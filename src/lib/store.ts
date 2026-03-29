
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
  blockedAt?: string;
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

let contentCache: ContentItem[] | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 1000 * 60 * 5; 

const URL_SEPARATOR = '|IPTV|';

async function fetchAllRecords(table: string, orderBy: string = 'id'): Promise<any[]> {
  let allData: any[] = [];
  let from = 0;
  const step = 1000;
  let hasMore = true;

  try {
    while (hasMore) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .range(from, from + step - 1)
        .order(orderBy, { ascending: true });

      if (error) throw error;
      if (data && data.length > 0) {
        allData = allData.concat(data);
        from += step;
        if (data.length < step) hasMore = false;
      } else {
        hasMore = false;
      }
    }
    return allData;
  } catch (e) {
    return contentCache || [];
  }
}

export async function getRemoteContent(forceRefresh = false): Promise<ContentItem[]> {
  const now = Date.now();
  if (!forceRefresh && contentCache && (now - lastFetchTime < CACHE_DURATION)) {
    return contentCache;
  }

  const rawData = await fetchAllRecords('content', 'title');
  
  const data = rawData.map(item => {
    if (item.streamUrl && typeof item.streamUrl === 'string' && item.streamUrl.includes(URL_SEPARATOR)) {
      const parts = item.streamUrl.split(URL_SEPARATOR);
      item.streamUrl = parts[0] || "";
      item.directStreamUrl = parts[1] || "";
    } else {
      item.directStreamUrl = item.streamUrl; 
    }
    return item;
  });

  if (data.length > 0) {
    contentCache = data;
    lastFetchTime = now;
  }
  return data || [];
}

export async function getRemoteUsers(): Promise<User[]> {
  return await fetchAllRecords('users', 'id');
}

export async function getRemoteResellers(): Promise<Reseller[]> {
  return await fetchAllRecords('resellers', 'name');
}

export async function saveContent(item: ContentItem) {
  try {
    const cleanStreamUrl = (item.streamUrl || "").trim();
    const cleanDirectUrl = (item.directStreamUrl || "").trim();

    const combinedUrl = cleanDirectUrl 
      ? `${cleanStreamUrl}${URL_SEPARATOR}${cleanDirectUrl}`
      : cleanStreamUrl;

    const payload: any = {
      id: item.id,
      title: item.title,
      type: item.type,
      description: item.description || "",
      genre: (item.genre || "GERAL").toUpperCase(),
      isRestricted: item.isRestricted || false,
      imageUrl: item.imageUrl || null,
      streamUrl: combinedUrl,
      episodes: Array.isArray(item.episodes) ? item.episodes : [],
      seasons: Array.isArray(item.seasons) ? item.seasons : [],
    };

    const { error } = await supabase.from('content').upsert(payload);
    
    if (!error) {
      contentCache = null; 
      return true;
    }
    return false;
  } catch (e) {
    return false;
  }
}

export async function removeContent(id: string) {
  const { error } = await supabase.from('content').delete().eq('id', id);
  contentCache = null;
  return !error;
}

export async function bulkRemoveContent(ids: string[]) {
  if (!ids || ids.length === 0) return true;
  const { error } = await supabase.from('content').delete().in('id', ids);
  contentCache = null;
  return !error;
}

export async function clearAllM3UContent() {
  const { error } = await supabase.from('content').delete().like('id', 'm3u_%');
  contentCache = null;
  return !error;
}

export async function saveUser(user: User) {
  try {
    const { error } = await supabase.from('users').upsert(user);
    return !error;
  } catch (e) {
    return false;
  }
}

export async function removeUser(id: string) {
  const { error } = await supabase.from('users').delete().eq('id', id);
  return !error;
}

export async function saveReseller(reseller: Reseller) {
  const { error } = await supabase.from('resellers').upsert(reseller);
  return !error;
}

export async function removeReseller(id: string) {
  try {
    await supabase.from('users').delete().eq('resellerId', id);
    const { error } = await supabase.from('resellers').delete().eq('id', id);
    return !error;
  } catch (err) {
    return false;
  }
}

export async function validateDeviceLogin(pin: string, deviceId: string): Promise<{ user?: User; error?: string }> {
  try {
    const normalizedPin = pin.trim();
    if (normalizedPin === 'adm77x2p') {
      return { user: { id: 'master-leo', pin: 'adm77x2p', role: 'admin', subscriptionTier: 'lifetime', maxScreens: 999, activeDevices: [{id: deviceId, lastActive: new Date().toISOString()}], isBlocked: false, isAdultEnabled: true } };
    }
    
    const { data: user, error } = await supabase.from('users').select('*').eq('pin', normalizedPin).maybeSingle();
    
    if (error && error.code === '402') return { error: "BANCO DE DADOS SEM COTA. CONTATE O MESTRE LÉO." };
    if (error || !user) return { error: "CÓDIGO INVÁLIDO." };
    if (user.isBlocked) return { error: "ACESSO BLOQUEADO." };

    const now = new Date();
    if (user.expiryDate && new Date(user.expiryDate) < now && user.subscriptionTier !== 'lifetime') {
      return { error: "SINAL EXPIRADO." };
    }

    let devices = Array.isArray(user.activeDevices) ? user.activeDevices : [];
    const isThisDeviceLinked = devices.some((d: any) => d.id === deviceId);

    if (!isThisDeviceLinked && deviceId !== "xtream_api_call" && deviceId !== "pc_smarters_call") {
      if (devices.length >= (user.maxScreens || 1)) {
        return { error: "LIMITE DE TELAS EXCEDIDO." };
      }
      devices.push({ id: deviceId, lastActive: now.toISOString() });
      user.activeDevices = devices;
    } 
    
    if (!user.activatedAt) {
      user.activatedAt = now.toISOString();
      if (user.subscriptionTier === 'test') {
        user.expiryDate = new Date(Date.now() + 6 * 60 * 60 * 1000).toISOString();
      } else if (user.subscriptionTier === 'monthly') {
        user.expiryDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
      }
    }
    
    await saveUser(user);
    return { user };
  } catch (e) {
    return { error: "ERRO DE CONEXÃO MASTER." };
  }
}

export async function validateResellerLogin(username: string, pass: string) {
  try {
    const { data: res, error } = await supabase.from('resellers').select('*').eq('username', username).eq('password', pass).maybeSingle();
    if (error || !res) return { error: "LOGIN INVÁLIDO." };
    if (res.isBlocked) return { error: "REVENDA SUSPENSA." };
    return { reseller: res };
  } catch (e) {
    return { error: "ERRO DE REDE." };
  }
}

export async function generateM3UPlaylist(pin: string): Promise<string> {
  try {
    const normalizedPin = pin.trim();
    const isMaster = normalizedPin === 'adm77x2p';
    
    let user = null;
    if (!isMaster) {
      const { data } = await supabase.from('users').select('*').eq('pin', normalizedPin).maybeSingle();
      user = data;
      if (!user || user.isBlocked) return "#EXTM3U\n#EXTINF:-1,PIN OBRIGATORIO NO LINK LEO TV\n";
    }

    const content = await getRemoteContent();
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : '');

    let m3uLines = ["#EXTM3U"];
    content.forEach(item => {
      if (item.isRestricted && !isMaster && user && !user.isAdultEnabled) return;
      const logo = item.imageUrl || "";
      const cat = (item.genre || "GERAL").toUpperCase();
      const title = item.title.toUpperCase();

      const getProxyUrl = (type: string, id: string, ext: string = 'ts') => {
        return `${baseUrl}/${type}/${normalizedPin}/${normalizedPin}/${id}.${ext}`;
      };

      if (item.type === 'channel') {
        m3uLines.push(`#EXTINF:-1 tvg-logo="${logo}" group-title="${cat}",${title}`);
        m3uLines.push(getProxyUrl('live', item.id));
      } else if (item.type === 'movie') {
        m3uLines.push(`#EXTINF:-1 tvg-logo="${logo}" group-title="${cat}",${title}`);
        m3uLines.push(getProxyUrl('movie', item.id, 'mp4'));
      } else if (item.type === 'series' || item.type === 'multi-season') {
        if (Array.isArray(item.episodes)) {
          item.episodes.forEach((ep: Episode) => {
            m3uLines.push(`#EXTINF:-1 tvg-logo="${logo}" group-title="${title}",${title} EP ${ep.number}`);
            m3uLines.push(getProxyUrl('series', ep.id, 'mp4'));
          });
        }
        if (Array.isArray(item.seasons)) {
          item.seasons.forEach((s: Season) => {
            if (Array.isArray(s.episodes)) {
              s.episodes.forEach(ep => {
                m3uLines.push(`#EXTINF:-1 tvg-logo="${logo}" group-title="${title} T${s.number}",${title} T${s.number} EP ${ep.number}`);
                m3uLines.push(getProxyUrl('series', ep.id, 'mp4'));
              });
            }
          });
        }
      }
    });
    return m3uLines.join('\n');
  } catch (e) {
    return "#EXTM3U\n#EXTINF:-1,ERRO NO SERVIDOR MASTER\n";
  }
}

export async function getGlobalSettings() {
  try {
    const { data } = await supabase.from('settings').select('*').eq('key', 'global').maybeSingle();
    return data?.value || { parentalPin: '1234' };
  } catch (e) {
    return { parentalPin: '1234' };
  }
}

export async function updateGlobalSettings(data: { parentalPin: string }) {
  const { error } = await supabase.from('settings').upsert({ key: 'global', value: data });
  return !error;
}

export const generateRandomPin = (length: number = 11) => {
  const chars = '0123456789';
  let result = '';
  for (let i = 0; i < length; i++) result += chars.charAt(Math.floor(Math.random() * chars.length));
  return result;
};

export const getBeautifulMessage = (pin: string, tier: string, baseUrl: string, screens: number) => {
  if (pin === 'adm77x2p') return "ERRO: O PIN MASTER NÃO PODE SER VENDIDO.";
  
  const prodUrl = baseUrl;
  const playlistUrl = `${prodUrl}/api/playlist?pin=${pin}`;
  const planoText = tier === 'test' ? 'Teste VIP 6H' : tier === 'lifetime' ? 'Vitalício' : 'Mensal 30 Dias';
  
  return `🚀 *LÉO TV STREAM - ACESSO LIBERADO!* 🚀

🔑 *SEU CÓDIGO:* \`${pin}\`
📅 *PLANO:* ${planoText}
🖥️ *LIMITE:* ${screens} tela(s)

---
💻 *PC E CELULAR (APLICATIVO PRÓPRIO):*
Abra o link abaixo e clique em "INSTALAR APP" no menu:
🔗 ${prodUrl}

---
📺 *SMART TV / TV BOX / ROKU (IPTV SMARTERS):*
Use os dados abaixo no seu app de IPTV:
🌐 *SERVIDOR:* ${prodUrl}
👤 *USUÁRIO:* ${pin}
🔑 *SENHA:* ${pin}

---
🔗 *LINK DA LISTA M3U8 (COPIE E COLE):*
${playlistUrl}

⚠️ _Sinal blindado de alta performance. Proibido compartilhar o PIN._`;
}

export async function renewUserSubscription(userId: string, resellerId: string) {
  try {
    const { data: user } = await supabase.from('users').select('*').eq('id', userId).single();
    const { data: reseller } = await supabase.from('resellers').select('*').eq('id', resellerId).single();
    if (!user || !reseller) return { error: "Erro." };
    const cost = user.maxScreens || 1;
    if (reseller.credits < cost) return { error: "Sem créditos." };
    const now = new Date();
    let baseDate = now;
    if (user.expiryDate && new Date(user.expiryDate) > now) baseDate = new Date(user.expiryDate);
    const newExpiry = new Date(baseDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    const updatedUser = { ...user, subscriptionTier: 'monthly', expiryDate: newExpiry.toISOString(), isBlocked: false };
    const updatedReseller = { ...reseller, credits: reseller.credits - cost, totalSold: (reseller.totalSold || 0) + 1 };
    await supabase.from('users').upsert(updatedUser);
    await supabase.from('resellers').upsert(updatedReseller);
    return { success: true, user: updatedUser, reseller: updatedReseller };
  } catch (e) {
    return { error: "FALHA." };
  }
}

export async function processM3UImport(content: string): Promise<{ success: number; failed: number }> {
  const lines = content.split('\n');
  const items: ContentItem[] = [];
  let currentItem: Partial<ContentItem> | null = null;

  // Carrega IDs existentes para evitar duplicatas
  const { data: existingData } = await supabase.from('content').select('id');
  const existingIds = new Set(existingData?.map(i => i.id) || []);

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    if (line.startsWith('#EXTINF:')) {
      const logoMatch = line.match(/tvg-logo=["']?([^"']+)["']?/i);
      const groupMatch = line.match(/group-title=["']?([^"']+)["']?/i);
      const nameParts = line.split(',');
      const name = nameParts[nameParts.length - 1]?.trim() || "Canal Importado";
      
      const genre = (groupMatch ? groupMatch[1] : "GERAL").toUpperCase();
      const nameUpper = name.toUpperCase();

      const isAdult = genre.includes('ADULT') || genre.includes('XXX') || genre.includes('HOT') || nameUpper.includes('XXX') || nameUpper.includes('ADULTO') || nameUpper.includes('EROTICO');
      const isTerror = genre.includes('TERROR') || genre.includes('HORROR') || nameUpper.includes('TERROR') || nameUpper.includes('HORROR');

      // Gera ID baseado no nome para evitar duplicata
      const itemPid = "m3u_" + name.toLowerCase().replace(/[^a-z0-9]/g, '_').substring(0, 50);

      currentItem = {
        id: itemPid,
        title: name,
        type: genre.includes('FILME') || genre.includes('MOVIE') ? 'movie' : 'channel',
        genre: genre,
        imageUrl: logoMatch ? logoMatch[1] : undefined,
        isRestricted: isAdult || isTerror,
        description: `Importado Léo Tv Stream - Grupo: ${genre}`,
        streamUrl: "",
        directStreamUrl: "" 
      };
    } else if (line.startsWith('http') && currentItem) {
      if (!existingIds.has(currentItem.id!)) {
        currentItem.streamUrl = line;
        currentItem.directStreamUrl = line; 
        items.push(currentItem as ContentItem);
      }
      currentItem = null;
    }
  }

  let successCount = 0;
  let failedCount = 0;

  // Processamento em lotes para performance P2P
  for (let i = 0; i < items.length; i += 100) {
    const batch = items.slice(i, i + 100);
    const fixedBatch = batch.map(item => {
      const combinedUrl = item.directStreamUrl 
        ? `${item.streamUrl || ''}${URL_SEPARATOR}${item.directStreamUrl}`
        : (item.streamUrl || "");
      
      return {
        id: item.id,
        title: item.title,
        type: item.type,
        genre: item.genre,
        imageUrl: item.imageUrl || null,
        isRestricted: item.isRestricted,
        description: item.description,
        streamUrl: combinedUrl,
        episodes: [],
        seasons: []
      };
    });

    try {
      const { error } = await supabase.from('content').upsert(fixedBatch);
      if (!error) successCount += fixedBatch.length;
      else failedCount += fixedBatch.length;
    } catch (e) {
      failedCount += batch.length;
    }
  }
  contentCache = null;
  return { success: successCount, failed: failedCount };
}

export async function importPremiumBundle(): Promise<{ success: number }> {
  const { data: existingData } = await supabase.from('content').select('id');
  const existingIds = new Set(existingData?.map(i => i.id) || []);

  const premiumChannels: ContentItem[] = [
    { id: 'leo_globo_sp', title: 'GLOBO SP 4K', type: 'channel', genre: 'TV ABERTA', isRestricted: false, streamUrl: 'https://tvonline0800.com/canal/globo-sp-novo/', imageUrl: 'https://i.postimg.cc/J0swJ7tH/Design-sem-nome-63.png', description: 'Rede Globo São Paulo 4K.' },
    { id: 'leo_sbt', title: 'SBT FHD', type: 'channel', genre: 'TV ABERTA', isRestricted: false, streamUrl: 'https://tvonline0800.com/canal/sbt-online-01/', imageUrl: 'http://contfree.shop:80/images/a3418b3c391884505f6034724cbc2e43.png', description: 'SBT Nacional Full HD.' },
    { id: 'leo_hbo_4k', title: 'HBO 4K', type: 'channel', genre: 'FILMES', isRestricted: false, streamUrl: 'http://contfree.shop:80/207946522/261879000/1698432.ts', imageUrl: 'http://contfree.shop:80/images/20b403598a91b2dd1e361a6746d3861f.png', description: 'HBO 4K Ultra HD.' },
    { id: 'leo_premiere_4k', title: 'PREMIERE CLUB 4K', type: 'channel', genre: 'ESPORTES', isRestricted: false, streamUrl: 'http://contfree.shop:80/207946522/261879000/1698439.ts', imageUrl: 'http://contfree.shop:80/images/2961e2a695b10db70eb306b3e0a41eb0.png', description: 'O melhor do futebol em 4K.' },
    { id: 'leo_combate_4k', title: 'COMBATE 4K', type: 'channel', genre: 'LUTAS', isRestricted: false, streamUrl: 'http://contfree.shop:80/207946522/261879000/1698415.ts', imageUrl: 'http://contfree.shop:80/images/31791acb79e4821c4c203bf95f6404ef.png', description: 'UFC e Boxe em 4K.' },
    { id: 'leo_animal_4k', title: 'ANIMAL PLANET 4K', type: 'channel', genre: 'DOCUMENTARIOS', isRestricted: false, streamUrl: 'http://contfree.shop:80/207946522/261879000/1698407.ts', imageUrl: 'http://contfree.shop:80/images/ac8530c1c4c5959785cc87d79da18310.png', description: 'Vida selvagem em 4K.' },
    { id: 'leo_jovem_pan_4k', title: 'JOVEM PAN NEWS 4K', type: 'channel', genre: 'NOTICIAS', isRestricted: false, streamUrl: 'http://contfree.shop:80/207946522/261879000/1698433.ts', imageUrl: 'http://contfree.shop:80/images/f74354fd9c9ffb12a64d86d760f446b3.png', description: 'Notícias 24h em 4K.' },
    { id: 'leo_cnn_4k', title: 'CNN BRASIL 4K', type: 'channel', genre: 'NOTICIAS', isRestricted: false, streamUrl: 'http://contfree.shop:80/207946522/261879000/1698414.ts', imageUrl: 'http://contfree.shop:80/images/9240c4b4c89f931c2907fb9b0e77b91a.png', description: 'Notícias do Brasil e Mundo 4K.' },
    { id: 'leo_cartoon_4k', title: 'CARTOON NETWORK 4K', type: 'channel', genre: 'INFANTIL', isRestricted: false, streamUrl: 'http://contfree.shop:80/207946522/261879000/1698413.ts', imageUrl: 'http://contfree.shop:80/images/912cedc265ab56388565c18ffa0f0e20.png', description: 'Desenhos 24h em 4K.' },
    { id: 'leo_axn_4k', title: 'AXN 4K', type: 'channel', genre: 'FILMES', isRestricted: false, streamUrl: 'http://contfree.shop:80/207946522/261879000/1698408.ts', imageUrl: 'http://contfree.shop:80/images/bc25b3ce198e1c529633e0035c164c7b.png', description: 'Séries de investigação em 4K.' },
    { id: 'leo_megapix_4k', title: 'MEGAPIX 4K', type: 'channel', genre: 'FILMES', isRestricted: false, streamUrl: 'http://contfree.shop:80/207946522/261879000/1698435.ts', imageUrl: 'http://contfree.shop:80/images/4bd33fbf4a00fd1567758a3edad3802f.png', description: 'Os melhores filmes em 4K.' },
    { id: 'leo_otaku_sign', title: 'OTAKU SIGN TV', type: 'channel', genre: 'ANIMES', isRestricted: false, streamUrl: 'https://www.olhosnatv.com.br/2022/10/otaku-sign-tv.html', imageUrl: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhWzsaBbPTqt4Y65Q5dWlHOkqeTjU7YEbHGOSMzQVUqCxyFC9xHUo-7ZVK6Tzd1Ea_uDuF_cNEd94yD2t3MRv2XG9nHjqZ_OUy8O21z0h2gn83tfI1SMXb7lmYGgPF-NejpcZWOmlBqIT1nszsVfuTmNd5Gwm_AMGob8wIUDWsv7HvLgbNeKnjpzJRbzmc/w385-h184-p-k-no-nu/OTAKU%20SIGN%20TV.webp', description: 'Canal 24h de Animes.' },
    { id: 'leo_retro_cartoon', title: 'RETRO CARTOON', type: 'channel', genre: 'DESENHOS', isRestricted: false, streamUrl: 'https://www.olhosnatv.com.br/2018/05/retro-cartoon-desenhos-classicos.html', imageUrl: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgLbQIJk3tD7MwHLzMY-NlcQm3O1a2qj50PBnRNfgMsNFaPzUkQGVWDQcCg6_V6vg4mCQ31YgfA6ni-FKIIRaBjC8FSxV-IEDiKZTIr93qVZdbfuebt9YibwJSWCNBS40XuXR_SAtDFADfnWEUfqbRloiCe27rg0cyAMQ8QXzXBTAamjn-Yj_qcidM16l0/w385-h184-p-k-no-nu/RETR%C3%94%20CARTOON.webp', description: 'Desenhos clássicos.' },
    { id: 'leo_horror_pluto', title: 'HORROR CHANNEL', type: 'channel', genre: 'TERROR', isRestricted: true, streamUrl: 'https://pluto.tv/br/live-tv/63eb9c5351f5d000085e8d7e', imageUrl: 'https://images.pluto.tv/channels/63eb9c5351f5d000085e8d7e/featuredImage_1774294524670.jpg', description: 'Terror 24h (PIN Obrigatório).' },
  ];

  let added = 0;
  for (const ch of premiumChannels) {
    if (!existingIds.has(ch.id)) {
      await saveContent(ch);
      added++;
    }
  }
  return { success: added };
}

export async function syncLiveSports(): Promise<{ success: number; error?: string }> {
  try {
    const response = await fetch("https://api.reidoscanais.ooo/sports");
    const data = await response.json();

    if (!data.success || !data.data) {
      return { success: 0, error: "Nenhum jogo encontrado na API agora." };
    }

    const { data: existingData } = await supabase.from('content').select('id');
    const existingIds = new Set(existingData?.map(i => i.id) || []);

    const sportsItems: ContentItem[] = data.data.map((evento: any) => {
      const firstEmbed = evento.embeds?.[0]?.embed_url || "";
      const sid = "radar_sport_" + evento.id;
      
      if (existingIds.has(sid)) return null;

      return {
        id: sid,
        title: evento.title.toUpperCase(),
        type: 'channel',
        genre: "FUTEBOL AO VIVO",
        description: `${evento.category} - Início: ${new Date(evento.start_time).toLocaleString()}`,
        imageUrl: evento.poster,
        isRestricted: false,
        streamUrl: `${firstEmbed}${URL_SEPARATOR}${firstEmbed}`, 
      };
    }).filter((i: any) => i !== null);

    if (sportsItems.length > 0) {
      const { error } = await supabase.from('content').upsert(sportsItems);
      if (error) throw error;
    }
    
    contentCache = null;
    return { success: sportsItems.length };
  } catch (err: any) {
    return { success: 0, error: err.message };
  }
}
