
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
  resellerId?: string;
  activatedAt?: string;
  blockedAt?: string;
}

export interface Reseller {
  id: string;
  name: string;
  username: string;
  password?: string;
  cpf: string;
  birthDate: string;
  phone: string;
  email: string;
  credits: number;
  totalSold: number;
  isBlocked: boolean;
}

async function fetchAllRecords(table: string, orderBy: string = 'id'): Promise<any[]> {
  let allData: any[] = [];
  let from = 0;
  let step = 1000;
  let finished = false;

  try {
    while (!finished) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .range(from, from + step - 1)
        .order(orderBy, { ascending: true });

      if (error) break;
      
      if (data && data.length > 0) {
        allData = [...allData, ...data];
        if (data.length < step) finished = true;
        else from += step;
      } else {
        finished = true;
      }
    }
  } catch (e) {}
  return allData;
}

export async function getRemoteContent(): Promise<ContentItem[]> {
  try {
    return await fetchAllRecords('content', 'title');
  } catch (e) {
    return [];
  }
}

export async function getRemoteUsers(): Promise<User[]> {
  try {
    return await fetchAllRecords('users', 'id');
  } catch (e) {
    return [];
  }
}

export async function getRemoteResellers(): Promise<Reseller[]> {
  try {
    return await fetchAllRecords('resellers', 'name');
  } catch (e) {
    return [];
  }
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

export async function saveUser(user: User) {
  try {
    const { error } = await supabase.from('users').upsert({
      id: user.id,
      pin: user.pin,
      role: user.role,
      subscriptionTier: user.subscriptionTier,
      expiryDate: user.expiryDate || null,
      maxScreens: user.maxScreens || 1,
      activeDevices: user.activeDevices || [],
      isBlocked: user.isBlocked || false,
      resellerId: user.resellerId || null,
      activatedAt: user.activatedAt || null,
      blockedAt: user.blockedAt || null
    });
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
      return { user: { id: 'master-leo', pin: 'adm77x2p', role: 'admin', subscriptionTier: 'lifetime', maxScreens: 999, activeDevices: [{id: deviceId, lastActive: new Date().toISOString()}], isBlocked: false } };
    }
    
    const { data: user, error } = await supabase.from('users').select('*').eq('pin', normalizedPin).maybeSingle();
    
    if (error || !user) return { error: "CÓDIGO DE ACESSO INVÁLIDO." };
    if (user.isBlocked) return { error: "ACESSO BLOQUEADO! CONTATE O SUPORTE." };

    const now = new Date();
    if (user.expiryDate && new Date(user.expiryDate) < now && user.subscriptionTier !== 'lifetime') {
      return { error: "SINAL EXPIRADO! RENOVE PARA CONTINUAR." };
    }

    let devices = user.activeDevices || [];
    const isThisDeviceLinked = devices.some((d: any) => d.id === deviceId);

    if (!isThisDeviceLinked) {
      if (devices.length >= (user.maxScreens || 1)) {
        user.isBlocked = true;
        user.blockedAt = now.toISOString();
        await saveUser(user);
        return { error: "LIMITE DE TELAS EXCEDIDO! PIN BLOQUEADO POR SEGURANÇA." };
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
    return { error: "ERRO INTERNO NO SERVIDOR MASTER." };
  }
}

export async function validateResellerLogin(username: string, pass: string) {
  try {
    const { data: res, error } = await supabase.from('resellers').select('*').eq('username', username).eq('password', pass).maybeSingle();
    if (error || !res) return { error: "USUÁRIO OU SENHA INVÁLIDOS." };
    if (res.isBlocked) return { error: "PAINEL DE REVENDA SUSPENSO." };
    return { reseller: res };
  } catch (e) {
    return { error: "ERRO DE CONEXÃO." };
  }
}

export async function generateM3UPlaylist(pin: string): Promise<string> {
  try {
    const { data: userData } = await supabase.from('users').select('*').eq('pin', pin).maybeSingle();
    
    if (!userData || userData.isBlocked) return "#EXTM3U\n#EXTINF:-1,ACESSO NEGADO OU BLOQUEADO";

    const { data: contentData } = await supabase.from('content').select('*').order('title');
    if (!contentData) return "#EXTM3U\n#EXTINF:-1,BIBLIOTECA VAZIA";

    let m3u = "#EXTM3U\n";

    contentData.forEach(item => {
      const logo = item.imageUrl || "";
      const category = (item.genre || "GERAL").toUpperCase();
      const title = item.title.toUpperCase();

      if (item.type === 'channel' || item.type === 'movie') {
        const streamUrl = item.streamUrl || "";
        if (!streamUrl) return;
        m3u += `#EXTINF:-1 tvg-logo="${logo}" group-title="${category}",${title}\n${streamUrl}\n`;
      } else if (item.type === 'series' || item.type === 'multi-season') {
        if (Array.isArray(item.episodes)) {
          item.episodes.sort((a,b) => a.number - b.number).forEach((ep: Episode) => {
            if (!ep.streamUrl) return;
            m3u += `#EXTINF:-1 tvg-logo="${logo}" group-title="${title}",${title} EP ${ep.number}\n${ep.streamUrl}\n`;
          });
        }
        
        if (Array.isArray(item.seasons)) {
          item.seasons.forEach(s => {
            if (Array.isArray(s.episodes)) {
              s.episodes.sort((a,b) => a.number - b.number).forEach(ep => {
                if (!ep.streamUrl) return;
                m3u += `#EXTINF:-1 tvg-logo="${logo}" group-title="${title} - T${s.number}",${title} T${s.number} EP ${ep.number}\n${ep.streamUrl}\n`;
              });
            }
          });
        }
      }
    });

    return m3u;
  } catch (e) {
    return "#EXTM3U\n#EXTINF:-1,ERRO INTERNO NO SERVIDOR MASTER";
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
  const playlistUrl = `${baseUrl}/api/playlist?pin=${pin}`;
  const planoText = tier === 'test' ? 'Teste VIP 6H' : tier === 'lifetime' ? 'Vitalício' : 'Mensal 30 Dias';
  
  return `🚀 *LÉO STREAM - ACESSO LIBERADO!* 🚀

🔑 *SEU CÓDIGO:* \`${pin}\`
📅 *PLANO:* ${planoText}
🖥️ *LIMITE:* ${screens} aparelho(s) vinculados

📺 *SERVIDOR SMART TV:* 
${playlistUrl}

⚠️ _Nota: Este código ficará vinculado aos seus primeiros ${screens} aparelhos. O uso em outros causará bloqueio automático._`;
}

export async function renewUserSubscription(userId: string, resellerId: string) {
  try {
    const { data: user } = await supabase.from('users').select('*').eq('id', userId).single();
    const { data: reseller } = await supabase.from('resellers').select('*').eq('id', resellerId).single();

    if (!user || !reseller) return { error: "Dados não localizados." };
    
    const cost = user.maxScreens || 1;
    if (reseller.credits < cost) return { error: `Sem créditos suficientes (${cost} necessários).` };

    const now = new Date();
    let baseDate = now;

    if (user.expiryDate) {
      const currentExpiry = new Date(user.expiryDate);
      if (currentExpiry > now) baseDate = currentExpiry;
    }

    const newExpiry = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000);

    const updatedUser = {
      ...user,
      subscriptionTier: 'monthly',
      expiryDate: newExpiry.toISOString(),
      isBlocked: false, 
      activatedAt: user.activatedAt || now.toISOString() 
    };

    const updatedReseller = {
      ...reseller,
      credits: reseller.credits - cost,
      totalSold: (reseller.totalSold || 0) + 1
    };

    const { error: errorU } = await supabase.from('users').upsert(updatedUser);
    const { error: errorR } = await supabase.from('resellers').upsert(updatedReseller);

    if (!errorU && !errorR) {
      return { success: true, user: updatedUser, reseller: updatedReseller };
    }
    return { error: "Erro de sincronia." };
  } catch (e) {
    return { error: "FALHA NA RENOVAÇÃO." };
  }
}
