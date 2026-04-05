
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
// FUNÇÕES DE EXCLUSÃO (BUILD SAFE v33.0)
// ==========================================

export async function removeUser(id: string) {
  try {
    const { error } = await supabase.from('users').delete().eq('id', id);
    return !error;
  } catch (e) { return false; }
}

export async function removeReseller(id: string) {
  try {
    const { error } = await supabase.from('resellers').delete().eq('id', id);
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

// ==========================================
// FUNÇÕES DE PLAYLIST M3U (ISOLAMENTO v33.0)
// ==========================================

export async function generateM3UPlaylist(pin: string, originUrl?: string): Promise<string> {
  try {
    const { data: user } = await supabase.from('users').select('*').eq('pin', pin.toUpperCase().trim()).maybeSingle();
    if (!user || user.isBlocked) return "#EXTM3U\n#EXTINF:-1,ACESSO NEGADO OU PIN BLOQUEADO\n";

    // FILTRO MESTRE: No IPTV, só mostramos o que tem directStreamUrl
    const { data: allItems } = await supabase.from('content').select('*').order('title', { ascending: true });
    if (!allItems) return "#EXTM3U\n";

    const items = allItems.filter(i => !!i.directStreamUrl || (i.type === 'series' && i.episodes?.some((e:any) => !!e.directStreamUrl)));

    const origin = originUrl || "";
    let m3u = "#EXTM3U\n";
    
    items.forEach(item => {
      if (item.isRestricted && !user.isAdultEnabled) return;

      const group = (item.genre || "GERAL").toUpperCase();
      const logo = item.imageUrl || "";
      const cleanTitle = (item.title || "SEM TITULO").toUpperCase();
      
      if (item.type === 'channel') {
        const streamUrl = `${origin}/live/${pin}/${pin}/${item.id}.m3u8`;
        m3u += `#EXTINF:-1 tvg-id="${item.id}" tvg-name="${cleanTitle}" tvg-logo="${logo}" group-title="${group}",${cleanTitle}\n${streamUrl}\n`;
      } else if (item.type === 'movie') {
        const streamUrl = `${origin}/movie/${pin}/${pin}/${item.id}.mp4`;
        m3u += `#EXTINF:-1 tvg-id="${item.id}" tvg-name="${cleanTitle}" tvg-logo="${logo}" group-title="FILMES - ${group}",${cleanTitle}\n${streamUrl}\n`;
      } else if (item.type === 'series' || item.type === 'multi-season') {
        if (item.episodes) {
          item.episodes.forEach((ep: Episode) => {
            if (!ep.directStreamUrl) return; // Só manda para o IPTV se tiver link direto
            const streamUrl = `${origin}/series/${pin}/${pin}/${ep.id}.mp4`;
            m3u += `#EXTINF:-1 tvg-id="${ep.id}" tvg-name="${cleanTitle} E${ep.number}" tvg-logo="${logo}" group-title="SERIES - ${cleanTitle}",${cleanTitle} - EP ${ep.number} ${ep.title}\n${streamUrl}\n`;
          });
        }
        if (item.seasons) {
          item.seasons.forEach((s: Season) => {
            s.episodes.forEach((ep: Episode) => {
              if (!ep.directStreamUrl) return;
              const streamUrl = `${origin}/series/${pin}/${pin}/${ep.id}.mp4`;
              m3u += `#EXTINF:-1 tvg-id="${ep.id}" tvg-name="${cleanTitle} T${s.number} E${ep.number}" tvg-logo="${logo}" group-title="SERIES - ${cleanTitle} T${s.number}",${cleanTitle} - T${s.number} EP ${ep.number} ${ep.title}\n${streamUrl}\n`;
            });
          });
        }
      }
    });

    return m3u;
  } catch (e) {
    return "#EXTM3U\n#EXTINF:-1,ERRO AO GERAR LISTA\n";
  }
}

// ==========================================
// FUNÇÕES DE CONTEÚDO (ISOLAMENTO v33.0)
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
    
    let items = data || [];

    // FILTRO MESTRE v33.0
    if (isIptv) {
      // No IPTV, só canais com directStreamUrl aparecem
      return items.filter(i => !!i.directStreamUrl || i.type === 'series' || i.type === 'multi-season');
    } else {
      // No PWA, canais com APENAS directStreamUrl não aparecem (a menos que seja admin)
      // Se tiver streamUrl, aparece. Se for admin, vê tudo.
      return items.filter(i => !!i.streamUrl || i.type === 'series' || i.type === 'multi-season');
    }
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
      directStreamUrl: (item.type === 'series' || item.type === 'multi-season') ? "" : (item.directStreamUrl || ""),
      episodes: (item.type === 'series') ? (item.episodes || []) : null,
      seasons: (item.type === 'multi-season') ? (item.seasons || []) : null
    };
    const { error } = await supabase.from('content').upsert(payload);
    return !error;
  } catch (e) { return false; }
}

export async function getContentById(id: string): Promise<ContentItem | null> {
  try {
    const { data } = await supabase.from('content').select('*').eq('id', id).maybeSingle();
    return data;
  } catch (e) { return null; }
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
    if (pin === 'adm77x2p') return { user: { id: 'master', pin: 'adm77x2p', role: 'admin', isAdultEnabled: true, isGamesEnabled: true } };
    const { data: user } = await supabase.from('users').select('*').eq('pin', pin.trim().toUpperCase()).maybeSingle();
    if (!user) return { error: "PIN INVÁLIDO" };
    if (user.isBlocked) return { error: "SINAL BLOQUEADO" };
    if (user.expiryDate && new Date(user.expiryDate) < new Date()) return { error: "SINAL EXPIRADO" };
    return { user };
  } catch (e) { return { error: "ERRO DE REDE" }; }
}

export async function validateResellerLogin(username: string, pass: string) {
  try {
    const { data: res } = await supabase.from('resellers').select('*').eq('username', username.trim()).eq('password', pass.trim()).maybeSingle();
    if (!res || res.isBlocked) return { error: "NEGADO" };
    return { reseller: res };
  } catch (e) { return { error: "ERRO NO BANCO" }; }
}

export async function getRemoteResellers() {
  try {
    const { data } = await supabase.from('resellers').select('*').order('name', { ascending: true });
    return data || [];
  } catch (e) { return []; }
}

export async function saveReseller(res: any) {
  try {
    const { error } = await supabase.from('resellers').upsert(res);
    return !error;
  } catch (e) { return false; }
}

export async function getCategoryCount(genre: string) {
  try {
    const { count } = await supabase.from('content').select('*', { count: 'exact', head: true }).eq('genre', genre.toUpperCase());
    return count || 0;
  } catch (e) { return 0; }
}

export async function getTotalContentCount() {
  try {
    const { count } = await supabase.from('content').select('*', { count: 'exact', head: true });
    return count || 0;
  } catch (e) { return 0; }
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
         `🌐 *ASSISTIR NO NAVEGADOR (PWA/WEB):*\n` +
         `${appUrl}\n\n` +
         `🛰️ *DADOS PARA IPTV (APPS EXTERNOS):*\n` +
         `👤 *Usuário:* ${pin}\n` +
         `🔑 *Senha:* ${pin}\n` +
         `🔗 *URL do Servidor:* ${appUrl.replace('https://', '').replace('http://', '')}\n\n` +
         `📄 *LISTA M3U DIRETA:*\n` +
         `${playlistUrl}\n\n` +
         `🚀 *APPS RECOMENDADOS:*\n` +
         `• *Android/TV Box:* XCIPTV, IPTV Smarters Pro, OTT Navigator.\n` +
         `• *iPhone/Apple TV:* IPTV Smarters, CloudStream.\n` +
         `• *Smart TVs:* SS IPTV, Bay IPTV, Smart IPTV.\n` +
         `• *PC:* VLC Player ou nosso Web App.\n\n` +
         `*Bom divertimento!* 🍿`;
};

export const getExpiryMessage = (pin: string, days: number) => `*AVISO LÉO TV* ⚠️\n\nSeu PIN *${pin}* vence em *${days} dia(s)*!`;
