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

const ADMIN_PIN = 'adm77x2p';

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
    console.error("Erro no content:", e);
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

export async function getRemoteUsers(): Promise<User[]> {
  try {
    const { data, error } = await supabase.from('users').select('*').order('pin', { ascending: true });
    if (error) throw error;

    let users: User[] = (data || []).map(u => ({
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
    
    // Adiciona o admin master se ele não existir na lista
    if (!users.some(u => u.pin === ADMIN_PIN)) {
      users.unshift({
        id: 'admin-master-permanent',
        pin: ADMIN_PIN,
        role: 'admin',
        subscriptionTier: 'lifetime',
        maxScreens: 99,
        activeDevices: [],
        isBlocked: false
      });
    }
    
    return users;
  } catch (e) {
    return [];
  }
}

export async function saveUser(user: User) {
  try {
    // Payload básico para evitar erros se a coluna blockedAt não existir
    const payload: any = {
      id: user.id,
      pin: user.pin,
      role: user.role,
      subscriptionTier: user.subscriptionTier,
      expiryDate: user.expiryDate || null,
      maxScreens: user.maxScreens,
      activeDevices: user.activeDevices || [],
      isBlocked: user.isBlocked
    };

    // Só tenta enviar blockedAt se ele estiver preenchido, para evitar erro de coluna ausente
    if (user.blockedAt) {
      payload.blockedAt = user.blockedAt;
    }

    const { error } = await supabase.from('users').upsert(payload);
    
    if (error) {
      // Se o erro for especificamente sobre a coluna blockedAt, tenta salvar sem ela
      if (error.message.includes('blockedAt') || error.message.includes('column')) {
        delete payload.blockedAt;
        const { error: retryError } = await supabase.from('users').upsert(payload);
        if (retryError) {
          console.error("Erro Supabase:", retryError.message);
          return false;
        }
        return true;
      }
      console.error("Erro Supabase:", error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.error("Erro saveUser:", e);
    return false;
  }
}

export async function validateDeviceLogin(pin: string, deviceId: string): Promise<{ user?: User; error?: string }> {
  const users = await getRemoteUsers();
  const normalizedPin = pin.trim().toLowerCase();
  
  if (normalizedPin === ADMIN_PIN) {
    const adminUser = users.find(u => u.pin === ADMIN_PIN);
    return { user: adminUser };
  }

  let user = users.find(u => u.pin.toLowerCase() === normalizedPin);
  if (!user) return { error: "CÓDIGO PIN INVÁLIDO" };

  // Verifica se está bloqueado e se o tempo de 10 minutos passou
  if (user.isBlocked) {
    if (user.blockedAt) {
      const blockedTime = new Date(user.blockedAt).getTime();
      const now = Date.now();
      const diffMins = (now - blockedTime) / (1000 * 60);

      if (diffMins >= 10) {
        // Desbloqueio automático após 10 minutos
        user.isBlocked = false;
        user.blockedAt = undefined;
        user.activeDevices = [deviceId]; 
        await saveUser(user);
      } else {
        return { error: `ACESSO SUSPENSO POR LOGIN DUPLO. LIBERADO EM ${Math.ceil(10 - diffMins)} MINUTOS.` };
      }
    } else {
      return { error: "ACESSO SUSPENSO PELO ADMINISTRADOR." };
    }
  }

  // Verifica expiração (Exceto Vitalício)
  if (user.subscriptionTier !== 'lifetime' && user.expiryDate && new Date(user.expiryDate) < new Date()) {
    return { error: "SUA ASSINATURA EXPIROU." };
  }

  const deviceList = user.activeDevices || [];
  const isExistingDevice = deviceList.includes(deviceId);

  // Lógica Inteligente de Login Duplo vs Troca de Aparelho
  if (!isExistingDevice) {
    // Se tentar entrar com um novo aparelho e já atingiu o limite de telas simultâneas
    if (deviceList.length >= user.maxScreens) {
      user.isBlocked = true;
      user.blockedAt = new Date().toISOString();
      user.activeDevices = []; // Reseta a lista para deslogar todos
      await saveUser(user);
      return { error: "BLOQUEIO! Tentativa de login excedeu o limite de telas simultâneas (Login Duplo Detectado)." };
    } else {
      // Se ainda tem telas disponíveis, apenas adiciona o novo aparelho
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