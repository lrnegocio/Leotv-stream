
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

/**
 * REMOÇÃO DE DADOS MASTER
 */
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

/**
 * ARENA GAMES RETRO - GESTÃO DINÂMICA
 */
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
      imageUrl: item.imageUrl
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

export async function removeGame(id: string) {
  return removeContent(id);
}

/**
 * PLAYLIST M3U - EXPORTAÇÃO BLINDADA
 */
export async function generateM3UPlaylist(pin: string, originUrl?: string): Promise<string> {
  try {
    const { data: user } = await supabase.from('users').select('*').eq('pin', pin.toUpperCase().trim()).maybeSingle();
    if (!user || user.isBlocked) return "#EXTM3U\n#EXTINF:-1,ACESSO NEGADO OU PIN BLOQUEADO\n";

    const { data: allItems } = await supabase.from('content').select('*').order('title', { ascending: true });
    const origin = originUrl || "";
    let m3u = "#EXTM3U\n";
    
    if (allItems) {
      allItems.forEach(item => {
        if (item.genre.startsWith('ARENA: ')) return;
        if (item.isRestricted && !user.isAdultEnabled) return;
        
        // NO IPTV: Só exportamos itens que têm o Link Direto (Secundário)
        if (!item.directStreamUrl && item.type !== 'series' && item.type !== 'multi-season') return; 

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
              if (!ep.directStreamUrl) return; 
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

      if (user.isGamesEnabled) {
        allItems.filter(i => i.genre.startsWith('ARENA: ')).forEach(game => {
          const gameUrl = `${origin}/user/home?id=${game.id}`;
          m3u += `#EXTINF:-1 tvg-id="${game.id}" tvg-name="🎮 ${game.title}" tvg-logo="${game.imageUrl || ""}" group-title="ARENA GAMES RETRO",🎮 ${game.title}\n${gameUrl}\n`;
        });
      }
    }

    return m3u;
  } catch (e) {
    return "#EXTM3U\n#EXTINF:-1,ERRO AO GERAR LISTA\n";
  }
}

/**
 * INTELIGÊNCIA DE CONTEÚDO
 */
export async function getTopContent(limit = 10): Promise<ContentItem[]> {
  try {
    const { data } = await supabase.from('content').select('*').not('genre', 'ilike', 'ARENA: %').order('views', { ascending: false }).limit(limit);
    return (data || []).map(i => ({ ...i, views: i.views || 0 }));
  } catch (e) { return []; }
}

export async function getRemoteContent(isIptv = false, searchQuery = "", categoryGenre = ""): Promise<ContentItem[]> {
  try {
    let query = supabase.from('content').select('*').not('genre', 'ilike', 'ARENA: %');
    if (searchQuery) query = query.ilike('title', `%${searchQuery}%`);
    
    const trimmedGenre = categoryGenre.trim().toUpperCase();
    if (trimmedGenre) query = query.eq('genre', trimmedGenre);
    
    const { data } = await query.order('title', { ascending: true });
    let items = data || [];

    // RECALIBRAGEM DE FILTRO v45:
    // PWA (isIptv=false): Mostra apenas o que tem o Link Soberano (Principal)
    // IPTV (isIptv=true): Mostra apenas o que tem o Link Direto (Secundário)
    return items.filter(i => {
      if (isIptv) {
        if (i.type === 'channel' || i.type === 'movie') return !!i.directStreamUrl;
        if (i.type === 'series') return i.episodes?.some((e: any) => !!e.directStreamUrl);
        if (i.type === 'multi-season') return i.seasons?.some((s: any) => s.episodes?.some((e: any) => !!e.directStreamUrl));
      } else {
        if (i.type === 'channel' || i.type === 'movie') return !!i.streamUrl;
        if (i.type === 'series') return i.episodes?.some((e: any) => !!e.streamUrl);
        if (i.type === 'multi-season') return i.seasons?.some((s: any) => s.episodes?.some((e: any) => !!e.streamUrl));
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

export async function getContentById(id: string): Promise<ContentItem | null> {
  try {
    const { data } = await supabase.from('content').select('*').eq('id', id).maybeSingle();
    return data;
  } catch (e) { return null; }
}

/**
 * CONFIGURAÇÕES GLOBAIS
 */
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

/**
 * GESTÃO DE CLIENTES & PINs
 */
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
    if (pin?.toLowerCase() === 'adm77x2p') return { user: { id: 'master', pin: 'adm77x2p', role: 'admin', isAdultEnabled: true, isGamesEnabled: true } };
    const { data: user } = await supabase.from('users').select('*').eq('pin', pin?.trim().toUpperCase()).maybeSingle();
    if (!user) return { error: "PIN INVÁLIDO" };
    if (user.isBlocked) return { error: "SINAL BLOQUEADO" };
    if (user.expiryDate && new Date(user.expiryDate) < new Date()) return { error: "SINAL EXPIRADO" };
    return { user };
  } catch (e) { return { error: "ERRO DE REDE" }; }
}

/**
 * GESTÃO DE REVENDA
 */
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

/**
 * CONTADORES DE CATEGORIA MASTER
 */
export async function getCategoryCount(genre: string) {
  try {
    // CORREÇÃO MESTRE v45: Conta tudo que tem sinal no PWA (inclui séries e filmes)
    const trimmedGenre = genre.trim().toUpperCase();
    const { data } = await supabase.from('content').select('id, streamUrl, type, episodes, seasons').eq('genre', trimmedGenre);
    
    if (!data) return 0;

    return data.filter(i => {
      if (i.type === 'channel' || i.type === 'movie') return !!i.streamUrl;
      if (i.type === 'series') return i.episodes?.some((e: any) => !!e.streamUrl);
      if (i.type === 'multi-season') return i.seasons?.some((s: any) => s.episodes?.some((e: any) => !!e.streamUrl));
      return false;
    }).length;
  } catch (e) { return 0; }
}

export async function getTotalContentCount() {
  try {
    const { count } = await supabase.from('content').select('*', { count: 'exact', head: true }).not('genre', 'ilike', 'ARENA: %');
    return count || 0;
  } catch (e) { return 0; }
}

/**
 * MULTIPLAYER ARENA LOGIC
 */
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
