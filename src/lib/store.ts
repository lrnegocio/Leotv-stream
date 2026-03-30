
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

const clearLocalCache = () => {
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
    if (error) return 0;
    return count || 0;
  } catch (e) {
    return 0;
  }
}

export async function getRemoteContent(forceRefresh = false, searchQuery = ""): Promise<ContentItem[]> {
  try {
    const cacheKey = `p2p_content_cache_${searchQuery || 'all'}`;
    
    if (!forceRefresh) {
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        // Cache reduzido para 1 hora para garantir sincronia entre Admin e Cliente
        if (Date.now() - timestamp < 1000 * 60 * 60) return data;
      }
    }

    let query = supabase.from('content').select('*').order('title', { ascending: true });

    if (searchQuery && searchQuery.length > 0) {
      query = query.or(`title.ilike.%${searchQuery}%,genre.ilike.%${searchQuery}%`);
      query = query.limit(1000); 
    } else {
      query = query.limit(500); 
    }

    const { data: rawData, error } = await query;
    if (error || !rawData) return [];

    const processed = rawData.map(item => {
      if (item.streamUrl && typeof item.streamUrl === 'string' && item.streamUrl.includes(URL_SEPARATOR)) {
        const parts = item.streamUrl.split(URL_SEPARATOR);
        item.streamUrl = parts[0] || "";
        item.directStreamUrl = parts[1] || "";
      } else if (!item.directStreamUrl) {
        item.directStreamUrl = item.streamUrl; 
      }
      return item;
    });

    localStorage.setItem(cacheKey, JSON.stringify({ data: processed, timestamp: Date.now() }));
    return processed;
  } catch (e) {
    return [];
  }
}

export async function getContentById(id: string): Promise<ContentItem | null> {
  try {
    const { data, error } = await supabase.from('content').select('*').eq('id', id).maybeSingle();
    if (error || !data) return null;

    if (data.streamUrl && typeof data.streamUrl === 'string' && data.streamUrl.includes(URL_SEPARATOR)) {
      const parts = data.streamUrl.split(URL_SEPARATOR);
      data.streamUrl = parts[0] || "";
      data.directStreamUrl = parts[1] || "";
    } else if (!data.directStreamUrl) {
      data.directStreamUrl = data.streamUrl;
    }
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
    const cleanStreamUrl = (item.streamUrl || "").trim();
    const cleanDirectUrl = (item.directStreamUrl || "").trim();
    const combinedUrl = cleanDirectUrl ? `${cleanStreamUrl}${URL_SEPARATOR}${cleanDirectUrl}` : cleanStreamUrl;

    const payload: any = {
      id: item.id || generateSafeId(item.title),
      title: item.title,
      type: item.type,
      description: item.description || "Sinal Master Léo Tv",
      genre: (item.genre || "LÉO TV GERAL").toUpperCase(),
      isRestricted: item.isRestricted || false,
      imageUrl: item.imageUrl || null,
      streamUrl: combinedUrl,
      episodes: Array.isArray(item.episodes) ? item.episodes : [],
      seasons: Array.isArray(item.seasons) ? item.seasons : [],
    };

    const { error } = await supabase.from('content').upsert(payload, { onConflict: 'id' });
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
  let allSuccess = true;

  for (let i = 0; i < ids.length; i += batchSize) {
    const batch = ids.slice(i, i + batchSize);
    const { error } = await supabase.from('content').delete().in('id', batch);
    if (error) {
      allSuccess = false;
    }
  }

  clearLocalCache();
  return allSuccess;
}

export async function clearAllM3UContent() {
  try {
    // LIMPEZA MASTER: Apaga absolutamente tudo da tabela de conteúdo
    const { error } = await supabase.from('content').delete().neq('id', '0_placeholder_0');
    clearLocalCache();
    return !error;
  } catch (e) {
    return false;
  }
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
  const itemsMap = new Map<string, any>();
  let currentItemData: any = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('#EXTINF:')) {
      const logoMatch = line.match(/tvg-logo=["']?([^"']+)["']?/i);
      const groupMatch = line.match(/group-title=["']?([^"']+)["']?/i);
      const name = line.split(',').pop()?.trim() || "Canal Sem Nome";
      const rawGenre = (groupMatch ? groupMatch[1] : "GERAL").toUpperCase();
      
      let finalGenre = `LÉO TV CANAIS AO VIVO`;
      if (rawGenre.includes('FILME') || rawGenre.includes('MOVIES')) finalGenre = "LÉO TV FILMES";
      else if (rawGenre.includes('ADULT') || rawGenre.includes('XXX') || rawGenre.includes('HOT')) finalGenre = "LÉO TV ADULTOS";
      else if (rawGenre.includes('DORAMA') || rawGenre.includes('K-DRAMA')) finalGenre = "LÉO TV DORAMAS";
      else if (rawGenre.includes('SERIE') || rawGenre.includes('ANIME')) finalGenre = "LÉO TV SERIES";
      else if (rawGenre.includes('ESPORTE') || rawGenre.includes('SPORTS')) finalGenre = "LÉO TV ESPORTES";
      else if (rawGenre.includes('DESENHO') || rawGenre.includes('KIDS') || rawGenre.includes('INFANTIL')) finalGenre = "LÉO TV DESENHOS";
      else if (rawGenre.includes('CLIPES')) finalGenre = "LÉO TV VÍDEO CLIPES";
      else if (rawGenre.includes('MUSICA')) finalGenre = "LÉO TV MUSICAS";
      else if (rawGenre.includes('RADIO')) finalGenre = "LÉO TV RÁDIOS";
      else if (rawGenre.includes('NOVELA')) finalGenre = "LÉO TV NOVELAS";

      currentItemData = {
        title: name,
        genre: finalGenre,
        imageUrl: logoMatch ? logoMatch[1] : null,
        isRestricted: rawGenre.includes('ADULT') || rawGenre.includes('XXX') || rawGenre.includes('HOT'),
      };
    } else if (line.startsWith('http') && currentItemData) {
      const { title, genre, imageUrl, isRestricted } = currentItemData;
      const streamUrl = line + URL_SEPARATOR + line;

      // MOTOR DE AGRUPAMENTO MASTER
      const seriesMatch = title.match(/(.*?)\s+[sS](\d+)[eE](\d+)/i) || 
                          title.match(/(.*?)\s+Episode\s+(\d+)/i) || 
                          title.match(/(.*?)\s+Episodio\s+(\d+)/i);
      
      if (seriesMatch && (genre.includes('SERIE') || genre.includes('DORAMA') || genre.includes('ANIME') || genre.includes('NOVELA'))) {
        const baseName = seriesMatch[1].trim();
        const seasonNum = seriesMatch.length === 4 ? parseInt(seriesMatch[2]) : 1;
        const epNum = seriesMatch.length === 4 ? parseInt(seriesMatch[3]) : parseInt(seriesMatch[2]);

        if (!itemsMap.has(baseName)) {
          itemsMap.set(baseName, {
            id: generateSafeId(baseName),
            title: baseName,
            type: seasonNum > 1 ? 'multi-season' : 'series',
            genre: genre,
            imageUrl: imageUrl,
            isRestricted: isRestricted,
            description: "Sinal Master Léo Tv",
            episodes: [],
            seasons: []
          });
        }

        const series = itemsMap.get(baseName);
        const newEp: Episode = {
          id: generateSafeId(title),
          title: `Episódio ${epNum}`,
          number: epNum,
          streamUrl: streamUrl,
          directStreamUrl: line
        };

        if (seasonNum > 1 || series.type === 'multi-season') {
          series.type = 'multi-season';
          let season = series.seasons.find((s: any) => s.number === seasonNum);
          if (!season) {
            season = { id: generateSafeId(`${baseName}_S${seasonNum}`), number: seasonNum, episodes: [] };
            series.seasons.push(season);
          }
          if (!season.episodes.find((e: any) => e.number === epNum)) {
            season.episodes.push(newEp);
          }
        } else {
          if (!series.episodes.find((e: any) => e.number === epNum)) {
            series.episodes.push(newEp);
          }
        }
      } else {
        const id = generateSafeId(title);
        itemsMap.set(id, {
          id,
          title,
          type: genre.includes('FILME') ? 'movie' : 'channel',
          genre,
          imageUrl,
          isRestricted,
          description: "Sinal Master Léo Tv",
          streamUrl
        });
      }
      currentItemData = null;
    }
  }

  const items = Array.from(itemsMap.values());
  let successCount = 0;
  const batchSize = 100; 
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    if (onProgress) onProgress(`Sincronizando: ${i} de ${items.length}...`);
    const { error } = await supabase.from('content').upsert(batch, { onConflict: 'id' });
    if (!error) successCount += batch.length;
    await new Promise(r => setTimeout(r, 100)); 
  }
  
  clearLocalCache();
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
    { id: 'leo_globo_sp_4k', title: 'GLOBO SP 4K', type: 'channel', genre: 'LÉO TV CANAIS AO VIVO', isRestricted: false, streamUrl: 'https://tvonline0800.com/canal/globo-sp-novo/', imageUrl: 'https://i.postimg.cc/J0swJ7tH/Design-sem-nome-63.png', description: 'Rede Globo 4K.' },
    { id: 'leo_premiere_4k', title: 'PREMIERE CLUB 4K', type: 'channel', genre: 'LÉO TV ESPORTES', isRestricted: false, streamUrl: 'http://contfree.shop:80/207946522/261879000/1698439.ts', imageUrl: 'http://contfree.shop:80/images/2961e2a695b10db70eb306b3e0a41eb0.png', description: 'Futebol 4K.' },
    { id: 'leo_hbo_4k', title: 'HBO 4K', type: 'channel', genre: 'LÉO TV FILMES', isRestricted: false, streamUrl: 'http://contfree.shop:80/207946522/261879000/1698432.ts', imageUrl: 'http://contfree.shop:80/images/20b403598a91b2dd1e361a6746d3861f.png', description: 'HBO 4K.' }
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
      genre: "LÉO TV ESPORTES",
      imageUrl: evento.poster,
      isRestricted: false,
      streamUrl: (evento.embeds?.[0]?.embed_url || "") + URL_SEPARATOR + (evento.embeds?.[0]?.embed_url || "")
    }));
    const { error } = await supabase.from('content').upsert(sportsItems, { onConflict: 'id', ignoreDuplicates: true });
    clearLocalCache();
    return { success: error ? 0 : sportsItems.length };
  } catch (e) {
    return { success: 0 };
  }
}
