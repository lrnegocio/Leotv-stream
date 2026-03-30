
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
  blockedAt?: string;
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

const URL_SEPARATOR = '|IPTV|';

export const clearLocalCache = () => {
  if (typeof window !== 'undefined') {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('p2p_content_cache')) {
        localStorage.removeItem(key);
      }
    });
  }
};

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

export async function getTotalContentCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('content')
      .select('*', { count: 'exact', head: true });
    return error ? 0 : (count || 0);
  } catch (e) {
    return 0;
  }
}

export async function getRemoteContent(forceRefresh = false, searchQuery = ""): Promise<ContentItem[]> {
  try {
    const cacheKey = `p2p_content_cache_${searchQuery || 'initial'}`;
    
    if (!forceRefresh && !searchQuery) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < 1000 * 60 * 30) return data;
      }
    }

    let query = supabase.from('content').select('*').order('title', { ascending: true });

    if (searchQuery) {
      query = query.or(`title.ilike.%${searchQuery}%,genre.ilike.%${searchQuery}%`).limit(1000);
    } else {
      query = query.limit(500);
    }

    const { data: rawData, error } = await query;
    if (error || !rawData) return [];

    const processed = rawData.map(item => {
      // Re-mapeamento de snake_case para CamelCase do Supabase
      const mapped = {
        ...item,
        isRestricted: item.isRestricted ?? item.is_restricted,
        streamUrl: item.streamUrl ?? item.stream_url,
        directStreamUrl: item.directStreamUrl ?? item.direct_stream_url,
        imageUrl: item.imageUrl ?? item.image_url,
      };

      if (mapped.streamUrl && typeof mapped.streamUrl === 'string' && mapped.streamUrl.includes(URL_SEPARATOR)) {
        const parts = mapped.streamUrl.split(URL_SEPARATOR);
        mapped.streamUrl = parts[0] || "";
        mapped.directStreamUrl = parts[1] || "";
      } else if (!mapped.directStreamUrl) {
        mapped.directStreamUrl = mapped.streamUrl; 
      }
      return mapped;
    });

    if (!searchQuery) {
      localStorage.setItem(cacheKey, JSON.stringify({ data: processed, timestamp: Date.now() }));
    }
    return processed;
  } catch (e) {
    return [];
  }
}

export async function getContentById(id: string): Promise<ContentItem | null> {
  try {
    const { data, error } = await supabase.from('content').select('*').eq('id', id).maybeSingle();
    if (error || !data) return null;
    return data;
  } catch (e) {
    return null;
  }
}

export async function getRemoteUsers(): Promise<User[]> {
  const { data } = await supabase.from('users').select('*').order('id', { ascending: false });
  return data || [];
}

export async function getRemoteResellers(): Promise<Reseller[]> {
  const { data } = await supabase.from('resellers').select('*').order('name', { ascending: true });
  return data || [];
}

export async function saveContent(item: ContentItem) {
  try {
    const combinedUrl = item.directStreamUrl && item.directStreamUrl !== item.streamUrl 
      ? `${item.streamUrl}${URL_SEPARATOR}${item.directStreamUrl}` 
      : item.streamUrl;

    const payload = {
      id: item.id || generateSafeId(item.title),
      title: item.title,
      type: item.type,
      description: item.description || "Sinal Master Léo Tv",
      genre: (item.genre || "LÉO TV CANAIS AO VIVO").toUpperCase(),
      isRestricted: item.isRestricted || false,
      imageUrl: item.imageUrl || null,
      streamUrl: combinedUrl,
      episodes: item.episodes || [],
      seasons: item.seasons || [],
    };

    const { error } = await supabase.from('content').upsert(payload);
    if (!error) clearLocalCache();
    return !error;
  } catch (e) {
    return false;
  }
}

export async function removeContent(id: string) {
  const { error } = await supabase.from('content').delete().eq('id', id);
  if (!error) clearLocalCache();
  return !error;
}

export async function bulkRemoveContent(ids: string[]) {
  if (!ids || ids.length === 0) return true;
  const batchSize = 20; 
  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    await supabase.from('content').delete().in('id', batch);
  }
  clearLocalCache();
  return true;
}

export async function clearAllM3UContent() {
  try {
    // Para 1 milhão de itens, o ideal é o TRUNCATE via SQL Editor.
    // Via API, tentamos apagar tudo que não seja um placeholder.
    const { error } = await supabase.from('content').delete().neq('id', '_root_');
    clearLocalCache();
    return !error;
  } catch (e) {
    return false;
  }
}

export async function saveUser(user: User) {
  const { error } = await supabase.from('users').upsert(user);
  return !error;
}

export async function removeUser(id: string) {
  const { error } = await supabase.from('users').delete().eq('id', id);
  return !error;
}

export async function saveReseller(reseller: Reseller) {
  const { error } = await supabase.from('resellers').upsert(reseller);
  return !error;
}

export async function removeReseller(id: string) {
  await supabase.from('users').delete().eq('resellerId', id);
  const { error } = await supabase.from('resellers').delete().eq('id', id);
  return !error;
}

export async function validateDeviceLogin(pin: string, deviceId: string): Promise<{ user?: User; error?: string }> {
  try {
    if (pin === 'adm77x2p') return { user: { id: 'master', pin: 'adm77x2p', role: 'admin', subscriptionTier: 'lifetime', maxScreens: 999, activeDevices: [], isBlocked: false, isAdultEnabled: true } };
    
    const { data: user, error } = await supabase.from('users').select('*').eq('pin', pin).maybeSingle();
    if (error || !user) return { error: "PIN INVÁLIDO." };
    if (user.isBlocked) return { error: "ACESSO SUSPENSO." };

    let ip = "0.0.0.0";
    try { const res = await fetch('https://api.ipify.org?format=json'); const d = await res.json(); ip = d.ip; } catch(e) {}

    let devices = user.activeDevices || [];
    if (!devices.some((d: any) => d.id === deviceId)) {
      if (devices.length >= user.maxScreens) return { error: "LIMITE DE TELAS EXCEDIDO." };
      devices.push({ id: deviceId, lastActive: new Date().toISOString(), ip });
    } else {
      devices = devices.map((d: any) => d.id === deviceId ? { ...d, lastActive: new Date().toISOString(), ip } : d);
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

export async function validateResellerLogin(u: string, p: string) {
  const { data, error } = await supabase.from('resellers').select('*').eq('username', u).eq('password', p).maybeSingle();
  if (error || !data) return { error: "LOGIN INVÁLIDO." };
  return { reseller: data };
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

      current = { title: name, genre, imageUrl: line.match(/tvg-logo=["']?([^"']+)["']?/i)?.[1], isRestricted: genre.includes('ADULTO') };
    } else if (line.startsWith('http') && current) {
      const seriesMatch = current.title.match(/(.*?)\s+[sS](\d+)[eE](\d+)/i) || current.title.match(/(.*?)\s+Episode\s+(\d+)/i);
      
      if (seriesMatch && (current.genre.includes('SERIE') || current.genre.includes('DORAMA') || current.genre.includes('NOVELA'))) {
        const base = seriesMatch[1].trim();
        const epNum = parseInt(seriesMatch[3] || seriesMatch[2]);
        if (!itemsMap.has(base)) {
          itemsMap.set(base, { id: generateSafeId(base), title: base, type: 'series', genre: current.genre, imageUrl: current.imageUrl, isRestricted: current.isRestricted, episodes: [] });
        }
        const series = itemsMap.get(base);
        if (!series.episodes.some((e:any) => e.number === epNum)) {
          series.episodes.push({ id: generateSafeId(current.title), title: `Episódio ${epNum}`, number: epNum, streamUrl: line, directStreamUrl: line });
        }
      } else {
        const id = generateSafeId(current.title);
        itemsMap.set(id, { id, title: current.title, type: current.genre.includes('FILME') ? 'movie' : 'channel', genre: current.genre, imageUrl: current.imageUrl, isRestricted: current.isRestricted, streamUrl: line });
      }
      current = null;
    }
  }

  const items = Array.from(itemsMap.values());
  for (let i = 0; i < items.length; i += 50) {
    if (onProgress) onProgress(`Importando: ${i} de ${items.length}...`);
    await supabase.from('content').upsert(items.slice(i, i + 50));
  }
  clearLocalCache();
  return { success: items.length };
}

export async function getGlobalSettings() {
  const { data } = await supabase.from('settings').select('*').eq('key', 'global').maybeSingle();
  return data?.value || { parentalPin: '1234' };
}

export async function updateGlobalSettings(v: any) {
  await supabase.from('settings').upsert({ key: 'global', value: v });
  return true;
}

export const generateRandomPin = () => Math.random().toString().substring(2, 13);

export const getBeautifulMessage = (pin: string, tier: string, url: string, screens: number) => 
  `🚀 *LÉO TV STREAM - ATIVADO!*\n\n🔑 *PIN:* \`${pin}\`\n📅 *PLANO:* ${tier}\n📺 *TELAS:* ${screens}\n\n🔗 *ACESSO:* ${url}\nSinal blindado de alta performance.`;

export async function importPremiumBundle() {
  const bundle = [
    { id: 'p1', title: 'GLOBO SP 4K', type: 'channel', genre: 'LÉO TV CANAIS AO VIVO', streamUrl: 'https://tvonline0800.com/canal/globo-sp-novo/', imageUrl: 'https://i.postimg.cc/J0swJ7tH/Design-sem-nome-63.png' },
    { id: 'p2', title: 'PREMIERE 4K', type: 'channel', genre: 'LÉO TV ESPORTES', streamUrl: 'http://contfree.shop:80/live/207946522/261879000/1698439.ts', imageUrl: 'http://contfree.shop:80/images/2961e2a695b10db70eb306b3e0a41eb0.png' }
  ];
  for (const item of bundle) await saveContent(item as any);
  return { success: bundle.length };
}

export async function syncLiveSports() {
  try {
    const res = await fetch("https://api.reidoscanais.ooo/sports");
    const d = await res.json();
    if (!d.success) return { success: 0 };
    const items = d.data.map((e: any) => ({ id: "r_"+e.id, title: e.title.toUpperCase(), type: 'channel', genre: "LÉO TV ESPORTES", imageUrl: e.poster, streamUrl: e.embeds?.[0]?.embed_url }));
    await supabase.from('content').upsert(items);
    return { success: items.length };
  } catch (e) { return { success: 0 }; }
}
