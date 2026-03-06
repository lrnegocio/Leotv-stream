
'use client';

/**
 * @fileOverview Gerenciamento de dados via Supabase com Fallback LocalStorage.
 * Prioriza a nuvem para sincronizar entre PC e TV.
 */

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
}

const isBrowser = typeof window !== 'undefined';

const getLocal = (key: string) => {
  if (!isBrowser) return [];
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

const setLocal = (key: string, data: any) => {
  if (!isBrowser) return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {}
}

const withTimeout = (promise: Promise<any>, ms: number = 8000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms))
  ]);
};

// --- CONTEÚDO ---

export async function getRemoteContent(): Promise<ContentItem[]> {
  if (supabase) {
    try {
      const { data, error } = await withTimeout(supabase.from('content').select('*'));
      if (!error && data) {
        setLocal('leo_tv_content', data);
        return data;
      }
    } catch (e) {
      console.warn("Supabase Content Error, usando local.");
    }
  }
  return getLocal('leo_tv_content');
}

export async function saveContent(item: ContentItem) {
  if (supabase) {
    try {
      await withTimeout(supabase.from('content').upsert(item));
    } catch (e) {}
  }
  const items = getLocal('leo_tv_content');
  const index = items.findIndex((i: any) => i.id === item.id);
  if (index >= 0) items[index] = item; else items.push(item);
  setLocal('leo_tv_content', items);
}

export async function removeContent(id: string) {
  if (supabase) {
    try {
      await withTimeout(supabase.from('content').delete().eq('id', id));
    } catch (e) {}
  }
  const items = getLocal('leo_tv_content').filter((i: any) => i.id !== id);
  setLocal('leo_tv_content', items);
}

// --- USUÁRIOS ---

export async function getRemoteUsers(): Promise<User[]> {
  let users: User[] = [];
  
  if (supabase) {
    try {
      const { data, error } = await withTimeout(supabase.from('users').select('*'));
      if (!error && data) {
        users = data;
        setLocal('leo_tv_users', users);
      } else {
        users = getLocal('leo_tv_users');
      }
    } catch (e) {
      users = getLocal('leo_tv_users');
    }
  } else {
    users = getLocal('leo_tv_users');
  }

  // PIN MASTER GLOBAL: Garantia de acesso em qualquer aparelho
  const adminPin = 'adm77x2p';
  if (!users.find(u => u.pin.toLowerCase() === adminPin)) {
    users.push({
      id: 'admin-master-permanent',
      pin: adminPin,
      role: 'admin',
      subscriptionTier: 'lifetime',
      maxScreens: 99,
      activeDevices: [],
      isBlocked: false
    });
  }
  
  return users;
}

export async function saveUser(user: User) {
  if (supabase) {
    try {
      await withTimeout(supabase.from('users').upsert(user));
    } catch (e) {}
  }
  const users = getLocal('leo_tv_users');
  const index = users.findIndex((u: any) => u.id === user.id);
  if (index >= 0) users[index] = user; else users.push(user);
  setLocal('leo_tv_users', users);
}

export async function removeUser(id: string) {
  if (supabase) {
    try {
      await withTimeout(supabase.from('users').delete().eq('id', id));
    } catch (e) {}
  }
  const users = getLocal('leo_tv_users').filter((u: any) => u.id !== id);
  setLocal('leo_tv_users', users);
}

// --- CONFIGURAÇÕES ---

export async function getGlobalSettings() {
  const defaultSettings = { parentalPin: '1234' };
  
  if (supabase) {
    try {
      const { data, error } = await withTimeout(supabase.from('settings').select('*').eq('key', 'global').single());
      if (!error && data) return data.value as { parentalPin: string };
    } catch (e) {}
  }
  
  if (!isBrowser) return defaultSettings;
  
  try {
    const localSettings = localStorage.getItem('leo_tv_settings');
    if (localSettings) return JSON.parse(localSettings);
  } catch {}

  return defaultSettings;
}

export async function updateGlobalSettings(data: { parentalPin: string }) {
  if (supabase) {
    try {
      await withTimeout(supabase.from('settings').upsert({ key: 'global', value: data }));
    } catch (e) {}
  }
  if (isBrowser) localStorage.setItem('leo_tv_settings', JSON.stringify(data));
}

export const generateRandomPin = (length: number = 6) => {
  const chars = '0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};
