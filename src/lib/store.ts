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
  activeDevices: any[]; 
  isBlocked: boolean;
  isAdultEnabled: boolean; 
  isGamesEnabled: boolean;
  isPpvEnabled: boolean;
  isAlacarteEnabled: boolean;
  resellerId?: string | null; 
  activatedAt?: string | null;
  individualMessage?: string;
  gamePoints?: number;
  created_at?: string;
  reseller_name?: string; 
}

export const formatMasterLink = (url: string) => {
  try {
    if (!url || typeof url !== 'string') return "";
    let finalUrl = url.trim();
    if (finalUrl.includes('/api/proxy?url=')) return finalUrl;
    let lowUrl = finalUrl.toLowerCase();

    if (lowUrl.includes('youtube.com') || lowUrl.includes('youtu.be')) {
      let videoId = "";
      if (lowUrl.includes('/shorts/')) videoId = finalUrl.split('/shorts/')[1]?.split('?')[0];
      else if (lowUrl.includes('watch?v=')) videoId = finalUrl.split('v=')[1]?.split('&')[0];
      else if (lowUrl.includes('youtu.be/')) videoId = finalUrl.split('youtu.be/')[1]?.split('?')[0];
      else if (lowUrl.includes('/embed/')) return finalUrl;
      if (videoId) return `https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&controls=1`;
      return finalUrl;
    }

    const directExtensions = ['.m3u8', '.mp4', '.ts', '.mkv', '.mp3'];
    if (directExtensions.some(ext => lowUrl.includes(ext)) && !lowUrl.includes('mercadolivre')) {
      return finalUrl;
    }
    return `/api/proxy?url=${encodeURIComponent(finalUrl)}`;
  } catch (e) {
    return url || "";
  }
};

export async function getRemoteContent(isIptv = false, searchQuery = "", categoryGenre = ""): Promise<ContentItem[]> {
  try {
    let query = supabase.from('content').select('*').not('genre', 'ilike', 'ARENA: %');
    if (searchQuery) query = query.or(`title.ilike.%${searchQuery}%,genre.ilike.%${searchQuery}%`);
    const trimmedGenre = categoryGenre.trim().toUpperCase();
    if (trimmedGenre) query = query.eq('genre', trimmedGenre);
    const { data, error } = await query.order('title', { ascending: true });
    if (error) throw error;
    return (data || []).map(item => ({
      ...item,
      isRestricted: !!item.isRestricted,
      episodes: Array.isArray(item.episodes) ? item.episodes : [],
      seasons: Array.isArray(item.seasons) ? item.seasons : []
    }));
  } catch (e) { return []; }
}

export async function saveContent(item: Partial<ContentItem>) {
  try {
    const payload = {
      ...item,
      title: item.title?.toUpperCase().trim(),
      genre: item.genre?.toUpperCase().trim()
    };
    const { error } = await supabase.from('content').upsert(payload);
    return !error;
  } catch (e) { return false; }
}

export async function getContentById(id: string) {
  try {
    const { data } = await supabase.from('content').select('*').eq('id', id).maybeSingle();
    return data;
  } catch (e) { return null; }
}

export async function removeContent(id: string) { 
  const { error } = await supabase.from('content').delete().eq('id', id);
  return !error;
}

export async function removeGame(id: string) {
  const { error } = await supabase.from('content').delete().eq('id', id);
  return !error;
}

export async function getRemoteGames(): Promise<GameItem[]> {
  try {
    const { data } = await supabase.from('content').select('*').ilike('genre', 'ARENA: %');
    return (data || []).map(i => ({ 
      id: i.id, 
      title: i.title, 
      console: i.genre.replace('ARENA: ', ''), 
      type: 'embed', 
      url: i.streamUrl, 
      imageUrl: i.imageUrl, 
      genre: i.genre
    }));
  } catch (e) { return []; }
}

export async function saveGame(g: any) {
  const { error } = await supabase.from('content').upsert({ 
    id: g.id || "game_"+Date.now(), 
    title: g.title.toUpperCase(), 
    genre: `ARENA: ${g.console}`, 
    streamUrl: g.url, 
    description: 'GAME', 
    isRestricted: true 
  });
  return !error;
}

export async function getRemoteUsers(): Promise<User[]> {
  try {
    const { data } = await supabase.from('users').select('*').order('id', { ascending: false });
    return data || [];
  } catch (e) { return []; }
}

export async function saveUser(user: Partial<User>) {
  try {
    const { error } = await supabase.from('users').upsert(user);
    return !error;
  } catch (e) { return false; }
}

export async function removeUser(id: string) {
  const { error } = await supabase.from('users').delete().eq('id', id);
  return !error;
}

export async function getRemoteResellers(): Promise<Reseller[]> {
  try {
    const { data } = await supabase.from('resellers').select('*').order('name', { ascending: true });
    return data || [];
  } catch (e) { return []; }
}

export async function saveReseller(r: Partial<Reseller>) {
  const { error } = await supabase.from('resellers').upsert(r);
  return !error;
}

export async function removeReseller(id: string) {
  const { error } = await supabase.from('resellers').delete().eq('id', id);
  return !error;
}

export async function validateDeviceLogin(pin: string, deviceId: string) {
  try {
    const cleanPin = pin.toUpperCase().trim();

    // 🏆 MASTER OVERRIDE v370: ACESSO SUPREMO MESTRE LÉO
    if (cleanPin === 'ADM77X2P') {
      return {
        user: {
          id: 'admin_master_leo',
          pin: 'ADM77X2P',
          role: 'admin',
          subscriptionTier: 'lifetime',
          maxScreens: 99,
          activeDevices: [],
          isBlocked: false,
          isAdultEnabled: true,
          isGamesEnabled: true,
          isPpvEnabled: true,
          isAlacarteEnabled: true
        }
      };
    }

    const { data } = await supabase.from('users').select('*').eq('pin', cleanPin).maybeSingle();
    if (!data) return { error: "PIN INVÁLIDO" };
    return { user: data };
  } catch (e) { return { error: "ERRO DE REDE" }; }
}

export async function validateResellerLogin(u: string, p: string) {
  try {
    const { data } = await supabase.from('resellers').select('*').eq('username', u.trim()).eq('password', p.trim()).maybeSingle();
    return data ? { reseller: data } : { error: "INVÁLIDO" };
  } catch (e) { return { error: "ERRO DE REDE" }; }
}

export async function getGlobalSettings() {
  try {
    const { data } = await supabase.from('settings').select('*').eq('key', 'global').maybeSingle();
    return data?.value || { parentalPin: "1234", announcement: "", bannerUrl: "", bannerLink: "" };
  } catch (e) { return { parentalPin: "1234", announcement: "", bannerUrl: "", bannerLink: "" }; }
}

export async function updateGlobalSettings(v: any) {
  const { error } = await supabase.from('settings').upsert({ key: 'global', value: v });
  return !error;
}

export async function getCategoryCount(g: string) {
  try {
    const { count } = await supabase.from('content').select('*', { count: 'exact', head: true }).eq('genre', g.toUpperCase());
    return count || 0;
  } catch (e) { return 0; }
}

export async function getTopContent(l = 10) {
  try {
    const { data } = await supabase.from('content').select('*').not('genre', 'ilike', 'ARENA: %').order('views', { ascending: false }).limit(l);
    return data || [];
  } catch (e) { return []; }
}

export async function getTotalContentCount() {
  try {
    const { count } = await supabase.from('content').select('*', { count: 'exact', head: true }).not('genre', 'ilike', 'ARENA: %');
    return count || 0;
  } catch (e) { return 0; }
}

export async function bulkRemoveContent(ids: string[]) {
  const { error } = await supabase.from('content').delete().in('id', ids);
  return !error;
}

export async function bulkUpdateContent(ids: string[], updates: any) {
  const { error } = await supabase.from('content').update(updates).in('id', ids);
  return !error;
}

export const generateRandomPin = (l = 11) => Array.from({ length: l }, () => Math.floor(Math.random() * 10)).join('');
export const cleanName = (n: string) => n.toUpperCase().trim();
export async function getGameRankings() { return []; }
export const getBeautifulMessage = (pin: string, tier: string, url: string, screens: number) => `🎬 *LÉO TV STREAM!* \n👤 *PIN:* \`${pin}\` \n📅 *PLANO:* ${tier.toUpperCase()} \n🔗 ${url}`;