
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';
import { getRemoteContent, ContentItem } from '@/lib/store';

export const dynamic = 'force-dynamic';

// MEMÓRIA MASTER v159: Cache agressivo para simular a velocidade de um servidor XUI real
let serverCache: { data: ContentItem[], time: number } | null = null;
const CACHE_TTL = 1000 * 60 * 5; // 5 minutos de cache em memória RAM

async function getFastContent() {
  const now = Date.now();
  if (serverCache && (now - serverCache.time < CACHE_TTL)) {
    return serverCache.data;
  }
  const data = await getRemoteContent(true);
  serverCache = { data, time: now };
  return data;
}

export async function GET(req: NextRequest) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60', 
  };

  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username'); 
    const password = searchParams.get('password');
    const action = searchParams.get('action');

    // Autenticação XUI Master
    if (!username) return NextResponse.json({ user_info: { auth: 0 } }, { headers });

    const isMaster = username === 'adm77x2p';
    let activeUser: any = null;

    if (isMaster) {
      activeUser = { pin: 'adm77x2p', isBlocked: false, isAdultEnabled: true };
    } else {
      const { data } = await supabase.from('users').select('*').eq('pin', username).maybeSingle();
      if (!data || data.isBlocked) return NextResponse.json({ user_info: { auth: 0 } }, { headers });
      activeUser = data;
    }

    const baseUrl = req.nextUrl.origin;

    // Resposta de Login Inicial (Handshake XUI)
    if (!action) {
      return NextResponse.json({
        user_info: {
          auth: 1,
          status: "Active",
          exp_date: activeUser.expiryDate ? Math.floor(new Date(activeUser.expiryDate).getTime() / 1000).toString() : "1999999999",
          is_trial: activeUser.subscriptionTier === 'test' ? "1" : "0",
          active_cons: "1",
          max_connections: activeUser.maxScreens?.toString() || "1",
          allowed_output_formats: ["m3u8", "ts", "mp4", "mkv"]
        },
        server_info: {
          url: baseUrl.replace('https://', '').replace('http://', ''),
          port: "443",
          https_port: "443",
          server_protocol: "https",
          rtmp_port: "80",
          timezone: "America/Sao_Paulo",
          timestamp: Math.floor(Date.now() / 1000),
          name: "Léo Tv Stream XUI Server"
        }
      }, { headers });
    }

    const content = await getFastContent();

    // Categorias de Canais (Live)
    if (action === 'get_live_categories') {
      const cats = Array.from(new Set(content.filter(i => i.type === 'channel').map(i => (i.genre || "GERAL").toUpperCase()))).sort();
      return NextResponse.json(cats.map((name, idx) => ({ category_id: (idx + 1).toString(), category_name: name, parent_id: "0" })), { headers });
    }

    // Categorias de Filmes (VOD)
    if (action === 'get_vod_categories') {
      const cats = Array.from(new Set(content.filter(i => i.type === 'movie').map(i => (i.genre || "FILMES").toUpperCase()))).sort();
      return NextResponse.json(cats.map((name, idx) => ({ category_id: (idx + 1000).toString(), category_name: name, parent_id: "0" })), { headers });
    }

    // Categorias de Séries
    if (action === 'get_series_categories') {
      const cats = Array.from(new Set(content.filter(i => i.type === 'series' || i.type === 'multi-season').map(i => (i.genre || "SÉRIES").toUpperCase()))).sort();
      return NextResponse.json(cats.map((name, idx) => ({ category_id: (idx + 2000).toString(), category_name: name, parent_id: "0" })), { headers });
    }

    // Streams de Canais (Live Streams)
    if (action === 'get_live_streams') {
      let items = content.filter(i => i.type === 'channel');
      const catId = searchParams.get('category_id');
      
      // Filtro de categoria se solicitado
      if (catId) {
        // Lógica simplificada de mapeamento para XUI
      }

      if (!activeUser.isAdultEnabled) items = items.filter(i => !i.isRestricted);
      
      return NextResponse.json(items.map(i => {
        const streamUrl = i.directStreamUrl || i.streamUrl || "";
        const ext = streamUrl.toLowerCase().includes('.m3u8') ? 'm3u8' : 'ts';
        return {
          num: i.id,
          name: i.title.toUpperCase(),
          stream_id: i.id,
          stream_icon: i.imageUrl || "",
          epg_channel_id: "",
          added: "1700000000",
          category_id: "1",
          custom_sid: "",
          tv_archive: 0,
          direct_source: streamUrl,
          tv_archive_duration: 0,
          thumbnail: i.imageUrl || "",
          stream_type: "live"
        };
      }), { headers });
    }

    // Streams de Filmes (VOD Streams)
    if (action === 'get_vod_streams') {
      let items = content.filter(i => i.type === 'movie');
      if (!activeUser.isAdultEnabled) items = items.filter(i => !i.isRestricted);

      return NextResponse.json(items.map(i => ({
        num: i.id,
        name: i.title.toUpperCase(),
        stream_id: i.id,
        stream_icon: i.imageUrl || "",
        added: "1700000000",
        category_id: "1000",
        container_extension: "mp4",
        custom_sid: "",
        direct_source: i.directStreamUrl || i.streamUrl || "",
        rating: "10",
        stream_type: "movie"
      })), { headers });
    }

    // Lista de Séries
    if (action === 'get_series') {
      let items = content.filter(i => i.type === 'series' || i.type === 'multi-season');
      return NextResponse.json(items.map(i => ({
        num: i.id,
        name: i.title.toUpperCase(),
        series_id: i.id,
        cover: i.imageUrl || "",
        plot: i.description || "Série Léo Tv Stream",
        cast: "Mestre Léo",
        director: "Léo Tv Stream",
        genre: i.genre || "Série",
        releaseDate: "2024",
        last_modified: "1700000000",
        rating: "10",
        category_id: "2000"
      })), { headers });
    }

    // Detalhes da Série (Episódios e Temporadas)
    if (action === 'get_series_info') {
      const seriesId = searchParams.get('series_id');
      const item = content.find(i => i.id === seriesId);
      if (!item) return NextResponse.json({}, { headers });

      const seasonsList = [];
      const episodesList: any = {};

      if (item.type === 'series' && item.episodes) {
        seasonsList.push({ season_number: 1, name: "Temporada 1", episode_count: item.episodes.length });
        episodesList["1"] = item.episodes.map(ep => ({
          id: ep.id,
          episode_num: ep.number,
          title: ep.title,
          container_extension: "mp4",
          info: { duration: "00:45:00", plot: item.description },
          direct_source: ep.directStreamUrl || ep.streamUrl || ""
        }));
      } else if (item.type === 'multi-season' && item.seasons) {
        item.seasons.forEach(s => {
          seasonsList.push({ season_number: s.number, name: `Temporada ${s.number}`, episode_count: s.episodes.length });
          episodesList[s.number.toString()] = s.episodes.map(ep => ({
            id: ep.id,
            episode_num: ep.number,
            title: ep.title,
            container_extension: "mp4",
            info: { duration: "00:45:00", plot: item.description },
            direct_source: ep.directStreamUrl || ep.streamUrl || ""
          }));
        });
      }

      return NextResponse.json({ 
        info: { 
          name: item.title, 
          cover: item.imageUrl, 
          plot: item.description, 
          cast: "Mestre Léo", 
          director: "Léo Tv Stream", 
          genre: item.genre, 
          releaseDate: "2024", 
          last_modified: "1700000000", 
          rating: "10" 
        }, 
        seasons: seasonsList, 
        episodes: episodesList 
      }, { headers });
    }

    return NextResponse.json([], { headers });
  } catch (err) {
    return NextResponse.json({ auth: 0 }, { headers });
  }
}
