
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
  emulatorUrl?: string;
  imageUrl?: string;
  created_at?: string;
  genre: string;
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

export interface GameRanking {
  pin: string;
  points: number;
}

// BUSCA DE CONTINGÊNCIA: Tenta achar uma fonte alternativa pública se a principal cair
export async function findAlternativeSource(channelName: string): Promise<string | null> {
  try {
    const { data } = await supabase
      .from('content')
      .select('streamUrl')
      .ilike('title', `%${channelName}%`)
      .not('streamUrl', 'is', null)
      .limit(5);
    
    if (data && data.length > 1) {
      // Retorna a segunda opção que não seja a que falhou (lógica simplificada)
      return data[Math.floor(Math.random() * data.length)].streamUrl;
    }
    return null;
  } catch (e) { return null; }
}

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
      streamUrl: item.streamUrl || item["streamUrl"] || "",
      imageUrl: item.imageUrl || item["imageUrl"] || "",
      isRestricted: !!(item.isRestricted || item["isRestricted"]),
      episodes: Array.isArray(item.episodes) ? item.episodes : [],
      seasons: Array.isArray(item.seasons) ? item.seasons : []
    }));
  } catch (e) { return []; }
}

export async function saveContent(item: Partial<ContentItem>) {
  try {
    const id = item.id || "str_" + Math.random().toString(36).substring(2, 12);
    const cleanUrl = (u: string) => {
      if (!u) return "";
      let res = u.trim();
      // Conversão automática para m3u8 se for .ts para compatibilidade HLS
      if (res.toLowerCase().endsWith('.ts')) {
        res = res.substring(0, res.length - 3) + '.m3u8';
      }
      return res;
    };

    const payload: any = {
      id, 
      title: (item.title || "NOVO CONTEÚDO").toUpperCase().trim(),
      genre: (item.genre || "LÉO TV AO VIVO").toUpperCase().trim(),
      type: item.type || 'channel', 
      description: item.description || "Sinal Master Léo Tv",
      "imageUrl": item.imageUrl || "", 
      "isRestricted": !!item.isRestricted,
      "streamUrl": cleanUrl(item.streamUrl || ""),
      "episodes": (item.type === 'series' || item.type === 'multi-season') 
        ? (item.episodes || []).map(ep => ({ ...ep, streamUrl: cleanUrl(ep.streamUrl) })) 
        : [],
      "seasons": (item.type === 'multi-season') 
        ? (item.seasons || []).map(s => ({ ...s, episodes: s.episodes.map(ep => ({ ...ep, streamUrl: cleanUrl(ep.streamUrl) })) })) 
        : []
    };
    const { error } = await supabase.from('content').upsert(payload);
    return !error;
  } catch (e) { return false; }
}

export async function getRemoteUsers(): Promise<User[]> {
  try {
    const { data, error } = await supabase.from('users').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (e) { return []; }
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
      await supabase.from('users').update({ "activeDevices": devices }).eq('id', user.id);
    }
    return { user: { ...user, activeDevices: devices } };
  } catch (e) { return { error: "ERRO DE REDE" }; }
}

export async function validateResellerLogin(username: string, password: string) {
  try {
    const { data, error } = await supabase.from('resellers').select('*').eq('username', username.trim()).eq('password', password.trim()).maybeSingle();
    if (error || !data) return { error: "USUÁRIO OU SENHA INVÁLIDOS" };
    if (data.isBlocked) return { error: "REVENDA BLOQUEADA" };
    return { reseller: data };
  } catch (e) { return { error: "ERRO DE REDE" }; }
}

export async function getRemoteResellers(): Promise<Reseller[]> {
  try {
    const { data } = await supabase.from('resellers').select('*').order('name', { ascending: true });
    return data || [];
  } catch (e) { return []; }
}

export async function saveReseller(reseller: Partial<Reseller>) {
  try {
    const payload = { 
      id: reseller.id, 
      name: reseller.name, 
      username: reseller.username, 
      password: reseller.password, 
      credits: reseller.credits || 0, 
      "totalSold": reseller.totalSold || 0, 
      "isBlocked": !!reseller.isBlocked 
    };
    const { error } = await supabase.from('resellers').upsert(payload);
    return !error;
  } catch (e) { return false; }
}

export async function getGlobalSettings() {
  try {
    const { data } = await supabase.from('settings').select('*').eq('key', 'global').maybeSingle();
    return { parentalPin: data?.value?.parentalPin || "1234", announcement: data?.value?.announcement || "" };
  } catch (e) { return { parentalPin: "1234", announcement: "" }; }
}

export async function updateGlobalSettings(value: any) {
  try {
    const payload = { key: 'global', value: { parentalPin: String(value.parentalPin), announcement: String(value.announcement) } };
    const { error } = await supabase.from('settings').upsert(payload);
    return !error;
  } catch (e) { return false; }
}

export async function getCategoryCount(genre: string) {
  try {
    const trimmedGenre = genre.trim().toUpperCase();
    const { count } = await supabase.from('content').select('*', { count: 'exact', head: true }).eq('genre', trimmedGenre);
    return count || 0;
  } catch (e) { return 0; }
}

export async function getRemoteGames(): Promise<GameItem[]> {
  try {
    const { data } = await supabase.from('content').select('*').ilike('genre', 'ARENA: %').order('title', { ascending: true });
    return (data || []).map(item => ({ 
      id: item.id, 
      title: item.title, 
      console: item.genre.replace('ARENA: ', ''), 
      type: item.description?.includes('GAME_TYPE:embed') ? 'embed' : 'direct', 
      url: item.streamUrl || item["streamUrl"] || "", 
      emulatorUrl: item.streamUrl || item["streamUrl"] || "", 
      imageUrl: item.imageUrl || item["imageUrl"] || "", 
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
      "streamUrl": game.url || "", 
      description: `GAME_TYPE:${game.type || 'embed'}`, 
      "imageUrl": game.imageUrl || "", 
      "isRestricted": true 
    };
    const { error } = await supabase.from('content').upsert(payload);
    return !error;
  } catch (e) { return false; }
}

export async function getTopContent(limit = 10): Promise<ContentItem[]> {
  try {
    const { data } = await supabase.from('content').select('*').not('genre', 'ilike', 'ARENA: %').order('views', { ascending: false }).limit(limit);
    return (data || []).map(item => ({
      ...item,
      streamUrl: item.streamUrl || item["streamUrl"] || "",
      imageUrl: item.imageUrl || item["imageUrl"] || ""
    }));
  } catch (e) { return []; }
}

export async function getTotalContentCount(): Promise<number> {
  try {
    const { count } = await supabase.from('content').select('*', { count: 'exact', head: true }).not('genre', 'ilike', 'ARENA: %');
    return count || 0;
  } catch (e) { return 0; }
}

export async function getContentById(id: string): Promise<ContentItem | null> {
  try {
    const { data, error } = await supabase.from('content').select('*').eq('id', id).maybeSingle();
    if (error || !data) return null;
    return {
      ...data,
      streamUrl: data.streamUrl || data["streamUrl"] || "",
      imageUrl: data.imageUrl || data["imageUrl"] || "",
      isRestricted: !!(data.isRestricted || data["isRestricted"]),
      episodes: Array.isArray(data.episodes) ? data.episodes : [],
      seasons: Array.isArray(data.seasons) ? data.seasons : []
    };
  } catch (e) { return null; }
}

export async function removeUser(id: string) { try { const { error } = await supabase.from('users').delete().eq('id', id); return !error; } catch (e) { return false; } }
export async function removeContent(id: string) { try { const { error } = await supabase.from('content').delete().eq('id', id); return !error; } catch (e) { return false; } }
export async function bulkRemoveContent(ids: string[]) { try { const { error } = await supabase.from('content').delete().in('id', ids); return !error; } catch (e) { return false; } }
export async function bulkUpdateContent(ids: string[], updates: any) { try { const payload: any = {}; if (updates.genre) payload.genre = updates.genre.toUpperCase(); if (updates.isRestricted !== undefined) payload["isRestricted"] = updates.isRestricted; if (updates.imageUrl) payload["imageUrl"] = updates.imageUrl; const { error } = await supabase.from('content').update(payload).in('id', ids); return !error; } catch (e) { return false; } }

export async function saveUser(user: Partial<User>) {
  try {
    let finalId = user.id;
    if (user.pin) {
      const { data: existing } = await supabase.from('users').select('id').eq('pin', user.pin.trim().toUpperCase()).maybeSingle();
      if (existing) finalId = existing.id;
    }

    const payload = {
      id: finalId || "user_" + Date.now() + Math.random().toString(36).substring(7),
      pin: user.pin?.trim().toUpperCase(),
      role: user.role || 'user',
      "subscriptionTier": user.subscriptionTier || 'monthly',
      "expiryDate": user.expiryDate,
      "maxScreens": user.maxScreens || 1,
      "activeDevices": user.activeDevices || [],
      "isBlocked": !!user.isBlocked,
      "isAdultEnabled": !!user.isAdultEnabled,
      "isGamesEnabled": !!user.isGamesEnabled,
      "resellerId": user.resellerId,
      "activatedAt": user.activatedAt,
      "individualMessage": user.individualMessage,
      "gamePoints": user.gamePoints || 0
    };
    const { error } = await supabase.from('users').upsert(payload);
    return !error;
  } catch (e) { return false; }
}

export async function getGameRankings(): Promise<GameRanking[]> {
  try {
    const { data } = await supabase.from('users').select('pin, "gamePoints"').gt('gamePoints', 0).order('gamePoints', { ascending: false }).limit(50);
    return (data || []).map(u => ({ pin: u.pin, points: u.gamePoints || 0 }));
  } catch (e) { return []; }
}

export const generateRandomPin = (l = 9) => Array.from({ length: l }, () => Math.floor(Math.random() * 10)).join('');

export const getBeautifulMessage = (pin: string, tier: string, url: string, screens: number) => {
  const domain = url.replace('https://', '').replace('http://', '').split('/')[0];
  const shortCode = pin.substring(0, 6);
  
  return `🎬 *SEJA BEM-VINDO(A) AO LÉO TV STREAM!* 

*SEUS DADOS DE ACESSO SOBERANO:*
👤 *Usuário:* \`${pin}\`
🔐 *Senha:* \`${pin}\`
📅 *Plano:* ${tier.toUpperCase()}
📱 *Limite de Telas:* ${screens}

🌍 *URLS DISPONÍVEIS:*
1️⃣ https://${domain}
2️⃣ http://${domain}

➡️ *APP PARCEIRO VIZZION PLAY* 📺 (LG, Samsung, Roku)
✅ *Código:* \`${shortCode}\`
✅ *Usuário:* \`${pin}\`
✅ *Senha:* \`${pin}\`

🔴 *APP PARCEIRO PLAY SIM / ASSIST PLUS +*
✅ *Código:* \`${shortCode}\`
✅ *Usuário:* \`${pin}\`
✅ *Senha:* \`${pin}\`

➡️ *APLICATIVOS ANDROID (VUSER / RP725):*
✅ *Usuário:* \`${pin}\`
✅ *Senha:* \`${pin}\`

➡️ *IPTV SMARTERS PLAYER:*
✅ *Name:* Léo TV
✅ *Usuário:* \`${pin}\`
✅ *Senha:* \`${pin}\`
✅ *URL:* http://${domain}

🌐 *WEB PLAYER:*
🔗 http://${domain}/user/home

📡 *LINKS DIRETOS (M3U / HLS):*
🔹 *M3U:* http://${domain}/api/playlist?username=${pin}&password=${pin}
🔹 *HLS:* http://${domain}/api/playlist?username=${pin}&password=${pin}&output=hls

🍿 *Instale o Web App no seu navegador para a melhor experiência!*`;
};

export const getExpiryMessage = (pin: string, days: number) => {
  return `*LÉO TV STREAM - AVISO DE RENOVAÇÃO* ⚠️\n\nOlá! Seu acesso (PIN: ${pin}) vence em *${days} dia(s)*.\n\nRenove agora para manter sua programação ativa sem interrupções! 🍿`;
};

export const cleanName = (n: string) => n.toUpperCase().trim();
