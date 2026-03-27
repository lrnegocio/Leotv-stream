import { supabase } from './supabase-client';

export type ContentType = 'movie' | 'series' | 'multi-season' | 'channel';

export interface Episode {
  id: string;
  title: string;
  number: number;
  streamUrl: string;
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
  imageUrl?: string;
  seasons?: Season[];
  episodes?: Episode[];
}

export type SubscriptionTier = 'test' | 'monthly' | 'lifetime';

export interface ActiveDevice {
  id: string;
  lastActive: string;
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
}

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

export async function getRemoteContent(): Promise<ContentItem[]> {
  return await fetchAllRecords('content', 'title');
}

export async function getRemoteUsers(): Promise<User[]> {
  return await fetchAllRecords('users', 'id');
}

export async function getRemoteResellers(): Promise<Reseller[]> {
  return await fetchAllRecords('resellers', 'name');
}

export async function saveContent(item: ContentItem) {
  try {
    const payload: any = {
      id: item.id,
      title: item.title,
      type: item.type,
      description: item.description || "",
      genre: item.genre || "",
      isRestricted: item.isRestricted || false,
      imageUrl: item.imageUrl || null,
    };

    if (item.type === 'series' || item.type === 'multi-season') {
      payload.episodes = Array.isArray(item.episodes) ? item.episodes.map((e, idx) => ({ ...e, number: idx + 1 })) : [];
      payload.seasons = Array.isArray(item.seasons) ? item.seasons.map((s, sIdx) => ({ 
        ...s, 
        number: sIdx + 1, 
        episodes: Array.isArray(s.episodes) ? s.episodes.map((e, eIdx) => ({ ...e, number: eIdx + 1 })) : []
      })) : [];
      payload.streamUrl = null;
    } else {
      payload.streamUrl = item.streamUrl || null;
      payload.episodes = [];
      payload.seasons = [];
    }
    
    const { error } = await supabase.from('content').upsert(payload);
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
  const { error } = await supabase.from('content').delete().in('id', ids);
  return !error;
}

export async function clearAllM3UContent() {
  const { error } = await supabase.from('content').delete().like('id', 'm3u_%');
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
    if (error || !user) return { error: "CÓDIGO INVÁLIDO." };
    if (user.isBlocked) return { error: "ACESSO BLOQUEADO." };

    const now = new Date();
    if (user.expiryDate && new Date(user.expiryDate) < now && user.subscriptionTier !== 'lifetime') {
      return { error: "SINAL EXPIRADO." };
    }

    let devices = Array.isArray(user.activeDevices) ? user.activeDevices : [];
    const isThisDeviceLinked = devices.some((d: any) => d.id === deviceId);

    if (!isThisDeviceLinked) {
      if (devices.length >= (user.maxScreens || 1)) {
        return { error: "LIMITE DE TELAS EXCEDIDO." };
      }
      devices.push({ id: deviceId, lastActive: now.toISOString() });
      user.activeDevices = devices;
    } else {
      user.activeDevices = devices.map((d: any) => d.id === deviceId ? { ...d, lastActive: now.toISOString() } : d);
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
    return { error: "ERRO DE CONEXÃO MASTER." };
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
    const { data: user } = await supabase.from('users').select('*').eq('pin', pin).maybeSingle();
    if (!user || user.isBlocked) return "#EXTM3U\n#EXTINF:-1,ACESSO BLOQUEADO";

    const content = await getRemoteContent();
    if (!content || content.length === 0) return "#EXTM3U\n#EXTINF:-1,LISTA VAZIA";

    let m3uLines = ["#EXTM3U"];
    content.forEach(item => {
      if (item.isRestricted && !user.isAdultEnabled) return;

      const logo = item.imageUrl || "";
      const cat = (item.genre || "GERAL").toUpperCase();
      const title = item.title.toUpperCase();

      if (item.type === 'channel' || item.type === 'movie') {
        if (!item.streamUrl) return;
        m3uLines.push(`#EXTINF:-1 tvg-logo="${logo}" group-title="${cat}",${title}`);
        m3uLines.push(item.streamUrl);
      } else if (item.type === 'series' || item.type === 'multi-season') {
        if (Array.isArray(item.episodes)) {
          item.episodes.forEach((ep: Episode) => {
            if (!ep.streamUrl) return;
            m3uLines.push(`#EXTINF:-1 tvg-logo="${logo}" group-title="${title}",${title} EP ${ep.number}`);
            m3uLines.push(ep.streamUrl);
          });
        }
        if (Array.isArray(item.seasons)) {
          item.seasons.forEach((s: Season) => {
            if (Array.isArray(s.episodes)) {
              s.episodes.forEach(ep => {
                if (!ep.streamUrl) return;
                m3uLines.push(`#EXTINF:-1 tvg-logo="${logo}" group-title="${title} T${s.number}",${title} T${s.number} EP ${ep.number}`);
                m3uLines.push(ep.streamUrl);
              });
            }
          });
        }
      }
    });
    return m3uLines.join('\n');
  } catch (e) {
    return "#EXTM3U\n#EXTINF:-1,ERRO NO SERVIDOR";
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
  const prodUrl = "https://leotv-streaming.vercel.app";
  const playlistUrl = `${prodUrl}/api/playlist?pin=${pin}`;
  const planoText = tier === 'test' ? 'Teste VIP 6H' : tier === 'lifetime' ? 'Vitalício' : 'Mensal 30 Dias';
  return `🚀 *LÉO STREAM - ACESSO LIBERADO!* 🚀\n\n🔑 *SEU CÓDIGO:* \`${pin}\`\n📅 *PLANO:* ${planoText}\n🖥️ *LIMITE:* ${screens} tela(s)\n\n📺 *SISTEMA:* ${prodUrl}\n📺 *LINK IPTV:* \n${playlistUrl}\n\n⚠️ _Sinal blindado de alta performance._`;
}

export async function renewUserSubscription(userId: string, resellerId: string) {
  try {
    const { data: user } = await supabase.from('users').select('*').eq('id', userId).single();
    const { data: reseller } = await supabase.from('resellers').select('*').eq('id', resellerId).single();
    if (!user || !reseller) return { error: "Erro." };
    const cost = user.maxScreens || 1;
    if (reseller.credits < cost) return { error: "Sem créditos." };
    const now = new Date();
    let baseDate = now;
    if (user.expiryDate && new Date(user.expiryDate) > now) baseDate = new Date(user.expiryDate);
    const newExpiry = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    const updatedUser = { ...user, subscriptionTier: 'monthly', expiryDate: newExpiry.toISOString(), isBlocked: false };
    const updatedReseller = { ...reseller, credits: reseller.credits - cost, totalSold: (reseller.totalSold || 0) + 1 };
    await supabase.from('users').upsert(updatedUser);
    await supabase.from('resellers').upsert(updatedReseller);
    return { success: true, user: updatedUser, reseller: updatedReseller };
  } catch (e) {
    return { error: "FALHA." };
  }
}

/**
 * IMPORTADOR M3U SUPREMO v126.0 - ULTRA-LIGHT TURBO
 * Otimizado para 40k+ itens e trava parental automática para Terror e Adultos.
 */
export async function processM3UImport(content: string): Promise<{ success: number; failed: number }> {
  const lines = content.split('\n');
  const items: ContentItem[] = [];
  let currentItem: Partial<ContentItem> | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.startsWith('#EXTINF:')) {
      const logoMatch = line.match(/tvg-logo=["']?([^"']+)["']?/i);
      const groupMatch = line.match(/group-title=["']?([^"']+)["']?/i);
      const nameParts = line.split(',');
      const name = nameParts[nameParts.length - 1]?.trim() || "Canal Importado";
      
      const genre = groupMatch ? groupMatch[1] : "GERAL";
      const genreUpper = genre.toUpperCase();
      const nameUpper = name.toUpperCase();

      // REGRA MESTRE: Detecção automática de restrição para Terror e Adultos
      const isAdult = genreUpper.includes('ADULT') || genreUpper.includes('XXX') || genreUpper.includes('HOT') || nameUpper.includes('XXX') || nameUpper.includes('ADULTO');
      const isTerror = genreUpper.includes('TERROR') || genreUpper.includes('HORROR') || nameUpper.includes('TERROR') || nameUpper.includes('HORROR');

      currentItem = {
        id: "m3u_" + Math.random().toString(36).substring(2, 10) + "_" + i,
        title: name,
        type: genreUpper.includes('FILME') || genreUpper.includes('MOVIE') ? 'movie' : 'channel',
        genre: genreUpper,
        imageUrl: logoMatch ? logoMatch[1] : undefined,
        isRestricted: isAdult || isTerror,
        description: `Importado via M3U Master - Grupo: ${genre}`
      };
    } else if (line.startsWith('http') && currentItem) {
      currentItem.streamUrl = line;
      items.push(currentItem as ContentItem);
      currentItem = null;
    }
  }

  let successCount = 0;
  let failedCount = 0;

  for (let i = 0; i < items.length; i += 50) {
    const batch = items.slice(i, i + 50);
    const { error } = await supabase.from('content').upsert(batch);
    if (!error) successCount += batch.length;
    else failedCount += batch.length;
    
    if (i % 500 === 0) {
      await new Promise(resolve => setTimeout(resolve, 10));
    }
  }

  return { success: successCount, failed: failedCount };
}