
'use client';

/**
 * MOTOR DE DADOS v385-S - MODO FIREBASE FIRESTORE
 * Sistema blindado contra quedas de outros bancos.
 */

import { initializeFirebase } from '@/firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  deleteDoc, 
  updateDoc, 
  orderBy, 
  limit, 
  serverTimestamp 
} from 'firebase/firestore';

const { db } = initializeFirebase();

export type ContentType = 'movie' | 'series' | 'multi-season' | 'channel';
export type SubscriptionTier = 'test' | 'monthly' | 'lifetime';

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
  isActive?: boolean; 
  streamUrl: string; 
  imageUrl?: string;
  seasons?: Season[] | null; 
  episodes?: Episode[] | null; 
  views?: number;
}

export interface GameItem {
  id: string;
  title: string;
  console: string;
  type: 'embed' | 'direct';
  url: string;
  imageUrl?: string;
}

export interface Reseller {
  id: string;
  name: string;
  username: string;
  password?: string;
  credits: number;
  totalSold: number;
  isBlocked: boolean;
}

export interface User {
  id: string; 
  pin: string; 
  role: 'admin' | 'user'; 
  subscriptionTier: SubscriptionTier;
  expiryDate?: string | null; 
  maxScreens: number; 
  activeDevices: string[]; 
  isBlocked: boolean;
  isAdultEnabled: boolean; 
  isGamesEnabled: boolean;
  isPpvEnabled: boolean;
  isAlacarteEnabled: boolean;
  isGamesOnly: boolean;
  resellerId?: string | null;
  individualMessage?: string;
  reseller_name?: string;
  activatedAt?: string;
  gamePoints?: number;
}

export const generateRandomPin = (l = 11) => Array.from({ length: l }, () => Math.floor(Math.random() * 10)).join('');
export const cleanName = (n: string) => n.toUpperCase().trim();

/**
 * FAILSAFE SOBERANO v385-S
 */
export async function validateDeviceLogin(pin: string, deviceId: string) {
  const cleanPin = pin.toUpperCase().trim();

  // BYPASS MESTRE INQUEBRÁVEL
  if (cleanPin === 'ADM77X2P') {
    return { 
      user: {
        id: 'master_leo',
        pin: 'ADM77X2P',
        role: 'admin',
        subscriptionTier: 'lifetime',
        maxScreens: 99,
        activeDevices: [deviceId],
        isBlocked: false,
        isAdultEnabled: true,
        isGamesEnabled: true,
        isPpvEnabled: true,
        isAlacarteEnabled: true,
        isGamesOnly: false
      } as User 
    };
  }

  if (!db) return { error: "ERRO DE INICIALIZAÇÃO FIREBASE" };

  try {
    const q = query(collection(db, 'users'), where('pin', '==', cleanPin));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) return { error: "PIN INVÁLIDO" };
    
    const userData = snapshot.docs[0].data() as User;
    const userId = snapshot.docs[0].id;

    if (userData.isBlocked) return { error: "ACESSO BLOQUEADO" };
    if (userData.expiryDate && new Date(userData.expiryDate) < new Date()) return { error: "PLANO EXPIRADO" };

    let devices = (userData.activeDevices || []) as string[];
    if (!devices.includes(deviceId)) {
      if (devices.length >= (userData.maxScreens || 1)) return { error: "LIMITE DE TELAS ATINGIDO" };
      devices.push(deviceId);
      await updateDoc(doc(db, 'users', userId), { activeDevices: devices });
    }
    return { user: { ...userData, id: userId, activeDevices: devices } as User };
  } catch (e) { 
    return { error: "ERRO DE CONEXÃO CLOUD" }; 
  }
}

/**
 * BUSCA REMOTA v385-S FIRESTORE
 */
export async function getRemoteContent(showInactive = true, searchQuery = "", categoryGenre = ""): Promise<ContentItem[]> {
  if (!db) return [];
  try {
    const contentRef = collection(db, 'content');
    // Busca básica ordenada por título
    let snapshot = await getDocs(query(contentRef, orderBy('title')));
    let items = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as ContentItem[];

    // Filtros manuais para evitar necessidade de índices complexos no Firebase inicialmente
    if (!showInactive) {
      items = items.filter(i => i.isActive !== false);
    }

    if (categoryGenre) {
      items = items.filter(i => i.genre === categoryGenre);
    }

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase();
      items = items.filter(i => i.title.toLowerCase().includes(lowerQuery));
    }

    return items;
  } catch (e) { 
    console.error("Erro Firestore Content:", e);
    return []; 
  }
}

export async function saveContent(item: Partial<ContentItem>) {
  if (!db) return false;
  try {
    const id = item.id || `content_${Date.now()}`;
    await setDoc(doc(db, 'content', id), { ...item, id }, { merge: true });
    return true;
  } catch (e) { return false; }
}

export async function getContentById(id: string) {
  if (!db) return null;
  try {
    const snap = await getDoc(doc(db, 'content', id));
    return snap.exists() ? snap.data() as ContentItem : null;
  } catch (e) { return null; }
}

export async function getRemoteUsers(): Promise<User[]> {
  if (!db) return [];
  try {
    const snapshot = await getDocs(collection(db, 'users'));
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as User[];
  } catch (e) { return []; }
}

export async function saveUser(user: Partial<User>) {
  if (!db) return false;
  try {
    const id = user.id || `user_${Date.now()}`;
    await setDoc(doc(db, 'users', id), { ...user, id }, { merge: true });
    return true;
  } catch (e) { return false; }
}

export async function removeUser(id: string) {
  if (!db) return false;
  try {
    await deleteDoc(doc(db, 'users', id));
    return true;
  } catch (e) { return false; }
}

export async function getRemoteResellers(): Promise<Reseller[]> {
  if (!db) return [];
  try {
    const snapshot = await getDocs(collection(db, 'resellers'));
    return snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as Reseller[];
  } catch (e) { return []; }
}

export async function saveReseller(r: Partial<Reseller>) {
  if (!db) return false;
  try {
    const id = r.id || `rev_${Date.now()}`;
    await setDoc(doc(db, 'resellers', id), { ...r, id }, { merge: true });
    return true;
  } catch (e) { return false; }
}

export async function removeReseller(id: string) {
  if (!db) return false;
  try {
    await deleteDoc(doc(db, 'resellers', id));
    return true;
  } catch (e) { return false; }
}

export async function getGlobalSettings() {
  if (!db) return { parentalPin: "1234" };
  try {
    const snap = await getDoc(doc(db, 'settings', 'global'));
    return snap.exists() ? snap.data() : { parentalPin: "1234" };
  } catch (e) { return { parentalPin: "1234" }; }
}

export async function updateGlobalSettings(v: any) {
  if (!db) return false;
  try {
    await setDoc(doc(db, 'settings', 'global'), v, { merge: true });
    return true;
  } catch (e) { return false; }
}

export async function getTotalContentCount() {
  if (!db) return 0;
  try {
    const snap = await getDocs(collection(db, 'content'));
    return snap.size;
  } catch (e) { return 0; }
}

export async function getCategoryCount(g: string) {
  if (!db) return 0;
  try {
    const q = query(collection(db, 'content'), where('genre', '==', g));
    const snap = await getDocs(q);
    return snap.size;
  } catch (e) { return 0; }
}

export async function getTopContent(limitNum = 10): Promise<ContentItem[]> {
  if (!db) return [];
  try {
    // Busca ordenada por visualizações
    const q = query(collection(db, 'content'), orderBy('views', 'desc'), limit(limitNum));
    const snap = await getDocs(q);
    return snap.docs.map(doc => ({ ...doc.data(), id: doc.id })) as ContentItem[];
  } catch (e) { return []; }
}

export async function getRemoteGames(): Promise<GameItem[]> {
  if (!db) return [];
  try {
    const snap = await getDocs(collection(db, 'games'));
    return snap.docs.map(doc => ({ ...doc.data(), id: doc.id })) as GameItem[];
  } catch (e) { return []; }
}

export async function saveGame(g: any) {
  if (!db) return false;
  try {
    const id = g.id || `game_${Date.now()}`;
    await setDoc(doc(db, 'games', id), { ...g, id }, { merge: true });
    return true;
  } catch (e) { return false; }
}

export async function removeGame(id: string) {
  if (!db) return false;
  try {
    await deleteDoc(doc(db, 'games', id));
    return true;
  } catch (e) { return false; }
}

export async function getGameRankings() {
  if (!db) return [];
  try {
    const q = query(collection(db, 'rankings'), orderBy('points', 'desc'), limit(20));
    const snap = await getDocs(q);
    return snap.docs.map(doc => doc.data());
  } catch (e) { return []; }
}

export const formatMasterLink = (url: string) => {
  if (!url) return "";
  let finalUrl = url.trim();
  if (finalUrl.includes('tvacabo.top') || finalUrl.includes('shortflix.net')) {
    return `/api/proxy?url=${encodeURIComponent(finalUrl)}`;
  }
  return finalUrl;
};

export const getBeautifulMessage = (pin: string, tier: string, url: string, screens: number) => 
  `🎬 *LÉO TV STREAM!* \n\n👤 *SEU PIN MASTER:* \`${pin}\` \n\n🖥️ *TELAS:* ${screens} \n📅 *PLANO:* ${tier === 'test' ? 'TESTE 6H' : 'MENSAL 30 DIAS'} \n\n🔗 *ACESSE AGORA:* ${url} \n\n*Bom entretenimento!*`;

export async function resetUserDevices(userId: string) {
  if (!db) return false;
  try {
    await updateDoc(doc(db, 'users', userId), { activeDevices: [] });
    return true;
  } catch (e) { return false; }
}
