
import { supabase } from './supabase-client';

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

const safeParse = (data: any) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  try {
    const parsed = typeof data === 'string' ? JSON.parse(data) : data;
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    return [];
  }
};

export async function getCategoryCount(g: string) {
  try {
    const { data, error } = await supabase.from('content').select('type, episodes, seasons').eq('genre', g.toUpperCase());
    if (error || !data) return 0;
    
    let total = 0;
    data.forEach(item => {
        if (item.type === 'channel' || item.type === 'movie') {
            total += 1;
        } else if (item.type === 'series') {
            const eps = safeParse(item.episodes);
            total += eps.length;
        } else if (item.type === 'multi-season') {
            const seasons = safeParse(item.seasons);
            seasons.forEach((s: any) => {
                const eps = safeParse(s.episodes);
                total += eps.length;
            });
        }
    });
    return total;
  } catch (e) { return 0; }
}

export async function getTotalContentCount() {
  try {
    const { data, error } = await supabase.from('content').select('id');
    if (error) return 0;
    return data?.length || 0;
  } catch (e) { return 0; }
}

export const formatMasterLink = (url: string) => {
  try {
    if (!url || typeof url !== 'string') return "";
    let finalUrl = url.trim();
    if (finalUrl.toLowerCase().startsWith('<iframe')) {
      const match = finalUrl.match(/src="([^"]+)"/i);
      if (match && match[1]) finalUrl = match[1];
    }
    let lowUrl = finalUrl.toLowerCase();
    if (lowUrl.includes('tokyvideo.com')) return `/api/proxy?url=${encodeURIComponent(finalUrl)}`;
    if (lowUrl.includes('youtube.com') || lowUrl.includes('youtu.be')) {
      let videoId = "";
      if (lowUrl.includes('/shorts/')) videoId = finalUrl.split('/shorts/')[1]?.split(/[?#&]/)[0];
      else if (lowUrl.includes('v=')) videoId = finalUrl.split('v=')[1]?.split(/[&#]/)[0];
      else if (lowUrl.includes('youtu.be/')) videoId = finalUrl.split('youtu.be/')[1]?.split(/[?#&]/)[0];
      if (videoId) return `https://www.youtube.com/embed/${videoId}`;
    }
    if (lowUrl.includes('.m3u8') || lowUrl.includes('.mp4') || lowUrl.includes('ch.php?') || lowUrl.includes('xn--')) {
      return `/api/proxy?url=${encodeURIComponent(finalUrl)}`;
    }
    return finalUrl;
  } catch (e) { return url || ""; }
};

export async function getRemoteContent(showInactive = false, searchQuery = "", categoryGenre = ""): Promise<ContentItem[]> {
  try {
    let query = supabase.from('content').select('*');
    
    // Filtro Arena (Games)
    if (!categoryGenre.startsWith('ARENA:')) {
       query = query.not('genre', 'ilike', 'ARENA: %');
    }

    // Busca por termo
    if (searchQuery) {
      query = query.or(`title.ilike.%${searchQuery}%,genre.ilike.%${searchQuery}%`);
    }

    // Filtro de Gênero Master
    const trimmedGenre = categoryGenre.trim().toUpperCase();
    if (trimmedGenre) {
      query = query.eq('genre', trimmedGenre);
    }

    const { data, error } = await query.order('title', { ascending: true });
    
    if (error) {
      console.error("Erro Supabase:", error);
      return [];
    }

    return (data || []).map(item => ({
      ...item,
      isRestricted: !!item.isRestricted,
      isActive: item.isActive !== false,
      episodes: safeParse(item.episodes),
      seasons: safeParse(item.seasons)
    })).filter(i => showInactive || i.isActive !== false);
  } catch (e: any) { 
    console.error("Falha Crítica no Banco:", e);
    return []; 
  }
}

export async function saveContent(item: Partial<ContentItem>) {
  try {
    const payload: any = { ...item };
    if (!payload.id) payload.id = "cont_" + Date.now() + Math.random().toString(36).substring(7);
    const validKeys = ['id', 'title', 'type', 'genre', 'description', 'isRestricted', 'isActive', 'streamUrl', 'imageUrl', 'episodes', 'seasons', 'views'];
    const cleanPayload: any = {};
    validKeys.forEach(k => { if (payload[k] !== undefined) cleanPayload[k] = payload[k]; });
    const { error } = await supabase.from('content').upsert(cleanPayload);
    return !error;
  } catch (e) { return false; }
}

export async function getRemoteUsers(): Promise<User[]> {
  try {
    const { data, error } = await supabase.from('users').select('*, resellers(name)').order('id', { ascending: false });
    if (error) throw error;
    return (data || []).map(u => ({ ...u, reseller_name: u.resellers?.name || 'ADMIN' }));
  } catch (e) { return []; }
}

export async function saveUser(user: Partial<User>) {
  try {
    const payload: any = { ...user };
    const cleanPin = (payload.pin || "").toUpperCase().trim();
    if (!cleanPin) return false;
    delete payload.reseller_name;
    delete payload.resellers;
    delete payload.created_at;
    const { data: existing } = await supabase.from('users').select('*').eq('pin', cleanPin).maybeSingle();
    if (existing) { payload.id = existing.id; } else {
      payload.id = payload.id || "user_" + Date.now() + Math.random().toString(36).substring(7);
    }
    const allowedColumns = ['id', 'pin', 'role', 'subscriptionTier', 'expiryDate', 'maxScreens', 'activeDevices', 'isBlocked', 'isAdultEnabled', 'isGamesEnabled', 'isPpvEnabled', 'isAlacarteEnabled', 'isGamesOnly', 'resellerId', 'activatedAt', 'individualMessage', 'gamePoints'];
    const cleanPayload: any = {};
    allowedColumns.forEach(col => { if (payload[col] !== undefined) cleanPayload[col] = payload[col]; });
    const { error } = await supabase.from('users').upsert(cleanPayload);
    return !error;
  } catch (e) { return false; }
}

export async function validateDeviceLogin(pin: string, deviceId: string) {
  try {
    const cleanPin = pin.toUpperCase().trim();
    if (cleanPin === 'ADM77X2P') {
      return { user: { id: 'admin_master_leo', pin: 'ADM77X2P', role: 'admin', subscriptionTier: 'lifetime', maxScreens: 99, activeDevices: [deviceId], isBlocked: false, isAdultEnabled: true, isGamesEnabled: true, isPpvEnabled: true, isAlacarteEnabled: true, isGamesOnly: false } };
    }
    const { data: user, error } = await supabase.from('users').select('*').eq('pin', cleanPin).maybeSingle();
    if (!user) return { error: "PIN INVÁLIDO" };
    if (user.isBlocked) return { error: "PIN BLOQUEADO" };
    if (user.expiryDate && new Date() > new Date(user.expiryDate)) return { error: "ACESSO EXPIRADO" };
    const activeDevices = user.activeDevices || [];
    if (!activeDevices.includes(deviceId)) {
      if (activeDevices.length >= user.maxScreens) return { error: "LIMITE DE TELAS ATINGIDO" };
      const updatedDevices = [...activeDevices, deviceId];
      await supabase.from('users').update({ activeDevices: updatedDevices }).eq('id', user.id);
      user.activeDevices = updatedDevices;
    }
    return { user };
  } catch (e) { return { error: "ERRO DE REDE" }; }
}

export async function bulkUpdateContent(ids: string[], updates: any) {
  if (!ids || ids.length === 0) return true;
  try { const { error } = await supabase.from('content').update(updates).in('id', ids); return !error; } catch (e) { return false; }
}

export async function getContentById(id: string) {
  try { const { data } = await supabase.from('content').select('*').eq('id', id).maybeSingle(); return data; } catch (e) { return null; }
}

export async function removeContent(id: string) { 
  const { error } = await supabase.from('content').delete().eq('id', id); 
  return !error; 
}

export async function removeUser(id: string) { 
  const { error } = await supabase.from('users').delete().eq('id', id); 
  return !error; 
}

export async function removeReseller(id: string) { 
  const { error } = await supabase.from('resellers').delete().eq('id', id); 
  return !error; 
}

// FIX: Exportação obrigatória para evitar erro de build no Putty
export async function removeGame(id: string) { 
  const { error } = await supabase.from('content').delete().eq('id', id); 
  return !error; 
}

export async function getRemoteGames(): Promise<GameItem[]> {
  try {
    const { data } = await supabase.from('content').select('*').ilike('genre', 'ARENA: %');
    return (data || []).map(i => ({ id: i.id, title: i.title, console: i.genre.replace('ARENA: ', ''), type: 'embed', url: i.streamUrl, imageUrl: i.imageUrl, genre: i.genre }));
  } catch (e) { return []; }
}

export async function saveGame(g: any) {
  return await saveContent({ id: g.id || "game_"+Date.now(), title: g.title.toUpperCase(), genre: `ARENA: ${g.console}`, streamUrl: g.url, description: 'GAME', isRestricted: true, isActive: true });
}

export async function resetUserDevices(userId: string) {
  try { const { error } = await supabase.from('users').update({ activeDevices: [] }).eq('id', userId); return !error; } catch (e) { return false; }
}

export async function getRemoteResellers(): Promise<Reseller[]> {
  try { const { data } = await supabase.from('resellers').select('*').order('name', { ascending: true }); return data || []; } catch (e) { return []; }
}

export async function saveReseller(r: Partial<Reseller>) {
  try {
    const payload: any = { ...r };
    const validCols = ['id', 'name', 'username', 'password', 'credits', 'totalSold', 'isBlocked', 'cpf', 'phone', 'email', 'birthDate'];
    const cleanPayload: any = {};
    validCols.forEach(c => { if(payload[c] !== undefined) cleanPayload[c] = payload[c]; });
    const { error } = await supabase.from('resellers').upsert(cleanPayload);
    return !error;
  } catch (err) { return false; }
}

export async function validateResellerLogin(u: string, p: string) {
  try { const { data } = await supabase.from('resellers').select('*').eq('username', u.trim()).eq('password', p.trim()).maybeSingle(); return data ? { reseller: data } : { error: "INVÁLIDO" }; } catch (e) { return { error: "ERRO DE REDE" }; }
}

export async function getGlobalSettings() {
  try { const { data } = await supabase.from('settings').select('*').eq('key', 'global').maybeSingle(); return data?.value || { parentalPin: "1234", announcement: "", bannerUrl: "", bannerLink: "" }; } catch (e) { return { parentalPin: "1234", announcement: "", bannerUrl: "", bannerLink: "" }; }
}

export async function updateGlobalSettings(v: any) {
  const { error } = await supabase.from('settings').upsert({ key: 'global', value: v });
  return !error;
}

export async function getTopContent(l = 10) {
  try { const { data } = await supabase.from('content').select('*').not('genre', 'ilike', 'ARENA: %').order('views', { ascending: false }).limit(l); return data || []; } catch (e) { return []; }
}

export async function bulkRemoveContent(ids: string[]) {
  const { error } = await supabase.from('content').delete().in('id', ids); return !error;
}

export const generateRandomPin = (l = 11) => Array.from({ length: l }, () => Math.floor(Math.random() * 10)).join('');
export const cleanName = (n: string) => n.toUpperCase().trim();
export async function getGameRankings() { return []; }
export const getBeautifulMessage = (pin: string, tier: string, url: string, screens: number) => `🎬 *LÉO TV STREAM!* \n👤 *PIN:* \`${pin}\` \n📅 *PLANO:* ${tier.toUpperCase()} \n🔗 ${url}`;
export const getExpiryMessage = (pin: string, days: number) => `⚠️ *AVISO LÉO TV!* \n👤 *PIN:* \`${pin}\` \n⏳ Seu acesso expira em ${days} dia(s).`;
export type GameRanking = any;
