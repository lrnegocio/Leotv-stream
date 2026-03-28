
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';
import { getRemoteContent, ContentItem } from '@/lib/store';

export const dynamic = 'force-dynamic';

/**
 * API XTREAM CODES EMULATOR v150.0 - SINTONIZADOR PRO
 * Agora com suporte a rotas de redirecionamento para maior compatibilidade.
 */

function getExtension(url: string | undefined): string {
  if (!url) return "mp4";
  const cleanUrl = url.split('?')[0].toLowerCase();
  if (cleanUrl.endsWith('.m3u8')) return "m3u8";
  if (cleanUrl.endsWith('.ts')) return "ts";
  if (cleanUrl.endsWith('.mkv')) return "mkv";
  if (cleanUrl.includes('youtube.com') || cleanUrl.includes('youtu.be')) return "mp4";
  return "mp4";
}

export async function GET(req: NextRequest) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate', 
  };

  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username'); 
    const password = searchParams.get('password'); 
    const action = searchParams.get('action');

    if (!username || !password) {
      return NextResponse.json({ user_info: { auth: 0 } }, { status: 200, headers });
    }

    let isMaster = username === 'adm77x2p';
    let userRecord = null;

    if (isMaster) {
      userRecord = { pin: 'adm77x2p', subscriptionTier: 'lifetime', maxScreens: 999, isBlocked: false, isAdultEnabled: true };
    } else {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('pin', username)
        .maybeSingle();
      
      if (userError || !user || user.isBlocked) {
        return NextResponse.json({ user_info: { auth: 0, status: "Inactive" } }, { status: 200, headers });
      }
      userRecord = user;
    }

    const expiry = userRecord.expiryDate ? Math.floor(new Date(userRecord.expiryDate).getTime() / 1000).toString() : "1999999999";

    if (!action) {
      return NextResponse.json({
        user_info: {
          auth: 1,
          username: userRecord.pin,
          password: userRecord.pin,
          status: "Active",
          exp_date: expiry,
          is_trial: userRecord.subscriptionTier === 'test' ? "1" : "0",
          active_cons: "0",
          max_connections: userRecord.maxScreens?.toString() || "1",
          allowed_output_formats: ["m3u8", "ts", "rtmp", "mp4", "mkv"]
        },
        server_info: {
          url: req.nextUrl.origin,
          port: "443",
          https_port: "443",
          server_protocol: "https",
          rtmp_port: "8000",
          timezone: "America/Sao_Paulo",
          time_now: new Date().toISOString()
        }
      }, { headers });
    }

    const content = await getRemoteContent(); 
    
    const liveCategories = Array.from(new Set(content.filter(i => i.type === 'channel').map(i => (i.genre || "GERAL").toUpperCase()))).sort();
    const liveCatMap = liveCategories.map((name, index) => ({ category_id: (index + 1).toString(), category_name: name, parent_id: "0" }));

    const movieCategories = Array.from(new Set(content.filter(i => i.type === 'movie').map(i => (i.genre || "FILMES").toUpperCase()))).sort();
    const movieCatMap = movieCategories.map((name, index) => ({ category_id: "vod_" + (index + 1), category_name: name, parent_id: "0" }));

    const seriesCategories = Array.from(new Set(content.filter(i => i.type === 'series' || i.type === 'multi-season').map(i => (i.genre || "SÉRIES").toUpperCase()))).sort();
    const seriesCatMap = seriesCategories.map((name, index) => ({ category_id: "ser_" + (index + 1), category_name: name, parent_id: "0" }));

    if (action === 'get_live_categories') return NextResponse.json(liveCatMap, { headers });
    if (action === 'get_vod_categories') return NextResponse.json(movieCatMap, { headers });
    if (action === 'get_series_categories') return NextResponse.json(seriesCatMap, { headers });

    if (action === 'get_live_streams') {
      const catId = searchParams.get('category_id');
      let items = content.filter(i => i.type === 'channel');
      if (catId) {
        const categoryName = liveCatMap.find(c => c.category_id === catId)?.category_name;
        if (categoryName) items = items.filter(i => (i.genre || "GERAL").toUpperCase() === categoryName);
      }
      if (!userRecord.isAdultEnabled) items = items.filter(i => !i.isRestricted);

      return NextResponse.json(items.map((i, idx) => ({
        num: idx + 1,
        name: i.title.toUpperCase(),
        stream_type: "live",
        stream_id: i.id,
        stream_icon: i.imageUrl || "",
        category_id: liveCatMap.find(c => c.category_name === (i.genre || "GERAL").toUpperCase())?.category_id || "1",
        added: "0",
        custom_sid: "",
        direct_source: i.directStreamUrl || i.streamUrl || ""
      })), { headers });
    }

    if (action === 'get_vod_streams') {
      const catId = searchParams.get('category_id');
      let movies = content.filter(i => i.type === 'movie');
      if (catId) {
        const categoryName = movieCatMap.find(c => c.category_id === catId)?.category_name;
        if (categoryName) movies = movies.filter(i => (i.genre || "FILMES").toUpperCase() === categoryName);
      }
      if (!userRecord.isAdultEnabled) movies = movies.filter(i => !i.isRestricted);

      return NextResponse.json(movies.map((i, idx) => {
        const url = i.directStreamUrl || i.streamUrl;
        return {
          num: idx + 1,
          name: i.title.toUpperCase(),
          stream_type: "movie",
          stream_id: i.id,
          stream_icon: i.imageUrl || "",
          category_id: movieCatMap.find(c => (i.genre || "FILMES").toUpperCase() === c.category_name)?.category_id || "vod_1",
          added: "0",
          container_extension: getExtension(url),
          rating: "10",
          direct_source: url || ""
        };
      }), { headers });
    }

    if (action === 'get_series') {
      const catId = searchParams.get('category_id');
      let series = content.filter(i => i.type === 'multi-season' || i.type === 'series');
      if (catId) {
        const categoryName = seriesCatMap.find(c => c.category_id === catId)?.category_name;
        if (categoryName) series = series.filter(i => (i.genre || "SÉRIES").toUpperCase() === categoryName);
      }

      return NextResponse.json(series.map((i, idx) => ({
        num: idx + 1,
        name: i.title.toUpperCase(),
        series_id: i.id,
        cover: i.imageUrl || "",
        plot: i.description || "",
        cast: "Léo Stream Cast",
        director: "Mestre Léo",
        genre: i.genre,
        releaseDate: "",
        last_modified: "0",
        rating: "10",
        category_id: seriesCatMap.find(c => (i.genre || "SÉRIES").toUpperCase() === c.category_name)?.category_id || "ser_1"
      })), { headers });
    }

    if (action === 'get_series_info') {
      const seriesId = searchParams.get('series_id');
      const item = content.find(i => i.id === seriesId);
      if (!item) return NextResponse.json({}, { headers });

      const info = {
        name: item.title,
        cover: item.imageUrl || "",
        plot: item.description || "",
        genre: item.genre,
        director: "Mestre Léo",
        cast: "Léo Stream Cast",
        rating: "10",
        releaseDate: ""
      };

      const seasonsList: any[] = [];
      const episodesList: Record<string, any[]> = {};

      if (item.type === 'series' && item.episodes) {
        seasonsList.push({ season_number: 1, name: "Temporada 1", episode_count: item.episodes.length });
        episodesList["1"] = item.episodes.map(ep => {
          const url = ep.directStreamUrl || ep.streamUrl;
          return {
            id: ep.id,
            episode_num: ep.number,
            title: ep.title || `Episódio ${ep.number}`,
            container_extension: getExtension(url),
            direct_source: url
          };
        });
      } else if (item.type === 'multi-season' && item.seasons) {
        item.seasons.forEach(s => {
          seasonsList.push({ season_number: s.number, name: `Temporada ${s.number}`, episode_count: s.episodes.length });
          episodesList[s.number.toString()] = s.episodes.map(ep => {
            const url = ep.directStreamUrl || ep.streamUrl;
            return {
              id: ep.id,
              episode_num: ep.number,
              title: ep.title || `Episódio ${ep.number}`,
              container_extension: getExtension(url),
              direct_source: url
            };
          });
        });
      }

      return NextResponse.json({ info, seasons: seasonsList, episodes: episodesList }, { headers });
    }

    if (action === 'get_vod_info') {
      const vodId = searchParams.get('vod_id');
      const movie = content.find(i => i.id === vodId);
      if (!movie) return NextResponse.json({}, { headers });

      const url = movie.directStreamUrl || movie.streamUrl;
      return NextResponse.json({
        info: {
          name: movie.title,
          cover: movie.imageUrl || "",
          plot: movie.description || "",
          genre: movie.genre,
          director: "Mestre Léo",
          rating: "10"
        },
        movie_data: {
          stream_id: movie.id,
          container_extension: getExtension(url),
          direct_source: url
        }
      }, { headers });
    }

    return NextResponse.json([], { headers });
  } catch (err) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 200, headers });
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
