
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';
import { getRemoteContent, getRemoteGames } from '@/lib/store';

export const dynamic = 'force-dynamic';

/**
 * XTREAM API MASTER v59.0 - SUPORTE COMPLETO A SÉRIES, FILMES E CANAIS
 * Blindagem total para VUSER, RP725 e Smarters.
 */
export async function GET(req: NextRequest) {
  const headers = { 
    'Content-Type': 'application/json', 
    'Access-Control-Allow-Origin': '*',
    'Cache-Control': 'no-store, max-age=0'
  };
  const { searchParams } = new URL(req.url);
  
  const username = (searchParams.get('username') || searchParams.get('user') || searchParams.get('u') || "").trim(); 
  const password = (searchParams.get('password') || searchParams.get('pass') || searchParams.get('p') || "").trim();
  const action = searchParams.get('action');

  if (!username && !password) {
    return NextResponse.json({ user_info: { auth: 0 } }, { headers });
  }

  try {
    let activeUser: any = null;
    const inputPin = (username || password).toUpperCase().trim();
    
    // Suporte para logins Master e Truncados (RP725 / VUSER)
    if (inputPin === 'ADM77X2P') {
      activeUser = { pin: 'ADM77X2P', isBlocked: false, isAdultEnabled: true, isGamesEnabled: true, maxScreens: 999 };
    } else {
      let query = supabase.from('users').select('*');
      if (/^\d+$/.test(inputPin) && (inputPin.length === 8 || inputPin.length === 9)) {
        query = query.ilike('pin', `${inputPin}%`);
      } else {
        query = query.eq('pin', inputPin);
      }
      const { data: users } = await query;
      activeUser = users?.[0];
    }

    if (!activeUser || activeUser.isBlocked) {
      return NextResponse.json({ user_info: { auth: 0, status: "Acesso Negado" } }, { headers });
    }

    const content = await getRemoteContent(true);
    const host = req.nextUrl.host;
    const protocol = req.headers.get('x-forwarded-proto') || "https";
    const baseUrl = `${protocol}://${host}`;

    // INFO DO PAINEL
    if (!action) {
      return NextResponse.json({
        user_info: {
          auth: 1,
          status: "Active",
          exp_date: activeUser.expiryDate ? Math.floor(new Date(activeUser.expiryDate).getTime() / 1000).toString() : "1999999999",
          is_trial: activeUser.subscriptionTier === 'test' ? "1" : "0",
          active_cons: "0",
          max_connections: activeUser.maxScreens?.toString() || "1",
          allowed_output_formats: ["m3u8", "ts", "mp4"]
        },
        server_info: { url: host, port: "443", https_port: "443", server_protocol: "https", timestamp: Math.floor(Date.now()/1000) }
      }, { headers });
    }

    // LIVE (CANAIS)
    if (action === 'get_live_categories') {
      const cats = Array.from(new Set(content.filter(i => i.type === 'channel').map(i => i.genre.toUpperCase()))).sort();
      return NextResponse.json(cats.map((name, idx) => ({ 
        category_id: (idx + 1).toString(), 
        category_name: name, 
        parent_id: "0" 
      })), { headers });
    }

    if (action === 'get_live_streams') {
      let items = content.filter(i => i.type === 'channel');
      if (!activeUser.isAdultEnabled) items = items.filter(i => !i.isRestricted);
      const catId = searchParams.get('category_id');
      if (catId) {
        const cats = Array.from(new Set(content.filter(i => i.type === 'channel').map(i => i.genre.toUpperCase()))).sort();
        const targetGenre = cats[parseInt(catId) - 1];
        if (targetGenre) items = items.filter(i => i.genre.toUpperCase() === targetGenre);
      }
      return NextResponse.json(items.map(i => ({ 
        num: i.id, name: i.title.toUpperCase(), stream_id: i.id, stream_icon: i.imageUrl || "", category_id: catId || "1", stream_type: "live" 
      })), { headers });
    }

    // VOD (FILMES)
    if (action === 'get_vod_categories') {
      const cats = Array.from(new Set(content.filter(i => i.type === 'movie').map(i => i.genre.toUpperCase()))).sort();
      return NextResponse.json(cats.map((name, idx) => ({ 
        category_id: (idx + 100).toString(), 
        category_name: name, 
        parent_id: "0" 
      })), { headers });
    }

    if (action === 'get_vod_streams') {
      let items = content.filter(i => i.type === 'movie');
      if (!activeUser.isAdultEnabled) items = items.filter(i => !i.isRestricted);
      const catId = searchParams.get('category_id');
      if (catId) {
        const cats = Array.from(new Set(content.filter(i => i.type === 'movie').map(i => i.genre.toUpperCase()))).sort();
        const targetGenre = cats[parseInt(catId) - 100];
        if (targetGenre) items = items.filter(i => i.genre.toUpperCase() === targetGenre);
      }
      return NextResponse.json(items.map(i => ({ 
        num: i.id, name: i.title.toUpperCase(), stream_id: i.id, stream_icon: i.imageUrl || "", category_id: catId || "100", container_extension: "mp4" 
      })), { headers });
    }

    // SERIES (EPISÓDIOS E TEMPORADAS)
    if (action === 'get_series_categories') {
      const cats = Array.from(new Set(content.filter(i => i.type === 'series' || i.type === 'multi-season').map(i => i.genre.toUpperCase()))).sort();
      return NextResponse.json(cats.map((name, idx) => ({ 
        category_id: (idx + 500).toString(), 
        category_name: name, 
        parent_id: "0" 
      })), { headers });
    }

    if (action === 'get_series') {
      let items = content.filter(i => i.type === 'series' || i.type === 'multi-season');
      if (!activeUser.isAdultEnabled) items = items.filter(i => !i.isRestricted);
      const catId = searchParams.get('category_id');
      if (catId) {
        const cats = Array.from(new Set(content.filter(i => i.type === 'series' || i.type === 'multi-season').map(i => i.genre.toUpperCase()))).sort();
        const targetGenre = cats[parseInt(catId) - 500];
        if (targetGenre) items = items.filter(i => i.genre.toUpperCase() === targetGenre);
      }
      return NextResponse.json(items.map(i => ({ 
        num: i.id, name: i.title.toUpperCase(), series_id: i.id, cover: i.imageUrl || "", category_id: catId || "500", releaseDate: "", plot: i.description, rating: "10"
      })), { headers });
    }

    if (action === 'get_series_info') {
      const seriesId = searchParams.get('series_id');
      const item = content.find(i => i.id === seriesId);
      if (!item) return NextResponse.json({}, { headers });

      const seasons: any = {};
      const episodes: any = {};

      if (item.type === 'series' && item.episodes) {
        seasons["1"] = { season_number: 1, name: "Temporada 1", episode_count: item.episodes.length };
        episodes["1"] = item.episodes.map(ep => ({
          id: ep.id, episode_num: ep.number, title: ep.title, container_extension: "mp4", info: { duration: "00:00" }
        }));
      } else if (item.type === 'multi-season' && item.seasons) {
        item.seasons.forEach(s => {
          seasons[s.number.toString()] = { season_number: s.number, name: `Temporada ${s.number}`, episode_count: s.episodes.length };
          episodes[s.number.toString()] = s.episodes.map(ep => ({
            id: ep.id, episode_num: ep.number, title: ep.title, container_extension: "mp4", info: { duration: "00:00" }
          }));
        });
      }

      return NextResponse.json({
        info: { name: item.title, cover: item.imageUrl, plot: item.description, genre: item.genre },
        seasons: Object.values(seasons),
        episodes: episodes
      }, { headers });
    }

    return NextResponse.json([], { headers });
  } catch (err) {
    return NextResponse.json({ user_info: { auth: 0 } }, { headers });
  }
}
