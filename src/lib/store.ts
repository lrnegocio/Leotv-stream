
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
  resellerId?: string | null; 
  activatedAt?: string | null;
  individualMessage?: string;
  gamePoints?: number;
  created_at?: string;
  reseller_name?: string; 
}

/**
 * FORMATADOR MASTER SOBERANO v374 - VACINA DEFINITIVA YOUTUBE (ERRO 153)
 */
export const formatMasterLink = (url: string) => {
  try {
    if (!url || typeof url !== 'string') return "";
    let finalUrl = url.trim();
    if (finalUrl.includes('/api/proxy?url=')) return finalUrl;
    let lowUrl = finalUrl.toLowerCase();

    // 📺 PROTOCOLO YOUTUBE & SHORTS (EXTERMINA ERRO 153)
    if (lowUrl.includes('youtube.com') || lowUrl.includes('youtu.be')) {
      let videoId = "";
      if (lowUrl.includes('/shorts/')) {
        videoId = finalUrl.split('/shorts/')[1]?.split(/[?#&]/)[0];
      } else if (lowUrl.includes('watch?v=')) {
        videoId = finalUrl.split('v=')[1]?.split(/[&#]/)[0];
      } else if (lowUrl.includes('youtu.be/')) {
        videoId = finalUrl.split('youtu.be/')[1]?.split(/[?#&]/)[0];
      } else if (lowUrl.includes('/embed/')) {
        videoId = finalUrl.split('/embed/')[1]?.split(/[?#&]/)[0];
      }
      
      if (videoId) {
        const origin = typeof window !== 'undefined' ? window.location.origin : 'https://leotv.fun';
        return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&rel=0&showinfo=0&enablejsapi=1&origin=${encodeURIComponent(origin)}`;
      }
    }

    // 🛡️ PROTOCOLO BRAVE BYPASS (RDCANAIS & STREAMRDC)
    if (lowUrl.includes('rdcanais') || lowUrl.includes('streamrdc') || lowUrl.includes('redecanais')) {
      return `/api/proxy?url=${encodeURIComponent(finalUrl)}`;
    }

    // 🔞 PROTOCOLO ADULTO
    if (lowUrl.includes('xvideos.com/video.')) {
      const match = finalUrl.match(/video\.([a-z0-9]+)/i);
      if (match && match[1]) {
        return `/api/proxy?url=${encodeURIComponent(`https://www.xvideos.com/embedframe/${match[1]}`)}`;
      }
    }
    
    if (lowUrl.includes('pornhub.com/view_video.php')) {
      const vId = new URL(finalUrl).searchParams.get('viewkey');
      if (vId) return `https://www.pornhub.com/embed/${vId}`;
    }

    return finalUrl;
  } catch (e) {
    return url || "";
  }
};

export async function getRemoteContent(showInactive = false, searchQuery = "", categoryGenre = ""): Promise<ContentItem[]> {
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
      isActive: item.isActive !== false,
      episodes: Array.isArray(item.episodes) ? item.episodes : [],
      seasons: Array.isArray(item.seasons) ? item.seasons : []
    }));
  } catch (e) { return []; }
}

export async function saveContent(item: Partial<ContentItem>) {
  try {
    const payload: any = { ...item };
    if (!payload.id) payload.id = "cont_" + Date.now() + Math.random().toString(36).substring(7);
    if (payload.title) payload.title = payload.title.toUpperCase().trim();
    if (payload.genre) payload.genre = payload.genre.toUpperCase().trim();
    
    // Tenta salvar respeitando a coluna isActive se existir
    const { error } = await supabase.from('content').upsert(payload);
    if (error && error.message.includes('isActive')) {
      delete payload.isActive;
      const { error: retryError } = await supabase.from('content').upsert(payload);
      return !retryError;
    }
    return !error;
  } catch (e) { return false; }
}

export async function bulkUpdateContent(ids: string[], updates: any) {
  if (!ids || ids.length === 0) return true;
  try {
    const { error } = await supabase.from('content').update(updates).in('id', ids);
    if (error && error.message.includes('isActive')) {
      delete updates.isActive;
      if (Object.keys(updates).length > 0) {
        await supabase.from('content').update(updates).in('id', ids);
      }
    }
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

export async function removeUser(id: string) {
  const { error } = await supabase.from('users').delete().eq('id', id);
  return !error;
}

export async function removeReseller(id: string) {
  const { error } = await supabase.from('resellers').delete().eq('id', id);
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
    isRestricted: true,
    isActive: true 
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

export async function resetUserDevices(userId: string) {
  try {
    const { error } = await supabase.from('users').update({ activeDevices: [] }).eq('id', userId);
    return !error;
  } catch (e) { return false; }
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

export async function validateDeviceLogin(pin: string, deviceId: string) {
  try {
    const cleanPin = pin.toUpperCase().trim();

    if (cleanPin === 'ADM77X2P') {
      return {
        user: {
          id: 'admin_master_leo',
          pin: 'ADM77X2P',
          role: 'admin',
          subscriptionTier: 'lifetime',
          maxScreens: 99,
          activeDevices: [deviceId],
          isBlocked: false,
          isAdultEnabled: true,
          isGamesEnabled: true,
          isPpvEnabled: true,
          isAlacarteEnabled: true
        }
      };
    }

    const { data: user, error } = await supabase.from('users').select('*').eq('pin', cleanPin).maybeSingle();
    if (!user) return { error: "PIN INVÁLIDO" };
    if (user.isBlocked) return { error: "PIN BLOQUEADO" };

    const activeDevices = user.activeDevices || [];
    const isDeviceRegistered = activeDevices.includes(deviceId);

    if (!isDeviceRegistered) {
      if (activeDevices.length >= user.maxScreens) {
        return { error: "LIMITE DE TELAS ATINGIDO" };
      }
      const updatedDevices = [...activeDevices, deviceId];
      await supabase.from('users').update({ activeDevices: updatedDevices }).eq('id', user.id);
      user.activeDevices = updatedDevices;
    }

    return { user };
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

export const generateRandomPin = (l = 11) => Array.from({ length: l }, () => Math.floor(Math.random() * 10)).join('');
export const cleanName = (n: string) => n.toUpperCase().trim();
export async function getGameRankings() { return []; }
export const getBeautifulMessage = (pin: string, tier: string, url: string, screens: number) => `🎬 *LÉO TV STREAM!* \n👤 *PIN:* \`${pin}\` \n📅 *PLANO:* ${tier.toUpperCase()} \n🔗 ${url}`;
export const getExpiryMessage = (pin: string, days: number) => `⚠️ *AVISO LÉO TV!* \n👤 *PIN:* \`${pin}\` \n⏳ Seu acesso expira em ${days} dia(s).`;
