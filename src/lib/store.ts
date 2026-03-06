'use client';

import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
} from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

/**
 * @fileOverview Gerenciamento de dados Híbrido.
 * Tenta usar Firebase se configurado, caso contrário usa LocalStorage.
 * Isso evita o erro de "Internal Server Error" ou loading infinito.
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

// Verifica se o Firebase está configurado corretamente (evita erro de chaves placeholder)
const isFirebaseConfigured = () => {
  if (typeof window === 'undefined') return false;
  try {
    const { firebaseConfig } = require('@/firebase/config');
    return firebaseConfig && firebaseConfig.apiKey && !firebaseConfig.apiKey.includes('seu-api-key') && !firebaseConfig.apiKey.includes('AIzaSy');
  } catch {
    return false;
  }
};

const useFirebase = isFirebaseConfigured();

// Funções Auxiliares para LocalStorage (Fallback)
const getLocal = (key: string) => {
  if (typeof window === 'undefined') return [];
  return JSON.parse(localStorage.getItem(key) || '[]');
}
const setLocal = (key: string, data: any) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
}

// Funções de Gerenciamento de Conteúdo
export async function getRemoteContent(): Promise<ContentItem[]> {
  if (useFirebase) {
    try {
      const { db } = initializeFirebase();
      const querySnapshot = await getDocs(collection(db, 'content'));
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ContentItem));
    } catch (e) {
      console.warn("Firebase content failed, using local", e);
    }
  }
  return getLocal('leo_tv_content');
}

export async function saveContent(item: ContentItem) {
  if (useFirebase) {
    try {
      const { db } = initializeFirebase();
      await setDoc(doc(db, 'content', item.id), item, { merge: true });
    } catch (e) {
      console.error(e);
    }
  }
  const items = getLocal('leo_tv_content');
  const index = items.findIndex((i: any) => i.id === item.id);
  if (index >= 0) items[index] = item; else items.push(item);
  setLocal('leo_tv_content', items);
}

export async function removeContent(id: string) {
  if (useFirebase) {
    try {
      const { db } = initializeFirebase();
      await deleteDoc(doc(db, 'content', id));
    } catch (e) {
      console.error(e);
    }
  }
  const items = getLocal('leo_tv_content').filter((i: any) => i.id !== id);
  setLocal('leo_tv_content', items);
}

// Funções de Gerenciamento de Usuários/PINs
export async function getRemoteUsers(): Promise<User[]> {
  let users: User[] = [];
  
  if (useFirebase) {
    try {
      const { db } = initializeFirebase();
      const querySnapshot = await getDocs(collection(db, 'users'));
      users = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
    } catch (e) {
      console.warn("Firebase users failed, using local", e);
      users = getLocal('leo_tv_users');
    }
  } else {
    users = getLocal('leo_tv_users');
  }

  // GARANTE QUE O ADMIN MASTER SEMPRE EXISTA (adm77x2p)
  const adminPin = 'adm77x2p';
  if (!users.find(u => u.pin.toLowerCase() === adminPin)) {
    const admin: User = {
      id: 'admin-master',
      pin: adminPin,
      role: 'admin',
      subscriptionTier: 'lifetime',
      maxScreens: 99,
      activeDevices: [],
      isBlocked: false
    };
    users.push(admin);
    // Não salvamos no local aqui para evitar loop, o login salvará se necessário
  }
  
  return users;
}

export async function saveUser(user: User) {
  if (useFirebase) {
    try {
      const { db } = initializeFirebase();
      await setDoc(doc(db, 'users', user.id), user, { merge: true });
    } catch (e) {
      console.error(e);
    }
  }
  const users = getLocal('leo_tv_users');
  const index = users.findIndex((u: any) => u.id === user.id);
  if (index >= 0) users[index] = user; else users.push(user);
  setLocal('leo_tv_users', users);
}

export async function removeUser(id: string) {
  if (useFirebase) {
    try {
      const { db } = initializeFirebase();
      await deleteDoc(doc(db, 'users', id));
    } catch (e) {
      console.error(e);
    }
  }
  const users = getLocal('leo_tv_users').filter((u: any) => u.id !== id);
  setLocal('leo_tv_users', users);
}

// Configurações Globais (Senha Parental)
export async function getGlobalSettings() {
  if (useFirebase) {
    try {
      const { db } = initializeFirebase();
      const docRef = doc(db, 'settings', 'global');
      const snap = await getDoc(docRef);
      if (snap.exists()) return snap.data();
    } catch (e) {
      console.error("Firebase settings failed", e);
    }
  }
  
  if (typeof window === 'undefined') return { parentalPin: '1234' };
  const localSettings = localStorage.getItem('leo_tv_settings');
  if (localSettings) return JSON.parse(localSettings);

  const def = { parentalPin: '1234' };
  localStorage.setItem('leo_tv_settings', JSON.stringify(def));
  return def;
}

export async function updateGlobalSettings(data: any) {
  if (useFirebase) {
    try {
      const { db } = initializeFirebase();
      await setDoc(doc(db, 'settings', 'global'), data, { merge: true });
    } catch (e) {
      console.error(e);
    }
  }
  if (typeof window !== 'undefined') {
    localStorage.setItem('leo_tv_settings', JSON.stringify(data));
  }
}

export const generateRandomPin = (length: number = 6) => {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyz';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};