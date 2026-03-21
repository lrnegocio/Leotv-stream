
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
  cpf: string;
  birthDate: string;
  phone: string;
  email: string;
  credits: number;
  totalSold: number;
}

/**
 * MOTOR DE BUSCA PERPÉTUA (ILIMITADO)
 * Varre o banco de 1000 em 1000 até carregar absolutamente tudo.
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
  } catch (e) {
    console.error(`Erro na busca da tabela ${table}:`, e);
  }
  return allData;
}

export async function getRemoteContent(): Promise<ContentItem[]> {
  // Retorna canais em ordem alfabética (A-Z)
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
  const { error } = await supabase.from('resellers').upsert(reseller);
  return !error;
}

export async function removeReseller(id: string) {
  const { error } = await supabase.from('resellers').delete().eq('id', id);
  return !error;
}

export async function validateDeviceLogin(pin: string, deviceId: string): Promise<{ user?: User; error?: string }> {
  const normalizedPin = pin.trim();
  
  // LOGIN MASTER ADMIN
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
  
  if (!user) return { error: "CÓDIGO INVÁLIDO" };
  if (user.isBlocked) return { error: "ACESSO SUSPENSO." };

  // LÓGICA DE TESTE GRÁTIS (6 HORAS) COM ANTI-FRAUDE DE DISPOSITIVO
  if (user.subscriptionTier === 'test') {
    // ANTI-FRAUDE: Verifica se este aparelho já usou OUTRO teste grátis antes
    const alreadyUsedATest = users.some(u => 
      u.subscriptionTier === 'test' && 
      u.pin !== normalizedPin && 
      u.activeDevices?.includes(deviceId)
    );

    if (alreadyUsedATest) {
      user.isBlocked = true;
      user.blockedAt = new Date().toISOString();
      await saveUser(user);
      return { error: "ESTE APARELHO JÁ UTILIZOU O TESTE GRÁTIS. ADQUIRA UM PLANO." };
    }

    // Ativação do Teste no 1º Uso
    if (!user.activatedAt) {
      user.activatedAt = new Date().toISOString();
      user.expiryDate = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString();
      user.activeDevices = [deviceId];
      await saveUser(user);
    }
  }

  // Lógica de Ativação Master para Vendas (30 dias)
  // Se for venda (monthly), libera mesmo que tenha usado teste antes
  if (!user.activatedAt && (user.subscriptionTier === 'monthly')) {
    user.activatedAt = new Date().toISOString();
    user.expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    user.activeDevices = [deviceId];
    await saveUser(user);
  }

  const isImmune = user.role === 'admin' || user.subscriptionTier === 'lifetime';

  // Verifica expiração
  if (!isImmune && user.expiryDate && new Date(user.expiryDate) < new Date()) {
    return { error: "ACESSO EXPIRADO. CONTATE SEU REVENDEDOR." };
  }

  // Controle de Telas
  const deviceList = user.activeDevices || [];
  if (!deviceList.includes(deviceId)) {
    if (deviceList.length >= user.maxScreens && !isImmune) {
      return { error: "LIMITE DE TELAS EXCEDIDO." };
    }
    user.activeDevices = [...deviceList, deviceId];
    await saveUser(user);
  }

  return { user };
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
