
/**
 * MOTOR DE DADOS v385-S - MODO CONEXÃO SOBERANA
 * Sistema Conectado ao Supabase com FAILSAFE MASTER.
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
 * O PIN ADM77X2P é o código mestre inquebrável.
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

  try {
    const { data: user, error } = await supabase.from('users').select('*').eq('pin', cleanPin).single();
    if (error || !user) return { error: "PIN INVÁLIDO" };
    if (user.isBlocked) return { error: "ACESSO BLOQUEADO" };
    if (user.expiryDate && new Date(user.expiryDate) < new Date()) return { error: "PLANO EXPIRADO" };

    let devices = (user.activeDevices || []) as string[];
    if (!devices.includes(deviceId)) {
      if (devices.length >= (user.maxScreens || 1)) return { error: "LIMITE DE TELAS ATINGIDO" };
      devices.push(deviceId);
      await supabase.from('users').update({ activeDevices: devices }).eq('id', user.id);
    }
    return { user: { ...user, activeDevices: devices } as User };
  } catch (e) { 
    return { error: "ERRO DE CONEXÃO" }; 
  }
}

/**
 * BUSCA REMOTA v385-S
 * Agora busca TUDO por padrão para não ocultar dados importados.
 */
export async function getRemoteContent(showInactive = true, searchQuery = "", categoryGenre = ""): Promise<ContentItem[]> {
  try {
    let query = supabase.from('content').select('*');
    
    // Se showInactive for false, só filtramos os que são EXPLICITAMENTE false.
    // Isso garante que canais com null no isActive apareçam.
    if (!showInactive) {
      query = query.not('isActive', 'eq', false);
    }

    if (categoryGenre) query = query.eq('genre', categoryGenre);
    if (searchQuery) query = query.ilike('title', `%${searchQuery}%`);
    
    const { data, error } = await query.order('title');
    if (error) throw error;
    return (data || []) as ContentItem[];
  } catch (e) { return []; }
}

export async function saveContent(item: Partial<ContentItem>) {
  try {
    const { error } = await supabase.from('content').upsert({ ...item, id: item.id || `content_${Date.now()}` });
    return !error;
  } catch (e) { return false; }
}

export async function getContentById(id: string) {
  try {
    const { data } = await supabase.from('content').select('*').eq('id', id).single();
    return data as ContentItem;
  } catch (e) { return null; }
}

export async function getRemoteUsers(): Promise<User[]> {
  try {
    const { data } = await supabase.from('users').select('*').order('id', { ascending: false });
    return (data || []) as User[];
  } catch (e) { return []; }
}

export async function saveUser(user: Partial<User>) {
  try {
    const { error } = await supabase.from('users').upsert({ ...user, id: user.id || `user_${Date.now()}` });
    return !error;
  } catch (e) { return false; }
}

export async function removeUser(id: string) {
  try {
    const { error } = await supabase.from('users').delete().eq('id', id);
    return !error;
  } catch (e) { return false; }
}

export async function getRemoteResellers(): Promise<Reseller[]> {
  try {
    const { data } = await supabase.from('resellers').select('*');
    return (data || []) as Reseller[];
  } catch (e) { return []; }
}

export async function saveReseller(r: Partial<Reseller>) {
  try {
    const { error } = await supabase.from('resellers').upsert({ ...r, id: r.id || `rev_${Date.now()}` });
    return !error;
  } catch (e) { return false; }
}

export async function removeReseller(id: string) {
  try {
    const { error } = await supabase.from('resellers').delete().eq('id', id);
    return !error;
  } catch (e) { return false; }
}

export async function getGlobalSettings() {
  try {
    const { data } = await supabase.from('settings').select('*').eq('id', 'global').single();
    return data || { parentalPin: "1234" };
  } catch (e) { return { parentalPin: "1234" }; }
}

export async function updateGlobalSettings(v: any) {
  try {
    const { error } = await supabase.from('settings').upsert({ ...v, id: 'global' });
    return !error;
  } catch (e) { return false; }
}

export async function getTotalContentCount() {
  try {
    const { count } = await supabase.from('content').select('*', { count: 'exact', head: true });
    return count || 0;
  } catch (e) { return 0; }
}

export async function getCategoryCount(g: string) {
  try {
    const { count } = await supabase.from('content').select('*', { count: 'exact', head: true }).eq('genre', g);
    return count || 0;
  } catch (e) { return 0; }
}

export async function getTopContent(limit = 10): Promise<ContentItem[]> {
  try {
    const { data } = await supabase.from('content').select('*').order('views', { ascending: false }).limit(limit);
    return (data || []) as ContentItem[];
  } catch (e) { return []; }
}

export async function getRemoteGames(): Promise<GameItem[]> {
  try {
    const { data } = await supabase.from('games').select('*');
    return (data || []) as GameItem[];
  } catch (e) { return []; }
}

export async function saveGame(g: any) {
  try {
    const { error } = await supabase.from('games').upsert({ ...g, id: g.id || `game_${Date.now()}` });
    return !error;
  } catch (e) { return false; }
}

export async function removeGame(id: string) {
  try {
    const { error } = await supabase.from('games').delete().eq('id', id);
    return !error;
  } catch (e) { return false; }
}

export async function getGameRankings() {
  try {
    const { data } = await supabase.from('rankings').select('*').order('points', { ascending: false }).limit(20);
    return data || [];
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
  try {
    const { error } = await supabase.from('users').update({ activeDevices: [] }).eq('id', userId);
    return !error;
  } catch (e) { return false; }
}
