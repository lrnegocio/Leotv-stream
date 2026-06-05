
import { initializeFirebase } from '@/firebase';
import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  increment,
  writeBatch
} from 'firebase/firestore';

// Tipagens Master
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
  isActive?: boolean; 
  streamUrl: string; 
  imageUrl?: string;
  seasons?: Season[] | null; 
  episodes?: Episode[] | null; 
  created_at?: string;
  views?: number;
}

export interface GameItem {
  id: string;
  title: string;
  console: string;
  type: 'embed' | 'direct';
  url: string;
  imageUrl?: string;
  genre: string;
  emulatorUrl?: string;
}

export interface Reseller {
  id: string;
  name: string;
  username: string;
  password?: string;
  credits: number;
  totalSold: number;
  isBlocked: boolean;
  created_at?: string;
  cpf?: string;
  phone?: string;
  email?: string;
  birthDate?: string;
}

export type SubscriptionTier = 'test' | 'monthly' | 'lifetime';

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
  activatedAt?: string | null;
  individualMessage?: string;
  gamePoints?: number;
  created_at?: string;
  reseller_name?: string; 
}

// Inicialização Segura do Motor Firebase
const getDb = () => {
  const { db } = initializeFirebase();
  if (!db) throw new Error("FIREBASE_OFFLINE");
  return db;
};

// Funções de Utilidade
const safeParse = (data: any) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  try { return typeof data === 'string' ? JSON.parse(data) : data; } catch (e) { return []; }
};

export const generateRandomPin = (l = 11) => Array.from({ length: l }, () => Math.floor(Math.random() * 10)).join('');
export const cleanName = (n: string) => n.toUpperCase().trim();

export const formatMasterLink = (url: string) => {
  try {
    if (!url || typeof url !== 'string') return "";
    let finalUrl = url.trim();

    if (finalUrl.toLowerCase().includes('<iframe')) {
      const srcMatch = finalUrl.match(/src=["']([^"']+)["']/i);
      if (srcMatch && srcMatch[1]) finalUrl = srcMatch[1];
    }

    let lowUrl = finalUrl.toLowerCase();

    // SINTONIZAÇÃO SOBERANA TVACABO, SHORTFLIX E OK.RU
    if (lowUrl.includes('ok.ru/video/')) {
      const videoId = finalUrl.split('/video/')[1]?.split(/[?#&/]/)[0];
      if (videoId) finalUrl = `https://ok.ru/videoembed/${videoId}`;
    }
    
    if (lowUrl.includes('tokyvideo.com/video/')) {
       const slug = finalUrl.split('/video/')[1]?.split(/[?#&/]/)[0];
       if (slug) finalUrl = `https://www.tokyvideo.com/embed/${slug}`;
    }

    if (lowUrl.includes('shortflix.net/pt/home')) return finalUrl;

    const needsProxy = [
      '.m3u8', '.mp4', '.ts', '.mpd', 'ch.php?', 'xn--', 
      'redecanais', 'rdcanais', 'stream', 'cdn', 'vidsrc', 
      'player', 'video', 'playlist', 'master', 'index',
      'tvacabo.top', 'shortflix'
    ];

    if (lowUrl.includes('/api/proxy?url=')) return finalUrl;

    if (needsProxy.some(term => lowUrl.includes(term)) && !lowUrl.includes('youtube.com') && !lowUrl.includes('ok.ru')) {
      return `/api/proxy?url=${encodeURIComponent(finalUrl)}`;
    }

    if (lowUrl.includes('youtube.com') || lowUrl.includes('youtu.be')) {
      let videoId = "";
      if (lowUrl.includes('/shorts/')) videoId = finalUrl.split('/shorts/')[1]?.split(/[?#&]/)[0];
      else if (lowUrl.includes('v=')) videoId = finalUrl.split('v=')[1]?.split(/[&#]/)[0];
      else if (lowUrl.includes('youtu.be/')) videoId = finalUrl.split( 'youtu.be/')[1]?.split(/[?#&/]/)[0];
      else if (lowUrl.includes('/embed/')) return finalUrl;
      
      if (videoId) return `https://www.youtube.com/embed/${videoId}?autoplay=1&modestbranding=1&rel=0`;
    }

    return finalUrl;
  } catch (e) { return url || ""; }
};

// --- OPERAÇÕES DE CONTEÚDO (FIREBASE) ---

export async function getRemoteContent(showInactive = false, searchQuery = "", categoryGenre = ""): Promise<ContentItem[]> {
  try {
    const db = getDb();
    const contentRef = collection(db, 'content');
    let q = query(contentRef, orderBy('title'));

    if (categoryGenre) {
      q = query(contentRef, where('genre', '==', categoryGenre.toUpperCase().trim()), orderBy('title'));
    }

    const querySnapshot = await getDocs(q);
    let results: ContentItem[] = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data() as ContentItem;
      if (showInactive || data.isActive !== false) {
        if (!searchQuery || data.title.toLowerCase().includes(searchQuery.toLowerCase())) {
          results.push({ ...data, id: doc.id });
        }
      }
    });

    return results;
  } catch (e) { return []; }
}

export async function saveContent(item: Partial<ContentItem>) {
  try {
    const db = getDb();
    const id = item.id || "cont_" + Date.now();
    await setDoc(doc(db, 'content', id), { ...item, id }, { merge: true });
    return true;
  } catch (e) { return false; }
}

export async function getContentById(id: string) {
  try {
    const db = getDb();
    const docSnap = await getDoc(doc(db, 'content', id));
    return docSnap.exists() ? docSnap.data() as ContentItem : null;
  } catch (e) { return null; }
}

export async function removeContent(id: string) {
  try {
    const db = getDb();
    await deleteDoc(doc(db, 'content', id));
    return true;
  } catch (e) { return false; }
}

export async function bulkRemoveContent(ids: string[]) {
  try {
    const db = getDb();
    const batch = writeBatch(db);
    ids.forEach(id => batch.delete(doc(db, 'content', id)));
    await batch.commit();
    return true;
  } catch (e) { return false; }
}

export async function bulkUpdateContent(ids: string[], updates: any) {
  try {
    const db = getDb();
    const batch = writeBatch(db);
    ids.forEach(id => batch.update(doc(db, 'content', id), updates));
    await batch.commit();
    return true;
  } catch (e) { return false; }
}

// --- OPERAÇÕES DE USUÁRIOS (FIREBASE) ---

export async function getRemoteUsers(): Promise<User[]> {
  try {
    const db = getDb();
    const usersSnap = await getDocs(collection(db, 'users'));
    const resellersSnap = await getDocs(collection(db, 'resellers'));
    
    const resellerMap = new Map();
    resellersSnap.forEach(r => resellerMap.set(r.id, r.data().name));

    const results: User[] = [];
    usersSnap.forEach(u => {
      const data = u.data() as User;
      results.push({
        ...data,
        id: u.id,
        reseller_name: data.resellerId ? (resellerMap.get(data.resellerId) || 'NÃO LOCALIZADO') : 'ADMIN'
      });
    });
    return results;
  } catch (e) { return []; }
}

export async function saveUser(user: Partial<User>) {
  try {
    const db = getDb();
    const pin = (user.pin || "").toUpperCase().trim();
    if (!pin) return false;

    // Busca por PIN para garantir unicidade
    const q = query(collection(db, 'users'), where('pin', '==', pin));
    const snap = await getDocs(q);
    
    let id = user.id;
    if (!id && !snap.empty) id = snap.docs[0].id;
    if (!id) id = "user_" + Date.now();

    await setDoc(doc(db, 'users', id), { ...user, id, pin }, { merge: true });
    return true;
  } catch (e) { return false; }
}

export async function validateDeviceLogin(pin: string, deviceId: string) {
  try {
    const cleanPin = pin.toUpperCase().trim();
    if (cleanPin === 'ADM77X2P') {
      return { user: { id: 'admin_master_leo', pin: 'ADM77X2P', role: 'admin', subscriptionTier: 'lifetime', maxScreens: 99, activeDevices: [deviceId], isBlocked: false, isAdultEnabled: true, isGamesEnabled: true, isPpvEnabled: true, isAlacarteEnabled: true, isGamesOnly: false } as User };
    }

    const db = getDb();
    const q = query(collection(db, 'users'), where('pin', '==', cleanPin));
    const snap = await getDocs(q);

    if (snap.empty) return { error: "PIN INVÁLIDO" };
    const user = snap.docs[0].data() as User;

    if (user.isBlocked) return { error: "PIN BLOQUEADO" };
    if (user.expiryDate && new Date() > new Date(user.expiryDate)) return { error: "ACESSO EXPIRADO" };

    const activeDevices = user.activeDevices || [];
    if (!activeDevices.includes(deviceId)) {
      if (activeDevices.length >= user.maxScreens) return { error: "LIMITE DE TELAS ATINGIDO" };
      const updatedDevices = [...activeDevices, deviceId];
      await updateDoc(doc(db, 'users', user.id), { activeDevices: updatedDevices });
      user.activeDevices = updatedDevices;
    }

    return { user };
  } catch (e) { return { error: "ERRO DE REDE" }; }
}

export async function removeUser(id: string) {
  try {
    const db = getDb();
    await deleteDoc(doc(db, 'users', id));
    return true;
  } catch (e) { return false; }
}

export async function resetUserDevices(userId: string) {
  try {
    const db = getDb();
    await updateDoc(doc(db, 'users', userId), { activeDevices: [] });
    return true;
  } catch (e) { return false; }
}

// --- OPERAÇÕES DE REVENDEDORES (FIREBASE) ---

export async function getRemoteResellers(): Promise<Reseller[]> {
  try {
    const db = getDb();
    const snap = await getDocs(query(collection(db, 'resellers'), orderBy('name')));
    const results: Reseller[] = [];
    snap.forEach(d => results.push({ ...d.data() as Reseller, id: d.id }));
    return results;
  } catch (e) { return []; }
}

export async function saveReseller(r: Partial<Reseller>) {
  try {
    const db = getDb();
    const id = r.id || "rev_" + Date.now();
    await setDoc(doc(db, 'resellers', id), { ...r, id }, { merge: true });
    return true;
  } catch (e) { return false; }
}

export async function removeReseller(id: string) {
  try {
    const db = getDb();
    await deleteDoc(doc(db, 'resellers', id));
    return true;
  } catch (e) { return false; }
}

export async function validateResellerLogin(u: string, p: string) {
  try {
    const db = getDb();
    const q = query(collection(db, 'resellers'), where('username', '==', u.trim()), where('password', '==', p.trim()));
    const snap = await getDocs(q);
    if (snap.empty) return { error: "INVÁLIDO" };
    return { reseller: snap.docs[0].data() as Reseller };
  } catch (e) { return { error: "ERRO DE REDE" }; }
}

// --- CONFIGURAÇÕES GLOBAIS (FIREBASE) ---

export async function getGlobalSettings() {
  try {
    const db = getDb();
    const docSnap = await getDoc(doc(db, 'settings', 'global'));
    return docSnap.exists() ? docSnap.data().value : { parentalPin: "1234", announcement: "", bannerUrl: "", bannerLink: "" };
  } catch (e) { return { parentalPin: "1234", announcement: "", bannerUrl: "", bannerLink: "" }; }
}

export async function updateGlobalSettings(v: any) {
  try {
    const db = getDb();
    await setDoc(doc(db, 'settings', 'global'), { value: v });
    return true;
  } catch (e) { return false; }
}

// --- ESTATÍSTICAS E GAMES ---

export async function getCategoryCount(g: string) {
  try {
    const db = getDb();
    const q = query(collection(db, 'content'), where('genre', '==', g.toUpperCase().trim()));
    const snap = await getDocs(q);
    return snap.size;
  } catch (e) { return 0; }
}

export async function getTotalContentCount() {
  try {
    const db = getDb();
    const snap = await getDocs(collection(db, 'content'));
    return snap.size;
  } catch (e) { return 0; }
}

export async function getTopContent(l = 10) {
  try {
    const db = getDb();
    const q = query(collection(db, 'content'), orderBy('views', 'desc'), limit(l));
    const snap = await getDocs(q);
    const results: ContentItem[] = [];
    snap.forEach(d => results.push(d.data() as ContentItem));
    return results;
  } catch (e) { return []; }
}

export async function getRemoteGames(): Promise<GameItem[]> {
  try {
    const db = getDb();
    const q = query(collection(db, 'content'), where('genre', '>=', 'ARENA:'), where('genre', '<=', 'ARENA:\uf8ff'));
    const snap = await getDocs(q);
    const results: GameItem[] = [];
    snap.forEach(i => {
      const data = i.data();
      results.push({ id: i.id, title: data.title, console: data.genre.replace('ARENA: ', ''), type: 'embed', url: data.streamUrl, imageUrl: data.imageUrl, genre: data.genre });
    });
    return results;
  } catch (e) { return []; }
}

export async function saveGame(g: any) {
  return await saveContent({ id: g.id || "game_"+Date.now(), title: g.title.toUpperCase(), genre: `ARENA: ${g.console}`, streamUrl: g.url, description: 'GAME', isRestricted: true, isActive: true });
}

export async function removeGame(id: string) {
  return await removeContent(id);
}

export async function getGameRankings() { return []; }
export const getBeautifulMessage = (pin: string, tier: string, url: string, screens: number) => `🎬 *LÉO TV STREAM!* \n👤 *PIN:* \`${pin}\` \n📅 *PLANO:* ${tier.toUpperCase()} \n🔗 ${url}`;
export const getExpiryMessage = (pin: string, days: number) => `⚠️ *AVISO LÉO TV!* \n👤 *PIN:* \`${pin}\` \n⏳ Seu acesso expira em ${days} dia(s).`;
export type GameRanking = any;
