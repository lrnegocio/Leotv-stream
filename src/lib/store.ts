
/**
 * MOTOR DE DADOS v385-S - MODO CONEXÃO SOBERANA
 * Sistema Conectado ao Supabase - Otimizado para Hardware (Sky/Vivensis) e VOD.
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
}

export interface GameRanking {
  pin: string;
  points: number;
}

export const generateRandomPin = (l = 11) => Array.from({ length: l }, () => Math.floor(Math.random() * 10)).join('');
export const cleanName = (n: string) => n.toUpperCase().trim();

/**
 * SINTONIZADOR MASTER v385-S
 * Proteção Master: sky, encoder, vivensis, tvacabo.top, shortflix.net.
 */
export const formatMasterLink = (url: string) => {
  if (!url) return "";
  let finalUrl = url.trim();

  if (
    finalUrl.startsWith('http://') && 
    (finalUrl.includes(':80') || finalUrl.includes(':8080') || finalUrl.includes('192.168') || finalUrl.includes('177.'))
  ) {
    return `/api/proxy?url=${encodeURIComponent(finalUrl)}`;
  }

  const needsGhostTunnel = [
    'tvacabo.top', 'shortflix.net', 'redecanais', 'rdcanais', 
    'vidsrc', 'ok.ru', 'vivensis', 'sky', 'encoder', 'youtube', 'dailymotion'
  ];

  if (needsGhostTunnel.some(t => finalUrl.toLowerCase().includes(t)) && !finalUrl.includes('/api/proxy')) {
    return `/api/proxy?url=${encodeURIComponent(finalUrl)}`;
  }

  return finalUrl;
};

// --- FUNÇÕES DE CONTEÚDO ---

export async function getRemoteContent(showInactive = false, searchQuery = "", categoryGenre = ""): Promise<ContentItem[]> {
  try {
    let query = supabase.from('content').select('*');
    
    if (!showInactive) query = query.eq('isActive', true);
    if (categoryGenre) query = query.eq('genre', categoryGenre);
    if (searchQuery) query = query.ilike('title', `%${searchQuery}%`);
    
    const { data, error } = await query.order('title');
    if (error) throw error;
    return data || [];
  } catch (e) {
    console.error("Erro ao buscar conteúdo:", e);
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

export async function removeContent(id: string) {
  try {
    const { error } = await supabase.from('content').delete().eq('id', id);
    return !error;
  } catch (e) { return false; }
}

export async function bulkRemoveContent(ids: string[]) {
  try {
    const { error } = await supabase.from('content').delete().in('id', ids);
    return !error;
  } catch (e) { return false; }
}

export async function bulkUpdateContent(ids: string[], updates: any) {
  try {
    const { error } = await supabase.from('content').update(updates).in('id', ids);
    return !error;
  } catch (e) { return false; }
}

// --- FUNÇÕES DE USUÁRIO / PIN ---

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

export async function resetUserDevices(userId: string) {
  try {
    const { error } = await supabase.from('users').update({ activeDevices: [] }).eq('id', userId);
    return !error;
  } catch (e) { return false; }
}

export async function validateDeviceLogin(pin: string, deviceId: string) {
  try {
    const cleanPin = pin.toUpperCase().trim();
    const { data: user, error } = await supabase.from('users').select('*').eq('pin', cleanPin).single();

    if (error || !user) return { error: "PIN INVÁLIDO" };
    if (user.isBlocked) return { error: "ACESSO BLOQUEADO" };

    if (user.expiryDate && new Date(user.expiryDate) < new Date()) {
      return { error: "PLANO EXPIRADO" };
    }

    let devices = user.activeDevices || [];
    if (!devices.includes(deviceId)) {
      if (devices.length >= (user.maxScreens || 1)) {
        return { error: "LIMITE DE TELAS ATINGIDO" };
      }
      devices.push(deviceId);
      await supabase.from('users').update({ 
        activeDevices: devices,
        activatedAt: user.activatedAt || new Date().toISOString()
      }).eq('id', user.id);
    }

    return { user: { ...user, activeDevices: devices } as User };
  } catch (e) {
    return { error: "ERRO DE CONEXÃO" };
  }
}

// --- FUNÇÕES DE REVENDA ---

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

export async function validateResellerLogin(u: string, p: string) {
  try {
    const { data: res, error } = await supabase.from('resellers').select('*').eq('username', u.toUpperCase()).eq('password', p).single();
    if (error || !res) return { error: "CREDENCIAIS INVÁLIDAS" };
    if (res.isBlocked) return { error: "REVENDA SUSPENSA" };
    return { reseller: res as Reseller };
  } catch (e) { return { error: "ERRO DE SISTEMA" }; }
}

// --- CONFIGURAÇÕES GLOBAIS ---

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

// --- ESTATÍSTICAS E GAMES ---

export async function getCategoryCount(g: string) {
  try {
    const { count } = await supabase.from('content').select('*', { count: 'exact', head: true }).eq('genre', g).eq('isActive', true);
    return count || 0;
  } catch (e) { return 0; }
}

export async function getTotalContentCount() {
  try {
    const { count } = await supabase.from('content').select('*', { count: 'exact', head: true }).eq('isActive', true);
    return count || 0;
  } catch (e) { return 0; }
}

export async function getTopContent(limit = 10): Promise<ContentItem[]> {
  try {
    const { data } = await supabase.from('content').select('*').order('views', { ascending: false }).limit(limit);
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

export async function getGameRankings(): Promise<GameRanking[]> {
  try {
    const { data } = await supabase.from('rankings').select('*').order('points', { ascending: false }).limit(20);
    return data || [];
  } catch (e) { return []; }
}

export const getBeautifulMessage = (pin: string, tier: string, url: string, screens: number) => 
  `🎬 *LÉO TV STREAM!* \n\n👤 *SEU PIN MASTER:* \`${pin}\` \n🖥️ *TELAS:* ${screens} \n📅 *PLANO:* ${tier === 'test' ? 'TESTE 6H' : 'MENSAL 30 DIAS'} \n\n🔗 *ACESSE AGORA:* ${url} \n\n*Bom entretenimento!*`;

export const getExpiryMessage = (pin: string, days: number) => 
  `⚠️ *AVISO LÉO TV!* \n\nSeu acesso PIN \`${pin}\` expira em *${days} dia(s)*. \nRegularize para não perder o sinal!`;
