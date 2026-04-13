
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
      episodes: (item.type === 'series' || item.type === 'multi-season') ? (item.episodes || []) : [],
      seasons: (item.type === 'multi-season') ? (item.seasons || []) : []
    };
    const { error } = await supabase.from('content').upsert(payload);
    return !error;
  } catch (e) { return false; }
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

export const generateRandomPin = (l = 9) => Array.from({ length: l }, () => Math.floor(Math.random() * 10)).join('');

export const getBeautifulMessage = (pin: string, tier: string, url: string, screens: number) => {
  const domain = url.replace('https://', '').replace('http://', '').split('/')[0];
  
  return `🎬 *BEM-VINDO(A) AO LÉO TV STREAM!* 

🚀 *DADOS DE ACESSO MASTER:*
👤 *Usuário:* \`${pin}\`
🔐 *Senha:* \`${pin}\`
📅 *Plano:* ${tier.toUpperCase()}
📱 *Telas:* ${screens}

🌐 *ASSISTA PELO NAVEGADOR (TV/CELULAR):*
🔗 http://${domain}/user/home

➡️ *ANDROID (TV BOX / CELULAR):*
🔹 Baixe o App: *IPTV SMARTERS PRO* ou *XCIPTV*
✅ URL: \`http://${domain}\`
✅ Usuário: \`${pin}\`
✅ Senha: \`${pin}\`

➡️ *SMART TVS (SAMSUNG / LG / ROKU):*
1️⃣ Instale o App: *BAY IPTV* ou *VIZZION PLAY*
2️⃣ Use seu Usuário e Senha acima.

⚠️ *TVs ANTIGAS (STB / SMART UP):*
1️⃣ Vá em Configurações de Rede da sua TV.
2️⃣ Mude o DNS para: \`5.161.46.209\`
3️⃣ Abra o app e use seu PIN como Usuário e Senha.

📡 *LINK DIRETO (M3U):*
🔗 http://${domain}/api/playlist?username=${pin}&password=${pin}

🍿 *Instale o Web App no seu aparelho para a melhor experiência!*`;
};

export async function getRemoteUsers(): Promise<User[]> { try { const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false }); return data || []; } catch (e) { return []; } }
export async function validateResellerLogin(u: string, p: string) { try { const { data } = await supabase.from('resellers').select('*').eq('username', u.trim()).eq('password', p.trim()).maybeSingle(); return data ? { reseller: data } : { error: "INVÁLIDO" }; } catch (e) { return { error: "ERRO" }; } }
export async function getRemoteResellers(): Promise<Reseller[]> { try { const { data } = await supabase.from('resellers').select('*').order('name', { ascending: true }); return data || []; } catch (e) { return []; } }
export async function saveReseller(r: Partial<Reseller>) { try { const { error } = await supabase.from('resellers').upsert(r); return !error; } catch (e) { return false; } }
export async function getGlobalSettings() { try { const { data } = await supabase.from('settings').select('*').eq('key', 'global').maybeSingle(); return { parentalPin: data?.value?.parentalPin || "1234", announcement: data?.value?.announcement || "" }; } catch (e) { return { parentalPin: "1234", announcement: "" }; } }
export async function updateGlobalSettings(v: any) { try { const { error } = await supabase.from('settings').upsert({ key: 'global', value: v }); return !error; } catch (e) { return false; } }
export async function getCategoryCount(g: string) { try { const { count } = await supabase.from('content').select('*', { count: 'exact', head: true }).eq('genre', g.toUpperCase()); return count || 0; } catch (e) { return 0; } }
export async function getRemoteGames(): Promise<GameItem[]> { try { const { data } = await supabase.from('content').select('*').ilike('genre', 'ARENA: %'); return (data || []).map(i => ({ id: i.id, title: i.title, console: i.genre.replace('ARENA: ', ''), type: 'embed', url: i.streamUrl, imageUrl: i.imageUrl, genre: i.genre })); } catch (e) { return []; } }
export async function saveGame(g: any) { try { const { error } = await supabase.from('content').upsert({ id: g.id || "game_"+Date.now(), title: g.title.toUpperCase(), genre: `ARENA: ${g.console}`, streamUrl: g.url, description: 'GAME', imageUrl: g.imageUrl, isRestricted: true }); return !error; } catch (e) { return false; } }
export async function getTopContent(l = 10) { try { const { data } = await supabase.from('content').select('*').not('genre', 'ilike', 'ARENA: %').order('views', { ascending: false }).limit(l); return data || []; } catch (e) { return []; } }
export async function getTotalContentCount() { try { const { count } = await supabase.from('content').select('*', { count: 'exact', head: true }).not('genre', 'ilike', 'ARENA: %'); return count || 0; } catch (e) { return 0; } }
export async function getContentById(id: string) { try { const { data } = await supabase.from('content').select('*').eq('id', id).maybeSingle(); return data; } catch (e) { return null; } }
export async function removeUser(id: string) { await supabase.from('users').delete().eq('id', id); return true; }
export async function removeContent(id: string) { await supabase.from('content').delete().eq('id', id); return true; }
export async function bulkRemoveContent(ids: string[]) { await supabase.from('content').delete().in('id', ids); return true; }
export async function bulkUpdateContent(ids: string[], updates: any) { await supabase.from('content').update(updates).in('id', ids); return true; }
export async function getGameRankings() { return []; }
export const cleanName = (n: string) => n.toUpperCase().trim();
export const getExpiryMessage = (p: string, d: number) => `⚠️ *AVISO DE VENCIMENTO*\n\nOlá! Seu PIN *${p}* vence em *${d} dias*.\n\nPara não perder o sinal, realize a renovação agora! 📺`;
