
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
 * @fileOverview Gerenciamento de dados Híbrido Resiliente.
 * Resolve "Internal Server Error" ao garantir que o localStorage só seja acessado no cliente.
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

// Verifica se o Firebase tem chaves válidas configuradas
const isFirebaseConfigured = () => {
  if (typeof window === 'undefined') return false;
  try {
    const { firebaseConfig } = require('@/firebase/config');
    const isPlaceholder = !firebaseConfig.apiKey || 
                         firebaseConfig.apiKey.includes('seu-api-key') || 
                         firebaseConfig.apiKey.includes('AIzaSy');
    return !isPlaceholder;
  } catch {
    return false;
  }
};

// Funções de Fallback LocalStorage (Seguras para SSR)
const getLocal = (key: string) => {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

const setLocal = (key: string, data: any) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error("Local storage set error", e);
  }
}

// CONTEÚDO
export async function getRemoteContent(): Promise<ContentItem[]> {
  if (isFirebaseConfigured()) {
    try {
      const { db } = initializeFirebase();
      const querySnapshot = await getDocs(collection(db, 'content'));
      return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ContentItem));
    } catch (e) {
      console.warn("Firebase content error, using local fallback");
    }
  }
  return getLocal('leo_tv_content');
}

export async function saveContent(item: ContentItem) {
  if (isFirebaseConfigured()) {
    try {
      const { db } = initializeFirebase();
      await setDoc(doc(db, 'content', item.id), item, { merge: true });
    } catch (e) {
      console.error("Save content error:", e);
    }
  }
  const items = getLocal('leo_tv_content');
  const index = items.findIndex((i: any) => i.id === item.id);
  if (index >= 0) items[index] = item; else items.push(item);
  setLocal('leo_tv_content', items);
}

export async function removeContent(id: string) {
  if (isFirebaseConfigured()) {
    try {
      const { db } = initializeFirebase();
      await deleteDoc(doc(db, 'content', id));
    } catch (e) {
      console.error("Delete content error:", e);
    }
  }
  const items = getLocal('leo_tv_content').filter((i: any) => i.id !== id);
  setLocal('leo_tv_content', items);
}

// USUÁRIOS E PINS
export async function getRemoteUsers(): Promise<User[]> {
  let users: User[] = [];
  
  if (isFirebaseConfigured()) {
    try {
      const { db } = initializeFirebase();
      const querySnapshot = await getDocs(collection(db, 'users'));
      users = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
    } catch (e) {
      users = getLocal('leo_tv_users');
    }
  } else {
    users = getLocal('leo_tv_users');
  }

  // GARANTE O ADMIN MASTER adm77x2p SEMPRE ATIVO
  const adminPin = 'adm77x2p';
  if (!users.find(u => u.pin.toLowerCase() === adminPin)) {
    const masterAdmin: User = {
      id: 'admin-master-permanent',
      pin: adminPin,
      role: 'admin',
      subscriptionTier: 'lifetime',
      maxScreens: 99,
      activeDevices: [],
      isBlocked: false
    };
    users.push(masterAdmin);
  }
  
  return users;
}

export async function saveUser(user: User) {
  if (isFirebaseConfigured()) {
    try {
      const { db } = initializeFirebase();
      await setDoc(doc(db, 'users', user.id), user, { merge: true });
    } catch (e) {
      console.error("Save user error:", e);
    }
  }
  const users = getLocal('leo_tv_users');
  const index = users.findIndex((u: any) => u.id === user.id);
  if (index >= 0) users[index] = user; else users.push(user);
  setLocal('leo_tv_users', users);
}

export async function removeUser(id: string) {
  if (isFirebaseConfigured()) {
    try {
      const { db } = initializeFirebase();
      await deleteDoc(doc(db, 'users', id));
    } catch (e) {
      console.error("Remove user error:", e);
    }
  }
  const users = getLocal('leo_tv_users').filter((u: any) => u.id !== id);
  setLocal('leo_tv_users', users);
}

// CONFIGURAÇÕES GLOBAIS
export async function getGlobalSettings() {
  if (isFirebaseConfigured()) {
    try {
      const { db } = initializeFirebase();
      const docRef = doc(db, 'settings', 'global');
      const snap = await getDoc(docRef);
      if (snap.exists()) return snap.data() as { parentalPin: string };
    } catch (e) {
      console.warn("Settings error, using local fallback");
    }
  }
  
  if (typeof window === 'undefined') return { parentalPin: '1234' };
  
  try {
    const localSettings = localStorage.getItem('leo_tv_settings');
    if (localSettings) return JSON.parse(localSettings);
  } catch {}

  const def = { parentalPin: '1234' };
  if (typeof window !== 'undefined') {
    localStorage.setItem('leo_tv_settings', JSON.stringify(def));
  }
  return def;
}

export async function updateGlobalSettings(data: { parentalPin: string }) {
  if (isFirebaseConfigured()) {
    try {
      const { db } = initializeFirebase();
      await setDoc(doc(db, 'settings', 'global'), data, { merge: true });
    } catch (e) {
      console.error("Update settings error:", e);
    }
  }
  if (typeof window !== 'undefined') {
    localStorage.setItem('leo_tv_settings', JSON.stringify(data));
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
