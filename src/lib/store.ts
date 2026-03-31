
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
  created_at?: string;
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

export const cleanName = (name: string) => {
  if (!name) return "";
  return name
    .toString()
    .replace(/[.",']/g, '') 
    .replace(/^\d+/, '')    
    .replace(/-+/g, ' ')
    .trim()
    .toUpperCase();
};

export const generateSafeId = (name: string) => {
  if (!name) return "leo_" + Date.now();
  const clean = name.toString().toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") 
    .replace(/[^a-z0-9]/g, '_') 
    .replace(/_+/g, '_')
    .trim()
    .substring(0, 100);
  return "leo_" + clean;
};

export async function getRemoteContent(forceRefresh = false, searchQuery = "", categoryGenre = ""): Promise<ContentItem[]> {
  try {
    let query = supabase.from('content').select('*');

    if (searchQuery) {
      query = query.ilike('title', `%${searchQuery}%`);
    } else if (categoryGenre) {
      query = query.eq('genre', categoryGenre.toUpperCase());
    }

    const { data: rawData, error } = await query
      .order('created_at', { ascending: false })
      .limit(searchQuery ? 2000 : 1000);

    if (error) throw error;

    return (rawData || []).map(item => ({
      ...item,
      isRestricted: item.is_restricted,
      streamUrl: item.stream_url,
      directStreamUrl: item.direct_stream_url,
      imageUrl: item.image_url,
    }));
  } catch (e) { 
    console.error("Erro ao carregar canais:", e);
    return []; 
  }
}

export async function getContentById(id: string): Promise<ContentItem | null> {
  try {
    const { data, error } = await supabase.from('content').select('*').eq('id', id).maybeSingle();
    if (error || !data) return null;
    return {
      ...data,
      isRestricted: data.is_restricted,
      streamUrl: data.stream_url,
      directStreamUrl: data.direct_stream_url,
      imageUrl: data.image_url,
    };
  } catch (e) { return null; }
}

export async function getTotalContentCount(): Promise<number> {
  try {
    const { count, error } = await supabase.from('content').select('*', { count: 'exact', head: true });
    if (error) throw error;
    return count || 0;
  } catch (e) { return 0; }
}

export async function getCategoryCount(genre: string): Promise<number> {
  try {
    const { data, error } = await supabase.from('content').select('episodes, seasons').eq('genre', genre.toUpperCase());
    if (error || !data) return 0;
    
    let total = 0;
    data.forEach(item => {
      if (item.episodes && Array.isArray(item.episodes) && item.episodes.length > 0) {
        total += item.episodes.length;
      } else if (item.seasons && Array.isArray(item.seasons)) {
        item.seasons.forEach((s: any) => {
          if (s.episodes && Array.isArray(s.episodes)) total += s.episodes.length;
        });
      } else {
        total += 1;
      }
    });
    return total;
  } catch (e) { return 0; }
}

export async function saveContent(item: ContentItem) {
  try {
    const payload = {
      id: item.id || generateSafeId(item.title),
      title: cleanName(item.title),
      type: item.type,
      description: item.description || "Sinal Master Léo Tv",
      genre: (item.genre || "LÉO TV AO VIVO").toUpperCase(),
      is_restricted: item.isRestricted || false,
      image_url: item.imageUrl || null,
      stream_url: item.streamUrl || null,
      direct_stream_url: item.directStreamUrl || null,
      episodes: item.episodes || [],
      seasons: item.seasons || [],
      created_at: item.created_at || new Date().toISOString()
    };

    const { error } = await supabase.from('content').upsert(payload);
    if (error) {
      console.error("Erro Supabase:", error);
      return false;
    }
    return true;
  } catch (e) { 
    console.error("Erro Fatal ao Salvar:", e);
    return false; 
  }
}

export async function removeContent(id: string) {
  try {
    const { error } = await supabase.from('content').delete().eq('id', id);
    return !error;
  } catch (e) { return false; }
}

export async function bulkRemoveContent(ids: string[]) {
  if (!ids || ids.length === 0) return true;
  try {
    const { error } = await supabase.from('content').delete().in('id', ids);
    return !error;
  } catch (e) { return false; }
}

export async function clearAllM3UContent() {
  try {
    const { error } = await supabase.from('content').delete().neq('id', '_dummy_');
    return !error;
  } catch (e) { return false; }
}

export async function saveUser(user: User) {
  try {
    const payload = {
      id: user.id,
      pin: user.pin,
      role: user.role,
      subscription_tier: user.subscriptionTier,
      expiry_date: user.expiryDate,
      max_screens: user.maxScreens,
      active_devices: user.activeDevices,
      is_blocked: user.isBlocked,
      is_adult_enabled: user.isAdultEnabled,
      reseller_id: user.resellerId,
      activated_at: user.activatedAt
    };
    const { error } = await supabase.from('users').upsert(payload);
    return !error;
  } catch (e) { return false; }
}

export async function getRemoteUsers(): Promise<User[]> {
  try {
    const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false });
    return (data || []).map(u => ({
      id: u.id,
      pin: u.pin,
      role: u.role,
      subscriptionTier: u.subscription_tier,
      expiryDate: u.expiry_date,
      maxScreens: u.max_screens,
      activeDevices: u.active_devices || [],
      isBlocked: u.is_blocked,
      isAdultEnabled: u.is_adult_enabled,
      resellerId: u.reseller_id,
      activatedAt: u.activated_at
    }));
  } catch (e) { return []; }
}

export async function removeUser(id: string) {
  try {
    const { error } = await supabase.from('users').delete().eq('id', id);
    return !error;
  } catch (e) { return false; }
}

export async function validateDeviceLogin(pin: string, deviceId: string): Promise<{ user?: User; error?: string }> {
  try {
    if (pin === 'adm77x2p') return { user: { id: 'master', pin: 'adm77x2p', role: 'admin', subscriptionTier: 'lifetime', maxScreens: 999, activeDevices: [], isBlocked: false, isAdultEnabled: true } as any };
    
    const { data: user, error } = await supabase.from('users').select('*').eq('pin', pin).maybeSingle();
    if (error || !user) return { error: "PIN INVÁLIDO." };
    if (user.is_blocked) return { error: "ACESSO SUSPENSO." };

    let devices = user.active_devices || [];
    if (!devices.some((d: any) => d.id === deviceId)) {
      if (devices.length >= user.max_screens) return { error: "LIMITE DE TELAS EXCEDIDO." };
      devices.push({ id: deviceId, lastActive: new Date().toISOString() });
    }

    const updatedUser: User = { 
      id: user.id,
      pin: user.pin,
      role: user.role,
      subscriptionTier: user.subscription_tier,
      expiryDate: user.expiry_date,
      maxScreens: user.max_screens,
      activeDevices: devices,
      isBlocked: user.is_blocked,
      isAdultEnabled: user.is_adult_enabled,
      resellerId: user.reseller_id,
      activatedAt: user.activated_at
    };

    if (!user.activated_at) {
      updatedUser.activatedAt = new Date().toISOString();
      if (updatedUser.subscriptionTier === 'test') updatedUser.expiryDate = new Date(Date.now() + 6*3600000).toISOString();
      else if (updatedUser.subscriptionTier === 'monthly') updatedUser.expiryDate = new Date(Date.now() + 30*86400000).toISOString();
    }

    await saveUser(updatedUser);
    return { user: updatedUser };
  } catch (e) { return { error: "ERRO DE CONEXÃO." }; }
}

export async function getRemoteResellers(): Promise<Reseller[]> {
  try {
    const { data } = await supabase.from('resellers').select('*').order('name', { ascending: true });
    return data || [];
  } catch (e) { return []; }
}

export async function saveReseller(res: Reseller) {
  try {
    const { error } = await supabase.from('resellers').upsert(res);
    return !error;
  } catch (e) { return false; }
}

export async function removeReseller(id: string) {
  try {
    const { error } = await supabase.from('resellers').delete().eq('id', id);
    return !error;
  } catch (e) { return false; }
}

export async function validateResellerLogin(username: string, password: string): Promise<{ reseller?: Reseller; error?: string }> {
  try {
    const { data, error } = await supabase.from('resellers').select('*').eq('username', username).eq('password', password).maybeSingle();
    if (error || !data) return { error: "USUÁRIO OU SENHA INVÁLIDOS." };
    if (data.is_blocked) return { error: "ACESSO DE REVENDA SUSPENSO." };
    return { reseller: data };
  } catch (e) { return { error: "ERRO DE CONEXÃO." }; }
}

export async function processHTMLImport(html: string, onProgress?: (m: string) => void) {
  const items: any[] = [];
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const links = doc.querySelectorAll('a.btn-stream');
  onProgress?.(`Iniciando Sniper Supremo...`);

  links.forEach((link, idx) => {
    const titleEl = link.querySelector('.col.d-flex') || link.querySelector('.col');
    const imgEl = link.querySelector('img');
    
    if (titleEl) {
      const rawTitle = titleEl.textContent?.trim() || `Sinal ${idx}`;
      const title = cleanName(rawTitle);
      const imageUrl = imgEl?.getAttribute('src') || '';
      
      let genre = "LÉO TV AO VIVO";
      const upperTitle = title.toUpperCase();
      
      if (upperTitle.includes('DORAMA')) genre = "LÉO TV DORAMAS";
      else if (upperTitle.includes('18+') || upperTitle.includes('XXX') || upperTitle.includes('ADULTO')) genre = "LÉO TV ADULTOS";
      else if (upperTitle.includes('FILME') || upperTitle.includes('MOVIE')) genre = "LÉO TV FILMES";
      else if (upperTitle.includes('SERIE') || upperTitle.includes('SEASON') || upperTitle.includes('EP')) genre = "LÉO TV SERIES";
      else if (upperTitle.includes('RADIO')) genre = "LÉO TV RÁDIOS";
      else if (upperTitle.includes('MUSICA') || upperTitle.includes('CLIP')) genre = "LÉO TV MUSICAS";
      else if (upperTitle.includes('NOVELA')) genre = "LÉO TV NOVELAS";
      else if (upperTitle.includes('DESENHO') || upperTitle.includes('KID')) genre = "LÉO TV DESENHOS";

      items.push({
        id: generateSafeId(title),
        title,
        type: genre.includes('SERIES') || genre.includes('DORAMAS') || genre.includes('NOVELAS') ? 'series' : 'channel',
        genre,
        description: 'Sinal Master Sniper Blindado',
        image_url: imageUrl,
        is_restricted: genre.includes('ADULTOS'),
        stream_url: '',
        direct_stream_url: '',
        episodes: [],
        seasons: [],
        created_at: new Date().toISOString()
      });
    }
  });

  const uniqueItems = Array.from(new Map(items.map(item => [item.id, item])).values());

  for (let i = 0; i < uniqueItems.length; i += 20) {
    if (onProgress) onProgress(`Sincronizando ${i} de ${uniqueItems.length} sinais...`);
    await supabase.from('content').upsert(uniqueItems.slice(i, i + 20));
  }

  return { success: uniqueItems.length };
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
      
      let genre = "LÉO TV AO VIVO";
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

      current = { title: cleanName(name), genre, imageUrl: line.match(/tvg-logo=["']?([^"']+)["']?/i)?.[1], isRestricted: genre.includes('ADULTOS') };
    } else if (line.startsWith('http') && current) {
      const seriesMatch = current.title.match(/(.*?)\s+[sS](\d+)[eE](\d+)/i) || 
                          current.title.match(/(.*?)\s+Episode\s+(\d+)/i) ||
                          current.title.match(/(.*?)\s+Ep\s+(\d+)/i);
      
      if (seriesMatch && (current.genre.includes('SERIE') || current.genre.includes('DORAMA') || current.genre.includes('NOVELA'))) {
        const base = cleanName(seriesMatch[1].trim());
        const epNum = parseInt(seriesMatch[3] || seriesMatch[2]);
        const baseId = generateSafeId(base);
        if (!itemsMap.has(baseId)) {
          itemsMap.set(baseId, { id: baseId, title: base, type: 'series', genre: current.genre, image_url: current.imageUrl, is_restricted: current.isRestricted, description: 'Sinal Master Léo Tv', episodes: [], created_at: new Date().toISOString() });
        }
        const series = itemsMap.get(baseId);
        if (!series.episodes.some((e:any) => e.number === epNum)) {
          series.episodes.push({ id: generateSafeId(current.title), title: `EPISODIO ${epNum}`, number: epNum, streamUrl: line, directStreamUrl: line });
        }
      } else {
        const id = generateSafeId(current.title);
        itemsMap.set(id, { id, title: current.title, type: current.genre.includes('FILMES') ? 'movie' : 'channel', genre: current.genre, image_url: current.imageUrl, is_restricted: current.isRestricted, description: 'Sinal Master Léo Tv', stream_url: line, direct_stream_url: line, created_at: new Date().toISOString() });
      }
      current = null;
    }
  }

  const items = Array.from(itemsMap.values());
  for (let i = 0; i < items.length; i += 20) {
    if (onProgress) onProgress(`Sincronizando M3U: ${i} de ${items.length}...`);
    await supabase.from('content').upsert(items.slice(i, i + 20));
  }
  return { success: items.length };
}

export async function getGlobalSettings() {
  try {
    const { data } = await supabase.from('settings').select('*').eq('key', 'global').maybeSingle();
    return data?.value || { parentalPin: '1234' };
  } catch (e) { return { parentalPin: '1234' }; }
}

export async function updateGlobalSettings(val: any) {
  try {
    await supabase.from('settings').upsert({ key: 'global', value: val });
  } catch (e) { }
}

export function getBeautifulMessage(pin: string, tier: string, url: string, screens: number) {
  return `🚀 *LÉO TV STREAM - ACESSO MASTER ATIVADO* 🚀\n\n📺 *Sua TV Online de Elite está pronta!*\n\n🔑 *PIN:* \`${pin}\`\n📅 *Plano:* ${tier.toUpperCase()}\n🖥️ *Telas:* ${screens}\n🌐 *Acesse:* ${url}\n\n🔥 *Instruções:* Coloque seu PIN no campo de acesso e sintonize agora!`;
}

export async function renewUserSubscription(userId: string, tier: SubscriptionTier) {
  try {
    const days = tier === 'test' ? 0.25 : tier === 'monthly' ? 30 : 9999;
    const expiry = new Date(Date.now() + days * 86400000).toISOString();
    await supabase.from('users').update({ "subscription_tier": tier, "expiry_date": expiry }).eq('id', userId);
  } catch (e) { }
}

export async function generateM3UPlaylist(pin: string) {
  try {
    const { data: user } = await supabase.from('users').select('*').eq('pin', pin).maybeSingle();
    if (!user || user.is_blocked) return "#EXTM3U\n#EXTINF:-1,PIN INVALIDO\n";
    const { data: content } = await supabase.from('content').select('*').limit(5000);
    let m3u = "#EXTM3U\n";
    content?.forEach(i => {
      if (i.is_restricted && !user.is_adult_enabled) return;
      const stream = i.direct_stream_url || i.stream_url;
      m3u += `#EXTINF:-1 tvg-logo="${i.image_url || ''}" group-title="${i.genre}",${i.title}\n${stream}\n`;
    });
    return m3u;
  } catch (e) { return "#EXTM3U\n"; }
}

export const generateRandomPin = (len = 11) => Math.random().toString().substring(2, 2+len);
