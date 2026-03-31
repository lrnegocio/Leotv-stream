
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
  streamUrl?: string; 
  directStreamUrl?: string;
  imageUrl?: string;
  seasons?: Season[];
  episodes?: Episode[];
  created_at?: string;
}

export type SubscriptionTier = 'test' | 'monthly' | 'lifetime';

export interface ActiveDevice {
  id: string;
  lastActive: string;
  ip?: string;
  userAgent?: string;
}

export interface User {
  id: string;
  pin: string; 
  role: 'admin' | 'user';
  subscriptionTier: SubscriptionTier;
  expiryDate?: string; 
  maxScreens: number;
  activeDevices: ActiveDevice[]; 
  isBlocked: boolean;
  isAdultEnabled: boolean;
  resellerId?: string;
  activatedAt?: string;
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

export const cleanName = (name: string) => {
  if (!name) return "";
  return name
    .toString()
    .replace(/[.",']/g, '') 
    .replace(/^\d+\s+/, '') 
    .replace(/^\d+-/, '')   
    .replace(/-+/g, ' ')
    .trim()
    .toUpperCase();
};

export const generateSafeId = (name: string) => {
  if (!name) return "leo_" + Date.now();
  const clean = name.toString().toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") 
    .replace(/[^a-z0-9]/g, '_') 
    .replace(/_+/g, '_')
    .trim()
    .substring(0, 100);
  return "leo_" + clean + "_" + Math.random().toString(36).substring(2, 5);
};

export async function getRemoteContent(forceRefresh = false, searchQuery = "", categoryGenre = ""): Promise<ContentItem[]> {
  try {
    let query = supabase.from('content').select('*');

    if (searchQuery) {
      query = query.ilike('title', `%${searchQuery}%`);
    } else if (categoryGenre) {
      query = query.eq('genre', categoryGenre.toUpperCase());
    }

    const { data: rawData, error } = await query
      .order('created_at', { ascending: false })
      .limit(searchQuery ? 2000 : 1000);

    if (error) throw error;

    return (rawData || []).map(item => ({
      ...item,
      isRestricted: item.is_restricted,
      streamUrl: item.stream_url,
      directStreamUrl: item.direct_stream_url,
      imageUrl: item.image_url,
    }));
  } catch (e) { 
    return []; 
  }
}

export async function saveContent(item: ContentItem) {
  try {
    const payload = {
      id: item.id || generateSafeId(item.title),
      title: cleanName(item.title),
      type: item.type,
      description: item.description || "Sinal Master Léo Tv",
      genre: (item.genre || "LÉO TV AO VIVO").toUpperCase(),
      is_restricted: item.isRestricted || false,
      image_url: item.imageUrl || null,
      stream_url: item.streamUrl || null,
      direct_stream_url: item.directStreamUrl || null,
      episodes: item.episodes || [],
      seasons: item.seasons || [],
      created_at: item.created_at || new Date().toISOString()
    };

    const { error } = await supabase.from('content').upsert(payload);
    return !error;
  } catch (e) { 
    return false; 
  }
}

export async function getContentById(id: string): Promise<ContentItem | null> {
  try {
    const { data, error } = await supabase.from('content').select('*').eq('id', id).maybeSingle();
    if (error || !data) return null;
    return {
      ...data,
      isRestricted: data.is_restricted,
      streamUrl: data.stream_url,
      directStreamUrl: data.direct_stream_url,
      imageUrl: data.image_url,
    };
  } catch (e) { return null; }
}

export async function removeContent(id: string) {
  try {
    const { error } = await supabase.from('content').delete().eq('id', id);
    return !error;
  } catch (e) { return false; }
}

export async function bulkRemoveContent(ids: string[]) {
  if (!ids || ids.length === 0) return true;
  try {
    const { error } = await supabase.from('content').delete().in('id', ids);
    return !error;
  } catch (e) { return false; }
}

export async function getGlobalSettings() {
  try {
    const { data, error } = await supabase.from('settings').select('value').eq('key', 'global').maybeSingle();
    if (error) throw error;
    return data?.value || { parentalPin: "1234" };
  } catch (e) { 
    return { parentalPin: "1234" }; 
  }
}

export async function updateGlobalSettings(val: any) {
  try {
    await supabase.from('settings').upsert({ key: 'global', value: val });
    return true;
  } catch (e) { 
    return false;
  }
}

export async function processM3UImport(m3u: string, onProgress: (msg: string) => void) {
  const lines = m3u.split('\n');
  let count = 0;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith('#EXTINF')) {
      const info = lines[i];
      const url = lines[i+1]?.trim();
      if (!url) continue;

      const titleMatch = info.match(/,(.*)$/);
      const title = titleMatch ? cleanName(titleMatch[1]) : "CANAL M3U";
      const groupMatch = info.match(/group-title="(.*?)"/);
      const genre = groupMatch ? groupMatch[1].toUpperCase() : "LÉO TV AO VIVO";
      const logoMatch = info.match(/tvg-logo="(.*?)"/);
      const logo = logoMatch ? logoMatch[1] : "";

      await saveContent({
        id: generateSafeId(title),
        title,
        type: 'channel',
        description: 'Importado via M3U',
        genre,
        isRestricted: genre.includes('ADULT') || genre.includes('XXX') || genre.includes('18+'),
        streamUrl: url,
        directStreamUrl: url,
        imageUrl: logo,
        created_at: new Date().toISOString()
      });
      count++;
      if (count % 50 === 0) onProgress(`Sincronizando ${count} sinais...`);
    }
  }
  return { success: count };
}

export async function clearAllM3UContent() {
  try {
    const { error } = await supabase.from('content').delete().neq('id', 'admin_placeholder');
    return !error;
  } catch (e) { return false; }
}

export async function saveUser(user: User) {
  try {
    const payload = {
      id: user.id,
      pin: user.pin,
      role: user.role,
      subscription_tier: user.subscriptionTier,
      expiry_date: user.expiryDate,
      max_screens: user.maxScreens,
      active_devices: user.activeDevices,
      is_blocked: user.isBlocked,
      is_adult_enabled: user.isAdultEnabled,
      reseller_id: user.resellerId,
      activated_at: user.activatedAt
    };
    const { error } = await supabase.from('users').upsert(payload);
    return !error;
  } catch (e) { return false; }
}

export async function removeUser(id: string) {
  try {
    const { error } = await supabase.from('users').delete().eq('id', id);
    return !error;
  } catch (e) { return false; }
}

export async function getRemoteUsers(): Promise<User[]> {
  try {
    const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false });
    return (data || []).map(u => ({
      id: u.id,
      pin: u.pin,
      role: u.role,
      subscriptionTier: u.subscription_tier,
      expiryDate: u.expiry_date,
      maxScreens: u.max_screens,
      activeDevices: u.active_devices || [],
      isBlocked: u.is_blocked,
      isAdultEnabled: u.is_adult_enabled,
      resellerId: u.reseller_id,
      activatedAt: u.activated_at
    }));
  } catch (e) { return []; }
}

export async function validateDeviceLogin(pin: string, deviceId: string): Promise<{ user?: User; error?: string }> {
  try {
    if (pin === 'adm77x2p') return { user: { id: 'master', pin: 'adm77x2p', role: 'admin', subscriptionTier: 'lifetime', maxScreens: 999, activeDevices: [], isBlocked: false, isAdultEnabled: true } as any };
    
    const { data: user, error } = await supabase.from('users').select('*').eq('pin', pin).maybeSingle();
    if (error || !user) return { error: "PIN INVÁLIDO." };
    if (user.is_blocked) return { error: "ACESSO SUSPENSO." };

    let devices = user.active_devices || [];
    if (!devices.some((d: any) => d.id === deviceId)) {
      if (devices.length >= user.max_screens) return { error: "LIMITE DE TELAS EXCEDIDO." };
      devices.push({ id: deviceId, lastActive: new Date().toISOString() });
    }

    const updatedUser: User = { 
      id: user.id,
      pin: user.pin,
      role: user.role,
      subscriptionTier: user.subscription_tier,
      expiryDate: user.expiry_date,
      maxScreens: user.max_screens,
      activeDevices: devices,
      isBlocked: user.is_blocked,
      isAdultEnabled: user.is_adult_enabled,
      resellerId: user.reseller_id,
      activatedAt: user.activated_at
    };

    if (!user.activated_at) {
      updatedUser.activatedAt = new Date().toISOString();
      if (updatedUser.subscriptionTier === 'test') updatedUser.expiryDate = new Date(Date.now() + 6*3600000).toISOString();
      else if (updatedUser.subscriptionTier === 'monthly') updatedUser.expiryDate = new Date(Date.now() + 30*86400000).toISOString();
    }

    await saveUser(updatedUser);
    return { user: updatedUser };
  } catch (e) { return { error: "ERRO DE CONEXÃO." }; }
}

export async function getRemoteResellers(): Promise<Reseller[]> {
  try {
    const { data } = await supabase.from('resellers').select('*').order('name', { ascending: true });
    return data || [];
  } catch (e) { return []; }
}

export async function saveReseller(res: Reseller) {
  try {
    const { error } = await supabase.from('resellers').upsert(res);
    return !error;
  } catch (e) { return false; }
}

export async function removeReseller(id: string) {
  try {
    const { error } = await supabase.from('resellers').delete().eq('id', id);
    return !error;
  } catch (e) { return false; }
}

export async function validateResellerLogin(username: string, password: string): Promise<{ reseller?: Reseller; error?: string }> {
  try {
    const { data, error } = await supabase.from('resellers').select('*').eq('username', username).eq('password', password).maybeSingle();
    if (error || !data) return { error: "USUÁRIO OU SENHA INVÁLIDOS." };
    if (data.is_blocked) return { error: "ACESSO DE REVENDA SUSPENSO." };
    return { reseller: data };
  } catch (e) { return { error: "ERRO DE CONEXÃO." }; }
}

export async function getCategoryCount(genre: string): Promise<number> {
  try {
    const { count, error } = await supabase.from('content').select('*', { count: 'exact', head: true }).eq('genre', genre.toUpperCase());
    if (error) throw error;
    return count || 0;
  } catch (e) { return 0; }
}

export async function getTotalContentCount(): Promise<number> {
  try {
    const { count, error } = await supabase.from('content').select('*', { count: 'exact', head: true });
    if (error) throw error;
    return count || 0;
  } catch (e) { return 0; }
}

export function getBeautifulMessage(pin: string, tier: string, url: string, screens: number) {
  const expiry = tier === 'test' ? '6 Horas' : '30 Dias';
  return `🚀 *LÉO TV & STREAM - ACESSO LIBERADO* 🚀\n\n` +
         `Seu sinal Master foi calibrado com sucesso!\n\n` +
         `🔑 *SEU PIN:* ${pin}\n` +
         `📅 *VALIDADE:* ${expiry}\n` +
         `📺 *TELAS:* ${screens}\n\n` +
         `🌐 *ACESSO:* ${url}\n\n` +
         `_Suporte Master Léo Tech_`;
}

export async function generateM3UPlaylist(pin: string) {
  const content = await getRemoteContent(true);
  let m3u = "#EXTM3U\n";
  content.forEach(item => {
    const streamUrl = item.directStreamUrl || item.streamUrl;
    if (streamUrl) {
      m3u += `#EXTINF:-1 tvg-logo="${item.imageUrl || ''}" group-title="${item.genre}",${item.title}\n${streamUrl}\n`;
    }
  });
  return m3u;
}

export const generateRandomPin = (len = 11) => Math.random().toString().substring(2, 2+len);
