
'use client';

import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  query, 
  where,
  onSnapshot
} from 'firebase/firestore';
import { getFirestore } from 'firebase/firestore';
import { initializeFirebase } from '@/firebase';

/**
 * @fileOverview Gerenciamento de dados via Firebase Firestore.
 * Garante que os dados sejam salvos na nuvem e acessíveis de qualquer lugar.
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

// Inicializa os serviços
const { db } = initializeFirebase();

// Funções de Gerenciamento de Conteúdo
export async function getRemoteContent(): Promise<ContentItem[]> {
  const querySnapshot = await getDocs(collection(db, 'content'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ContentItem));
}

export async function saveContent(item: ContentItem) {
  const docRef = doc(db, 'content', item.id);
  await setDoc(docRef, item, { merge: true });
}

export async function removeContent(id: string) {
  await deleteDoc(doc(db, 'content', id));
}

// Funções de Gerenciamento de Usuários/PINs
export async function getRemoteUsers(): Promise<User[]> {
  const querySnapshot = await getDocs(collection(db, 'users'));
  const users = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as User));
  
  // Garante que o Admin Master sempre exista
  const adminPin = 'adm77x2p';
  if (!users.find(u => u.pin === adminPin)) {
    const admin: User = {
      id: 'admin-master',
      pin: adminPin,
      role: 'admin',
      subscriptionTier: 'lifetime',
      maxScreens: 99,
      activeDevices: [],
      isBlocked: false
    };
    await setDoc(doc(db, 'users', 'admin-master'), admin);
    users.push(admin);
  }
  
  return users;
}

export async function saveUser(user: User) {
  await setDoc(doc(db, 'users', user.id), user, { merge: true });
}

export async function removeUser(id: string) {
  await deleteDoc(doc(db, 'users', id));
}

// Configurações Globais (Senha Parental)
export async function getGlobalSettings() {
  const docRef = doc(db, 'settings', 'global');
  const snap = await getDoc(docRef);
  if (snap.exists()) return snap.data();
  
  // Default
  const def = { parentalPin: '1234' };
  await setDoc(docRef, def);
  return def;
}

export async function updateGlobalSettings(data: any) {
  await setDoc(doc(db, 'settings', 'global'), data, { merge: true });
}

export const generateRandomPin = (length: number = 6) => {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyz';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};
