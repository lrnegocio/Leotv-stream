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
}

const isBrowser = typeof window !== 'undefined';

// --- FUNÇÕES DE CONTEÚDO ---

export async function getRemoteContent(): Promise<ContentItem[]> {
  try {
    const { data, error } = await supabase.from('content').select('*').order('title', { ascending: true });
    if (error) {
      console.error("Erro Supabase Content:", error.message);
      return [];
    }
    return data || [];
  } catch (e) {
    console.error("Erro Crítico Content:", e);
    return [];
  }
}

export async function saveContent(item: ContentItem) {
  try {
    const { error } = await supabase.from('content').upsert(item);
    if (error) throw error;
    return true;
  } catch (e) {
    console.error("Erro ao salvar conteúdo:", e);
    return false;
  }
}

export async function removeContent(id: string) {
  try {
    const { error } = await supabase.from('content').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (e) {
    console.error("Erro ao remover conteúdo:", e);
    return false;
  }
}

// --- FUNÇÕES DE USUÁRIOS (PINS) ---

export async function getRemoteUsers(): Promise<User[]> {
  const adminPin = 'adm77x2p';
  let users: User[] = [];

  try {
    const { data, error } = await supabase.from('users').select('*').order('pin', { ascending: true });
    if (error) {
      console.warn("Tabela de usuários não encontrada no Supabase.");
    } else {
      users = data || [];
    }
  } catch (e) {
    console.error("Erro ao buscar usuários no Supabase:", e);
  }

  // Garante que o PIN Master sempre exista para evitar bloqueio do admin
  if (!users.find(u => u.pin === adminPin)) {
    users.unshift({
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
  try {
    const { error } = await supabase.from('users').upsert({
      id: user.id,
      pin: user.pin,
      role: user.role,
      subscriptionTier: user.subscriptionTier,
      expiryDate: user.expiryDate,
      maxScreens: user.maxScreens,
      activeDevices: user.activeDevices || [],
      isBlocked: user.isBlocked
    });
    
    if (error) {
      console.error("Supabase Save Error:", error.message);
      return false;
    }
    return true;
  } catch (e) {
    console.error("Falha fatal ao salvar PIN:", e);
    return false;
  }
}

export async function removeUser(id: string) {
  try {
    const { error } = await supabase.from('users').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (e) {
    console.error("Erro ao remover PIN:", e);
    return false;
  }
}

// --- CONFIGURAÇÕES ---

export async function getGlobalSettings() {
  const defaultSettings = { parentalPin: '1234' };
  try {
    const { data, error } = await supabase.from('settings').select('*').eq('key', 'global').single();
    if (!error && data && data.value) return data.value as { parentalPin: string };
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
