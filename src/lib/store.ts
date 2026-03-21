
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

export interface User {
  id: string;
  pin: string; 
  role: 'admin' | 'user';
  subscriptionTier: SubscriptionTier;
  expiryDate?: string; 
  maxScreens: number;
  activeDevices: string[]; 
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

/**
 * MOTOR DE BUSCA PERPÉTUA - MESTRE LÉO
 * Varre o banco em blocos de 1.000 para trazer TODOS os registros da sua rede de 1.045+ canais.
 */
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
  const { error } = await supabase.from('content').upsert(item);
  return !error;
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
  if (error) console.error("Erro ao salvar usuário:", error.message);
  return !error;
}

export async function removeUser(id: string) {
  const { error } = await supabase.from('users').delete().eq('id', id);
  return !error;
}

export async function saveReseller(reseller: Reseller) {
  const { error } = await supabase.from('resellers').upsert(reseller);
  if (error) console.error("Erro ao salvar revenda:", error.message);
  return !error;
}

/**
 * EXCLUSÃO BLINDADA DE REVENDA
 * Remove primeiro todos os usuários e depois o revendedor para evitar erros de chave estrangeira.
 */
export async function removeReseller(id: string) {
  try {
    // 1. Limpa os usuários vinculados
    await supabase.from('users').delete().eq('resellerId', id);
    // 2. Apaga o revendedor
    const { error } = await supabase.from('resellers').delete().eq('id', id);
    if (error) console.error("Erro ao excluir revenda:", error.message);
    return !error;
  } catch (err) {
    console.error("Falha fatal na exclusão:", err);
    return false;
  }
}

export async function renewUserSubscription(userId: string, resellerId: string) {
  const users = await getRemoteUsers();
  const user = users.find(u => u.id === userId);
  const resellers = await getRemoteResellers();
  const reseller = resellers.find(r => r.id === resellerId);

  if (!user || !reseller) return { error: "Dados não localizados." };
  if (reseller.credits < 1) return { error: "Sem créditos!" };

  const now = new Date();
  let baseDate = now;

  if (user.expiryDate) {
    const currentExpiry = new Date(user.expiryDate);
    if (currentExpiry > now) {
      baseDate = currentExpiry;
    }
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
    credits: reseller.credits - 1,
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
    return { user: { id: 'master-leo', pin: 'adm77x2p', role: 'admin', subscriptionTier: 'lifetime', maxScreens: 999, activeDevices: [deviceId], isBlocked: false } };
  }
  
  const users = await getRemoteUsers();
  const user = users.find(u => u.pin === normalizedPin);
  
  if (!user) return { error: "PIN INVÁLIDO." };
  if (user.isBlocked) return { error: "PIN SUSPENSO." };

  if (user.resellerId) {
    const resellers = await getRemoteResellers();
    const res = resellers.find(r => r.id === user.resellerId);
    if (res?.isBlocked) return { error: "SINAL SUSPENSO (REVENDA BLOQUEADA)." };
  }

  if (!user.activatedAt) {
    if (user.subscriptionTier === 'test') {
      const alreadyUsed = users.some(u => 
        u.subscriptionTier === 'test' && 
        u.pin !== normalizedPin && 
        u.activeDevices?.includes(deviceId)
      );
      if (alreadyUsed) return { error: "APARELHO JÁ USOU O TESTE GRÁTIS." };
      
      user.activatedAt = new Date().toISOString();
      user.expiryDate = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString();
    } else if (user.subscriptionTier === 'monthly') {
      user.activatedAt = new Date().toISOString();
      user.expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    }
    user.activeDevices = [deviceId];
    await saveUser(user);
  }

  if (user.expiryDate && new Date(user.expiryDate) < new Date() && user.subscriptionTier !== 'lifetime') {
    return { error: "SINAL EXPIRADO." };
  }
  
  return { user };
}

export async function validateResellerLogin(username: string, pass: string) {
  const resellers = await getRemoteResellers();
  const res = resellers.find(r => r.username === username && r.password === pass);
  if (!res) return { error: "LOGIN INVÁLIDO." };
  if (res.isBlocked) return { error: "PAINEL SUSPENSO." };
  return { reseller: res };
}

export async function generateM3UPlaylist(pin: string): Promise<string> {
  const users = await getRemoteUsers();
  const user = users.find(u => u.pin === pin);
  
  if (!user || user.isBlocked) return "#EXTM3U\n#EXTINF:-1,ACESSO NEGADO OU EXPIRADO";

  const content = await getRemoteContent();
  let m3u = "#EXTM3U\n";

  content.forEach(item => {
    const streamUrl = item.streamUrl || "";
    const title = item.title.toUpperCase();
    const category = (item.genre || "GERAL").toUpperCase();
    const logo = item.imageUrl || "";

    m3u += `#EXTINF:-1 tvg-logo="${logo}" group-title="${category}",${title}\n${streamUrl}\n`;
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

export const generateRandomPin = (length: number = 6) => {
  const chars = '0123456789';
  let result = '';
  for (let i = 0; i < length; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
};

export const getBeautifulMessage = (pin: string, tier: string, baseUrl: string) => {
  const playlistUrl = `${baseUrl}/api/playlist?pin=${pin}`;
  return `🚀 *LÉO STREAM - SINAL LIBERADO!* 🚀\n\n🔑 *SEU PIN:* \`${pin}\`\n📅 *PLANO:* ${tier === 'test' ? 'Teste VIP 6 Horas' : 'Mensal 30 Dias'}\n\n📺 *LINK PARA SMART TV:* \n${playlistUrl}\n\n📲 _Assista agora em sua Smart TV ou Celular!_`;
}
