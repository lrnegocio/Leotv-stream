
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';
import { getRemoteContent, ContentItem } from '@/lib/store';

export const dynamic = 'force-dynamic';

/**
 * API XTREAM CODES EMULATOR v138.0 - INTELIGÊNCIA DUAL LINK
 */

export async function GET(req: NextRequest) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Cache-Control': 'public, s-maxage=3600', 
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
      userRecord = { pin: 'adm77x2p', subscriptionTier: 'lifetime', maxScreens: 999, isBlocked: false };
    } else {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('pin', username)
        .maybeSingle();
      
      if (userError || !user || user.isBlocked) {
        return NextResponse.json({ user_info: { auth: 0, status: "Inactive", exp_date: "0" } }, { status: 200, headers });
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
          allowed_output_formats: ["m3u8", "ts", "rtmp", "mp4"]
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
    const genres = Array.from(new Set(content.map(i => (i.genre || "GERAL").toUpperCase()))).sort();
    const genreToId = (genre: string) => (genres.indexOf((genre || "GERAL").toUpperCase()) + 1).toString();

    if (action === 'get_live_categories') {
      return NextResponse.json(genres.map(g => ({
        category_id: genreToId(g),
        category_name: g,
        parent_id: "0"
      })), { headers });
    }

    if (action === 'get_live_streams') {
      const catId = searchParams.get('category_id');
      let liveItems = content.filter(i => i.type === 'channel');
      
      if (catId) {
        liveItems = liveItems.filter(i => genreToId(i.genre) === catId);
      }

      return NextResponse.json(liveItems.map((i, idx) => ({
        num: idx + 1,
        name: i.title.toUpperCase(),
        stream_type: "live",
        stream_id: i.id,
        stream_icon: i.imageUrl || "",
        category_id: genreToId(i.genre),
        added: "0",
        custom_sid: "",
        direct_source: i.directStreamUrl || i.streamUrl || "" // Prioridade para o Link Direto no IPTV
      })), { headers });
    }

    if (action === 'get_vod_categories') {
      const movieGenres = Array.from(new Set(content.filter(i => i.type === 'movie').map(i => (i.genre || "FILMES").toUpperCase()))).sort();
      return NextResponse.json(movieGenres.map(g => ({
        category_id: "mov_" + genreToId(g),
        category_name: g,
        parent_id: "0"
      })), { headers });
    }

    if (action === 'get_vod_streams') {
      const catId = searchParams.get('category_id');
      let movies = content.filter(i => i.type === 'movie');
      
      if (catId) {
        movies = movies.filter(i => ("mov_" + genreToId(i.genre)) === catId);
      }

      return NextResponse.json(movies.map((i, idx) => ({
        num: idx + 1,
        name: i.title.toUpperCase(),
        stream_type: "movie",
        stream_id: i.id,
        stream_icon: i.imageUrl || "",
        category_id: "mov_" + genreToId(i.genre),
        added: "0",
        container_extension: "mp4",
        direct_source: i.directStreamUrl || i.streamUrl || "" // Prioridade para o Link Direto no IPTV
      })), { headers });
    }

    return NextResponse.json([], { headers });
  } catch (err) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 200, headers });
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
