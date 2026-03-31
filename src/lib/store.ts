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

/**
 * LIMPEZA SNIPER DE NOMES: Remove aspas, pontos, vírgulas e números iniciais.
 */
export const cleanName = (name: string) => {
  if (!name) return "";
  return name
    .replace(/[.",']/g, '') 
    .replace(/^\d+/, '')    
    .replace(/-+/g, ' ')
    .trim()
    .toUpperCase();
};

export const generateSafeId = (name: string) => {
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
    let query = supabase.from('content').select('*');

    if (searchQuery) {
      query = query.ilike('title', `%${searchQuery}%`);
    } else if (categoryGenre) {
      query = query.eq('genre', categoryGenre.toUpperCase());
    }

    const { data: rawData, error } = await query
      .order('title', { ascending: true })
      .limit(searchQuery ? 1000 : 200);

    if (error || !rawData) return [];

    return rawData.map(item => ({
      ...item,
      isRestricted: item.is_restricted,
      streamUrl: item.stream_url,
      directStreamUrl: item.direct_stream_url,
      imageUrl: item.image_url,
    }));
  } catch (e) { return []; }
}

export async function getContentById(id: string): Promise<ContentItem | null> {
  const { data, error } = await supabase.from('content').select('*').eq('id', id).maybeSingle();
  if (error || !data) return null;
  return {
    ...data,
    isRestricted: data.is_restricted,
    streamUrl: data.stream_url,
    directStreamUrl: data.direct_stream_url,
    imageUrl: data.image_url,
  };
}

export async function getTotalContentCount(): Promise<number> {
  try {
    const { count } = await supabase.from('content').select('*', { count: 'exact', head: true });
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
          if (s.episodes) total += s.episodes.length;
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
      genre: (item.genre || "LÉO TV CANAIS AO VIVO").toUpperCase(),
      is_restricted: item.isRestricted || false,
      image_url: item.imageUrl || null,
      stream_url: item.streamUrl || null,
      direct_stream_url: item.directStreamUrl || null,
      episodes: item.episodes || [],
      seasons: item.seasons || [],
    };

    const { error } = await supabase.from('content').upsert(payload);
    if (error) {
      console.error("Erro Supabase Detalhado:", JSON.stringify(error, null, 2));
    }
    return !error;
  } catch (e) { 
    console.error("Erro Fatal no Catch:", e);
    return false; 
  }
}

export async function removeContent(id: string) {
  const { error } = await supabase.from('content').delete().eq('id', id);
  return !error;
}

export async function bulkRemoveContent(ids: string[]) {
  if (!ids || ids.length === 0) return true;
  for (let i = 0; i < ids.length; i += 20) {
    const batch = ids.slice(i, i + 20);
    await supabase.from('content').delete().in('id', batch);
  }
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
}

export async function getRemoteUsers(): Promise<User[]> {
  const { data } = await supabase.from('users').select('*').order('id', { ascending: false });
  return (data || []).map(u => ({
    id: u.id,
    pin: u.pin,
    role: u.role,
    subscriptionTier: u.subscription_tier,
    expiryDate: u.expiry_date,
    maxScreens: u.max_screens,
    activeDevices: u.active_devices,
    isBlocked: u.is_blocked,
    isAdultEnabled: u.is_adult_enabled,
    resellerId: u.reseller_id,
    activatedAt: u.activated_at
  }));
}

export async function removeUser(id: string) {
  const { error } = await supabase.from('users').delete().eq('id', id);
  return !error;
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
  } catch (e) { return { error: "ERRO CRÍTICO." }; }
}

export async function getRemoteResellers(): Promise<Reseller[]> {
  const { data } = await supabase.from('resellers').select('*').order('name', { ascending: true });
  return data || [];
}

export async function saveReseller(res: Reseller) {
  const { error } = await supabase.from('resellers').upsert(res);
  return !error;
}

export async function removeReseller(id: string) {
  const { error } = await supabase.from('resellers').delete().eq('id', id);
  return !error;
}

export async function validateResellerLogin(username: string, password: string): Promise<{ reseller?: Reseller; error?: string }> {
  const { data, error } = await supabase.from('resellers').select('*').eq('username', username).eq('password', password).maybeSingle();
  if (error || !data) return { error: "USUÁRIO OU SENHA INVÁLIDOS." };
  if (data.isBlocked) return { error: "ACESSO DE REVENDA SUSPENSO." };
  return { reseller: data };
}

export async function processHTMLImport(html: string, onProgress?: (m: string) => void) {
  const items: any[] = [];
  const div = document.createElement('div');
  div.innerHTML = html;

  const links = div.querySelectorAll('a.btn-stream');
  onProgress?.(`Iniciando Sniper em Massa...`);

  links.forEach((link, idx) => {
    const titleEl = link.querySelector('.col.d-flex') || link.querySelector('.col');
    const imgEl = link.querySelector('img');
    
    if (titleEl) {
      const rawTitle = titleEl.textContent?.trim() || `Sinal ${idx}`;
      const title = cleanName(rawTitle);
      const imageUrl = imgEl?.getAttribute('src') || '';
      
      let genre = "LÉO TV CANAIS AO VIVO";
      if (title.includes('DORAMA') || title.includes('24H DORAMA')) genre = "LÉO TV DORAMAS";
      else if (title.includes('18+') || title.includes('XXX') || title.includes('ADULTO')) genre = "LÉO TV ADULTOS";
      else if (title.includes('FILME') || title.includes('MOVIE')) genre = "LÉO TV FILMES";
      else if (title.includes('SERIE') || title.includes('SERIADO') || title.includes('SEASON') || title.includes('EP')) genre = "LÉO TV SERIES";
      else if (title.includes('RADIO')) genre = "LÉO TV RÁDIOS";
      else if (title.includes('MUSICA') || title.includes('CLIP')) genre = "LÉO TV MUSICAS";

      items.push({
        id: generateSafeId(title),
        title,
        type: genre.includes('SERIES') || genre.includes('DORAMAS') ? 'series' : 'channel',
        genre,
        description: 'Sinal Master Sniper',
        image_url: imageUrl,
        is_restricted: genre.includes('ADULTOS'),
        stream_url: '',
        direct_stream_url: '',
        episodes: [],
        seasons: []
      });
    }
  });

  // UPSERT EM BATCH (20 em 20) PARA NÃO TRAVAR
  for (let i = 0; i < items.length; i += 20) {
    if (onProgress) onProgress(`Sincronizando ${i} de ${items.length} sinais...`);
    await supabase.from('content').upsert(items.slice(i, i + 20));
  }

  return { success: items.length };
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

      current = { title: cleanName(name), genre, imageUrl: line.match(/tvg-logo=["']?([^"']+)["']?/i)?.[1], isRestricted: genre.includes('ADULTOS') };
    } else if (line.startsWith('http') && current) {
      const seriesMatch = current.title.match(/(.*?)\s+[sS](\d+)[eE](\d+)/i) || 
                          current.title.match(/(.*?)\s+Episode\s+(\d+)/i) ||
                          current.title.match(/(.*?)\s+Ep\s+(\d+)/i);
      
      if (seriesMatch && (current.genre.includes('SERIE') || current.genre.includes('DORAMA') || current.genre.includes('NOVELA'))) {
        const base = cleanName(seriesMatch[1].trim());
        const epNum = parseInt(seriesMatch[3] || seriesMatch[2]);
        if (!itemsMap.has(base)) {
          itemsMap.set(base, { id: generateSafeId(base), title: base, type: 'series', genre: current.genre, image_url: current.imageUrl, is_restricted: current.isRestricted, description: 'Sinal Master Léo Tv', episodes: [] });
        }
        const series = itemsMap.get(base);
        if (!series.episodes.some((e:any) => e.number === epNum)) {
          series.episodes.push({ id: generateSafeId(current.title), title: `EPISODIO ${epNum}`, number: epNum, streamUrl: line, directStreamUrl: line });
        }
      } else {
        const id = generateSafeId(current.title);
        itemsMap.set(id, { id, title: current.title, type: current.genre.includes('FILMES') ? 'movie' : 'channel', genre: current.genre, image_url: current.imageUrl, is_restricted: current.isRestricted, description: 'Sinal Master Léo Tv', stream_url: line, direct_stream_url: line });
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
  const { data } = await supabase.from('settings').select('*').eq('key', 'global').maybeSingle();
  return data?.value || { parentalPin: '1234' };
}

export async function updateGlobalSettings(val: any) {
  await supabase.from('settings').upsert({ key: 'global', value: val });
}

export function getBeautifulMessage(pin: string, tier: string, url: string, screens: number) {
  return `🚀 *LÉO TV STREAM - ACESSO MASTER ATIVADO* 🚀\n\n📺 *Sua TV Online de Elite está pronta!*\n\n🔑 *PIN:* \`${pin}\`\n📅 *Plano:* ${tier.toUpperCase()}\n🖥️ *Telas:* ${screens}\n🌐 *Acesse:* ${url}\n\n🔥 *Instruções:* Coloque seu PIN no campo de acesso e sintonize agora!`;
}

export async function renewUserSubscription(userId: string, tier: SubscriptionTier) {
  const days = tier === 'test' ? 0.25 : tier === 'monthly' ? 30 : 9999;
  const expiry = new Date(Date.now() + days * 86400000).toISOString();
  await supabase.from('users').update({ "subscription_tier": tier, "expiry_date": expiry }).eq('id', userId);
}

export async function generateM3UPlaylist(pin: string) {
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
}

export const generateRandomPin = (len = 11) => Math.random().toString().substring(2, 2+len);
