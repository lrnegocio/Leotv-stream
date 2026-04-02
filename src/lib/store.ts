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
  directStreamUrl?: string; // Mantido para compatibilidade, mas unificado
}

export type SubscriptionTier = 'test' | 'monthly' | 'lifetime';

export interface User {
  id: string; 
  pin: string; 
  role: 'admin' | 'user'; 
  subscriptionTier: SubscriptionTier;
  expiryDate?: string; 
  maxScreens: number; 
  activeDevices: any[]; 
  isBlocked: boolean;
  isAdultEnabled: boolean; 
  resellerId?: string; 
  activatedAt?: string;
  individualMessage?: string;
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

export async function getRemoteContent(isIptv = false, searchQuery = "", categoryGenre = ""): Promise<ContentItem[]> {
  try {
    let query = supabase.from('content').select('*');
    if (searchQuery) query = query.ilike('title', `%${searchQuery}%`);
    if (categoryGenre) query = query.eq('genre', categoryGenre.toUpperCase());
    
    const { data } = await query.order('title', { ascending: true });
    
    return (data || []).map(i => ({ 
      ...i, 
      isRestricted: !!i.isRestricted,
      title: (i.title || "").toUpperCase()
    }));
  } catch (e) { 
    return []; 
  }
}

export async function getTopContent(limit = 10): Promise<ContentItem[]> {
  try {
    const { data } = await supabase.from('content').select('*').order('title', { ascending: true }).limit(limit);
    return data || [];
  } catch (e) { return []; }
}

export async function saveContent(item: Partial<ContentItem>) {
  try {
    const id = item.id || "leo_" + Math.random().toString(36).substring(2, 12);
    
    // BLINDAGEM MESTRE: Somente colunas existentes no banco (Sem 'views')
    const payload = {
      id: id,
      title: (item.title || "NOVO SINAL").toUpperCase().trim(),
      genre: (item.genre || "LÉO TV AO VIVO").toUpperCase(),
      type: item.type || 'channel',
      description: item.description || "",
      imageUrl: item.imageUrl || "",
      isRestricted: !!item.isRestricted,
      streamUrl: item.streamUrl || "",
      episodes: (item.type === 'series') ? (item.episodes || []) : null,
      seasons: (item.type === 'multi-season') ? (item.seasons || []) : null
    };

    const { error } = await supabase.from('content').upsert(payload);
    if (error) {
      console.error("Erro Supabase saveContent:", JSON.stringify(error));
      return false;
    }
    return true;
  } catch (e: any) { 
    console.error("Erro fatal saveContent:", e);
    return false; 
  }
}

export async function getContentById(id: string): Promise<ContentItem | null> {
  const { data } = await supabase.from('content').select('*').eq('id', id).maybeSingle();
  return data;
}

export async function removeContent(id: string) {
  const { error } = await supabase.from('content').delete().eq('id', id);
  return !error;
}

export async function bulkRemoveContent(ids: string[]) {
  const { error } = await supabase.from('content').delete().in('id', ids);
  return !error;
}

export async function clearAllM3UContent() {
  try {
    const { data: items } = await supabase.from('content').select('id');
    if (!items || items.length === 0) return true;
    const { error } = await supabase.from('content').delete().in('id', items.map(i => i.id));
    return !error;
  } catch (e) { return false; }
}

export async function processM3UImport(m3u: string, onProgress: (m: string) => void) {
  const lines = m3u.split('\n');
  let count = 0;
  let current: any = {};
  for (const line of lines) {
    if (line.startsWith('#EXTINF:')) {
      const parts = line.split(',');
      current = { title: parts[parts.length - 1]?.trim(), type: 'channel', genre: 'LÉO TV AO VIVO', isRestricted: false };
    } else if (line.startsWith('http')) {
      if (current.title) {
        await saveContent({ ...current, streamUrl: line.trim() });
        count++;
        if (count % 10 === 0) onProgress(`Sintonizando: ${count} sinais...`);
      }
      current = {};
    }
  }
  return { success: count };
}

export async function getGlobalSettings() {
  const { data } = await supabase.from('settings').select('*').eq('key', 'global').maybeSingle();
  return data?.value || { parentalPin: "1234", announcement: "" };
}

export async function updateGlobalSettings(value: any) {
  const { error } = await supabase.from('settings').upsert({ key: 'global', value });
  return !error;
}

export async function getRemoteUsers() {
  const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false });
  return data || [];
}

export async function saveUser(user: User) {
  try {
    const { error } = await supabase.from('users').upsert({
      id: user.id,
      pin: user.pin.toUpperCase().trim(),
      role: user.role,
      subscriptionTier: user.subscriptionTier,
      expiryDate: user.expiryDate,
      maxScreens: user.maxScreens,
      activeDevices: user.activeDevices,
      isBlocked: user.isBlocked,
      isAdultEnabled: user.isAdultEnabled,
      resellerId: user.resellerId,
      activatedAt: user.activatedAt,
      individualMessage: (user.individualMessage || "").trim()
    });
    if (error) return false;
    return true;
  } catch (e: any) {
    return false;
  }
}

export async function removeUser(id: string) {
  const { error } = await supabase.from('users').delete().eq('id', id);
  return !error;
}

export async function validateDeviceLogin(pin: string, deviceId: string) {
  if (pin === 'adm77x2p') return { user: { id: 'master', pin: 'adm77x2p', role: 'admin', isAdultEnabled: true } };
  const { data: user } = await supabase.from('users').select('*').eq('pin', pin.trim().toUpperCase()).maybeSingle();
  if (!user) return { error: "PIN NÃO LOCALIZADO" };
  if (user.isBlocked) return { error: "SINAL BLOQUEADO PELO MESTRE" };
  if (user.expiryDate && new Date(user.expiryDate) < new Date()) return { error: "SINAL EXPIRADO. RENOVE AGORA!" };
  return { user };
}

export async function validateResellerLogin(username: string, pass: string) {
  const { data: reseller } = await supabase.from('resellers').select('*').eq('username', username.trim()).eq('password', pass.trim()).maybeSingle();
  if (!reseller || reseller.isBlocked) return { error: "ACESSO NEGADO" };
  return { reseller };
}

export async function getRemoteResellers() {
  const { data } = await supabase.from('resellers').select('*').order('name', { ascending: true });
  return data || [];
}

export async function saveReseller(reseller: any) {
  const { error } = await supabase.from('resellers').upsert(reseller);
  return !error;
}

export async function removeReseller(id: string) {
  const { error } = await supabase.from('resellers').delete().eq('id', id);
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
  content.forEach(item => {
    if (item.streamUrl) {
      const streamUrl = `${baseUrl}/live/${pin}/pass/${item.id}.ts`;
      m3u += `#EXTINF:-1 tvg-logo="${item.imageUrl || ''}" group-title="${item.genre.toUpperCase()}",${(item.title || "").toUpperCase()}\n${streamUrl}\n`;
    }
  });
  return m3u;
}

export function getBeautifulMessage(pin: string, tier: string, url: string, screens: number) {
  return `🚀 *LÉO TV - ACESSO LIBERADO* 🚀\n\n🔑 *PIN:* ${pin}\n📺 *TELAS:* ${screens}\n🌐 *LINK:* ${url}\n\n*Bom entretenimento!*`;
}

export function getExpiryMessage(pin: string, days: number) {
  return `⚠️ *ALERTA LÉO TV* ⚠️\n\nSeu sinal *${pin}* expira em *${days} dia(s)*!\n\nRenove agora para não ficar sem sintonizar o melhor conteúdo!`;
}

export const generateRandomPin = (l = 11) => Math.random().toString(36).substring(2, 2+l).toUpperCase();
export const cleanName = (n: string) => n.toUpperCase().trim();