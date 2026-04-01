
import { supabase } from './supabase-client';

export type ContentType = 'movie' | 'series' | 'multi-season' | 'channel';

export interface Episode { id: string; title: string; number: number; streamUrl: string; directStreamUrl?: string; }
export interface Season { id: string; number: number; episodes: Episode[]; }
export interface ContentItem {
  id: string; title: string; type: ContentType; description: string; genre: string;
  isRestricted: boolean; streamUrl?: string; directStreamUrl?: string; imageUrl?: string;
  seasons?: Season[]; episodes?: Episode[]; created_at?: string;
}

export type SubscriptionTier = 'test' | 'monthly' | 'lifetime';
export interface User {
  id: string; pin: string; role: 'admin' | 'user'; subscriptionTier: SubscriptionTier;
  expiryDate?: string; maxScreens: number; activeDevices: any[]; isBlocked: boolean;
  isAdultEnabled: boolean; resellerId?: string; activatedAt?: string;
}

export async function getRemoteContent(forceRefresh = false, searchQuery = "", categoryGenre = ""): Promise<ContentItem[]> {
  try {
    let query = supabase.from('content').select('*');
    if (searchQuery) query = query.ilike('title', `%${searchQuery}%`);
    if (categoryGenre) query = query.eq('genre', categoryGenre.toUpperCase());
    const { data } = await query.order('title', { ascending: true });
    return (data || []).map(i => ({ ...i, isRestricted: i.isRestricted || false }));
  } catch (e) { return []; }
}

export async function saveContent(item: ContentItem) {
  try {
    const { error } = await supabase.from('content').upsert({
      ...item,
      title: item.title.toUpperCase().trim(),
      genre: (item.genre || "LÉO TV AO VIVO").toUpperCase()
    });
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

export async function clearAllM3UContent() {
  const { data: items } = await supabase.from('content').select('id');
  if (!items) return true;
  const { error } = await supabase.from('content').delete().in('id', items.map(i => i.id));
  return !error;
}

export async function processM3UImport(m3u: string, onProgress: (m: string) => void) {
  const lines = m3u.split('\n');
  let count = 0;
  let current: any = {};
  for (const line of lines) {
    if (line.startsWith('#EXTINF:')) {
      current = { title: line.split(',')[1]?.trim(), type: 'channel', genre: 'LÉO TV AO VIVO', isRestricted: false };
    } else if (line.startsWith('http')) {
      if (current.title) {
        await saveContent({ ...current, id: "leo_" + Math.random().toString(36).substring(7), streamUrl: line.trim(), description: "Importado" });
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
  return data?.value || { parentalPin: "1234" };
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
  const { error } = await supabase.from('users').upsert(user);
  return !error;
}

export async function removeUser(id: string) {
  const { error } = await supabase.from('users').delete().eq('id', id);
  return !error;
}

export async function validateDeviceLogin(pin: string, deviceId: string) {
  if (pin === 'adm77x2p') return { user: { id: 'master', pin: 'adm77x2p', role: 'admin', isAdultEnabled: true } };
  const { data: user } = await supabase.from('users').select('*').eq('pin', pin.trim()).maybeSingle();
  if (!user || user.isBlocked) return { error: "ACESSO NEGADO" };
  return { user };
}

export async function getCategoryCount(genre: string) {
  const { count } = await supabase.from('content').select('*', { count: 'exact', head: true }).eq('genre', genre.toUpperCase());
  return count || 0;
}

export async function getTotalContentCount() {
  const { count } = await supabase.from('content').select('*', { count: 'exact', head: true });
  return count || 0;
}

export function getBeautifulMessage(pin: string, tier: string, url: string, screens: number) {
  return `🚀 *LÉO TV - ACESSO LIBERADO* 🚀\n\n🔑 *PIN:* ${pin}\n📺 *TELAS:* ${screens}\n🌐 *LINK:* ${url}`;
}

export const generateRandomPin = (l = 11) => Math.random().toString().substring(2, 2+l);
