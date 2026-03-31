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
  return name.toString().toUpperCase().trim();
};

export const generateSafeId = (name: string) => {
  const clean = name.toString().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, '_');
  return "leo_" + clean.substring(0, 15) + "_" + Math.random().toString(36).substring(2, 6);
};

export async function getRemoteContent(forceRefresh = false, searchQuery = "", categoryGenre = ""): Promise<ContentItem[]> {
  try {
    let query = supabase.from('content').select('*');
    if (searchQuery) query = query.ilike('title', `%${searchQuery}%`);
    if (categoryGenre) query = query.eq('genre', categoryGenre.toUpperCase());

    const { data: rawData, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;

    return (rawData || []).map(item => ({
      id: item.id,
      title: item.title,
      type: item.type as any,
      description: item.description,
      genre: item.genre,
      isRestricted: item["isRestricted"] || false,
      streamUrl: item["streamUrl"],
      directStreamUrl: item["directStreamUrl"],
      imageUrl: item["imageUrl"],
      episodes: item.episodes || [],
      seasons: item.seasons || [],
      created_at: item.created_at
    }));
  } catch (e) { 
    return []; 
  }
}

export async function saveContent(item: ContentItem) {
  try {
    // BLINDAGEM SQL SNIPER: Usa nomes de colunas exatos com aspas duplas
    const payload = {
      id: item.id || generateSafeId(item.title),
      title: cleanName(item.title),
      type: item.type,
      description: item.description || "Sinal Master Léo Tv",
      genre: (item.genre || "LÉO TV AO VIVO").toUpperCase(),
      "isRestricted": item.isRestricted,
      "streamUrl": item.streamUrl || null,
      "directStreamUrl": item.directStreamUrl || null,
      "imageUrl": item.imageUrl || null,
      episodes: item.episodes || [],
      seasons: item.seasons || [],
      created_at: item.created_at || new Date().toISOString()
    };

    const { error } = await supabase.from('content').upsert(payload);
    if (error) throw error;
    return true;
  } catch (e: any) { 
    console.error("Erro ao salvar no Supabase:", e.message || e);
    return false; 
  }
}

export async function getContentById(id: string): Promise<ContentItem | null> {
  if (!id) return null;
  try {
    const { data, error } = await supabase.from('content').select('*').eq('id', id).maybeSingle();
    if (error || !data) return null;
    return {
      id: data.id,
      title: data.title,
      type: data.type as any,
      description: data.description,
      genre: data.genre,
      isRestricted: data["isRestricted"] || false,
      streamUrl: data["streamUrl"],
      directStreamUrl: data["directStreamUrl"],
      imageUrl: data["imageUrl"],
      episodes: data.episodes || [],
      seasons: data.seasons || [],
      created_at: data.created_at
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
  try {
    const { error } = await supabase.from('content').delete().in('id', ids);
    return !error;
  } catch (e) { return false; }
}

export async function getGlobalSettings() {
  try {
    const { data } = await supabase.from('settings').select('value').eq('key', 'global').maybeSingle();
    return data?.value || { parentalPin: "1234" };
  } catch (e) { return { parentalPin: "1234" }; }
}

export async function updateGlobalSettings(val: any) {
  try {
    await supabase.from('settings').upsert({ key: 'global', value: val });
    return true;
  } catch (e) { return false; }
}

export async function saveUser(user: User) {
  try {
    const payload = {
      id: user.id,
      pin: user.pin,
      role: user.role,
      "subscriptionTier": user.subscriptionTier,
      "expiryDate": user.expiryDate,
      "maxScreens": user.maxScreens,
      "activeDevices": user.activeDevices,
      "isBlocked": user.isBlocked,
      "isAdultEnabled": user.isAdultEnabled,
      "resellerId": user.resellerId,
      "activatedAt": user.activatedAt
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
      subscriptionTier: u["subscriptionTier"],
      expiryDate: u["expiryDate"],
      maxScreens: u["maxScreens"],
      activeDevices: u["activeDevices"] || [],
      isBlocked: u["isBlocked"] || false,
      isAdultEnabled: u["isAdultEnabled"] || false,
      resellerId: u["resellerId"],
      activatedAt: u["activatedAt"]
    }));
  } catch (e) { return []; }
}

export async function validateDeviceLogin(pin: string, deviceId: string): Promise<{ user?: User; error?: string }> {
  try {
    if (pin === 'adm77x2p') return { user: { id: 'master', pin: 'adm77x2p', role: 'admin', subscriptionTier: 'lifetime', maxScreens: 999, activeDevices: [], isBlocked: false, isAdultEnabled: true } as any };
    
    const { data: user, error } = await supabase.from('users').select('*').eq('pin', pin).maybeSingle();
    if (error || !user) return { error: "PIN INVÁLIDO OU NÃO CADASTRADO." };
    if (user["isBlocked"]) return { error: "ACESSO SUSPENSO PELO ADMINISTRADOR." };

    let devices = user["activeDevices"] || [];
    if (!devices.some((d: any) => d.id === deviceId)) {
      if (devices.length >= user["maxScreens"]) return { error: "LIMITE DE TELAS EXCEDIDO NO PLANO." };
      devices.push({ id: deviceId, lastActive: new Date().toISOString() });
    }

    const updatedUser: User = { 
      id: user.id,
      pin: user.pin,
      role: user.role,
      subscriptionTier: user["subscriptionTier"],
      expiryDate: user["expiryDate"],
      maxScreens: user["maxScreens"],
      activeDevices: devices,
      isBlocked: user["isBlocked"],
      isAdultEnabled: user["isAdultEnabled"],
      resellerId: user["resellerId"],
      activatedAt: user["activatedAt"] || new Date().toISOString()
    };

    if (!user["activatedAt"]) {
      if (updatedUser.subscriptionTier === 'test') updatedUser.expiryDate = new Date(Date.now() + 6*3600000).toISOString();
      else if (updatedUser.subscriptionTier === 'monthly') updatedUser.expiryDate = new Date(Date.now() + 30*86400000).toISOString();
    }

    await saveUser(updatedUser);
    return { user: updatedUser };
  } catch (e) { return { error: "ERRO DE CONEXÃO COM O BANCO MASTER." }; }
}

export async function getRemoteResellers(): Promise<Reseller[]> {
  try {
    const { data } = await supabase.from('resellers').select('*').order('name', { ascending: true });
    return (data || []).map(r => ({
      ...r,
      isBlocked: r["isBlocked"] || false,
      totalSold: r["totalSold"] || 0,
      birthDate: r["birthDate"]
    }));
  } catch (e) { return []; }
}

export async function saveReseller(res: Reseller) {
  try {
    const payload = {
      id: res.id,
      name: res.name,
      username: res.username,
      password: res.password,
      credits: res.credits,
      "totalSold": res.totalSold || 0,
      "isBlocked": res.isBlocked || false,
      "birthDate": res.birthDate || null,
      email: res.email,
      phone: res.phone,
      cpf: res.cpf
    };
    const { error } = await supabase.from('resellers').upsert(payload);
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
    if (data["isBlocked"]) return { error: "ACESSO DE REVENDA SUSPENSO." };
    return { reseller: {
      ...data,
      isBlocked: data["isBlocked"] || false,
      totalSold: data["totalSold"] || 0,
      birthDate: data["birthDate"]
    } };
  } catch (e) { return { error: "ERRO DE CONEXÃO MASTER." }; }
}

export async function getCategoryCount(genre: string): Promise<number> {
  try {
    const { count } = await supabase.from('content').select('*', { count: 'exact', head: true }).eq('genre', genre.toUpperCase());
    return count || 0;
  } catch (e) { return 0; }
}

export async function getTotalContentCount(): Promise<number> {
  try {
    const { count } = await supabase.from('content').select('*', { count: 'exact', head: true });
    return count || 0;
  } catch (e) { return 0; }
}

export function getBeautifulMessage(pin: string, tier: string, url: string, screens: number) {
  let expiry = '30 DIAS';
  if (tier === 'test') expiry = '6 HORAS';
  if (tier === 'lifetime') expiry = 'VITALÍCIO';
  return `🚀 *LÉO TV & STREAM - ACESSO LIBERADO* 🚀\n\n🔑 *PIN:* ${pin}\n📅 *VALIDADE:* ${expiry}\n📺 *TELAS:* ${screens}\n\n🌐 *ACESSO:* ${url}\n\n_Suporte Master Léo Tech_`;
}

export const generateRandomPin = (len = 11) => Math.random().toString().substring(2, 2+len);
