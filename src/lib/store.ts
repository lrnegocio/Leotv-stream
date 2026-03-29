
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
const CACHE_KEY = 'leo_stream_content_cache';
const CACHE_TIME_KEY = 'leo_stream_cache_timestamp';
const CACHE_TTL = 1000 * 60 * 60; // 1 HORA DE CACHE PARA SALVAR O SUPABASE

async function fetchAllRecords(table: string, orderBy: string = 'id'): Promise<any[]> {
  let allData: any[] = [];
  let from = 0;
  const step = 1000;
  let hasMore = true;

  try {
    while (hasMore) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .range(from, from + step - 1)
        .order(orderBy, { ascending: true });

      if (error) throw error;
      if (data && data.length > 0) {
        allData = allData.concat(data);
        from += step;
        if (data.length < step) hasMore = false;
      } else {
        hasMore = false;
      }
    }
    return allData;
  } catch (e) {
    return [];
  }
}

export async function getRemoteContent(forceRefresh = false): Promise<ContentItem[]> {
  const now = Date.now();
  
  if (typeof window !== 'undefined' && !forceRefresh) {
    const cachedData = localStorage.getItem(CACHE_KEY);
    const cachedTime = localStorage.getItem(CACHE_TIME_KEY);
    
    if (cachedData && cachedTime && (now - parseInt(cachedTime) < CACHE_TTL)) {
      return JSON.parse(cachedData);
    }
  }

  const rawData = await fetchAllRecords('content', 'title');
  
  const data = rawData.map(item => {
    if (item.streamUrl && typeof item.streamUrl === 'string' && item.streamUrl.includes(URL_SEPARATOR)) {
      const parts = item.streamUrl.split(URL_SEPARATOR);
      item.streamUrl = parts[0] || "";
      item.directStreamUrl = parts[1] || "";
    } else {
      item.directStreamUrl = item.streamUrl; 
    }
    return item;
  });

  if (typeof window !== 'undefined') {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    localStorage.setItem(CACHE_TIME_KEY, now.toString());
  }
  
  return data || [];
}

export async function getRemoteUsers(): Promise<User[]> {
  return await fetchAllRecords('users', 'id');
}

export async function getRemoteResellers(): Promise<Reseller[]> {
  return await fetchAllRecords('resellers', 'name');
}

export async function saveContent(item: ContentItem) {
  try {
    const cleanStreamUrl = (item.streamUrl || "").trim();
    const cleanDirectUrl = (item.directStreamUrl || "").trim();

    const combinedUrl = cleanDirectUrl 
      ? `${cleanStreamUrl}${URL_SEPARATOR}${cleanDirectUrl}`
      : cleanStreamUrl;

    const payload: any = {
      id: item.id,
      title: item.title,
      type: item.type,
      description: item.description || "",
      genre: (item.genre || "GERAL").toUpperCase(),
      isRestricted: item.isRestricted || false,
      imageUrl: item.imageUrl || null,
      streamUrl: combinedUrl,
      episodes: Array.isArray(item.episodes) ? item.episodes : [],
      seasons: Array.isArray(item.seasons) ? item.seasons : [],
    };

    const { error } = await supabase.from('content').upsert(payload, { onConflict: 'id' });
    
    if (!error) {
      if (typeof window !== 'undefined') localStorage.removeItem(CACHE_TIME_KEY);
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
}

export async function removeContent(id: string) {
  const { error } = await supabase.from('content').delete().eq('id', id);
  if (typeof window !== 'undefined') localStorage.removeItem(CACHE_TIME_KEY);
  return !error;
}

export async function bulkRemoveContent(ids: string[]) {
  if (!ids || ids.length === 0) return true;
  const { error } = await supabase.from('content').delete().in(ids);
  if (typeof window !== 'undefined') localStorage.removeItem(CACHE_TIME_KEY);
  return !error;
}

export async function clearAllM3UContent() {
  const { error } = await supabase.from('content').delete().like('id', 'm3u_%');
  if (typeof window !== 'undefined') localStorage.removeItem(CACHE_TIME_KEY);
  return !error;
}

export async function saveUser(user: User) {
  try {
    const { error } = await supabase.from('users').upsert(user);
    return !error;
  } catch (e) {
    return false;
  }
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
  try {
    await supabase.from('users').delete().eq('resellerId', id);
    const { error } = await supabase.from('resellers').delete().eq('id', id);
    return !error;
  } catch (err) {
    return false;
  }
}

export async function validateDeviceLogin(pin: string, deviceId: string): Promise<{ user?: User; error?: string }> {
  try {
    const normalizedPin = pin.trim();
    if (normalizedPin === 'adm77x2p') {
      return { user: { id: 'master-leo', pin: 'adm77x2p', role: 'admin', subscriptionTier: 'lifetime', maxScreens: 999, activeDevices: [{id: deviceId, lastActive: new Date().toISOString()}], isBlocked: false, isAdultEnabled: true } };
    }
    
    const { data: user, error } = await supabase.from('users').select('*').eq('pin', normalizedPin).maybeSingle();
    
    if (error) return { error: "ERRO DE CONEXÃO MASTER." };
    if (!user) return { error: "CÓDIGO INVÁLIDO." };
    if (user.isBlocked) return { error: "ACESSO BLOQUEADO." };

    const now = new Date();
    if (user.expiryDate && new Date(user.expiryDate) < now && user.subscriptionTier !== 'lifetime') {
      return { error: "SINAL EXPIRADO." };
    }

    let userIp = "0.0.0.0";
    try {
      const ipRes = await fetch('https://api.ipify.org?format=json');
      const ipData = await ipRes.json();
      userIp = ipData.ip;
    } catch(e) {}

    let devices = Array.isArray(user.activeDevices) ? user.activeDevices : [];
    const isThisDeviceLinked = devices.some((d: any) => d.id === deviceId);

    if (!isThisDeviceLinked && deviceId !== "xtream_api_call") {
      if (devices.length >= (user.maxScreens || 1)) {
        return { error: "LIMITE DE TELAS EXCEDIDO." };
      }
      devices.push({ id: deviceId, lastActive: now.toISOString(), ip: userIp, userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'TV/Box' });
      user.activeDevices = devices;
    } else {
      user.activeDevices = devices.map((d: any) => d.id === deviceId ? { ...d, lastActive: now.toISOString(), ip: userIp } : d);
    }
    
    if (!user.activatedAt) {
      user.activatedAt = now.toISOString();
      if (user.subscriptionTier === 'test') {
        user.expiryDate = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString();
      } else if (user.subscriptionTier === 'monthly') {
        user.expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      }
    }
    
    await saveUser(user);
    return { user };
  } catch (e) {
    return { error: "ERRO CRÍTICO DE SISTEMA." };
  }
}

export async function validateResellerLogin(username: string, pass: string) {
  try {
    const { data: res, error } = await supabase.from('resellers').select('*').eq('username', username).eq('password', pass).maybeSingle();
    if (error || !res) return { error: "LOGIN INVÁLIDO." };
    if (res.isBlocked) return { error: "REVENDA SUSPENSA." };
    return { reseller: res };
  } catch (e) {
    return { error: "ERRO DE REDE." };
  }
}

export async function generateM3UPlaylist(pin: string): Promise<string> {
  try {
    const content = await getRemoteContent();
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : (process.env.NEXT_PUBLIC_BASE_URL || '');

    let m3uLines = ["#EXTM3U"];
    content.forEach(item => {
      const logo = item.imageUrl || "";
      const cat = (item.genre || "GERAL").toUpperCase();
      const title = item.title.toUpperCase();

      if (item.type === 'channel') {
        m3uLines.push(`#EXTINF:-1 tvg-logo="${logo}" group-title="${cat}",${title}`);
        m3uLines.push(`${baseUrl}/live/${pin}/${pin}/${item.id}.ts`);
      } else if (item.type === 'movie') {
        m3uLines.push(`#EXTINF:-1 tvg-logo="${logo}" group-title="${cat}",${title}`);
        m3uLines.push(`${baseUrl}/movie/${pin}/${pin}/${item.id}.mp4`);
      }
    });
    return m3uLines.join('\n');
  } catch (e) {
    return "#EXTM3U\n#EXTINF:-1,ERRO NO SERVIDOR\n";
  }
}

export async function getGlobalSettings() {
  try {
    const { data } = await supabase.from('settings').select('*').eq('key', 'global').maybeSingle();
    return data?.value || { parentalPin: '1234' };
  } catch (e) {
    return { parentalPin: '1234' };
  }
}

export async function updateGlobalSettings(data: { parentalPin: string }) {
  const { error } = await supabase.from('settings').upsert({ key: 'global', value: data });
  return !error;
}

export const generateRandomPin = (length: number = 11) => {
  const chars = '0123456789';
  let result = '';
  for (let i = 0; i < length; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
};

export const getBeautifulMessage = (pin: string, tier: string, baseUrl: string, screens: number) => {
  if (pin === 'adm77x2p') return "ERRO: PIN MASTER.";
  const planoText = tier === 'test' ? 'Teste VIP 6H' : tier === 'lifetime' ? 'Vitalício' : 'Mensal 30 Dias';
  return `🚀 *LÉO TV STREAM - SINAL LIBERADO!* 🚀\n\n🔑 *PIN:* \`${pin}\`\n📅 *PLANO:* ${planoText}\n🖥️ *TELAS:* ${screens}\n\n🔗 *ACESSO:* ${baseUrl}\n👤 *USUÁRIO:* ${pin}\n🔑 *SENHA:* ${pin}\n\nSinal blindado de alta performance.`;
}

export async function processM3UImport(content: string, onProgress?: (msg: string) => void): Promise<{ success: number; failed: number }> {
  const lines = content.split('\n');
  const items: any[] = [];
  let currentItem: any = null;

  const generateSafeId = (name: string) => {
    return "m3u_" + name.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, '_')
      .substring(0, 40) + "_" + Math.random().toString(36).substring(2, 7);
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('#EXTINF:')) {
      const logoMatch = line.match(/tvg-logo=["']?([^"']+)["']?/i);
      const groupMatch = line.match(/group-title=["']?([^"']+)["']?/i);
      const name = line.split(',').pop()?.trim() || "Canal";
      const genre = (groupMatch ? groupMatch[1] : "GERAL").toUpperCase();
      currentItem = {
        id: generateSafeId(name),
        title: name,
        type: genre.includes('FILME') ? 'movie' : 'channel',
        genre: genre,
        imageUrl: logoMatch ? logoMatch[1] : null,
        isRestricted: genre.includes('ADULT') || genre.includes('XXX'),
        description: "Sinal Master",
        streamUrl: ""
      };
    } else if (line.startsWith('http') && currentItem) {
      currentItem.streamUrl = line + URL_SEPARATOR + line;
      items.push(currentItem);
      currentItem = null;
    }
  }

  let successCount = 0;
  const batchSize = 100; 
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    onProgress?.(`Processando ${i} de ${items.length}...`);
    const { error } = await supabase.from('content').upsert(batch, { onConflict: 'id', ignoreDuplicates: true });
    if (!error) successCount += batch.length;
    await new Promise(r => setTimeout(r, 50));
  }
  
  if (typeof window !== 'undefined') localStorage.removeItem(CACHE_TIME_KEY);
  return { success: successCount, failed: items.length - successCount };
}

export async function importPremiumBundle(): Promise<{ success: number }> {
  const premiumChannels: ContentItem[] = [
    { id: 'leo_globo_sp', title: 'GLOBO SP 4K', type: 'channel', genre: 'TV ABERTA', isRestricted: false, streamUrl: 'https://tvonline0800.com/canal/globo-sp-novo/', imageUrl: 'https://i.postimg.cc/J0swJ7tH/Design-sem-nome-63.png', description: 'Rede Globo 4K.' },
    { id: 'leo_premiere_4k', title: 'PREMIERE CLUB 4K', type: 'channel', genre: 'ESPORTES', isRestricted: false, streamUrl: 'http://contfree.shop:80/207946522/261879000/1698439.ts', imageUrl: 'http://contfree.shop:80/images/2961e2a695b10db70eb306b3e0a41eb0.png', description: 'Futebol 4K.' },
    { id: 'leo_hbo_4k', title: 'HBO 4K', type: 'channel', genre: 'FILMES', isRestricted: false, streamUrl: 'http://contfree.shop:80/207946522/261879000/1698432.ts', imageUrl: 'http://contfree.shop:80/images/20b403598a91b2dd1e361a6746d3861f.png', description: 'HBO 4K.' },
    { id: 'leo_cazetv', title: 'CAZÉ TV', type: 'channel', genre: 'ESPORTES', isRestricted: false, streamUrl: 'https://tvonline0800.com/canal/cazetv/', imageUrl: 'https://tvonline0800.com/wp-content/uploads/2024/07/cazetv.webp' },
    { id: 'leo_otaku_tv', title: 'OTAKU SIGN TV', type: 'channel', genre: 'ANIMES', isRestricted: false, streamUrl: 'https://www.olhosnatv.com.br/2022/10/otaku-sign-tv.html', imageUrl: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhWzsaBbPTqt4Y65Q5dWlHOkqeTjU7YEbHGOSMzQVUqCxyFC9xHUo-7ZVK6Tzd1Ea_uDuF_cNEd94yD2t3MRv2XG9nHjqZ_OUy8O21z0h2gn83tfI1SMXb7lmYGgPF-NejpcZWOmlBqIT1nszsVfuTmNd5Gwm_AMGob8wIUDWsv7HvLgbNeKnjpzJRbzmc/w385-h184-p-k-no-nu/OTAKU%20SIGN%20TV.webp' }
  ];
  
  let added = 0;
  for (const ch of premiumChannels) {
    if (await saveContent(ch)) added++;
  }
  return { success: added };
}

export async function syncLiveSports(): Promise<{ success: number; error?: string }> {
  try {
    const response = await fetch("https://api.reidoscanais.ooo/sports");
    const data = await response.json();
    if (!data.success || !data.data) return { success: 0, error: "Sem jogos agora." };
    const sportsItems = data.data.map((evento: any) => ({
      id: "radar_" + evento.id,
      title: evento.title.toUpperCase(),
      type: 'channel',
      genre: "FUTEBOL AO VIVO",
      imageUrl: evento.poster,
      isRestricted: false,
      streamUrl: (evento.embeds?.[0]?.embed_url || "") + URL_SEPARATOR + (evento.embeds?.[0]?.embed_url || "")
    }));
    await supabase.from('content').upsert(sportsItems, { onConflict: 'id', ignoreDuplicates: true });
    if (typeof window !== 'undefined') localStorage.removeItem(CACHE_TIME_KEY);
    return { success: sportsItems.length };
  } catch (e) {
    return { success: 0 };
  }
}
