'use client';

import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc,
  query,
  limit
} from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

/**
 * @fileOverview Gerenciamento de dados resiliente (Firebase + LocalStorage).
 * O sistema prioriza o Firebase, mas alterna para LocalStorage se houver erro ou timeout.
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

// Utilitário para evitar erro de "localStorage is not defined" no Servidor
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

// Timeout para evitar que o app fique "preso" esperando o Firebase
const withTimeout = (promise: Promise<any>, ms: number = 5000) => {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), ms))
  ]);
};

// --- CONTEÚDO ---

export async function getRemoteContent(): Promise<ContentItem[]> {
  const { db } = initializeFirebase();
  if (db) {
    try {
      const querySnapshot = await withTimeout(getDocs(collection(db, 'content')));
      const items = querySnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as ContentItem));
      if (items.length > 0) setLocal('leo_tv_content', items);
      return items;
    } catch (e) {
      console.warn("Firestore Content Timeout/Error, usando local.");
    }
  }
  return getLocal('leo_tv_content');
}

export async function saveContent(item: ContentItem) {
  const { db } = initializeFirebase();
  if (db) {
    try {
      await withTimeout(setDoc(doc(db, 'content', item.id), item, { merge: true }));
    } catch (e) {}
  }
  const items = getLocal('leo_tv_content');
  const index = items.findIndex((i: any) => i.id === item.id);
  if (index >= 0) items[index] = item; else items.push(item);
  setLocal('leo_tv_content', items);
}

export async function removeContent(id: string) {
  const { db } = initializeFirebase();
  if (db) {
    try {
      await withTimeout(deleteDoc(doc(db, 'content', id)));
    } catch (e) {}
  }
  const items = getLocal('leo_tv_content').filter((i: any) => i.id !== id);
  setLocal('leo_tv_content', items);
}

// --- USUÁRIOS ---

export async function getRemoteUsers(): Promise<User[]> {
  let users: User[] = [];
  const { db } = initializeFirebase();
  
  if (db) {
    try {
      const querySnapshot = await withTimeout(getDocs(collection(db, 'users')));
      users = querySnapshot.docs.map((doc: any) => ({ id: doc.id, ...doc.data() } as User));
      if (users.length > 0) setLocal('leo_tv_users', users);
    } catch (e) {
      users = getLocal('leo_tv_users');
    }
  } else {
    users = getLocal('leo_tv_users');
  }

  // PIN MASTER GLOBAL: Sempre injetado para garantir acesso
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
  const { db } = initializeFirebase();
  if (db) {
    try {
      await withTimeout(setDoc(doc(db, 'users', user.id), user, { merge: true }));
    } catch (e) {}
  }
  const users = getLocal('leo_tv_users');
  const index = users.findIndex((u: any) => u.id === user.id);
  if (index >= 0) users[index] = user; else users.push(user);
  setLocal('leo_tv_users', users);
}

export async function removeUser(id: string) {
  const { db } = initializeFirebase();
  if (db) {
    try {
      await withTimeout(deleteDoc(doc(db, 'users', id)));
    } catch (e) {}
  }
  const users = getLocal('leo_tv_users').filter((u: any) => u.id !== id);
  setLocal('leo_tv_users', users);
}

// --- CONFIGURAÇÕES ---

export async function getGlobalSettings() {
  const { db } = initializeFirebase();
  if (db) {
    try {
      const snap = await withTimeout(getDoc(doc(db, 'settings', 'global')));
      if (snap.exists()) return snap.data() as { parentalPin: string };
    } catch (e) {}
  }
  
  if (!isBrowser) return { parentalPin: '1234' };
  
  try {
    const localSettings = localStorage.getItem('leo_tv_settings');
    if (localSettings) return JSON.parse(localSettings);
  } catch {}

  return { parentalPin: '1234' };
}

export async function updateGlobalSettings(data: { parentalPin: string }) {
  const { db } = initializeFirebase();
  if (db) {
    try {
      await withTimeout(setDoc(doc(db, 'settings', 'global'), data, { merge: true }));
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
