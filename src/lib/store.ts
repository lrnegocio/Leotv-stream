
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

export async function getRemoteUsers(): Promise<User[]> {
  try {
    const { data, error } = await supabase.from('users').select('*').order('pin', { ascending: true });
    if (error) throw error;
    return (data || []).map(u => ({
      ...u,
      role: u.role || 'user',
      isBlocked: !!u.isBlocked
    }));
  } catch (e) {
    return [];
  }
}

export async function saveUser(user: User) {
  try {
    const payload: any = { ...user };
    const { error } = await supabase.from('users').upsert(payload);
    if (error) {
      // Caso a coluna blockedAt ainda não exista, tenta salvar sem ela
      delete payload.blockedAt;
      const { error: retryError } = await supabase.from('users').upsert(payload);
      return !retryError;
    }
    return true;
  } catch (e) {
    return false;
  }
}

export async function validateDeviceLogin(pin: string, deviceId: string): Promise<{ user?: User; error?: string }> {
  const normalizedPin = pin.trim();
  
  // PIN MESTRE BLINDADO (adm77x2p) - NÃO REMOVER
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

  // Imunidade para Admin e Vitalício
  const isImmune = user.role === 'admin' || user.subscriptionTier === 'lifetime';

  if (!isImmune && user.expiryDate && new Date(user.expiryDate) < new Date()) {
    return { error: "ACESSO EXPIRADO." };
  }

  const deviceList = user.activeDevices || [];
  if (!deviceList.includes(deviceId)) {
    if (deviceList.length >= user.maxScreens && !isImmune) {
      user.isBlocked = true;
      user.blockedAt = new Date().toISOString();
      await saveUser(user);
      return { error: "LIMITE DE TELAS EXCEDIDO! Acesso suspenso." };
    }
    user.activeDevices = [...deviceList, deviceId];
    await saveUser(user);
  }

  return { user };
}

export async function removeUser(id: string) {
  try {
    const { error } = await supabase.from('users').delete().eq('id', id);
    return !error;
  } catch (e) {
    return false;
  }
}

export async function getGlobalSettings() {
  try {
    const { data } = await supabase.from('settings').select('*').eq('key', 'global').maybeSingle();
    if (data?.value) return data.value as { parentalPin: string };
  } catch (e) {}
  return { parentalPin: '1234' };
}

export async function updateGlobalSettings(data: { parentalPin: string }) {
  try {
    const { error } = await supabase.from('settings').upsert({ key: 'global', value: data });
    return !error;
  } catch (e) {
    return false;
  }
}

export const generateRandomPin = (length: number = 6) => {
  const chars = '0123456789';
  let result = '';
  for (let i = 0; i < length; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
};
