
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
  resellerId?: string | null; 
  activatedAt?: string | null;
  individualMessage?: string;
  gamePoints?: number;
  created_at?: string;
}

/**
 * MOTOR DE LINKS MASTER v270 - PROTOCOLO DE TÚNEL SOBERANO (MODO AUTO-PLAY)
 * Inclui suporte para PlayCNVS e extermínio de redirecionamentos.
 */
export const formatMasterLink = (url: string) => {
  if (!url) return "";
  let finalUrl = url.trim();
  const lowUrl = finalUrl.toLowerCase();
  
  // SPOTIFY MASTER CONVERTER v261 (AUTO-LOGIN CAPABLE)
  if (lowUrl.includes('spotify.com')) {
    let cleanUrl = finalUrl.replace(/\/intl-[a-z]{2}\//i, '/');
    cleanUrl = cleanUrl.replace(/([^:]\/)\/+/g, "$1");

    if (cleanUrl.includes('/search/')) {
      const searchTerm = cleanUrl.split('/search/')[1]?.split('?')[0] || "";
      return `https://open.spotify.com/embed/search/${searchTerm}`;
    }
    
    if (!cleanUrl.includes('/embed/')) {
      cleanUrl = cleanUrl.replace('open.spotify.com/', 'open.spotify.com/embed/');
    }
    
    if (!cleanUrl.includes('?')) {
      cleanUrl += '?utm_source=leotv_master&autoplay=1';
    } else {
      cleanUrl += '&autoplay=1';
    }
    
    return cleanUrl;
  }

  // YOUTUBE AUTO-PLAY INJECTOR
  if (lowUrl.includes('youtube.com') || lowUrl.includes('youtu.be') || lowUrl.includes('shorts')) {
    if (!finalUrl.includes('autoplay=1')) {
       finalUrl += (finalUrl.includes('?') ? '&' : '?') + 'autoplay=1&mute=0';
    }
    return finalUrl;
  }

  // DOMÍNIOS DE IFRAME DIRETO (SEM PROXY PARA EVITAR QUEBRA DE SCRIPTS)
  // Adicionado playcnvs.stream para garantir autoplay
  const isIframeSite = 
    lowUrl.includes('rdcanais') || 
    lowUrl.includes('redecanaistv') || 
    lowUrl.includes('tvacabo') || 
    lowUrl.includes('reidoscanais') ||
    lowUrl.includes('playcnvs');

  if (isIframeSite) {
    if (!finalUrl.includes('autoplay=1')) {
       finalUrl += (finalUrl.includes('?') ? '&' : '?') + 'autoplay=1';
    }
    return finalUrl;
  }

  // Links que precisam de Bypass ou Proxy para funcionar na VPS
  const needsProxy = 
    lowUrl.includes('.m3u8') || 
    lowUrl.includes('.ts') || 
    lowUrl.includes('.mp4') ||
    lowUrl.includes('archive.org') || 
    lowUrl.includes('mlstatic.com') || 
    lowUrl.includes('agropesca') ||
    lowUrl.includes('acplay.live') || 
    lowUrl.includes('xn--');

  if (needsProxy) {
    if (finalUrl.includes('/api/proxy')) return finalUrl;
    return `/api/proxy?url=${encodeURIComponent(finalUrl)}`;
  }
  
  return finalUrl;
};

/**
 * CONVERSOR DE LINKS DE GAMES v253 - DESTILADOR DE MOTOR
 */
export const formatGameLink = (input: string) => {
  if (!input) return "";
  let url = input.trim();

  if (url.includes('<iframe') && url.includes('src=')) {
    const srcMatch = url.match(/src=["'](.*?)["']/);
    if (srcMatch && srcMatch[1]) {
      url = srcMatch[1];
    }
  }

  const lowUrl = url.toLowerCase();
  if (lowUrl.includes('retrogames.cc') && !lowUrl.includes('/embed/')) {
      if (url.includes('/psx-games/') || url.includes('/snes-games/') || url.includes('/n64-games/')) {
          url = url.replace('www.retrogames.cc/', 'www.retrogames.cc/embed/');
      }
  }

  return url;
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
      streamUrl: item.streamUrl || "",
      imageUrl: item.imageUrl || "",
      isRestricted: !!item.isRestricted,
      episodes: Array.isArray(item.episodes) ? item.episodes : [],
      seasons: Array.isArray(item.seasons) ? item.seasons : []
    }));
  } catch (e) { return []; }
}

export async function saveContent(item: Partial<ContentItem>) {
  try {
    const finalId = item.id || "str_" + Math.random().toString(36).substring(2, 12);
    const payload: any = {
      id: finalId, 
      title: (item.title || "NOVO CONTEÚDO").toUpperCase().trim(),
      genre: (item.genre || "LÉO TV AO VIVO").toUpperCase().trim(),
      type: item.type || 'channel', 
      description: item.description || "Sinal Master Léo Tv",
      imageUrl: item.imageUrl || "", 
      isRestricted: !!item.isRestricted,
      streamUrl: item.streamUrl || "",
      episodes: (item.type === 'series') ? (item.episodes || []) : [],
      seasons: (item.type === 'multi-season') ? (item.seasons || []) : []
    };
    const { error } = await supabase.from('content').upsert(payload);
    return !error;
  } catch (e) { return false; }
}

export async function getContentById(id: string) {
  const { data } = await supabase.from('content').select('*').eq('id', id).maybeSingle();
  if (data) {
    return {
      ...data,
      episodes: Array.isArray(data.episodes) ? data.episodes : [],
      seasons: Array.isArray(data.seasons) ? data.seasons : []
    };
  }
  return null;
}

export async function validateDeviceLogin(pin: string, deviceId: string) {
  try {
    const cleanPin = pin?.trim().toUpperCase();
    if (!cleanPin) return { error: "PIN INVÁLIDO" };
    if (cleanPin === 'ADM77X2P') return { user: { id: 'master', pin: 'ADM77X2P', role: 'admin', isAdultEnabled: true, isGamesEnabled: true, maxScreens: 999 } };
    const { data: users, error } = await supabase.from('users').select('*').eq('pin', cleanPin);
    const user = users?.[0];
    if (error || !user) return { error: "PIN INVÁLIDO" };
    if (user.isBlocked) return { error: "ACESSO BLOQUEADO" };
    const now = new Date();
    if (user.expiryDate && new Date(user.expiryDate) < now) return { error: "ACESSO EXPIRADO" };
    let devices = user.activeDevices || [];
    if (!devices.includes(deviceId)) {
      if (devices.length >= (user.maxScreens || 1)) devices = [deviceId]; 
      else devices.push(deviceId);
      await supabase.from('users').update({ activeDevices: devices }).eq('id', user.id);
    }
    return { user: { ...user, activeDevices: devices } };
  } catch (e) { return { error: "ERRO DE REDE" }; }
}

export async function saveUser(user: Partial<User>) {
  try {
    let finalId = user.id;
    if (user.pin && !finalId) {
      const { data: existing } = await supabase.from('users').select('id').eq('pin', user.pin.trim().toUpperCase()).maybeSingle();
      if (existing) finalId = existing.id;
    }
    const payload = {
      id: finalId || "user_" + Date.now() + Math.random().toString(36).substring(7),
      pin: user.pin?.trim().toUpperCase(),
      role: user.role || 'user',
      subscriptionTier: user.subscriptionTier || 'monthly',
      expiryDate: user.expiryDate,
      maxScreens: user.maxScreens || 1,
      activeDevices: user.activeDevices || [],
      isBlocked: !!user.isBlocked,
      isAdultEnabled: !!user.isAdultEnabled,
      isGamesEnabled: !!user.isGamesEnabled,
      resellerId: user.resellerId,
      activatedAt: user.activatedAt,
      individualMessage: user.individualMessage,
      gamePoints: user.gamePoints || 0
    };
    const { error } = await supabase.from('users').upsert(payload);
    return !error;
  } catch (e) { return false; }
}

export async function getRemoteUsers(): Promise<User[]> {
  const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false });
  return data || [];
}

export async function removeUser(id: string) {
  const { error } = await supabase.from('users').delete().eq('id', id);
  return !error;
}

export async function getRemoteResellers(): Promise<Reseller[]> {
  const { data } = await supabase.from('resellers').select('*').order('name', { ascending: true });
  return data || [];
}

export async function saveReseller(r: Partial<Reseller>) {
  const { error } = await supabase.from('resellers').upsert(r);
  return !error;
}

export async function removeReseller(id: string) {
  const { error } = await supabase.from('resellers').delete().eq('id', id);
  return !error;
}

export async function validateResellerLogin(u: string, p: string) {
  const { data } = await supabase.from('resellers').select('*').eq('username', u.trim()).eq('password', p.trim()).maybeSingle();
  return data ? { reseller: data } : { error: "INVÁLIDO" };
}

export async function getRemoteGames(): Promise<GameItem[]> {
  const { data } = await supabase.from('content').select('*').ilike('genre', 'ARENA: %');
  return (data || []).map(i => ({ 
    id: i.id, 
    title: i.title, 
    console: i.genre.replace('ARENA: ', ''), 
    type: 'embed', 
    url: i.streamUrl, 
    imageUrl: i.imageUrl, 
    genre: i.genre,
    emulatorUrl: i.description === 'GAME' ? '' : i.description
  }));
}

export async function saveGame(g: any) {
  const cleanUrl = formatGameLink(g.url);
  const { error } = await supabase.from('content').upsert({ 
    id: g.id || "game_"+Date.now(), 
    title: g.title.toUpperCase(), 
    genre: `ARENA: ${g.console}`, 
    streamUrl: cleanUrl, 
    description: g.emulatorUrl || 'GAME', 
    imageUrl: g.imageUrl, 
    isRestricted: true 
  });
  return !error;
}

export async function removeGame(id: string) {
  const { error } = await supabase.from('content').delete().eq('id', id);
  return !error;
}

export async function getGlobalSettings() {
  const { data } = await supabase.from('settings').select('*').eq('key', 'global').maybeSingle();
  return { 
    parentalPin: data?.value?.parentalPin || "1234", 
    announcement: data?.value?.announcement || "",
    bannerUrl: data?.value?.bannerUrl || "",
    bannerLink: data?.value?.bannerLink || ""
  };
}

export async function updateGlobalSettings(v: any) {
  const { error } = await supabase.from('settings').upsert({ key: 'global', value: v });
  return !error;
}

export async function getCategoryCount(g: string) {
  const { count } = await supabase.from('content').select('*', { count: 'exact', head: true }).eq('genre', g.toUpperCase());
  return count || 0;
}

export async function getTopContent(l = 10) {
  const { data } = await supabase.from('content').select('*').not('genre', 'ilike', 'ARENA: %').order('views', { ascending: false }).limit(l);
  return data || [];
}

export async function getTotalContentCount() {
  const { count } = await supabase.from('content').select('*', { count: 'exact', head: true }).not('genre', 'ilike', 'ARENA: %');
  return count || 0;
}

export async function removeContent(id: string) { 
  const { error } = await supabase.from('content').delete().eq('id', id);
  return !error;
}

export async function bulkRemoveContent(ids: string[]) {
  const { error } = await supabase.from('content').delete().in('id', ids);
  return !error;
}

export async function bulkUpdateContent(ids: string[], updates: any) {
  const { error } = await supabase.from('content').update(updates).in('id', ids);
  return !error;
}

export const generateRandomPin = (l = 9) => Array.from({ length: l }, () => Math.floor(Math.random() * 10)).join('');
export const cleanName = (n: string) => n.toUpperCase().trim();
export async function getGameRankings() { return []; }
export const getExpiryMessage = (p: string, d: number) => `⚠️ *AVISO DE VENCIMENTO*\n\nOlá! Seu PIN *${p}* vence em *${d} dias*.\n\nPara não perder o sinal, realize a renovação agora! 📺`;

export const getBeautifulMessage = (pin: string, tier: string, url: string, screens: number) => {
  const domain = url.replace('https://', '').replace('http://', '').split('/')[0];
  const serverUrl = `http://${domain}`;

  return `🎬 *BEM-VINDO(A) AO LÉO TV STREAM!*

🚀 *DADOS DE ACESSO MASTER:*
👤 *Acesso:* \`${pin}\`
📅 *Plano:* ${tier.toUpperCase()}

🌐 *LINK PARA ASSISTIR:*
🔗 ${serverUrl}

🍿 *Divirta-se!*`;
};
