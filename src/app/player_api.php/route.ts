
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';
import { getRemoteContent, ContentItem } from '@/lib/store';

export const dynamic = 'force-dynamic';

// MEMÓRIA MASTER v156: Aumento do cache para 10 minutos para velocidade absoluta
let serverCache: { data: ContentItem[], time: number } | null = null;
const CACHE_TTL = 1000 * 60 * 10; 

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
    'Cache-Control': 'public, s-maxage=600, stale-while-revalidate=120', 
  };

  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username'); 
    const action = searchParams.get('action');

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

    if (!action) {
      return NextResponse.json({
        user_info: {
          auth: 1,
          status: "Active",
          exp_date: "1999999999",
          max_connections: "999",
          allowed_output_formats: ["m3u8", "ts", "mp4", "mkv"]
        },
        server_info: { url: baseUrl, port: "443", https_port: "443", server_protocol: "https", timezone: "America/Sao_Paulo" }
      }, { headers });
    }

    const content = await getFastContent(); 

    if (action === 'get_live_categories') {
      const cats = Array.from(new Set(content.filter(i => i.type === 'channel').map(i => (i.genre || "GERAL").toUpperCase()))).sort();
      return NextResponse.json(cats.map((name, idx) => ({ category_id: (idx + 1).toString(), category_name: name, parent_id: "0" })), { headers });
    }

    if (action === 'get_vod_categories') {
      const cats = Array.from(new Set(content.filter(i => i.type === 'movie').map(i => (i.genre || "FILMES").toUpperCase()))).sort();
      return NextResponse.json(cats.map((name, idx) => ({ category_id: "vod_" + (idx + 1), category_name: name, parent_id: "0" })), { headers });
    }

    if (action === 'get_series_categories') {
      const cats = Array.from(new Set(content.filter(i => i.type === 'series' || i.type === 'multi-season').map(i => (i.genre || "SÉRIES").toUpperCase()))).sort();
      return NextResponse.json(cats.map((name, idx) => ({ category_id: "ser_" + (idx + 1), category_name: name, parent_id: "0" })), { headers });
    }

    if (action === 'get_live_streams') {
      let items = content.filter(i => i.type === 'channel');
      if (!activeUser.isAdultEnabled) items = items.filter(i => !i.isRestricted);
      
      return NextResponse.json(items.map(i => {
        const streamUrl = i.directStreamUrl || i.streamUrl || "";
        const ext = streamUrl.toLowerCase().includes('.m3u8') ? 'm3u8' : 'ts';
        return {
          name: i.title.toUpperCase(),
          stream_id: i.id,
          stream_icon: i.imageUrl || "",
          category_id: "1",
          stream_type: "live",
          added: "1700000000",
          custom_sid: "",
          tv_archive: 0,
          direct_source: `${baseUrl}/live/${username}/${username}/${i.id}.${ext}`
        };
      }), { headers });
    }

    if (action === 'get_vod_streams') {
      let items = content.filter(i => i.type === 'movie');
      if (!activeUser.isAdultEnabled) items = items.filter(i => !i.isRestricted);

      return NextResponse.json(items.map(i => ({
        name: i.title.toUpperCase(),
        stream_id: i.id,
        stream_icon: i.imageUrl || "",
        category_id: "vod_1",
        container_extension: "mp4",
        rating: "10",
        added: "1700000000",
        stream_type: "movie",
        direct_source: `${baseUrl}/movie/${username}/${username}/${i.id}.mp4`
      })), { headers });
    }

    if (action === 'get_series') {
      let items = content.filter(i => i.type === 'series' || i.type === 'multi-season');
      return NextResponse.json(items.map(i => ({
        name: i.title.toUpperCase(),
        series_id: i.id,
        cover: i.imageUrl || "",
        plot: i.description || "",
        genre: i.genre,
        last_modified: "1700000000",
        rating: "10",
        category_id: "ser_1"
      })), { headers });
    }

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
          direct_source: `${baseUrl}/series/${username}/${username}/${ep.id}.mp4`
        }));
      } else if (item.type === 'multi-season' && item.seasons) {
        item.seasons.forEach(s => {
          seasonsList.push({ season_number: s.number, name: `Temporada ${s.number}`, episode_count: s.episodes.length });
          episodesList[s.number.toString()] = s.episodes.map(ep => ({
            id: ep.id,
            episode_num: ep.number,
            title: ep.title,
            container_extension: "mp4",
            direct_source: `${baseUrl}/series/${username}/${username}/${ep.id}.mp4`
          }));
        });
      }

      return NextResponse.json({ 
        info: { name: item.title, cover: item.imageUrl, plot: item.description, cast: "Mestre Léo", director: "Léo Tv Stream", genre: item.genre, releaseDate: "2024", last_modified: "1700000000", rating: "10" }, 
        seasons: seasonsList, 
        episodes: episodesList 
      }, { headers });
    }

    return NextResponse.json([], { headers });
  } catch (err) {
    return NextResponse.json({ auth: 0 }, { headers });
  }
}
