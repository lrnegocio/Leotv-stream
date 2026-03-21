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
    // Primeiro deleta os usuários vinculados para não dar erro de chave estrangeira
    await supabase.from('users').delete().eq('resellerId', id);
    // Depois deleta o revendedor
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

/**
 * VALIDAÇÃO DE LOGIN COM VINCULAÇÃO DE HARDWARE (BINDING) PERMANENTE
 * O PIN é "casado" com os aparelhos que logam primeiro.
 */
export async function validateDeviceLogin(pin: string, deviceId: string): Promise<{ user?: User; error?: string }> {
  const normalizedPin = pin.trim();
  
  // Acesso Admin Master Blindado
  if (normalizedPin === 'adm77x2p') {
    return { user: { id: 'master-leo', pin: 'adm77x2p', role: 'admin', subscriptionTier: 'lifetime', maxScreens: 999, activeDevices: [{id: deviceId, lastActive: new Date().toISOString()}], isBlocked: false } };
  }
  
  const users = await getRemoteUsers();
  const user = users.find(u => u.pin === normalizedPin);
  
  if (!user) return { error: "CÓDIGO INVÁLIDO." };
  if (user.isBlocked) return { error: "ACESSO BLOQUEADO! CONTATE O ADMINISTRADOR." };

  const now = new Date();
  if (user.expiryDate && new Date(user.expiryDate) < now && user.subscriptionTier !== 'lifetime') {
    return { error: "SINAL EXPIRADO! RENOVE PARA VOLTAR A ASSISTIR." };
  }

  // LÓGICA DE VINCULAÇÃO DE HARDWARE (BINDING) PERMANENTE
  const registeredDevices = user.activeDevices || [];
  const isDeviceRegistered = registeredDevices.some(d => d.id === deviceId);

  if (!isDeviceRegistered) {
    // Se não está registrado, tenta registrar uma nova vaga
    if (registeredDevices.length >= user.maxScreens) {
      // Bloqueia o PIN permanentemente porque tentou usar em um aparelho novo sem ter vaga disponível
      user.isBlocked = true;
      user.blockedAt = now.toISOString();
      await saveUser(user);
      return { error: "LIMITE DE APARELHOS EXCEDIDO! PIN BLOQUEADO PARA SEGURANÇA DO PAINEL." };
    }
    // Vincula este aparelho permanentemente ao PIN
    registeredDevices.push({ id: deviceId, lastActive: now.toISOString() });
    user.activeDevices = registeredDevices;
  } else {
    // Aparelho já vinculado, apenas atualiza o timestamp de atividade
    user.activeDevices = registeredDevices.map(d => d.id === deviceId ? { ...d, lastActive: now.toISOString() } : d);
  }
  
  // Ativação do PIN no primeiro uso
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

export async function logoutDevice(userId: string, deviceId: string) {
  // Logout no modelo de vinculação de hardware (Binding) não desvincula o aparelho, pois o vínculo é permanente conforme pedido.
}

export async function validateResellerLogin(username: string, pass: string) {
  const resellers = await getRemoteResellers();
  const res = resellers.find(r => r.username === username && r.password === pass);
  if (!res) return { error: "LOGIN INVÁLIDO." };
  if (res.isBlocked) return { error: "PAINEL SUSPENSO." };
  return { reseller: res };
}

export async function generateM3UPlaylist(pin: string): Promise<string> {
  const users = await fetchAllRecords('users');
  const user = users.find(u => u.pin === pin);
  
  if (!user || user.isBlocked) return "#EXTM3U\n#EXTINF:-1,ACESSO NEGADO OU BLOQUEADO";

  const now = new Date();
  if (user.expiryDate && new Date(user.expiryDate) < now && user.subscriptionTier !== 'lifetime') {
    return "#EXTM3U\n#EXTINF:-1,SINAL EXPIRADO - RENOVE COM SEU REVENDEDOR";
  }

  const content = await fetchAllRecords('content', 'title');
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

// PINs DE 11 DÍGITOS PARA MÁXIMA SEGURANÇA
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

📺 *SERVIDOR IPTV (SMART TV):* 
${playlistUrl}

⚠️ _Nota: Este código será vinculado permanentemente aos primeiros aparelhos que logarem._`;
}
