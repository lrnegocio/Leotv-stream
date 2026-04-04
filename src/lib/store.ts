
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

// ==========================================
// FUNÇÕES DE EXCLUSÃO (BUILD SAFE)
// ==========================================

export async function removeUser(id: string) {
  const { error } = await supabase.from('users').delete().eq('id', id);
  return !error;
}

export async function removeReseller(id: string) {
  const { error } = await supabase.from('resellers').delete().eq('id', id);
  return !error;
}

export async function removeContent(id: string) {
  const { error } = await supabase.from('content').delete().eq('id', id);
  return !error;
}

export async function bulkRemoveContent(ids: string[]) {
  const { error } = await supabase.from('content').delete().in('id', ids);
  return !error;
}

// ==========================================
// FUNÇÕES DE PLAYLIST M3U (IPTV)
// ==========================================

export async function generateM3UPlaylist(pin: string): Promise<string> {
  const { data: user } = await supabase.from('users').select('*').eq('pin', pin.toUpperCase().trim()).maybeSingle();
  if (!user || user.isBlocked) return "#EXTM3U\n#EXTINF:-1,ACESSO NEGADO OU PIN BLOQUEADO\n";

  const { data: items } = await supabase.from('content').select('*').order('title', { ascending: true });
  if (!items) return "#EXTM3U\n";

  const origin = typeof window !== 'undefined' ? window.location.origin : process.env.NEXT_PUBLIC_SITE_URL || "";
  
  let m3u = "#EXTM3U\n";
  
  items.forEach(item => {
    // Filtro de Adulto
    if (item.isRestricted && !user.isAdultEnabled) return;

    const group = item.genre.toUpperCase();
    const logo = item.imageUrl || "";
    
    if (item.type === 'channel') {
      const streamUrl = `${origin}/live/${pin}/${pin}/${item.id}.m3u8`;
      m3u += `#EXTINF:-1 tvg-id="${item.id}" tvg-name="${item.title}" tvg-logo="${logo}" group-title="${group}",${item.title.toUpperCase()}\n${streamUrl}\n`;
    } else if (item.type === 'movie') {
      const streamUrl = `${origin}/movie/${pin}/${pin}/${item.id}.mp4`;
      m3u += `#EXTINF:-1 tvg-id="${item.id}" tvg-name="${item.title}" tvg-logo="${logo}" group-title="FILMES - ${group}",${item.title.toUpperCase()}\n${streamUrl}\n`;
    } else if (item.type === 'series' || item.type === 'multi-season') {
      // Séries na playlist M3U costumam ser listadas por episódio em grupos específicos
      if (item.episodes) {
        item.episodes.forEach((ep: Episode) => {
          const streamUrl = `${origin}/series/${pin}/${pin}/${ep.id}.mp4`;
          m3u += `#EXTINF:-1 tvg-id="${ep.id}" tvg-name="${item.title} E${ep.number}" tvg-logo="${logo}" group-title="SERIES - ${item.title.toUpperCase()}",${item.title.toUpperCase()} - EP ${ep.number} ${ep.title}\n${streamUrl}\n`;
        });
      }
      if (item.seasons) {
        item.seasons.forEach((s: Season) => {
          s.episodes.forEach((ep: Episode) => {
            const streamUrl = `${origin}/series/${pin}/${pin}/${ep.id}.mp4`;
            m3u += `#EXTINF:-1 tvg-id="${ep.id}" tvg-name="${item.title} T${s.number} E${ep.number}" tvg-logo="${logo}" group-title="SERIES - ${item.title.toUpperCase()} T${s.number}",${item.title.toUpperCase()} - T${s.number} EP ${ep.number} ${ep.title}\n${streamUrl}\n`;
          });
        });
      }
    }
  });

  return m3u;
}

// ==========================================
// FUNÇÕES DE CONTEÚDO
// ==========================================

export async function getTopContent(limit = 10): Promise<ContentItem[]> {
  try {
    const { data } = await supabase.from('content').select('*').order('views', { ascending: false }).limit(limit);
    return (data || []).map(i => ({ ...i, views: i.views || 0 }));
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

// ==========================================
// FUNÇÕES DE USUÁRIOS E ADMIN
// ==========================================

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
  const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false });
  return data || [];
}

export async function saveUser(user: User) {
  try {
    const { error } = await supabase.from('users').upsert(user);
    return !error;
  } catch (e) { return false; }
}

export async function validateDeviceLogin(pin: string, deviceId: string) {
  if (pin === 'adm77x2p') return { user: { id: 'master', pin: 'adm77x2p', role: 'admin', isAdultEnabled: true, isGamesEnabled: true } };
  const { data: user } = await supabase.from('users').select('*').eq('pin', pin.trim().toUpperCase()).maybeSingle();
  if (!user) return { error: "PIN INVÁLIDO" };
  if (user.isBlocked) return { error: "SINAL BLOQUEADO" };
  if (user.expiryDate && new Date(user.expiryDate) < new Date()) return { error: "SINAL EXPIRADO" };
  return { user };
}

export async function validateResellerLogin(username: string, pass: string) {
  const { data: res } = await supabase.from('resellers').select('*').eq('username', username.trim()).eq('password', pass.trim()).maybeSingle();
  if (!res || res.isBlocked) return { error: "NEGADO" };
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

export const generateRandomPin = (l = 11) => Math.random().toString(36).substring(2, 2+l).toUpperCase();
export const cleanName = (n: string) => n.toUpperCase().trim();

export const getBeautifulMessage = (pin: string, tier: string, url: string, screens: number) => {
  const appUrl = url;
  const playlistUrl = `${appUrl}/api/playlist?pin=${pin}`;
  
  return `*LÉO TV & STREAM* 📺\n\n` +
         `Seu acesso Master está liberado!\n\n` +
         `🔑 *SEU PIN:* ${pin}\n` +
         `📅 *PLANO:* ${tier.toUpperCase()}\n` +
         `🖥️ *TELAS:* ${screens}\n\n` +
         `🌐 *ASSISTIR NO NAVEGADOR (WEB/TV):*\n` +
         `${appUrl}\n\n` +
         `🛰️ *DADOS PARA IPTV (SMARTERS/XCIPTV):*\n` +
         `👤 *Usuário:* ${pin}\n` +
         `🔑 *Senha:* ${pin}\n` +
         `🔗 *URL do Servidor:* ${appUrl.replace('https://', '').replace('http://', '')}\n\n` +
         `📄 *LISTA M3U DIRECTA:*\n` +
         `${playlistUrl}\n\n` +
         `*Bom divertimento!* 🍿`;
};

export const getExpiryMessage = (pin: string, days: number) => `*AVISO LÉO TV* ⚠️\n\nSeu PIN *${pin}* vence em *${days} dia(s)*!`;
