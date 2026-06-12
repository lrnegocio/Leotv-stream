'use client';

/**
 * MOTOR DE DADOS v385-S - MODO SUPABASE REATIVADO
 * Sistema reconectado ao projeto veilblctswnnyzidirrf por ordem do Mestre Léo.
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
 */
export async function validateDeviceLogin(pin: string, deviceId: string) {
  const cleanPin = pin.toUpperCase().trim();

  // BYPASS MESTRE INQUEBRÁVEL (ADM77X2P)
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
    return { error: "ERRO DE CONEXÃO MASTER" }; 
  }
}

/**
 * BUSCA REMOTA v385-S SUPABASE
 */
export async function getRemoteContent(showInactive = true, searchQuery = "", categoryGenre = ""): Promise<ContentItem[]> {
  try {
    let query = supabase.from('content').select('*');
    
    if (!showInactive) query = query.eq('isActive', true);
    if (categoryGenre) query = query.eq('genre', categoryGenre);
    if (searchQuery) query = query.ilike('title', `%${searchQuery}%`);
    
    const { data, error } = await query.order('title');
    if (error) throw error;
    return data || [];
  } catch (e) { 
    console.error("Erro Supabase Content:", e);
    return []; 
  }
}

export async function saveContent(item: Partial<ContentItem>) {
  try {
    const id = item.id || `content_${Date.now()}`;
    const { error } = await supabase.from('content').upsert({ ...item, id });
    return !error;
  } catch (e) { return false; }
}

export async function getContentById(id: string) {
  try {
    const { data, error } = await supabase.from('content').select('*').eq('id', id).single();
    if (error) return null;
    return data as ContentItem;
  } catch (e) { return null; }
}

export async function getRemoteUsers(): Promise<User[]> {
  try {
    const { data, error } = await supabase.from('users').select('*').order('id', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (e) { return []; }
}

export async function saveUser(user: Partial<User>) {
  try {
    const id = user.id || `user_${Date.now()}`;
    const { error } = await supabase.from('users').upsert({ ...user, id });
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
    const { data, error } = await supabase.from('resellers').select('*');
    if (error) throw error;
    return data || [];
  } catch (e) { return []; }
}

export async function saveReseller(r: Partial<Reseller>) {
  try {
    const id = r.id || `rev_${Date.now()}`;
    const { error } = await supabase.from('resellers').upsert({ ...r, id });
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
    const { data, error } = await supabase.from('settings').select('*').eq('id', 'global').single();
    if (error || !data) return { parentalPin: "1234", announcement: "", bannerUrl: "", bannerLink: "" };
    return data;
  } catch (e) { return { parentalPin: "1234", announcement: "", bannerUrl: "", bannerLink: "" }; }
}

export async function updateGlobalSettings(v: any) {
  try {
    const { error } = await supabase.from('settings').upsert({ ...v, id: 'global' });
    return !error;
  } catch (e) { return false; }
}

export async function getTotalContentCount() {
  try {
    const { count } = await supabase.from('content').select('*', { count: 'exact', head: true }).eq('isActive', true);
    return count || 0;
  } catch (e) { return 0; }
}

export async function getCategoryCount(g: string) {
  try {
    const { count } = await supabase.from('content').select('*', { count: 'exact', head: true }).eq('genre', g).eq('isActive', true);
    return count || 0;
  } catch (e) { return 0; }
}

export async function getTopContent(limitNum = 10): Promise<ContentItem[]> {
  try {
    const { data } = await supabase.from('content').select('*').order('views', { ascending: false }).limit(limitNum);
    return data || [];
  } catch (e) { return []; }
}

export async function getRemoteGames(): Promise<GameItem[]> {
  try {
    const { data } = await supabase.from('games').select('*');
    return data || [];
  } catch (e) { return []; }
}

export async function saveGame(g: any) {
  try {
    const id = g.id || `game_${Date.now()}`;
    const { error } = await supabase.from('games').upsert({ ...g, id });
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
