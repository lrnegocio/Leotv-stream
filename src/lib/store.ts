
import { supabase } from './supabase-client';

export type ContentType = 'movie' | 'series' | 'multi-season' | 'channel';

export interface Episode { 
  id: string; 
  title: string; 
  number: number; 
  streamUrl: string; 
  directStreamUrl?: string;
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
  directStreamUrl?: string;
  imageUrl?: string;
  seasons?: Season[] | null; 
  episodes?: Episode[] | null; 
  created_at?: string;
  views?: number;
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
  resellerId?: string | null; 
  activatedAt?: string | null;
  individualMessage?: string;
  gamePoints?: number;
  isSearchingMatch?: boolean;
  searchingMatchAt?: string | null;
}

export interface GameRanking {
  pin: string;
  points: number;
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

export async function getTopContent(limit = 10): Promise<ContentItem[]> {
  try {
    const { data } = await supabase.from('content').select('*').order('views', { ascending: false }).limit(limit);
    return (data || []).map(i => ({ ...i, views: i.views || 0 }));
  } catch (e) { return []; }
}

export async function updateGameScore(pin: string, result: 'win' | 'draw' | 'loss') {
  try {
    const { data: user } = await supabase.from('users').select('gamePoints').eq('pin', pin.toUpperCase()).single();
    let pts = user?.gamePoints || 0;
    if (result === 'win') pts += 10;
    else if (result === 'draw') pts += 3;
    else if (result === 'loss') pts = Math.max(0, pts - 5);
    const { error } = await supabase.from('users').update({ gamePoints: pts, isSearchingMatch: false }).eq('pin', pin.toUpperCase());
    return !error;
  } catch (e) { return false; }
}

export async function setUserSearchingMatch(pin: string, isSearching: boolean) {
  try {
    const { error } = await supabase.from('users').update({ 
      isSearchingMatch: isSearching, 
      searchingMatchAt: isSearching ? new Date().toISOString() : null 
    }).eq('pin', pin.toUpperCase());
    return !error;
  } catch (e) { return false; }
}

export async function getWaitingPlayers(): Promise<User[]> {
  try {
    const { data } = await supabase.from('users')
      .select('*')
      .eq('isSearchingMatch', true)
      .order('searchingMatchAt', { ascending: false });
    return data || [];
  } catch (e) { return []; }
}

export async function getGameRankings(): Promise<GameRanking[]> {
  try {
    const { data } = await supabase.from('users').select('pin, gamePoints').gt('gamePoints', 0).order('gamePoints', { ascending: false }).limit(50);
    return (data || []).map(u => ({ pin: u.pin, points: u.gamePoints || 0 }));
  } catch (e) { return []; }
}

export async function getRemoteContent(isIptv = false, searchQuery = "", categoryGenre = ""): Promise<ContentItem[]> {
  try {
    let query = supabase.from('content').select('*');
    if (searchQuery) query = query.ilike('title', `%${searchQuery}%`);
    if (categoryGenre) query = query.eq('genre', categoryGenre.toUpperCase());
    const { data } = await query.order('title', { ascending: true });
    return (data || []).map(i => ({ ...i, isRestricted: !!i.isRestricted, title: (i.title || "").toUpperCase() }));
  } catch (e) { return []; }
}

export async function saveContent(item: Partial<ContentItem>) {
  try {
    const id = item.id || "leo_" + Math.random().toString(36).substring(2, 12);
    const payload = {
      id, title: (item.title || "NOVO SINAL").toUpperCase().trim(),
      genre: (item.genre || "LÉO TV AO VIVO").toUpperCase(),
      type: item.type || 'channel', description: item.description || "",
      imageUrl: item.imageUrl || "", isRestricted: !!item.isRestricted,
      streamUrl: (item.type === 'series' || item.type === 'multi-season') ? "" : (item.streamUrl || ""),
      episodes: (item.type === 'series') ? (item.episodes || []) : null,
      seasons: (item.type === 'multi-season') ? (item.seasons || []) : null
    };
    const { error } = await supabase.from('content').upsert(payload);
    return !error;
  } catch (e) { return false; }
}

export async function getContentById(id: string): Promise<ContentItem | null> {
  const { data } = await supabase.from('content').select('*').eq('id', id).maybeSingle();
  return data;
}

export async function removeContent(id: string) {
  const { error } = await supabase.from('content').delete().eq('id', id);
  return !error;
}

export async function getGlobalSettings() {
  try {
    const { data, error } = await supabase.from('settings').select('*').eq('key', 'global').maybeSingle();
    if (error) throw error;
    if (data && data.value) {
      return {
        parentalPin: String(data.value.parentalPin || "1234"),
        announcement: String(data.value.announcement || "")
      };
    }
    return { parentalPin: "1234", announcement: "" };
  } catch (e) {
    console.error("Erro ao ler settings:", e);
    return { parentalPin: "1234", announcement: "" };
  }
}

export async function updateGlobalSettings(value: any) {
  try {
    const payload = {
      key: 'global',
      value: {
        parentalPin: String(value.parentalPin || "1234"),
        announcement: String(value.announcement || "")
      }
    };
    const { error } = await supabase.from('settings').upsert(payload);
    if (error) {
      console.error("Erro Supabase updateGlobalSettings:", error);
      return false;
    }
    return true;
  } catch (e) {
    console.error("Erro Fatal updateGlobalSettings:", e);
    return false;
  }
}

export async function getRemoteUsers() {
  const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false });
  return data || [];
}

export async function saveUser(user: User) {
  try {
    const payload: any = {
      id: user.id,
      pin: user.pin.toUpperCase().trim(),
      role: user.role || 'user',
      subscriptionTier: user.subscriptionTier || 'monthly',
      expiryDate: user.expiryDate || null,
      maxScreens: user.maxScreens || 1,
      activeDevices: user.activeDevices || [],
      isBlocked: !!user.isBlocked,
      isAdultEnabled: !!user.isAdultEnabled,
      isGamesEnabled: !!user.isGamesEnabled,
      resellerId: user.resellerId || null,
      activatedAt: user.activatedAt || null,
      individualMessage: (user.individualMessage || "").trim(),
      gamePoints: user.gamePoints || 0,
      isSearchingMatch: !!user.isSearchingMatch,
      searchingMatchAt: user.searchingMatchAt || null
    };

    const { error } = await supabase.from('users').upsert(payload);
    if (error) {
      console.error("Erro Supabase SaveUser:", error);
      return false;
    }
    return true;
  } catch (e) {
    console.error("Erro Fatal SaveUser:", e);
    return false;
  }
}

export async function validateDeviceLogin(pin: string, deviceId: string) {
  if (pin === 'adm77x2p') return { user: { id: 'master', pin: 'adm77x2p', role: 'admin', isAdultEnabled: true, isGamesEnabled: true, gamePoints: 9999 } };
  const { data: user } = await supabase.from('users').select('*').eq('pin', pin.trim().toUpperCase()).maybeSingle();
  if (!user) return { error: "PIN NÃO LOCALIZADO" };
  if (user.isBlocked) return { error: "SINAL BLOQUEADO PELO MESTRE" };
  if (user.expiryDate && new Date(user.expiryDate) < new Date()) return { error: "SINAL EXPIRADO. RENOVE AGORA!" };
  return { user };
}

export async function validateResellerLogin(username: string, pass: string) {
  const { data: res } = await supabase.from('resellers').select('*').eq('username', username.trim()).eq('password', pass.trim()).maybeSingle();
  if (!res || res.isBlocked) return { error: "ACESSO NEGADO" };
  return { reseller: res };
}

export async function getRemoteResellers() {
  const { data } = await supabase.from('resellers').select('*').order('name', { ascending: true });
  return data || [];
}

export async function saveReseller(res: any) {
  const { error } = await supabase.from('resellers').upsert(res);
  return !error;
}

export async function getCategoryCount(genre: string) {
  const { count } = await supabase.from('content').select('*', { count: 'exact', head: true }).eq('genre', genre.toUpperCase());
  return count || 0;
}

export async function getTotalContentCount() {
  const { count } = await supabase.from('content').select('*', { count: 'exact', head: true });
  return count || 0;
}

export async function generateM3UPlaylist(pin: string) {
  const content = await getRemoteContent(true);
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  let m3u = "#EXTM3U\n";
  content.forEach(i => { if (i.streamUrl) m3u += `#EXTINF:-1 tvg-logo="${i.imageUrl || ''}" group-title="${i.genre.toUpperCase()}",${(i.title || "").toUpperCase()}\n${baseUrl}/live/${pin}/pass/${i.id}.ts\n`; });
  return m3u;
}

export const generateRandomPin = (l = 11) => Math.random().toString(36).substring(2, 2+l).toUpperCase();
export const cleanName = (n: string) => n.toUpperCase().trim();
export const getBeautifulMessage = (pin: string, tier: string, url: string, screens: number) => `*LÉO TV & STREAM* 📺\n\nSeu acesso Master foi liberado!\n\n🔑 *PIN:* ${pin}\n👤 *Telas:* ${screens}\n📅 *Plano:* ${tier.toUpperCase()}\n\n🔗 *Acesse agora:* ${url}\n\n_Bom divertimento!_`;
export const getExpiryMessage = (pin: string, days: number) => `*AVISO LÉO TV* ⚠️\n\nO sinal do seu PIN *${pin}* vence em *${days} dia(s)*.\n\nFale com seu revendedor para renovar e não perder o acesso!`;
