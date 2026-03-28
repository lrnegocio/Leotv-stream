
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
  const existingItems = await fetchAllRecords('content', 'id');
  const existingIds = new Set(existingItems.map(i => i.id));

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
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
      const itemPid = "m3u_" + name.toLowerCase().replace(/\s+/g, '_').substring(0, 30);

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

  for (let i = 0; i < items.length; i += 100) {
    const batch = items.slice(i, i + 100);
    const fixedBatch = batch.map(item => {
      const combinedUrl = item.directStreamUrl 
        ? `${item.streamUrl || ''}${URL_SEPARATOR}${item.directStreamUrl}`
        : (item.streamUrl || "");
      
      return {
        ...item,
        streamUrl: combinedUrl,
        directStreamUrl: undefined 
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
  // Carrega IDs existentes para evitar duplicatas
  const existingItems = await fetchAllRecords('content', 'id');
  const existingIds = new Set(existingItems.map(i => i.id));

  // CLONAGEM MASTER DAS FONTES ENVIADAS (CXTV + REI DOS CANAIS + OLHOS NA TV + PLUTO)
  const premiumChannels: ContentItem[] = [
    { id: 'leo_cazetv', title: 'CazéTV', type: 'channel', genre: 'ESPORTES', isRestricted: false, streamUrl: 'https://tvonline0800.com/canal/cazetv/', imageUrl: 'https://tvonline0800.com/wp-content/uploads/2024/07/cazetv.webp', description: 'Transmissões ao vivo do Cazé.' },
    { id: 'leo_globo_sp', title: 'Globo SP', type: 'channel', genre: 'TV ABERTA', isRestricted: false, streamUrl: 'https://tvonline0800.com/canal/globo-sp-novo/', imageUrl: 'https://tvonline0800.com/wp-content/uploads/2023/12/Globo-SP.png', description: 'Rede Globo São Paulo.' },
    { id: 'leo_sbt', title: 'SBT', type: 'channel', genre: 'TV ABERTA', isRestricted: false, streamUrl: 'https://tvonline0800.com/canal/sbt-online-01/', imageUrl: 'https://tvonline0800.com/wp-content/uploads/2023/12/SBT.png', description: 'SBT Nacional.' },
    { id: 'leo_record_news', title: 'Record News', type: 'channel', genre: 'NOTÍCIAS', isRestricted: false, streamUrl: 'https://tvonline0800.com/canal/record-news/', imageUrl: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhI84Ty2-c5a0Cy6_37FhJFQ2frSUXAkHfklFclNih8lfgsXw0kZRyjNUOZQg16TjmcBiQOaLmwDlDKemQM6gC9HYCFAf-6xIHdP6IruKL31cAaNI01FcPxQQnxMRi7NYVnTFEkevV45BEGui2ABhxh81-N6vWzsR-rACG8pZDESxJZR1nJMu0fmSNmYvg/w385-h184-p-k-no-nu/RECORD%20NEWS.webp', description: 'Notícias 24h.' },
    { id: 'leo_hbo', title: 'HBO', type: 'channel', genre: 'FILMES', isRestricted: false, streamUrl: 'https://tvonline0800.com/canal/hbo/', imageUrl: 'https://tvonline0800.com/wp-content/uploads/2023/12/HBO.png', description: 'HBO Filmes e Séries.' },
    { id: 'leo_telecine_p', title: 'Telecine Premium', type: 'channel', genre: 'FILMES', isRestricted: false, streamUrl: 'https://tvonline0800.com/canal/telecine-premium-hd/', imageUrl: 'https://tvonline0800.com/wp-content/uploads/2023/12/Telecine-Premium-HD.png', description: 'Os melhores filmes.' },
    { id: 'leo_otaku', title: 'Otaku Sign TV', type: 'channel', genre: 'ANIMES', isRestricted: false, streamUrl: 'https://www.olhosnatv.com.br/2022/10/otaku-sign-tv.html', imageUrl: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhWzsaBbPTqt4Y65Q5dWlHOkqeTjU7YEbHGOSMzQVUqCxyFC9xHUo-7ZVK6Tzd1Ea_uDuF_cNEd94yD2t3MRv2XG9nHjqZ_OUy8O21z0h2gn83tfI1SMXb7lmYGgPF-NejpcZWOmlBqIT1nszsVfuTmNd5Gwm_AMGob8wIUDWsv7HvLgbNeKnjpzJRbzmc/w385-h184-p-k-no-nu/OTAKU%20SIGN%20TV.webp', description: 'Canal 24h de Animes.' },
    { id: 'leo_retro_cartoon', title: 'Retrô Cartoon', type: 'channel', genre: 'DESENHOS', isRestricted: false, streamUrl: 'https://www.olhosnatv.com.br/2018/05/retro-cartoon-desenhos-classicos.html', imageUrl: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgLbQIJk3tD7MwHLzMY-NlcQm3O1a2qj50PBnRNfgMsNFaPzUkQGVWDQcCg6_V6vg4mCQ31YgfA6ni-FKIIRaBjC8FSxV-IEDiKZTIr93qVZdbfuebt9YibwJSWCNBS40XuXR_SAtDFADfnWEUfqbRloiCe27rg0cyAMQ8QXzXBTAamjn-Yj_qcidM16l0/w385-h184-p-k-no-nu/RETR%C3%94%20CARTOON.webp', description: 'Desenhos clássicos.' },
    { id: 'leo_tv_one', title: 'TV One', type: 'channel', genre: 'VARIEDADES', isRestricted: false, streamUrl: 'https://www.olhosnatv.com.br/2020/04/tv-one.html', imageUrl: 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjLy7HhupoGU0Ddwu2c8R-_bpUgj-AaeJ8NxdjanzPZPm5uZiQ24do8-gB9B1N0vufThxuKoyRA6h2n-EPNf_MiKTQvW5kFNrzn0usqqsAaCtrJUq35oX-_4W4ljuQ1gkR4N-Oy-BSaB-JQ3w_XobpxUteS9_iMr-VJkmmdndWrq-JipuvdN25qxoy_kbQ/w385-h184-p-k-no-nu/TV%20ONE.webp', description: 'Canal regional de variedades.' },
    { id: 'leo_ph_brazzers', title: 'Brazzers TV', type: 'channel', genre: 'ADULTOS', isRestricted: true, streamUrl: 'https://pornhub.com/channels/brazzers', imageUrl: 'https://ei.phncdn.com/(m=bLGmidK)(mh=hFyV5Tf75aRqNbo7)bf7b2336-5cd0-4635-8c08-f82060342019.jpg', description: 'Canal adulto restrito.' },
    { id: 'leo_horror_movies', title: 'Horror Channel', type: 'channel', genre: 'TERROR', isRestricted: true, streamUrl: 'https://pluto.tv/br/live-tv/63eb9c5351f5d000085e8d7e', imageUrl: 'https://images.pluto.tv/channels/63eb9c5351f5d000085e8d7e/featuredImage_1774294524670.jpg', description: 'Filmes de terror 24h.' },
    { id: 'leo_tv_brasil', title: 'TV Brasil', type: 'channel', genre: 'TV ABERTA', isRestricted: false, streamUrl: 'https://www.cxtv.com.br/tv-ao-vivo/tv-brasil', imageUrl: 'https://www.cxtv.com.br/img/Tvs/Logo/webp-l/041a53eb1b2c6c9d65151c102342544b.webp', description: 'TV pública nacional.' },
    { id: 'leo_abc_news', title: 'ABC News', type: 'channel', genre: 'NOTÍCIAS', isRestricted: false, streamUrl: 'https://d1zx6l1dn8vaj5.cloudfront.net/out/v1/b89cc37caa6d418eb423cf092a2ef970/index_4.m3u8', imageUrl: 'https://www.cxtv.com.br/img/Tvs/Logo/webp-m/ec432b3a9f86ac0b68d68ce11c20dd99.webp', description: 'Notícias dos Estados Unidos.' },
    { id: 'leo_euronews', title: 'Euronews PT', type: 'channel', genre: 'NOTÍCIAS', isRestricted: false, streamUrl: 'https://www.cxtv.com.br/tv-ao-vivo/euronews-pt', imageUrl: 'https://www.cxtv.com.br/img/Tvs/Logo/webp-l/fee4bcbe6932805a9862a46b1773a0c1.webp', description: 'Notícias da Europa em Português.' },
    { id: 'leo_nhk', title: 'NHK World', type: 'channel', genre: 'INTERNACIONAL', isRestricted: false, streamUrl: 'https://www.cxtv.com.br/tv-ao-vivo/nhk-world', imageUrl: 'https://www.cxtv.com.br/img/Tvs/Logo/webp-m/87ab2cae62f1210235beccb4bb75e35b.webp', description: 'Canal oficial do Japão.' },
    { id: 'leo_bloomberg', title: 'Bloomberg TV', type: 'channel', genre: 'ECONOMIA', isRestricted: false, streamUrl: 'https://www.cxtv.com.br/tv-ao-vivo/bloomberg-tv', imageUrl: 'https://www.cxtv.com.br/img/Tvs/Logo/webp-m/a024c9bc44f4adf14389bbfeab689cd2.webp', description: 'Notícias financeiras globais.' },
    { id: 'leo_reuters', title: 'Reuters TV', type: 'channel', genre: 'NOTÍCIAS', isRestricted: false, streamUrl: 'https://www.cxtv.com.br/tv-ao-vivo/reuters-tv', imageUrl: 'https://www.cxtv.com.br/img/Tvs/Logo/webp-m/39e53ff4eb0078728bfbe6e72dbbb90d.webp', description: 'Reuters Global News.' },
    { id: 'leo_boomerang', title: 'Boomerang UK', type: 'channel', genre: 'INFANTIL', isRestricted: false, streamUrl: 'https://www.cxtv.com.br/tv-ao-vivo/boomerang-uk', imageUrl: 'https://www.cxtv.com.br/img/Tvs/Logo/webp-l/1d525204b1e092a830410bb9e9ccb339.webp', description: 'Desenhos clássicos.' },
    { id: 'leo_redbull', title: 'Red Bull TV', type: 'channel', genre: 'ESPORTES RADICAIS', isRestricted: false, streamUrl: 'https://www.cxtv.com.br/tv-ao-vivo/red-bull-tv', imageUrl: 'https://www.cxtv.com.br/img/Tvs/Logo/webp-l/e0ff78240cc23f1868ce2a008a92c58d.webp', description: 'Esportes e ação extrema.' },
    { id: 'leo_cnn_portugal', title: 'CNN Portugal', type: 'channel', genre: 'NOTÍCIAS', isRestricted: false, streamUrl: 'https://www.cxtv.com.br/tv-ao-vivo/cnn-portugal', imageUrl: 'https://www.cxtv.com.br/img/Tvs/Logo/webp-l/b6904191bba4cd4428ac6f08a5716aec.webp', description: 'Notícias de Portugal.' },
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

    const existingItems = await fetchAllRecords('content', 'id');
    const existingIds = new Set(existingItems.map(i => i.id));

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
