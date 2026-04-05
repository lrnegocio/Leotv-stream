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
  emulatorUrl?: string;
  imageUrl?: string;
  created_at?: string;
  genre: string;
}

export interface Reseller {
  id: string;
  name: string;
  username: string;
  password?: string;
  cpf?: string;
  birthDate?: string;
  phone?: string;
  email?: string;
  credits: number;
  totalSold: number;
  isBlocked: boolean;
  created_at?: string;
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

export async function getRemoteContent(isIptv = false, searchQuery = "", categoryGenre = ""): Promise<ContentItem[]> {
  try {
    let query = supabase.from('content').select('*').not('genre', 'ilike', 'ARENA: %');
    
    if (searchQuery) {
      query = query.or(`title.ilike.%${searchQuery}%,genre.ilike.%${searchQuery}%`);
    }
    
    const trimmedGenre = categoryGenre.trim().toUpperCase();
    if (trimmedGenre) query = query.eq('genre', trimmedGenre);
    
    const { data } = await query.order('title', { ascending: true });
    return data || [];
  } catch (e) { return []; }
}

export async function saveContent(item: Partial<ContentItem>) {
  try {
    const id = item.id || "str_" + Math.random().toString(36).substring(2, 12);
    const finalUrl = item.streamUrl || "";
    
    const payload: any = {
      id, 
      title: (item.title || "NOVO CONTEÚDO").toUpperCase().trim(),
      genre: (item.genre || "CANAIS").toUpperCase().trim(),
      type: item.type || 'channel', 
      description: item.description || "Transmissão StreamSight",
      imageUrl: item.imageUrl || "", 
      isRestricted: !!item.isRestricted,
      streamUrl: finalUrl,
      episodes: (item.type === 'series') ? (item.episodes || []) : null,
      seasons: (item.type === 'multi-season') ? (item.seasons || []) : null
    };
    
    const { error } = await supabase.from('content').upsert(payload);
    return !error;
  } catch (e) { return false; }
}

export async function getCategoryCount(genre: string) {
  try {
    const trimmedGenre = genre.trim().toUpperCase();
    const { count } = await supabase.from('content').select('*', { count: 'exact', head: true }).eq('genre', trimmedGenre);
    return count || 0;
  } catch (e) { return 0; }
}

export async function validateResellerLogin(username: string, password: string) {
  try {
    const { data, error } = await supabase
      .from('resellers')
      .select('*')
      .eq('username', username.trim())
      .eq('password', password.trim())
      .maybeSingle();
    
    if (error || !data) return { error: "USUÁRIO OU SENHA INVÁLIDOS" };
    if (data.isBlocked) return { error: "REVENDA BLOQUEADA" };
    return { reseller: data };
  } catch (e) { return { error: "ERRO DE REDE" }; }
}

export async function getRemoteResellers(): Promise<Reseller[]> {
  try {
    const { data } = await supabase.from('resellers').select('*').order('name', { ascending: true });
    return data || [];
  } catch (e) { return []; }
}

export async function saveReseller(reseller: Partial<Reseller>) {
  try {
    const { error } = await supabase.from('resellers').upsert(reseller);
    return !error;
  } catch (e) { return false; }
}

export async function removeReseller(id: string) {
  try {
    const { error } = await supabase.from('resellers').delete().eq('id', id);
    return !error;
  } catch (e) { return false; }
}

export async function getTopContent(limit = 10): Promise<ContentItem[]> {
  try {
    const { data } = await supabase
      .from('content')
      .select('*')
      .not('genre', 'ilike', 'ARENA: %')
      .order('id', { ascending: false }) 
      .limit(limit);
    return data || [];
  } catch (e) { return []; }
}

export async function getTotalContentCount(): Promise<number> {
  try {
    const { count } = await supabase.from('content').select('*', { count: 'exact', head: true }).not('genre', 'ilike', 'ARENA: %');
    return count || 0;
  } catch (e) { return 0; }
}

export async function getContentById(id: string): Promise<ContentItem | null> {
  try {
    const { data } = await supabase.from('content').select('*').eq('id', id).maybeSingle();
    return data;
  } catch (e) { return null; }
}

export async function removeUser(id: string) {
  try {
    const { error } = await supabase.from('users').delete().eq('id', id);
    return !error;
  } catch (e) { return false; }
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

export async function getRemoteGames(): Promise<GameItem[]> {
  try {
    const { data } = await supabase
      .from('content')
      .select('*')
      .ilike('genre', 'ARENA: %')
      .order('title', { ascending: true });
    
    return (data || []).map(item => ({
      id: item.id,
      title: item.title,
      console: item.genre.replace('ARENA: ', ''),
      type: item.description?.includes('GAME_TYPE:embed') ? 'embed' : 'direct',
      url: item.streamUrl || "",
      emulatorUrl: item.streamUrl || "",
      imageUrl: item.imageUrl,
      genre: item.genre
    }));
  } catch (e) { return []; }
}

export async function saveGame(game: Partial<GameItem>) {
  try {
    const id = game.id || "game_" + Math.random().toString(36).substring(2, 12);
    const url = game.url || "";
    const payload = {
      id,
      title: (game.title || "NOVO JOGO").toUpperCase().trim(),
      type: 'channel', 
      genre: `ARENA: ${game.console || 'OUTROS'}`,
      streamUrl: url,
      description: `GAME_TYPE:${game.type || 'embed'}`,
      imageUrl: game.imageUrl || "",
      isRestricted: true 
    };
    const { error } = await supabase.from('content').upsert(payload);
    return !error;
  } catch (e) { return false; }
}

export async function removeGame(id: string) {
  return removeContent(id);
}

export async function getRemoteUsers() {
  try {
    const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false });
    return data || [];
  } catch (e) { return []; }
}

export async function saveUser(user: User) {
  try {
    const { error } = await supabase.from('users').upsert(user);
    return !error;
  } catch (e) { return false; }
}

export async function validateDeviceLogin(pin: string, deviceId: string) {
  try {
    const cleanPin = pin?.trim().toUpperCase();
    if (!cleanPin) return { error: "PIN INVÁLIDO" };
    if (cleanPin === 'ADM77X2P') return { user: { id: 'master', pin: 'ADM77X2P', role: 'admin', isAdultEnabled: true, isGamesEnabled: true, maxScreens: 999 } };
    
    let query = supabase.from('users').select('*').eq('pin', cleanPin);
    const { data: users } = await query;
    const user = users?.[0];
    
    if (!user) return { error: "PIN INVÁLIDO" };
    if (user.isBlocked) return { error: "ACESSO BLOQUEADO" };
    
    const now = new Date();
    if (user.expiryDate && new Date(user.expiryDate) < now) return { error: "ACESSO EXPIRADO" };
    
    return { user };
  } catch (e) { return { error: "ERRO DE REDE" }; }
}

export async function getGlobalSettings() {
  try {
    const { data } = await supabase.from('settings').select('*').eq('key', 'global').maybeSingle();
    return {
      parentalPin: data?.value?.parentalPin || "1234",
      announcement: data?.value?.announcement || ""
    };
  } catch (e) { return { parentalPin: "1234", announcement: "" }; }
}

export async function updateGlobalSettings(value: any) {
  try {
    const payload = { key: 'global', value: { parentalPin: String(value.parentalPin), announcement: String(value.announcement) } };
    const { error } = await supabase.from('settings').upsert(payload);
    return !error;
  } catch (e) { return false; }
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
    const { data } = await supabase.from('users').select('*').eq('isSearchingMatch', true).order('searchingMatchAt', { ascending: false });
    return data || [];
  } catch (e) { return []; }
}

export async function getGameRankings(): Promise<GameRanking[]> {
  try {
    const { data } = await supabase.from('users').select('pin, gamePoints').gt('gamePoints', 0).order('gamePoints', { ascending: false }).limit(50);
    return (data || []).map(u => ({ pin: u.pin, points: u.gamePoints || 0 }));
  } catch (e) { return []; }
}

export const generateRandomPin = (l = 11) => Array.from({ length: l }, () => Math.floor(Math.random() * 10)).join('');

export const cleanName = (name: string) => name.replace(/[^\w\s]/gi, '').toUpperCase().trim();

export const getBeautifulMessage = (pin: string, tier: string, url: string, screens: number) => {
  return `*STREAMSIGHT - ACESSO LIBERADO* 📺\n\n` +
         `🔑 *CÓDIGO PIN:* ${pin}\n` +
         `📅 *PLANO:* ${tier.toUpperCase()}\n` +
         `📱 *LIMITE DE TELAS:* ${screens}\n\n` +
         `🌐 *ASSISTA AQUI:* ${url}\n\n` +
         `🍿 *Instale o Web App para uma experiência nativa em seu aparelho!*`;
};

export const getExpiryMessage = (pin: string, days: number) => {
  return `*STREAMSIGHT - AVISO DE RENOVAÇÃO* ⚠️\n\n` +
         `Olá! Seu acesso (PIN: ${pin}) vence em *${days} dia(s)*.\n\n` +
         `Renove agora para manter sua programação ativa sem interrupções! 🍿`;
};