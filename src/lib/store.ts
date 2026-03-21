
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
  return await fetchAllRecords('content', 'title');
}

export async function getRemoteUsers(): Promise<User[]> {
  return await fetchAllRecords('users', 'id');
}

export async function getRemoteResellers(): Promise<Reseller[]> {
  return await fetchAllRecords('resellers', 'name');
}

export async function saveContent(item: ContentItem) {
  const payload: any = {
    id: item.id,
    title: item.title,
    type: item.type,
    description: item.description,
    genre: item.genre,
    isRestricted: item.isRestricted,
    imageUrl: item.imageUrl || null,
  };

  if (item.type === 'series' || item.type === 'multi-season') {
    payload.episodes = item.episodes || [];
    payload.seasons = item.seasons || [];
    payload.streamUrl = null;
  } else {
    payload.streamUrl = item.streamUrl || null;
    payload.episodes = [];
    payload.seasons = [];
  }
  
  const { error } = await supabase.from('content').upsert(payload);
  
  if (error) {
    console.error("FALHA CRÍTICA NO SUPABASE:", error.message);
    return false;
  }
  return true;
}

export async function removeContent(id: string) {
  const { error } = await supabase.from('content').delete().eq('id', id);
  return !error;
}

export async function saveUser(user: User) {
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

export async function renewUserSubscription(userId: string, resellerId: string) {
  const users = await getRemoteUsers();
  const user = users.find(u => u.id === userId);
  const resellers = await getRemoteResellers();
  const reseller = resellers.find(r => r.id === resellerId);

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

  const updatedUser: User = {
    ...user,
    subscriptionTier: 'monthly',
    expiryDate: newExpiry.toISOString(),
    isBlocked: false, 
    activatedAt: user.activatedAt || now.toISOString() 
  };

  const updatedReseller: Reseller = {
    ...reseller,
    credits: reseller.credits - cost,
    totalSold: (reseller.totalSold || 0) + 1
  };

  const successUser = await saveUser(updatedUser);
  const successReseller = await saveReseller(updatedReseller);

  if (successUser && successReseller) {
    return { success: true, user: updatedUser, reseller: updatedReseller };
  }
  return { error: "Erro de sincronia." };
}

export async function validateDeviceLogin(pin: string, deviceId: string): Promise<{ user?: User; error?: string }> {
  const normalizedPin = pin.trim();
  
  if (normalizedPin === 'adm77x2p') {
    return { user: { id: 'master-leo', pin: 'adm77x2p', role: 'admin', subscriptionTier: 'lifetime', maxScreens: 999, activeDevices: [{id: deviceId, lastActive: new Date().toISOString()}], isBlocked: false } };
  }
  
  const users = await getRemoteUsers();
  const user = users.find(u => u.pin === normalizedPin);
  
  if (!user) return { error: "CÓDIGO DE ACESSO INVÁLIDO." };
  if (user.isBlocked) return { error: "ACESSO BLOQUEADO! CONTATE O SUPORTE." };

  const now = new Date();
  if (user.expiryDate && new Date(user.expiryDate) < now && user.subscriptionTier !== 'lifetime') {
    return { error: "SINAL EXPIRADO! RENOVE PARA CONTINUAR." };
  }

  let devices = user.activeDevices || [];
  const isThisDeviceLinked = devices.some(d => d.id === deviceId);

  if (!isThisDeviceLinked) {
    if (devices.length >= user.maxScreens) {
      // PERFORMANCE & SEGURANÇA: Só bloqueia se tentar um novo aparelho acima do limite.
      user.isBlocked = true;
      user.blockedAt = now.toISOString();
      await saveUser(user);
      return { error: "LIMITE DE APARELHOS EXCEDIDO! PIN BLOQUEADO." };
    }
    devices.push({ id: deviceId, lastActive: now.toISOString() });
    user.activeDevices = devices;
  } else {
    user.activeDevices = devices.map(d => d.id === deviceId ? { ...d, lastActive: now.toISOString() } : d);
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
}

export async function validateResellerLogin(username: string, pass: string) {
  const resellers = await getRemoteResellers();
  const res = resellers.find(r => r.username === username && r.password === pass);
  if (!res) return { error: "USUÁRIO OU SENHA INVÁLIDOS." };
  if (res.isBlocked) return { error: "PAINEL DE REVENDA SUSPENSO." };
  return { reseller: res };
}

export async function generateM3UPlaylist(pin: string): Promise<string> {
  const users = await fetchAllRecords('users');
  const user = users.find(u => u.pin === pin);
  
  if (!user || user.isBlocked) return "#EXTM3U\n#EXTINF:-1,ACESSO NEGADO";

  const now = new Date();
  if (user.expiryDate && new Date(user.expiryDate) < now && user.subscriptionTier !== 'lifetime') {
    return "#EXTM3U\n#EXTINF:-1,SINAL EXPIRADO";
  }

  const content = await fetchAllRecords('content', 'title');
  let m3u = "#EXTM3U\n";

  content.forEach(item => {
    if (item.type === 'channel' || item.type === 'movie') {
      const streamUrl = item.streamUrl || "";
      const title = item.title.toUpperCase();
      const category = (item.genre || "GERAL").toUpperCase();
      const logo = item.imageUrl || "";
      m3u += `#EXTINF:-1 tvg-logo="${logo}" group-title="${category}",${title}\n${streamUrl}\n`;
    } else if ((item.type === 'series' || item.type === 'multi-season') && item.episodes) {
      item.episodes.forEach((ep: Episode) => {
        m3u += `#EXTINF:-1 group-title="${item.title.toUpperCase()}",${item.title.toUpperCase()} EP ${ep.number}\n${ep.streamUrl}\n`;
      });
    }
  });

  return m3u;
}

export async function getGlobalSettings() {
  const { data } = await supabase.from('settings').select('*').eq('key', 'global').maybeSingle();
  return data?.value || { parentalPin: '1234' };
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
