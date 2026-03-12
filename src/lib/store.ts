
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
    
    const masterPinExists = users.some(u => u.pin === ADMIN_PIN);
    if (!masterPinExists) {
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
    const { error } = await supabase
      .from('users')
      .upsert({
        id: user.id,
        pin: user.pin,
        role: user.role,
        subscriptionTier: user.subscriptionTier,
        expiryDate: user.expiryDate || null,
        maxScreens: user.maxScreens,
        activeDevices: user.activeDevices || [],
        isBlocked: user.isBlocked,
        blockedAt: user.blockedAt || null
      });
    if (error) throw error;
    return true;
  } catch (e) {
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

  if (user.isBlocked && user.blockedAt) {
    const blockedTime = new Date(user.blockedAt).getTime();
    const now = Date.now();
    const diffMins = (now - blockedTime) / (1000 * 60);

    if (diffMins >= 10) {
      user.isBlocked = false;
      user.blockedAt = undefined;
      user.activeDevices = [deviceId]; 
      await saveUser(user);
    } else {
      return { error: `ACESSO BLOQUEADO POR USO SIMULTÂNEO. AGUARDE ${Math.ceil(10 - diffMins)} MINUTOS.` };
    }
  } else if (user.isBlocked) {
    return { error: "ACESSO SUSPENSO. FALE COM O SUPORTE." };
  }

  if (user.subscriptionTier !== 'lifetime' && user.expiryDate && new Date(user.expiryDate) < new Date()) {
    return { error: "SUA ASSINATURA EXPIROU." };
  }

  const deviceList = user.activeDevices || [];
  const isExistingDevice = deviceList.includes(deviceId);

  if (!isExistingDevice) {
    if (deviceList.length >= user.maxScreens) {
      user.isBlocked = true;
      user.blockedAt = new Date().toISOString();
      user.activeDevices = []; 
      await saveUser(user);
      return { error: "BLOQUEADO! Tentativa de login simultâneo excedida." };
    } else {
      user.activeDevices = [...deviceList, deviceId];
      await saveUser(user);
    }
  }

  return { user };
}

export async function removeActiveDevice(userId: string, deviceId: string) {
  const users = await getRemoteUsers();
  const user = users.find(u => u.id === userId);
  if (user) {
    user.activeDevices = (user.activeDevices || []).filter(id => id !== deviceId);
    await saveUser(user);
  }
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
