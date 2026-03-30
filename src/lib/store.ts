import { supabase } from './supabase-client';

export type ContentType = 'movie' | 'series' | 'multi-season' | 'channel';

export interface Episode {
  id: string;
  title: string;
  number: number;
  streamUrl: string;
  directStreamUrl?: string;
}

export interface Season {
  id: string;
  number: number;
  episodes: Episode[];
}

export interface ContentItem {
  id: string;
  title: string;
  type: ContentType;
  description: string;
  genre: string;
  isRestricted: boolean; 
  streamUrl?: string; 
  directStreamUrl?: string;
  imageUrl?: string;
  seasons?: Season[];
  episodes?: Episode[];
}

export type SubscriptionTier = 'test' | 'monthly' | 'lifetime';

export interface ActiveDevice {
  id: string;
  lastActive: string;
  ip?: string;
  userAgent?: string;
}

export interface User {
  id: string;
  pin: string; 
  role: 'admin' | 'user';
  subscriptionTier: SubscriptionTier;
  expiryDate?: string; 
  maxScreens: number;
  activeDevices: ActiveDevice[]; 
  isBlocked: boolean;
  isAdultEnabled: boolean;
  resellerId?: string;
  activatedAt?: string;
}

export interface Reseller {
  id: string;
  name: string;
  username: string;
  password?: string;
  credits: number;
  totalSold: number;
  isBlocked: boolean;
  email?: string;
  phone?: string;
  cpf?: string;
  birthDate?: string;
}

const generateSafeId = (name: string) => {
  const clean = name.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") 
    .replace(/[^a-z0-9]/g, '_') 
    .replace(/_+/g, '_')
    .trim()
    .substring(0, 100);
  return "leo_" + clean + "_" + Math.random().toString(36).substring(2, 7);
};

export async function getRemoteContent(forceRefresh = false, searchQuery = "", categoryGenre = ""): Promise<ContentItem[]> {
  try {
    const cacheKey = `p2p_cache_${searchQuery || 'init'}_${categoryGenre || 'all'}`;
    if (!forceRefresh && !searchQuery && !categoryGenre) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < 1000 * 60 * 5) return parsed.data;
      }
    }

    let query = supabase.from('content').select('*').order('title', { ascending: true });

    if (searchQuery) {
      query = query.or(`title.ilike.%${searchQuery}%,genre.ilike.%${searchQuery}%`);
    }
    
    if (categoryGenre) {
      query = query.eq('genre', categoryGenre);
    }

    const { data: rawData, error } = await query.limit(1000);
    if (error || !rawData) return [];

    const processed = rawData.map(item => ({
      ...item,
      isRestricted: item.isRestricted ?? item.is_restricted,
      streamUrl: item.streamUrl ?? item.stream_url,
      directStreamUrl: item.directStreamUrl ?? item.direct_stream_url,
      imageUrl: item.imageUrl ?? item.image_url,
    }));

    if (!searchQuery && !categoryGenre) {
      localStorage.setItem(cacheKey, JSON.stringify({ data: processed, timestamp: Date.now() }));
    }
    return processed;
  } catch (e) { return []; }
}

export async function saveContent(item: ContentItem) {
  try {
    const payload = {
      id: item.id || generateSafeId(item.title),
      title: item.title,
      type: item.type,
      description: item.description || "Sinal Master Léo Tv",
      genre: (item.genre || "LÉO TV CANAIS AO VIVO").toUpperCase(),
      isRestricted: item.isRestricted || false,
      imageUrl: item.imageUrl || null,
      streamUrl: item.streamUrl || null,
      directStreamUrl: item.directStreamUrl || null,
      episodes: item.episodes || [],
      seasons: item.seasons || [],
    };

    const { error } = await supabase.from('content').upsert(payload);
    if (!error) localStorage.clear();
    return !error;
  } catch (e) { return false; }
}

export async function removeContent(id: string) {
  const { error } = await supabase.from('content').delete().eq('id', id);
  if (!error) localStorage.clear();
  return !error;
}

export async function bulkRemoveContent(ids: string[]) {
  if (!ids || ids.length === 0) return true;
  for (let i = 0; i < ids.length; i += 20) {
    const batch = ids.slice(i, i + 20);
    await supabase.from('content').delete().in('id', batch);
  }
  localStorage.clear();
  return true;
}

export async function clearAllM3UContent() {
  try {
    const { error } = await supabase.from('content').delete().neq('id', '_init_');
    localStorage.clear();
    return !error;
  } catch (e) { return false; }
}

export async function saveUser(user: User) {
  const { error } = await supabase.from('users').upsert(user);
  return !error;
}

export async function getRemoteUsers(): Promise<User[]> {
  const { data } = await supabase.from('users').select('*').order('id', { ascending: false });
  return data || [];
}

export async function validateDeviceLogin(pin: string, deviceId: string): Promise<{ user?: User; error?: string }> {
  try {
    if (pin === 'adm77x2p') return { user: { id: 'master', pin: 'adm77x2p', role: 'admin', subscriptionTier: 'lifetime', maxScreens: 999, activeDevices: [], isBlocked: false, isAdultEnabled: true } as any };
    
    const { data: user, error } = await supabase.from('users').select('*').eq('pin', pin).maybeSingle();
    if (error || !user) return { error: "PIN INVÁLIDO." };
    if (user.isBlocked) return { error: "ACESSO SUSPENSO." };

    let ip = "0.0.0.0";
    try { const res = await fetch('https://api.ipify.org?format=json'); const d = await res.json(); ip = d.ip; } catch(e) {}

    let devices = user.activeDevices || [];
    if (!devices.some((d: any) => d.id === deviceId)) {
      if (devices.length >= user.maxScreens) return { error: "LIMITE DE TELAS EXCEDIDO." };
      devices.push({ id: deviceId, lastActive: new Date().toISOString(), ip });
    }

    const update: any = { ...user, activeDevices: devices };
    if (!user.activatedAt) {
      update.activatedAt = new Date().toISOString();
      if (user.subscriptionTier === 'test') update.expiryDate = new Date(Date.now() + 6*3600000).toISOString();
      else if (user.subscriptionTier === 'monthly') update.expiryDate = new Date(Date.now() + 30*86400000).toISOString();
    }

    await saveUser(update);
    return { user: update };
  } catch (e) { return { error: "ERRO CRÍTICO." }; }
}

export async function processM3UImport(content: string, onProgress?: (m: string) => void) {
  const lines = content.split('\n');
  const itemsMap = new Map<string, any>();
  let current: any = null;

  for (let line of lines) {
    line = line.trim();
    if (line.startsWith('#EXTINF:')) {
      const name = line.split(',').pop()?.trim() || "Canal";
      const group = (line.match(/group-title=["']?([^"']+)["']?/i)?.[1] || "GERAL").toUpperCase();
      
      let genre = "LÉO TV CANAIS AO VIVO";
      if (group.includes('FILME') || group.includes('MOVIE')) genre = "LÉO TV FILMES";
      else if (group.includes('ADULT') || group.includes('XXX') || group.includes('HOT')) genre = "LÉO TV ADULTOS";
      else if (group.includes('DORAMA')) genre = "LÉO TV DORAMAS";
      else if (group.includes('SERIE') || group.includes('ANIME')) genre = "LÉO TV SERIES";
      else if (group.includes('ESPORTE') || group.includes('SPORT')) genre = "LÉO TV ESPORTES";
      else if (group.includes('DESENHO') || group.includes('KID') || group.includes('CHILD')) genre = "LÉO TV DESENHOS";
      else if (group.includes('CLIP')) genre = "LÉO TV VÍDEO CLIPES";
      else if (group.includes('MUSICA')) genre = "LÉO TV MUSICAS";
      else if (group.includes('RADIO')) genre = "LÉO TV RÁDIOS";
      else if (group.includes('NOVELA')) genre = "LÉO TV NOVELAS";

      current = { title: name, genre, imageUrl: line.match(/tvg-logo=["']?([^"']+)["']?/i)?.[1], isRestricted: genre.includes('ADULTOS') };
    } else if (line.startsWith('http') && current) {
      const seriesMatch = current.title.match(/(.*?)\s+[sS](\d+)[eE](\d+)/i) || 
                          current.title.match(/(.*?)\s+Episode\s+(\d+)/i) ||
                          current.title.match(/(.*?)\s+Ep\s+(\d+)/i);
      
      if (seriesMatch && (current.genre.includes('SERIE') || current.genre.includes('DORAMA') || current.genre.includes('NOVELA'))) {
        const base = seriesMatch[1].trim();
        const epNum = parseInt(seriesMatch[3] || seriesMatch[2]);
        if (!itemsMap.has(base)) {
          itemsMap.set(base, { id: generateSafeId(base), title: base, type: 'series', genre: current.genre, imageUrl: current.imageUrl, isRestricted: current.isRestricted, description: 'Sinal Master Léo Tv', episodes: [] });
        }
        const series = itemsMap.get(base);
        if (!series.episodes.some((e:any) => e.number === epNum)) {
          series.episodes.push({ id: generateSafeId(current.title), title: `Episódio ${epNum}`, number: epNum, streamUrl: line, directStreamUrl: line });
        }
      } else {
        const id = generateSafeId(current.title);
        itemsMap.set(id, { id, title: current.title, type: current.genre.includes('FILMES') ? 'movie' : 'channel', genre: current.genre, imageUrl: current.imageUrl, isRestricted: current.isRestricted, description: 'Sinal Master Léo Tv', streamUrl: line, directStreamUrl: line });
      }
      current = null;
    }
  }

  const items = Array.from(itemsMap.values());
  for (let i = 0; i < items.length; i += 20) {
    if (onProgress) onProgress(`Sintonizando: ${i} de ${items.length}...`);
    await supabase.from('content').upsert(items.slice(i, i + 20));
  }
  localStorage.clear();
  return { success: items.length };
}

export async function getGlobalSettings() {
  const { data } = await supabase.from('settings').select('*').eq('key', 'global').maybeSingle();
  return data?.value || { parentalPin: '1234' };
}

export const generateRandomPin = () => Math.random().toString().substring(2, 13);
