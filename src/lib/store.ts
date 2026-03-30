
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
const CACHE_KEY = 'leo_stream_content_cache_v6';
const CACHE_TIME_KEY = 'leo_stream_cache_timestamp_v6';
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 HORAS

// GERADOR DE ID BLINDADO CONTRA ERRO 500 E SÍMBOLOS (✮)
const generateSafeId = (name: string) => {
  const clean = name.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") 
    .replace(/[^a-z0-9]/g, '_') 
    .substring(0, 50);
  return "leo_" + clean + "_" + Math.random().toString(36).substring(2, 7);
};

export async function getTotalContentCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('content')
      .select('*', { count: 'exact', head: true });
    if (error) return 0;
    return count || 0;
  } catch (e) {
    return 0;
  }
}

/**
 * BUSCA ON-DEMAND MASTER (v180)
 * Esta função é o segredo para gerir 300k canais sem estourar o Supabase.
 * Se houver busca, ela filtra no banco. Se não, traz os primeiros 500.
 */
export async function getRemoteContent(forceRefresh = false, searchQuery = ""): Promise<ContentItem[]> {
  try {
    let query = supabase.from('content').select('*').order('title', { ascending: true });

    if (searchQuery) {
      // Se tiver busca, filtra direto no banco (Consome quase nada de dados)
      query = query.or(`title.ilike.%${searchQuery}%,genre.ilike.%${searchQuery}%`);
      query = query.limit(500); 
    } else {
      // Se for a home normal, traz os primeiros 500 para ser instantâneo
      query = query.limit(500);
    }

    const { data: rawData, error } = await query;
    
    if (error || !rawData) return [];

    return rawData.map(item => {
      if (item.streamUrl && typeof item.streamUrl === 'string' && item.streamUrl.includes(URL_SEPARATOR)) {
        const parts = item.streamUrl.split(URL_SEPARATOR);
        item.streamUrl = parts[0] || "";
        item.directStreamUrl = parts[1] || "";
      } else {
        item.directStreamUrl = item.streamUrl; 
      }
      return item;
    });
  } catch (e) {
    return [];
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
    const cleanStreamUrl = (item.streamUrl || "").trim();
    const cleanDirectUrl = (item.directStreamUrl || "").trim();
    const combinedUrl = cleanDirectUrl ? `${cleanStreamUrl}${URL_SEPARATOR}${cleanDirectUrl}` : cleanStreamUrl;

    const payload: any = {
      id: item.id || generateSafeId(item.title),
      title: item.title,
      type: item.type,
      description: item.description || "Sinal Master Léo Tv",
      genre: (item.genre || "GERAL").toUpperCase(),
      isRestricted: item.isRestricted || false,
      imageUrl: item.imageUrl || null,
      streamUrl: combinedUrl,
      episodes: Array.isArray(item.episodes) ? item.episodes : [],
      seasons: Array.isArray(item.seasons) ? item.seasons : [],
    };

    const { error } = await supabase.from('content').upsert(payload, { onConflict: 'id' });
    return !error;
  } catch (e) {
    return false;
  }
}

export async function removeContent(id: string) {
  const { error } = await supabase.from('content').delete().eq('id', id);
  return !error;
}

export async function bulkRemoveContent(ids: string[]) {
  if (!ids || ids.length === 0) return true;
  const { error } = await supabase.from('content').delete().in(ids);
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
    
    if (error || !user) return { error: "PIN INVÁLIDO." };
    if (user.isBlocked) return { error: "ACESSO SUSPENSO." };

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

    if (!isThisDeviceLinked) {
      if (devices.length >= (user.maxScreens || 1)) return { error: "LIMITE DE TELAS EXCEDIDO." };
      devices.push({ id: deviceId, lastActive: now.toISOString(), ip: userIp });
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
    return { error: "ERRO CRÍTICO NO LOGIN." };
  }
}

export async function validateResellerLogin(username: string, pass: string) {
  try {
    const { data: res, error } = await supabase.from('resellers').select('*').eq('username', username).eq('password', pass).maybeSingle();
    if (error || !res) return { error: "LOGIN INVÁLIDO." };
    if (res.isBlocked) return { error: "REVENDA SUSPENSA." };
    return { reseller: res };
  } catch (e) {
    return { error: "ERRO DE BANCO." };
  }
}

export async function processM3UImport(content: string, onProgress?: (msg: string) => void): Promise<{ success: number; failed: number }> {
  const lines = content.split('\n');
  const items: any[] = [];
  let currentItem: any = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('#EXTINF:')) {
      const logoMatch = line.match(/tvg-logo=["']?([^"']+)["']?/i);
      const groupMatch = line.match(/group-title=["']?([^"']+)["']?/i);
      const name = line.split(',').pop()?.trim() || "Canal Sem Nome";
      const genre = (groupMatch ? groupMatch[1] : "GERAL").toUpperCase();
      currentItem = {
        id: generateSafeId(name),
        title: name,
        type: genre.includes('FILME') ? 'movie' : genre.includes('SERIE') ? 'series' : 'channel',
        genre: genre,
        imageUrl: logoMatch ? logoMatch[1] : null,
        isRestricted: genre.includes('ADULT') || genre.includes('XXX'),
        description: "Sinal Master Léo Tv",
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
    onProgress?.(`Processando: ${i} de ${items.length}...`);
    const { error } = await supabase.from('content').upsert(batch, { onConflict: 'id', ignoreDuplicates: true });
    if (!error) successCount += batch.length;
    await new Promise(r => setTimeout(r, 100)); 
  }
  
  return { success: successCount, failed: items.length - successCount };
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
  const planoText = tier === 'test' ? 'Teste VIP 6H' : tier === 'lifetime' ? 'Vitalício' : 'Mensal 30 Dias';
  return `🚀 *LÉO TV STREAM - SINAL LIBERADO!* 🚀\n\n🔑 *PIN:* \`${pin}\`\n📅 *PLANO:* ${planoText}\n\n🔗 *ACESSO:* ${baseUrl}\n👤 *USUÁRIO:* ${pin}\n🔑 *SENHA:* ${pin}\n\nSinal blindado de alta performance.`;
}

export async function importPremiumBundle(): Promise<{ success: number }> {
  const premiumChannels: ContentItem[] = [
    { id: 'leo_globo_sp', title: 'GLOBO SP 4K', type: 'channel', genre: 'TV ABERTA', isRestricted: false, streamUrl: 'https://tvonline0800.com/canal/globo-sp-novo/', imageUrl: 'https://i.postimg.cc/J0swJ7tH/Design-sem-nome-63.png', description: 'Rede Globo 4K.' },
    { id: 'leo_premiere_4k', title: 'PREMIERE CLUB 4K', type: 'channel', genre: 'ESPORTES', isRestricted: false, streamUrl: 'http://contfree.shop:80/207946522/261879000/1698439.ts', imageUrl: 'http://contfree.shop:80/images/2961e2a695b10db70eb306b3e0a41eb0.png', description: 'Futebol 4K.' },
    { id: 'leo_hbo_4k', title: 'HBO 4K', type: 'channel', genre: 'HBO', isRestricted: false, streamUrl: 'http://contfree.shop:80/207946522/261879000/1698432.ts', imageUrl: 'http://contfree.shop:80/images/20b403598a91b2dd1e361a6746d3861f.png', description: 'HBO 4K.' }
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
    if (!data.success || !data.data) return { success: 0, error: "Sem jogos." };
    const sportsItems = data.data.map((evento: any) => ({
      id: "radar_" + evento.id,
      title: evento.title.toUpperCase(),
      type: 'channel',
      genre: "FUTEBOL AO VIVO",
      imageUrl: evento.poster,
      isRestricted: false,
      streamUrl: (evento.embeds?.[0]?.embed_url || "") + URL_SEPARATOR + (evento.embeds?.[0]?.embed_url || "")
    }));
    const { error } = await supabase.from('content').upsert(sportsItems, { onConflict: 'id', ignoreDuplicates: true });
    return { success: error ? 0 : sportsItems.length };
  } catch (e) {
    return { success: 0 };
  }
}
