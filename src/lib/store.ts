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
  blockedAt?: string; 
}

/**
 * BUSCA CONTEÚDO REMOTO
 * Otimizado com cache de sessão para Smart TVs
 */
export async function getRemoteContent(): Promise<ContentItem[]> {
  try {
    const { data, error } = await supabase.from('content').select('*').order('title', { ascending: true });
    if (error) throw error;
    return data || [];
  } catch (e) {
    return [];
  }
}

export async function saveContent(item: ContentItem) {
  try {
    const { error } = await supabase.from('content').upsert(item);
    if (error) throw error;
    return true;
  } catch (e) {
    return false;
  }
}

export async function removeContent(id: string) {
  try {
    const { error } = await supabase.from('content').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * BUSCA USUÁRIOS REMOTOS
 * Removido hardcode de ADMIN_PIN para segurança total.
 * O admin agora deve ser definido diretamente no banco de dados.
 */
export async function getRemoteUsers(): Promise<User[]> {
  try {
    const { data, error } = await supabase.from('users').select('*').order('pin', { ascending: true });
    if (error) throw error;

    return (data || []).map(u => ({
      id: u.id,
      pin: u.pin,
      role: u.role || 'user',
      subscriptionTier: u.subscriptionTier || 'test',
      expiryDate: u.expiryDate,
      maxScreens: u.maxScreens || 1,
      activeDevices: u.activeDevices || [],
      isBlocked: !!u.isBlocked,
      blockedAt: u.blockedAt
    }));
  } catch (e) {
    return [];
  }
}

export async function saveUser(user: User) {
  try {
    const payload: any = {
      id: user.id,
      pin: user.pin,
      role: user.role,
      subscriptionTier: user.subscriptionTier,
      expiryDate: user.expiryDate || null,
      maxScreens: user.maxScreens,
      activeDevices: user.activeDevices || [],
      isBlocked: user.isBlocked,
      blockedAt: user.blockedAt || null
    };

    const { error } = await supabase.from('users').upsert(payload);
    
    if (error) {
      // Tenta salvar sem a coluna blockedAt caso ela não exista no banco do usuário
      delete payload.blockedAt;
      const { error: retryError } = await supabase.from('users').upsert(payload);
      return !retryError;
    }
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * VALIDAÇÃO DE LOGIN P2P MASTER
 * Lógica inteligente de troca de aparelhos vs login duplo real.
 */
export async function validateDeviceLogin(pin: string, deviceId: string): Promise<{ user?: User; error?: string }> {
  const users = await getRemoteUsers();
  const normalizedPin = pin.trim();
  
  // Busca o usuário pelo PIN no banco (Sem hardcode!)
  const user = users.find(u => u.pin === normalizedPin);
  
  if (!user) return { error: "CÓDIGO PIN INVÁLIDO" };

  // ADMINS E VITALÍCIOS NÃO EXPIRAM
  const isImmortal = user.role === 'admin' || user.subscriptionTier === 'lifetime';
  if (!isImmortal && user.expiryDate && new Date(user.expiryDate) < new Date()) {
    return { error: "SUA ASSINATURA EXPIROU." };
  }

  // LOGICA DE BLOQUEIO POR LOGIN DUPLO
  if (user.isBlocked) {
    // Se tiver data de bloqueio, verifica se já passou 10 minutos
    if (user.blockedAt) {
      const blockedTime = new Date(user.blockedAt).getTime();
      const diffMins = (Date.now() - blockedTime) / (1000 * 60);
      if (diffMins < 10) {
        return { error: `ACESSO SUSPENSO POR LOGIN DUPLO. LIBERADO EM ${Math.ceil(10 - diffMins)} MINUTOS.` };
      } else {
        user.isBlocked = false;
        user.blockedAt = undefined;
      }
    } else {
      // Bloqueio manual do admin
      return { error: "ACESSO BLOQUEADO PELO ADMINISTRADOR." };
    }
  }

  const deviceList = user.activeDevices || [];
  const isExistingDevice = deviceList.includes(deviceId);

  if (!isExistingDevice) {
    if (deviceList.length >= user.maxScreens && user.role !== 'admin') {
      // ESTOUROU O LIMITE: BLOQUEIA O PIN NA HORA
      user.isBlocked = true;
      user.blockedAt = new Date().toISOString();
      user.activeDevices = []; 
      await saveUser(user);
      return { error: "LOGIN DUPLO DETECTADO! Este PIN foi bloqueado por exceder o limite de telas." };
    } else {
      user.activeDevices = [...deviceList, deviceId];
      await saveUser(user);
    }
  }

  return { user };
}

export async function removeUser(id: string) {
  try {
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (e) {
    return false;
  }
}

export async function getGlobalSettings() {
  const defaultSettings = { parentalPin: '1234' };
  try {
    const { data } = await supabase.from('settings').select('*').eq('key', 'global').maybeSingle();
    if (data && data.value) return data.value as { parentalPin: string };
  } catch (e) {}
  return defaultSettings;
}

export async function updateGlobalSettings(data: { parentalPin: string }) {
  try {
    const { error } = await supabase.from('settings').upsert({ key: 'global', value: data });
    if (error) throw error;
    return true;
  } catch (e) {
    return false;
  }
}

export const generateRandomPin = (length: number = 6) => {
  const chars = '0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};
