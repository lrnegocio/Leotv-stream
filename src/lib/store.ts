
/**
 * MOTOR DE DADOS v385-S - MODO INDEPENDÊNCIA VPS
 * Sistema Autossuficiente - Otimizado para TVACABO e SHORTFLIX.
 */

export type ContentType = 'movie' | 'series' | 'multi-season' | 'channel';
export type SubscriptionTier = 'test' | 'monthly' | 'lifetime';

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
  views?: number;
}

export interface GameItem {
  id: string;
  title: string;
  console: string;
  type: 'embed' | 'direct';
  url: string;
  imageUrl?: string;
}

export interface Reseller {
  id: string;
  name: string;
  username: string;
  password?: string;
  credits: number;
  totalSold: number;
  isBlocked: boolean;
}

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
  isGamesOnly: boolean;
  resellerId?: string | null;
  individualMessage?: string;
}

export interface GameRanking {
  pin: string;
  points: number;
}

export const generateRandomPin = (l = 11) => Array.from({ length: l }, () => Math.floor(Math.random() * 10)).join('');
export const cleanName = (n: string) => n.toUpperCase().trim();

/**
 * SINTONIZADOR MASTER v385-S (BYPASS TOTAL)
 * Suporte: tvacabo.top, shortflix.net, ok.ru, youtube.
 */
export const formatMasterLink = (url: string) => {
  if (!url) return "";
  let finalUrl = url.trim();

  // Bypass OK.RU
  if (finalUrl.toLowerCase().includes('ok.ru/video/')) {
    const vid = finalUrl.split('/video/')[1]?.split(/[?#&/]/)[0];
    if (vid) finalUrl = `https://ok.ru/videoembed/${vid}`;
  }

  // Bypass Proteções e Links Instáveis (M3U8, MP4, TS, VPS Extraction)
  const needsGhostTunnel = [
    'tvacabo.top', 'shortflix.net', 'tokyvideo.com', '.m3u8', '.mp4', '.ts', 
    'redecanais', 'rdcanais', 'vidsrc', 'cdn', 'akamai', 'youtube.com', 'youtu.be'
  ];

  if (needsGhostTunnel.some(t => finalUrl.toLowerCase().includes(t)) && !finalUrl.includes('/api/proxy')) {
    return `/api/proxy?url=${encodeURIComponent(finalUrl)}`;
  }

  return finalUrl;
};

// EXPORTAÇÕES OBRIGATÓRIAS PARA O BUILD
export async function getRemoteContent(showInactive = false, searchQuery = "", categoryGenre = ""): Promise<ContentItem[]> {
  const all = [
    { id: 'c1', title: 'LÉO TV EXCLUSIVO', type: 'channel', genre: 'LÉO TV AO VIVO', description: 'Canal Master Léo', streamUrl: 'https://tvacabo.top/', isRestricted: false, isActive: true },
    { id: 'c2', title: 'SHORTFLIX DRAMAS', type: 'channel', genre: 'LÉO TV DORAMAS', description: 'Novelas Curtas', streamUrl: 'https://www.shortflix.net/pt/home', isRestricted: false, isActive: true }
  ] as ContentItem[];
  if (searchQuery) return all.filter(i => i.title.toLowerCase().includes(searchQuery.toLowerCase()));
  if (categoryGenre) return all.filter(i => i.genre === categoryGenre);
  return all;
}

export async function saveContent(item: Partial<ContentItem>) { return true; }
export async function getContentById(id: string) { 
  const all = await getRemoteContent();
  return all.find(i => i.id === id) || null;
}
export async function removeContent(id: string) { return true; }
export async function bulkRemoveContent(ids: string[]) { return true; }
export async function bulkUpdateContent(ids: string[], updates: any) { return true; }

export async function getRemoteUsers(): Promise<User[]> { 
  return [{ id: 'admin', pin: 'ADM77X2P', role: 'admin', subscriptionTier: 'lifetime', maxScreens: 99, activeDevices: [], isBlocked: false, isAdultEnabled: true, isGamesEnabled: true, isPpvEnabled: true, isAlacarteEnabled: true, isGamesOnly: false }];
}
export async function saveUser(user: Partial<User>) { return true; }
export async function removeUser(id: string) { return true; }
export async function resetUserDevices(userId: string) { return true; }

export async function getRemoteResellers(): Promise<Reseller[]> { return []; }
export async function saveReseller(r: Partial<Reseller>) { return true; }
export async function removeReseller(id: string) { return true; }

export async function validateDeviceLogin(pin: string, deviceId: string) {
  if (pin.toUpperCase().trim() === 'ADM77X2P') return { user: { id: 'admin', pin: 'ADM77X2P', role: 'admin', subscriptionTier: 'lifetime', maxScreens: 99, activeDevices: [deviceId], isBlocked: false, isAdultEnabled: true, isGamesEnabled: true, isPpvEnabled: true, isAlacarteEnabled: true, isGamesOnly: false } as User };
  return { error: "SISTEMA VITALÍCIO" };
}

export async function validateResellerLogin(u: string, p: string) { return { error: "ACESSO RESTRITO" }; }
export async function getGlobalSettings() { return { parentalPin: "1234", announcement: "SISTEMA VITALÍCIO ATIVO v385-S", bannerUrl: "", bannerLink: "" }; }
export async function updateGlobalSettings(v: any) { return true; }
export async function getCategoryCount(g: string) { return 0; }
export async function getTotalContentCount() { return 2; }
export async function getTopContent() { return []; }
export async function getRemoteGames(): Promise<GameItem[]> { return []; }
export async function saveGame(g: any) { return true; }
export async function removeGame(id: string) { return true; }
export async function getGameRankings(): Promise<GameRanking[]> { return []; }

export const getBeautifulMessage = (pin: string, tier: string, url: string, screens: number) => `🎬 *LÉO TV STREAM!* \n👤 *PIN:* \`${pin}\` \n🔗 ${url}`;
export const getExpiryMessage = (pin: string, days: number) => `⚠️ *AVISO LÉO TV!*`;
