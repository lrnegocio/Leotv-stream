
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

export interface GameItem {
  id: string;
  title: string;
  console: string;
  type: 'embed' | 'direct';
  url: string;
  emulatorUrl?: string;
  imageUrl?: string;
  created_at?: string;
  genre: string; // Compatibilidade com VideoPlayer
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
      url: item.streamUrl,
      emulatorUrl: item.directStreamUrl,
      imageUrl: item.imageUrl,
      genre: item.genre
    }));
  } catch (e) { return []; }
}

export async function saveGame(game: Partial<GameItem>) {
  try {
    const id = game.id || "game_" + Math.random().toString(36).substring(2, 12);
    const payload = {
      id,
      title: (game.title || "NOVO JOGO").toUpperCase().trim(),
      type: 'channel', 
      genre: `ARENA: ${game.console || 'OUTROS'}`,
      streamUrl: game.url || "",
      directStreamUrl: game.emulatorUrl || "",
      description: `GAME_TYPE:${game.type || 'embed'}`,
      imageUrl: game.imageUrl || "",
      isRestricted: true 
    };
    const { error } = await supabase.from('content').upsert(payload);
    return !error;
  } catch (e) { return false; }
}

export async function getCategoryCount(genre: string) {
  try {
    const trimmedGenre = genre.trim().toUpperCase();
    const { data } = await supabase.from('content').select('*').eq('genre', trimmedGenre);
    if (!data) return 0;
    // CONTAGEM INTELIGENTE v48: Conta tudo que tem link Soberano
    return data.filter(i => {
      if (i.type === 'channel' || i.type === 'movie') return !!i.streamUrl;
      if (i.type === 'series') return i.episodes?.some((e: any) => !!e.streamUrl) || i.episodes?.length > 0;
      if (i.type === 'multi-season') return i.seasons?.some((s: any) => s.episodes?.some((e: any) => !!e.streamUrl)) || i.seasons?.length > 0;
      return false;
    }).length;
  } catch (e) { return 0; }
}

export async function getRemoteContent(isIptv = false, searchQuery = "", categoryGenre = ""): Promise<ContentItem[]> {
  try {
    let query = supabase.from('content').select('*').not('genre', 'ilike', 'ARENA: %');
    if (searchQuery) query = query.ilike('title', `%${searchQuery}%`);
    
    const trimmedGenre = categoryGenre.trim().toUpperCase();
    if (trimmedGenre) query = query.eq('genre', trimmedGenre);
    
    const { data } = await query.order('title', { ascending: true });
    let items = data || [];

    return items.filter(i => {
      if (isIptv) {
        if (i.type === 'channel' || i.type === 'movie') return !!i.directStreamUrl;
        if (i.type === 'series') return i.episodes?.some((e: any) => !!e.directStreamUrl);
        if (i.type === 'multi-season') return i.seasons?.some((s: any) => s.episodes?.some((e: any) => !!e.directStreamUrl));
      } else {
        if (i.type === 'channel' || i.type === 'movie') return !!i.streamUrl;
        if (i.type === 'series') return i.episodes?.some((e: any) => !!e.streamUrl) || (i.episodes && i.episodes.length > 0);
        if (i.type === 'multi-season') return i.seasons?.some((s: any) => s.episodes?.some((e: any) => !!e.streamUrl)) || (i.seasons && i.seasons.length > 0);
      }
      return false;
    });
  } catch (e) { return []; }
}

export async function saveContent(item: Partial<ContentItem>) {
  try {
    const id = item.id || "leo_" + Math.random().toString(36).substring(2, 12);
    const payload = {
      id, title: (item.title || "NOVO SINAL").toUpperCase().trim(),
      genre: (item.genre || "LÉO TV AO VIVO").toUpperCase().trim(),
      type: item.type || 'channel', description: item.description || "",
      imageUrl: item.imageUrl || "", isRestricted: !!item.isRestricted,
      streamUrl: (item.type === 'series' || item.type === 'multi-season') ? "" : (item.streamUrl || ""),
      directStreamUrl: (item.type === 'series' || item.type === 'multi-season') ? "" : (item.directStreamUrl || ""),
      episodes: (item.type === 'series') ? (item.episodes || []) : null,
      seasons: (item.type === 'multi-season') ? (item.seasons || []) : null
    };
    const { error } = await supabase.from('content').upsert(payload);
    return !error;
  } catch (e) { return false; }
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
    if (cleanPin === 'ADM77X2P') return { user: { id: 'master', pin: 'adm77x2p', role: 'admin', isAdultEnabled: true, isGamesEnabled: true } };
    
    let query = supabase.from('users').select('*');
    if (/^\d+$/.test(cleanPin) && (cleanPin.length === 8 || cleanPin.length === 9)) query = query.ilike('pin', `${cleanPin}%`);
    else query = query.eq('pin', cleanPin);

    const { data: users } = await query;
    const user = users?.[0];
    if (!user) return { error: "PIN INVÁLIDO" };
    if (user.isBlocked) return { error: "SINAL BLOQUEADO" };
    if (user.expiryDate && new Date(user.expiryDate) < new Date()) return { error: "SINAL EXPIRADO" };
    return { user };
  } catch (e) { return { error: "ERRO DE REDE" }; }
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

export const getBeautifulMessage = (pin: string, tier: string, url: string, screens: number) => {
  const appUrl = url;
  const pin8 = pin.substring(0, 8);
  const pin9 = pin.substring(0, 9);
  return `*LÉO TV & STREAM* 📺\n\n` +
         `🔑 *SEU PIN:* ${pin}\n` +
         `📅 *PLANO:* ${tier.toUpperCase()}\n` +
         `🖥️ *TELAS:* ${screens}\n\n` +
         `🌐 *WEB APP (PC/CELULAR):* ${appUrl}\n\n` +
         `🚀 *RP725:* Cód: ${pin8} / User: ${pin9}\n` +
         `🚀 *VUSER:* User: ${pin9} / Senha: ${pin9}\n\n` +
         `🍿 *Bom divertimento!*`;
};
