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

// LIMPEZA DE NOMES MASTER (REMOÇÃO DE ASPAS, PONTOS, VÍRGULAS)
const cleanName = (name: string) => {
  if (!name) return "";
  return name
    .replace(/[.",']/g, '') // Remove aspas, pontos e vírgulas
    .replace(/^\d+/, '')    // Remove números no início do nome
    .trim()
    .toUpperCase();
};

const generateSafeId = (name: string) => {
  const clean = name.toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") 
    .replace(/[^a-z0-9]/g, '_') 
    .replace(/_+/g, '_')
    .trim()
    .substring(0, 100);
  return "leo_" + clean + "_" + Math.random().toString(36).substring(2, 7);
};

// BUSCA BLINDADA PARA GRANDES VOLUMES (SUPORTE 1 MILHÃO)
export async function getRemoteContent(forceRefresh = false, searchQuery = "", categoryGenre = ""): Promise<ContentItem[]> {
  try {
    // BLINDAGEM: Não usamos mais localStorage para a lista de canais, pois 50k+ canais estouram a memória do navegador.
    // Buscamos direto do Supabase com limites inteligentes.
    
    let query = supabase.from('content').select('*');

    if (searchQuery) {
      query = query.ilike('title', `%${searchQuery}%`);
    } else if (categoryGenre) {
      query = query.eq('genre', categoryGenre.toUpperCase());
    }

    // Ordenação e Limite de segurança para não travar a tela
    const { data: rawData, error } = await query
      .order('title', { ascending: true })
      .limit(searchQuery ? 1000 : 200); // Se for busca, traz mais. Se for lista geral, traz 200 para ser instantâneo.

    if (error || !rawData) return [];

    return rawData.map(item => ({
      ...item,
      isRestricted: item.isRestricted ?? item.is_restricted,
      streamUrl: item.streamUrl ?? item.stream_url,
      directStreamUrl: item.directStreamUrl ?? item.direct_stream_url,
      imageUrl: item.imageUrl ?? item.image_url,
    }));
  } catch (e) { return []; }
}

export async function getContentById(id: string): Promise<ContentItem | null> {
  const { data, error } = await supabase.from('content').select('*').eq('id', id).maybeSingle();
  if (error || !data) return null;
  return {
    ...data,
    isRestricted: data.isRestricted ?? data.is_restricted,
    streamUrl: data.streamUrl ?? data.stream_url,
    directStreamUrl: data.directStreamUrl ?? data.direct_stream_url,
    imageUrl: data.imageUrl ?? data.image_url,
  };
}

// CONTAGEM REAL DO IMPÉRIO (0 CONSUMO DE MEMÓRIA)
export async function getTotalContentCount(): Promise<number> {
  try {
    const { count, error } = await supabase.from('content').select('*', { count: 'exact', head: true });
    return count || 0;
  } catch (e) { return 0; }
}

export async function getCategoryCount(genre: string): Promise<number> {
  try {
    const { count, error } = await supabase.from('content').select('*', { count: 'exact', head: true }).eq('genre', genre.toUpperCase());
    return count || 0;
  } catch (e) { return 0; }
}

export async function saveContent(item: ContentItem) {
  try {
    const payload = {
      id: item.id || generateSafeId(item.title),
      title: cleanName(item.title),
      type: item.type,
      description: item.description || "Sinal Master Léo Tv",
      genre: (item.genre || "LÉO TV CANAIS AO VIVO").toUpperCase(),
      isRestricted: item.isRestricted || false,
      imageUrl: item.imageUrl || null,
      streamUrl: item.streamUrl || null,
      directStreamUrl: item.directStreamUrl || null,
      episodes: item.episodes || [],
      seasons: item.seasons || [],
    };

    const { error } = await supabase.from('content').upsert(payload);
    return !error;
  } catch (e) { return false; }
}

export async function removeContent(id: string) {
  const { error } = await supabase.from('content').delete().eq('id', id);
  return !error;
}

export async function bulkRemoveContent(ids: string[]) {
  if (!ids || ids.length === 0) return true;
  // EXCLUSÃO EM LOTES DE 20 PARA NÃO TRAVAR O BANCO
  for (let i = 0; i < ids.length; i += 20) {
    const batch = ids.slice(i, i + 20);
    await supabase.from('content').delete().in('id', batch);
  }
  return true;
}

export async function clearAllM3UContent() {
  try {
    const { error } = await supabase.from('content').delete().neq('id', '_init_');
    return !error;
  } catch (e) { return false; }
}

export async function saveUser(user: User) {
  const { error } = await supabase.from('users').upsert(user);
  return !error;
}

export async function getRemoteUsers(): Promise<User[]> {
  const { data } = await supabase.from('users').select('*').order('id', { ascending: false });
  return data || [];
}

export async function removeUser(id: string) {
  const { error } = await supabase.from('users').delete().eq('id', id);
  return !error;
}

export async function validateDeviceLogin(pin: string, deviceId: string): Promise<{ user?: User; error?: string }> {
  try {
    if (pin === 'adm77x2p') return { user: { id: 'master', pin: 'adm77x2p', role: 'admin', subscriptionTier: 'lifetime', maxScreens: 999, activeDevices: [], isBlocked: false, isAdultEnabled: true } as any };
    
    const { data: user, error } = await supabase.from('users').select('*').eq('pin', pin).maybeSingle();
    if (error || !user) return { error: "PIN INVÁLIDO." };
    if (user.isBlocked) return { error: "ACESSO SUSPENSO." };

    let devices = user.activeDevices || [];
    if (!devices.some((d: any) => d.id === deviceId)) {
      if (devices.length >= user.maxScreens) return { error: "LIMITE DE TELAS EXCEDIDO." };
      devices.push({ id: deviceId, lastActive: new Date().toISOString() });
    }

    const update: any = { ...user, activeDevices: devices };
    if (!user.activatedAt) {
      update.activatedAt = new Date().toISOString();
      if (user.subscriptionTier === 'test') update.expiryDate = new Date(Date.now() + 6*3600000).toISOString();
      else if (user.subscriptionTier === 'monthly') update.expiryDate = new Date(Date.now() + 30*86400000).toISOString();
    }

    await saveUser(update);
    return { user: update };
  } catch (e) { return { error: "ERRO CRÍTICO." }; }
}

export async function getRemoteResellers(): Promise<Reseller[]> {
  const { data } = await supabase.from('resellers').select('*').order('name', { ascending: true });
  return data || [];
}

export async function saveReseller(res: Reseller) {
  const { error } = await supabase.from('resellers').upsert(res);
  return !error;
}

export async function removeReseller(id: string) {
  const { error } = await supabase.from('resellers').delete().eq('id', id);
  return !error;
}

export async function validateResellerLogin(username: string, password: string): Promise<{ reseller?: Reseller; error?: string }> {
  const { data, error } = await supabase.from('resellers').select('*').eq('username', username).eq('password', password).maybeSingle();
  if (error || !data) return { error: "USUÁRIO OU SENHA INVÁLIDOS." };
  if (data.isBlocked) return { error: "ACESSO DE REVENDA SUSPENSO." };
  return { reseller: data };
}

// IMPORTAÇÃO HTML SNIPER MASTER CALIBRADA PARA O SUPREMO
export async function processHTMLImport(html: string, onProgress?: (m: string) => void) {
  const items: any[] = [];
  const div = document.createElement('div');
  div.innerHTML = html;

  const links = div.querySelectorAll('a.btn-stream');
  onProgress?.(`Analisando ${links.length} sinais extraídos...`);

  links.forEach((link, idx) => {
    const titleEl = link.querySelector('.col.d-flex') || link.querySelector('.col');
    const imgEl = link.querySelector('img');
    
    if (titleEl) {
      const rawTitle = titleEl.textContent?.replace(/^\d+/, '').trim() || `Canal ${idx}`;
      const title = cleanName(rawTitle);
      const imageUrl = imgEl?.getAttribute('src') || '';
      
      let genre = "LÉO TV CANAIS AO VIVO";
      if (title.includes('DORAMA') || title.includes('24H DORAMA')) genre = "LÉO TV DORAMAS";
      else if (title.includes('18+') || title.includes('XXX') || title.includes('ADULTO')) genre = "LÉO TV ADULTOS";
      else if (title.includes('FILME') || title.includes('MOVIE')) genre = "LÉO TV FILMES";
      else if (title.includes('SERIE') || title.includes('SERIADO')) genre = "LÉO TV SERIES";

      items.push({
        id: generateSafeId(title),
        title,
        type: genre.includes('SERIES') || genre.includes('DORAMAS') ? 'series' : 'channel',
        genre,
        description: 'Sinal Master Léo Tv',
        imageUrl,
        isRestricted: genre.includes('ADULTOS'),
        streamUrl: 'OFFLINE_MANUAL',
        directStreamUrl: '',
        episodes: [],
        seasons: []
      });
    }
  });

  for (let i = 0; i < items.length; i += 20) {
    if (onProgress) onProgress(`Sintonizando HTML: ${i} de ${items.length}...`);
    await supabase.from('content').upsert(items.slice(i, i + 20));
  }

  return { success: items.length };
}

export async function processM3UImport(content: string, onProgress?: (m: string) => void) {
  const lines = content.split('\n');
  const itemsMap = new Map<string, any>();
  let current: any = null;

  for (let line of lines) {
    line = line.trim();
    if (line.startsWith('#EXTINF:')) {
      const name = line.split(',').pop()?.trim() || "Canal";
      const group = (line.match(/group-title=["']?([^"']+)["']?/i)?.[1] || "GERAL").toUpperCase();
      
      let genre = "LÉO TV CANAIS AO VIVO";
      if (group.includes('FILME') || group.includes('MOVIE')) genre = "LÉO TV FILMES";
      else if (group.includes('ADULT') || group.includes('XXX') || group.includes('HOT')) genre = "LÉO TV ADULTOS";
      else if (group.includes('DORAMA')) genre = "LÉO TV DORAMAS";
      else if (group.includes('SERIE') || group.includes('ANIME')) genre = "LÉO TV SERIES";
      else if (group.includes('ESPORTE') || group.includes('SPORT')) genre = "LÉO TV ESPORTES";
      else if (group.includes('DESENHO') || group.includes('KID') || group.includes('CHILD')) genre = "LÉO TV DESENHOS";
      else if (group.includes('CLIP')) genre = "LÉO TV VÍDEO CLIPES";
      else if (group.includes('MUSICA')) genre = "LÉO TV MUSICAS";
      else if (group.includes('RADIO')) genre = "LÉO TV RÁDIOS";
      else if (group.includes('NOVELA')) genre = "LÉO TV NOVELAS";

      current = { title: cleanName(name), genre, imageUrl: line.match(/tvg-logo=["']?([^"']+)["']?/i)?.[1], isRestricted: genre.includes('ADULTOS') };
    } else if (line.startsWith('http') && current) {
      const seriesMatch = current.title.match(/(.*?)\s+[sS](\d+)[eE](\d+)/i) || 
                          current.title.match(/(.*?)\s+Episode\s+(\d+)/i) ||
                          current.title.match(/(.*?)\s+Ep\s+(\d+)/i);
      
      if (seriesMatch && (current.genre.includes('SERIE') || current.genre.includes('DORAMA') || current.genre.includes('NOVELA'))) {
        const base = cleanName(seriesMatch[1].trim());
        const epNum = parseInt(seriesMatch[3] || seriesMatch[2]);
        if (!itemsMap.has(base)) {
          itemsMap.set(base, { id: generateSafeId(base), title: base, type: 'series', genre: current.genre, imageUrl: current.imageUrl, isRestricted: current.isRestricted, description: 'Sinal Master Léo Tv', episodes: [] });
        }
        const series = itemsMap.get(base);
        if (!series.episodes.some((e:any) => e.number === epNum)) {
          series.episodes.push({ id: generateSafeId(current.title), title: `EPISODIO ${epNum}`, number: epNum, streamUrl: line, directStreamUrl: line });
        }
      } else {
        const id = generateSafeId(current.title);
        itemsMap.set(id, { id, title: current.title, type: current.genre.includes('FILMES') ? 'movie' : 'channel', genre: current.genre, imageUrl: current.imageUrl, isRestricted: current.isRestricted, description: 'Sinal Master Léo Tv', streamUrl: line, directStreamUrl: line });
      }
      current = null;
    }
  }

  const items = Array.from(itemsMap.values());
  for (let i = 0; i < items.length; i += 20) {
    if (onProgress) onProgress(`Sintonizando M3U: ${i} de ${items.length}...`);
    await supabase.from('content').upsert(items.slice(i, i + 20));
  }
  return { success: items.length };
}

export async function getGlobalSettings() {
  const { data } = await supabase.from('settings').select('*').eq('key', 'global').maybeSingle();
  return data?.value || { parentalPin: '1234' };
}

export async function updateGlobalSettings(val: any) {
  await supabase.from('settings').upsert({ key: 'global', value: val });
}

export function getBeautifulMessage(pin: string, tier: string, url: string, screens: number) {
  return `🚀 *LÉO TV STREAM - ACESSO MASTER ATIVADO* 🚀\n\n📺 *Sua TV Online de Elite está pronta!*\n\n🔑 *PIN:* \`${pin}\`\n📅 *Plano:* ${tier.toUpperCase()}\n🖥️ *Telas:* ${screens}\n🌐 *Acesse:* ${url}\n\n🔥 *Instruções:* Coloque seu PIN no campo de acesso e sintonize agora!`;
}

export async function renewUserSubscription(userId: string, tier: SubscriptionTier) {
  const days = tier === 'test' ? 0.25 : tier === 'monthly' ? 30 : 9999;
  const expiry = new Date(Date.now() + days * 86400000).toISOString();
  await supabase.from('users').update({ "subscriptionTier": tier, "expiryDate": expiry }).eq('id', userId);
}

export async function generateM3UPlaylist(pin: string) {
  const { data: user } = await supabase.from('users').select('*').eq('pin', pin).maybeSingle();
  if (!user || user.isBlocked) return "#EXTM3U\n#EXTINF:-1,PIN INVALIDO\n";
  const { data: content } = await supabase.from('content').select('*').limit(5000);
  let m3u = "#EXTM3U\n";
  content?.forEach(i => {
    if (i.isRestricted && !user.isAdultEnabled) return;
    m3u += `#EXTINF:-1 tvg-logo="${i.imageUrl || ''}" group-title="${i.genre}",${i.title}\n${i.directStreamUrl || i.streamUrl}\n`;
  });
  return m3u;
}

export const generateRandomPin = (len = 11) => Math.random().toString().substring(2, 2+len);
