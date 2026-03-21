'use client';

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
 * MOTOR DE BUSCA PERPÉTUA LÉO STREAM v56.0
 * Varre o Supabase em blocos de 1000 canais de forma sequencial para evitar Timeout na Vercel.
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

      if (error) {
        console.error(`Erro no motor P2P na tabela ${table}:`, error.message);
        break;
      }
      
      if (data && data.length > 0) {
        allData = [...allData, ...data];
        if (data.length < step) finished = true;
        else from += step;
      } else {
        finished = true;
      }
    }
  } catch (e) {
    console.error(`Falha crítica no motor P2P ${table}:`, e);
  }
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
  const { error } = await supabase.from('users').upsert(user);
  return !error;
}

export async function removeUser(id: string) {
  const { error } = await supabase.from('users').delete().eq('id', id);
  return !error;
}

export async function saveReseller(reseller: Reseller) {
  // Envio explícito de campos para garantir compatibilidade com o banco
  const dataToSave = {
    id: reseller.id,
    name: reseller.name,
    username: reseller.username,
    password: reseller.password,
    cpf: reseller.cpf,
    birthDate: reseller.birthDate,
    phone: reseller.phone,
    email: reseller.email,
    credits: reseller.credits,
    totalSold: reseller.totalSold,
    isBlocked: reseller.isBlocked
  };

  const { error } = await supabase.from('resellers').upsert(dataToSave);
  if (error) {
    console.error("Erro fatal ao salvar revenda:", error.message);
    return false;
  }
  return true;
}

export async function removeReseller(id: string) {
  const { error } = await supabase.from('resellers').delete().eq('id', id);
  if (error) {
    console.error("Erro fatal ao excluir revenda:", error.message);
    return false;
  }
  return true;
}

export async function validateDeviceLogin(pin: string, deviceId: string): Promise<{ user?: User; error?: string }> {
  const normalizedPin = pin.trim();
  
  // Login Master Léo
  if (normalizedPin === 'adm77x2p') {
    return { 
      user: { 
        id: 'master-leo', 
        pin: 'adm77x2p', 
        role: 'admin', 
        subscriptionTier: 'lifetime', 
        maxScreens: 999, 
        activeDevices: [deviceId], 
        isBlocked: false 
      } 
    };
  }

  const users = await getRemoteUsers();
  const user = users.find(u => u.pin === normalizedPin);
  
  if (!user) return { error: "CÓDIGO PIN INVÁLIDO." };
  if (user.isBlocked) return { error: "ACESSO SUSPENSO PELO ADMIN." };

  // Verifica se o revendedor deste PIN está bloqueado
  if (user.resellerId) {
    const resellers = await getRemoteResellers();
    const res = resellers.find(r => r.id === user.resellerId);
    if (res?.isBlocked) return { error: "SINAL TEMPORARIAMENTE INDISPONÍVEL (REVENDA)." };
  }

  // Lógica Anti-Fraude de Aparelho (Teste 6h)
  if (user.subscriptionTier === 'test' && !user.activatedAt) {
    const alreadyUsed = users.some(u => 
      u.subscriptionTier === 'test' && 
      u.pin !== normalizedPin && 
      u.activeDevices?.includes(deviceId)
    );
    
    if (alreadyUsed) {
      user.isBlocked = true;
      user.blockedAt = new Date().toISOString();
      await saveUser(user);
      return { error: "ESTE APARELHO JÁ UTILIZOU O TESTE GRÁTIS." };
    }
    
    user.activatedAt = new Date().toISOString();
    user.expiryDate = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString();
    user.activeDevices = [deviceId];
    await saveUser(user);
  }

  // Ativação Mensal Automática
  if (user.subscriptionTier === 'monthly' && !user.activatedAt) {
    user.activatedAt = new Date().toISOString();
    user.expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    user.activeDevices = [deviceId];
    await saveUser(user);
  }

  // Verificação de Expiração em Tempo Real
  if (user.expiryDate && new Date(user.expiryDate) < new Date() && user.subscriptionTier !== 'lifetime') {
    user.isBlocked = true;
    await saveUser(user);
    return { error: "SINAL EXPIRADO. PROCURE SEU REVENDEDOR." };
  }

  return { user };
}

export async function validateResellerLogin(username: string, pass: string) {
  const resellers = await getRemoteResellers();
  const res = resellers.find(r => r.username === username && r.password === pass);
  if (!res) return { error: "USUÁRIO OU SENHA INCORRETOS." };
  if (res.isBlocked) return { error: "ACESSO À REVENDA SUSPENSO PELO ADMIN." };
  return { reseller: res };
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

export const getBeautifulMessage = (pin: string, type: string) => {
  return `🚀 *LÉO STREAM - SINAL ATIVADO!* 🚀\n\nSeu acesso master de alta performance foi liberado com sucesso.\n\n🔑 *SEU PIN:* \`${pin}\`\n📅 *PLANO:* ${type === 'test' ? 'Teste 6 Horas' : 'Mensal 30 Dias'}\n\n📲 *Como acessar:* Acesse nosso site e coloque o código acima.\n\n✨ _O melhor sinal P2P do Brasil!_`;
}