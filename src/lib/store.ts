
'use client';

/**
 * MOTOR DE DADOS v385-S - MODO INDEPENDÊNCIA VPS
 * Sistema de Armazenamento Local (JSON) com função de Migração.
 */

import { supabase } from './supabase-client';

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
  email?: string;
  phone?: string;
  cpf?: string;
  birthDate?: string;
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

// --- UTILITÁRIOS ---
export const generateRandomPin = (l = 11) => Array.from({ length: l }, () => Math.floor(Math.random() * 10)).join('');
export const cleanName = (n: string) => n.toUpperCase().trim();

// --- MOTOR DE COMUNICAÇÃO COM A VPS (API LOCAL) ---
async function apiCall(action: string, collection: string, data?: any) {
  try {
    const res = await fetch('/api/db', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, collection, data })
    });
    const result = await res.json();
    return result.data;
  } catch (e) {
    console.error("Erro na API Local:", e);
    return null;
  }
}

/**
 * MIGRADO SOBERANO - PUXA DADOS DO SUPABASE PARA A VPS
 */
export async function migrateFromSupabase() {
  try {
    const { data: content } = await supabase.from('content').select('*');
    const { data: users } = await supabase.from('users').select('*');
    const { data: resellers } = await supabase.from('resellers').select('*');
    
    if (content) {
      for (const item of content) await saveContent(item);
    }
    if (users) {
      for (const user of users) await saveUser(user);
    }
    if (resellers) {
      for (const res of resellers) await saveReseller(res);
    }
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * LOGIN SOBERANO v385-S
 */
export async function validateDeviceLogin(pin: string, deviceId: string) {
  const cleanPin = pin.toUpperCase().trim();

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

  const users: User[] = await apiCall('list', 'users') || [];
  const user = users.find(u => u.pin === cleanPin);

  if (!user) return { error: "PIN INVÁLIDO" };
  if (user.isBlocked) return { error: "ACESSO BLOQUEADO" };
  if (user.expiryDate && new Date(user.expiryDate) < new Date()) return { error: "PLANO EXPIRADO" };

  let devices = (user.activeDevices || []) as string[];
  if (!devices.includes(deviceId)) {
    if (devices.length >= (user.maxScreens || 1)) return { error: "LIMITE DE TELAS ATINGIDO" };
    devices.push(deviceId);
    await apiCall('update', 'users', { ...user, activeDevices: devices });
  }
  return { user: { ...user, activeDevices: devices } as User };
}

/**
 * LOGIN REVENDA v385-S
 */
export async function validateResellerLogin(username: string, password: string) {
  const resellers: Reseller[] = await apiCall('list', 'resellers') || [];
  const cleanUsername = username.toUpperCase().trim();
  const res = resellers.find(r => r.username.toUpperCase() === cleanUsername && r.password === password);
  
  if (!res) return { error: "CREDENCIAIS INVÁLIDAS" };
  if (res.isBlocked) return { error: "REVENDA SUSPENSA" };
  return { reseller: res as Reseller };
}

/**
 * BUSCA DE CONTEÚDO v385-S
 */
export async function getRemoteContent(showInactive = true, searchQuery = "", categoryGenre = ""): Promise<ContentItem[]> {
  let items: ContentItem[] = await apiCall('list', 'content') || [];
  
  if (categoryGenre) {
    // Se o gênero for ARENA GAMES ou PAY PER VIEW, unifica
    const isArena = categoryGenre === 'ARENA GAMES' || categoryGenre === 'LÉO TV PAY PER VIEW';
    if (isArena) {
      items = items.filter(i => i.genre === 'LÉO TV PAY PER VIEW' || i.genre === 'ARENA GAMES');
    } else {
      items = items.filter(i => i.genre === categoryGenre);
    }
  }

  if (!showInactive) items = items.filter(i => i.isActive !== false);
  
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    items = items.filter(i => i.title.toLowerCase().includes(q) || i.genre.toLowerCase().includes(q));
  }
  
  return items.sort((a, b) => a.title.localeCompare(b.title));
}

export async function saveContent(item: Partial<ContentItem>) {
  const id = item.id || `content_${Date.now()}`;
  const cleanItem = {
    ...item,
    id,
    genre: item.genre || "LÉO TV AO VIVO",
    isActive: item.isActive !== false,
    title: item.title ? cleanName(item.title) : "SEM TITULO"
  };
  const res = await apiCall('upsert', 'content', cleanItem);
  return !!res;
}

export async function getContentById(id: string) {
  const items: ContentItem[] = await apiCall('list', 'content') || [];
  return items.find(i => i.id === id) || null;
}

export async function removeContent(id: string) {
  const res = await apiCall('delete', 'content', { id });
  return !!res;
}

export async function bulkRemoveContent(ids: string[]) {
  let success = true;
  for (const id of ids) {
    const res = await apiCall('delete', 'content', { id });
    if (!res) success = false;
  }
  return success;
}

export async function bulkUpdateContent(ids: string[], updates: any) {
  const items: ContentItem[] = await apiCall('list', 'content') || [];
  for (const id of ids) {
    const item = items.find(i => i.id === id);
    if (item) {
      await apiCall('update', 'content', { ...item, ...updates });
    }
  }
  return true;
}

export async function getRemoteUsers(): Promise<User[]> {
  return await apiCall('list', 'users') || [];
}

export async function saveUser(user: Partial<User>) {
  const id = user.id || `user_${Date.now()}`;
  const res = await apiCall('upsert', 'users', { ...user, id });
  return !!res;
}

export async function removeUser(id: string) {
  const res = await apiCall('delete', 'users', { id });
  return !!res;
}

export async function getRemoteResellers(): Promise<Reseller[]> {
  return await apiCall('list', 'resellers') || [];
}

export async function saveReseller(r: Partial<Reseller>) {
  const id = r.id || `rev_${Date.now()}`;
  const cleanReseller = {
    ...r,
    id,
    username: r.username ? r.username.toUpperCase().trim() : "",
    name: r.name ? r.name.toUpperCase().trim() : "NOVO PARCEIRO"
  };
  const res = await apiCall('upsert', 'resellers', cleanReseller);
  return !!res;
}

export async function removeReseller(id: string) {
  const res = await apiCall('delete', 'resellers', { id });
  return !!res;
}

export async function getGlobalSettings() {
  const settings = await apiCall('list', 'settings') || [];
  const global = settings.find((s: any) => s.id === 'global');
  if (!global) return { parentalPin: "1234", announcement: "", bannerUrl: "", bannerLink: "" };
  return global;
}

export async function updateGlobalSettings(v: any) {
  const res = await apiCall('upsert', 'settings', { ...v, id: 'global' });
  return !!res;
}

export async function getTotalContentCount() {
  const items = await getRemoteContent(false);
  return items.length;
}

export async function getCategoryCount(g: string) {
  const items = await getRemoteContent(false, "", g);
  return items.length;
}

export async function getTopContent(limitNum = 10): Promise<ContentItem[]> {
  const items: ContentItem[] = await apiCall('list', 'content') || [];
  return items.sort((a, b) => (b.views || 0) - (a.views || 0)).slice(0, limitNum);
}

export async function getRemoteGames(): Promise<GameItem[]> {
  return await apiCall('list', 'games') || [];
}

export async function saveGame(g: any) {
  const id = g.id || `game_${Date.now()}`;
  const cleanGame = {
    id,
    title: cleanName(g.title || "JOGO ARENA"),
    console: g.console || "RETRO",
    url: g.url || "",
    imageUrl: g.imageUrl || ""
  };
  const res = await apiCall('upsert', 'games', cleanGame);
  return !!res;
}

export async function removeGame(id: string) {
  const res = await apiCall('delete', 'games', { id });
  return !!res;
}

export async function getGameRankings() {
  return await apiCall('list', 'rankings') || [];
}

/**
 * FORMATADOR MASTER v385-S
 * YouTube e Proxy Tunnel.
 */
export const formatMasterLink = (url: string) => {
  if (!url) return "";
  let finalUrl = url.trim();

  const hostOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://177.153.202.104:3000';
  
  if (finalUrl.includes('youtube.com/watch?v=')) {
    const videoId = finalUrl.split('v=')[1]?.split('&')[0];
    if (videoId) finalUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&origin=${encodeURIComponent(hostOrigin)}&enablejsapi=1&rel=0`;
  } else if (finalUrl.includes('youtu.be/')) {
    const videoId = finalUrl.split('youtu.be/')[1]?.split('?')[0];
    if (videoId) finalUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1&origin=${encodeURIComponent(hostOrigin)}&enablejsapi=1&rel=0`;
  }

  if (finalUrl.includes('tvacabo.top') || finalUrl.includes('shortflix.net')) {
    return `/api/proxy?url=${encodeURIComponent(finalUrl)}`;
  }
  return finalUrl;
};

export const getBeautifulMessage = (pin: string, tier: string, url: string, screens: number) => 
  `🎬 *LÉO TV STREAM!* \n\n👤 *SEU PIN MASTER:* \`${pin}\` \n\n🖥️ *TELAS:* ${screens} \n📅 *PLANO:* ${tier === 'test' ? 'TESTE 6H' : 'MENSAL 30 DIAS'} \n\n🔗 *ACESSE AGORA:* ${url} \n\n*Bom entretenimento!*`;

export async function resetUserDevices(userId: string) {
  const users: User[] = await apiCall('list', 'users') || [];
  const user = users.find(u => u.id === userId);
  if (user) {
    await apiCall('update', 'users', { ...user, activeDevices: [] });
    return true;
  }
  return false;
}
