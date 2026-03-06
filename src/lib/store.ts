'use client';

/**
 * @fileOverview Gerenciamento de estado local persistente para o Léo Tv.
 * Utiliza LocalStorage para garantir que o app funcione sem erros de servidor.
 */

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

export type SubscriptionTier = 'test' | 'monthly' | 'lifetime' | 'custom';

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

const IS_SERVER = typeof window === 'undefined';

const getStorageItem = (key: string, defaultValue: any) => {
  if (IS_SERVER) return defaultValue;
  const saved = localStorage.getItem(key);
  return saved ? JSON.parse(saved) : defaultValue;
};

const setStorageItem = (key: string, value: any) => {
  if (!IS_SERVER) {
    localStorage.setItem(key, JSON.stringify(value));
  }
};

// Dados Iniciais e Funções de Acesso
export const getMockContent = (): ContentItem[] => getStorageItem('leo_content', []);

export const getMockUsers = (): User[] => {
  const users = getStorageItem('leo_users', []);
  const adminPin = 'adm77x2p';
  const adminExists = users.find((u: User) => u.pin === adminPin);
  
  if (!adminExists) {
    const admin: User = { 
      id: 'admin-master', 
      pin: adminPin,
      role: 'admin', 
      subscriptionTier: 'lifetime',
      maxScreens: 99,
      activeDevices: [],
      isBlocked: false
    };
    const updated = [admin, ...users.filter((u: User) => u.id !== 'admin-master')];
    setStorageItem('leo_users', updated);
    return updated;
  }
  return users;
};

export const getGlobalParentalPin = (): string => getStorageItem('leo_global_parental_pin', '1234');
export const setGlobalParentalPin = (pin: string) => setStorageItem('leo_global_parental_pin', pin);

export const generateRandomPin = (length: number = 6) => {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyz';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

export const addContent = (item: ContentItem) => {
  const content = getMockContent();
  const updated = [...content, item];
  setStorageItem('leo_content', updated);
  return updated;
};

export const updateContent = (item: ContentItem) => {
  const content = getMockContent();
  const updated = content.map(c => c.id === item.id ? item : c);
  setStorageItem('leo_content', updated);
  return updated;
};

export const deleteContent = (id: string) => {
  const content = getMockContent();
  const updated = content.filter(c => c.id !== id);
  setStorageItem('leo_content', updated);
  return updated;
};

export const addUser = (user: User) => {
  const users = getMockUsers();
  const updated = [...users, user];
  setStorageItem('leo_users', updated);
  return updated;
};

export const updateUser = (user: User) => {
  const users = getMockUsers();
  const updated = users.map(u => u.id === user.id ? user : u);
  setStorageItem('leo_users', updated);
  return updated;
};