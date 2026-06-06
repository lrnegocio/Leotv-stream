
/**
 * MOTOR DE DADOS v385-S - MODO INDEPENDÊNCIA VPS
 * Sistema Autossuficiente - Otimizado para Hardware (Sky/Vivensis) e Streams.
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
 * SINTONIZADOR MASTER v385-S (EXTRAÇÃO E BYPASS)
 * Proteção Master: sky, encoder, vivensis, tvacabo.top, shortflix.net.
 */
export const formatMasterLink = (url: string) => {
  if (!url) return "";
  let finalUrl = url.trim();

  // Tratamento de hardware encoder (Sky/Vivensis) ou IPs locais
  // Se o link for um IP de casa ou porta de encoder, mandamos pro Túnel Ghost da VPS
  if (
    finalUrl.startsWith('http://') && 
    (finalUrl.includes(':80') || finalUrl.includes(':8080') || finalUrl.includes('192.168') || finalUrl.includes('177.'))
  ) {
    return `/api/proxy?url=${encodeURIComponent(finalUrl)}`;
  }

  const needsGhostTunnel = [
    'tvacabo.top', 'shortflix.net', 'redecanais', 'rdcanais', 
    'vidsrc', 'ok.ru', 'vivensis', 'sky', 'encoder', 'youtube', 'dailymotion'
  ];

  if (needsGhostTunnel.some(t => finalUrl.toLowerCase().includes(t)) && !finalUrl.includes('/api/proxy')) {
    return `/api/proxy?url=${encodeURIComponent(finalUrl)}`;
  }

  return finalUrl;
};

// MOTOR DE DADOS INDEPENDENTE (MEMÓRIA/ESTÁTICO) - SEM BANCO EXTERNO
export async function getRemoteContent(showInactive = false, searchQuery = "", categoryGenre = ""): Promise<ContentItem[]> {
  const all = [
    { id: 'c1', title: 'SINAL SKY MASTER (ENCODER)', type: 'channel', genre: 'LÉO TV AO VIVO', description: 'Canal via Hardware Encoder', streamUrl: 'https://tvacabo.top/', isRestricted: false, isActive: true },
    { id: 'c2', title: 'SHORTFLIX DRAMAS', type: 'channel', genre: 'LÉO TV DORAMAS', description: 'Novelas Curtas Master', streamUrl: 'https://www.shortflix.net/pt/home', isRestricted: false, isActive: true }
  ] as ContentItem[];
  
  let filtered = all;
  if (searchQuery) filtered = filtered.filter(i => i.title.toLowerCase().includes(searchQuery.toLowerCase()));
  if (categoryGenre) filtered = filtered.filter(i => i.genre === categoryGenre);
  if (!showInactive) filtered = filtered.filter(i => i.isActive !== false);
  
  return filtered;
}

export async function saveContent(item: Partial<ContentItem>) { console.log("Simulando Save Content", item); return true; }
export async function getContentById(id: string) { 
  const all = await getRemoteContent(true);
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
  const cleanPin = pin.toUpperCase().trim();
  if (cleanPin === 'ADM77X2P') return { user: { id: 'admin', pin: 'ADM77X2P', role: 'admin', subscriptionTier: 'lifetime', maxScreens: 99, activeDevices: [deviceId], isBlocked: false, isAdultEnabled: true, isGamesEnabled: true, isPpvEnabled: true, isAlacarteEnabled: true, isGamesOnly: false } as User };
  return { error: "SISTEMA VITALÍCIO - USE PIN MASTER" };
}

export async function validateResellerLogin(u: string, p: string) { return { error: "ACESSO RESTRITO AO MESTRE" }; }
export async function getGlobalSettings() { return { parentalPin: "1234", announcement: "SISTEMA VITALÍCIO ATIVO v385-S", bannerUrl: "", bannerLink: "" }; }
export async function updateGlobalSettings(v: any) { return true; }
export async function getCategoryCount(g: string) { return 0; }
export async function getTotalContentCount() { return 2; }
export async function getTopContent(limit = 10): Promise<ContentItem[]> { return []; }

export async function getRemoteGames(): Promise<GameItem[]> { return []; }
export async function saveGame(g: any) { return true; }
export async function removeGame(id: string) { return true; }
export async function getGameRankings(): Promise<GameRanking[]> { return []; }

export const getBeautifulMessage = (pin: string, tier: string, url: string, screens: number) => `🎬 *LÉO TV STREAM!* \n👤 *PIN MASTER:* \`${pin}\` \n🔗 ${url}`;
export const getExpiryMessage = (pin: string, days: number) => `⚠️ *AVISO LÉO TV!*`;
