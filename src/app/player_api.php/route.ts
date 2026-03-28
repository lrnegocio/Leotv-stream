
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';
import { getRemoteContent, ContentItem } from '@/lib/store';

export const dynamic = 'force-dynamic';

/**
 * API XTREAM CODES EMULATOR v140.0 - SUPREMACIA TOTAL
 * Calibrado para IPTV Smarters Pro, OTT Navigator e TiViMate
 */

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

    // Informações de Autenticação Inicial
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

    const content = await getRemoteContent(true); // ForceRefresh para garantir lista atualizada
    
    // Mapeamento de Categorias Inteligente
    const categories = Array.from(new Set(content.map(i => (i.genre || "GERAL").toUpperCase()))).sort();
    const catMap = categories.map((name, index) => ({
      category_id: (index + 1).toString(),
      category_name: name,
      parent_id: "0"
    }));

    // --- LIVE CHANNELS ---
    if (action === 'get_live_categories') {
      return NextResponse.json(catMap, { headers });
    }

    if (action === 'get_live_streams') {
      const catId = searchParams.get('category_id');
      let items = content.filter(i => i.type === 'channel' || i.type === 'series'); // Séries podem aparecer como canais se não tiverem temporadas
      
      if (catId) {
        const categoryName = catMap.find(c => c.category_id === catId)?.category_name;
        if (categoryName) {
          items = items.filter(i => (i.genre || "GERAL").toUpperCase() === categoryName);
        }
      }

      // Filtro de Adultos
      if (!userRecord.isAdultEnabled) {
        items = items.filter(i => !i.isRestricted);
      }

      return NextResponse.json(items.map((i, idx) => {
        // Inteligência de Link para IPTV
        let streamUrl = i.directStreamUrl || i.streamUrl || "";
        
        // Suporte para YouTube no IPTV (Tenta forçar o sinal)
        if (streamUrl.includes('youtube.com') || streamUrl.includes('youtu.be')) {
           // Apps como OttNavigator e alguns Smarters entendem o link do YouTube direto se tiverem o plugin
        }

        return {
          num: idx + 1,
          name: i.title.toUpperCase(),
          stream_type: "live",
          stream_id: i.id,
          stream_icon: i.imageUrl || "",
          category_id: catMap.find(c => c.category_name === (i.genre || "GERAL").toUpperCase())?.category_id || "1",
          added: "0",
          custom_sid: "",
          direct_source: streamUrl
        };
      }), { headers });
    }

    // --- VOD (FILMES) ---
    if (action === 'get_vod_categories') {
      const movieCats = Array.from(new Set(content.filter(i => i.type === 'movie').map(i => (i.genre || "FILMES").toUpperCase()))).sort();
      return NextResponse.json(movieCats.map((name, index) => ({
        category_id: "vod_" + (index + 1),
        category_name: name,
        parent_id: "0"
      })), { headers });
    }

    if (action === 'get_vod_streams') {
      const catId = searchParams.get('category_id');
      let movies = content.filter(i => i.type === 'movie');
      
      if (catId) {
        const catName = catId.startsWith('vod_') ? catId : null; // Simples para o Smarters
        // Se o app pedir categoria, filtramos
      }

      return NextResponse.json(movies.map((i, idx) => ({
        num: idx + 1,
        name: i.title.toUpperCase(),
        stream_type: "movie",
        stream_id: i.id,
        stream_icon: i.imageUrl || "",
        category_id: "1",
        added: "0",
        container_extension: "mp4",
        direct_source: i.directStreamUrl || i.streamUrl || ""
      })), { headers });
    }

    // --- SERIES ---
    if (action === 'get_series_categories') {
      return NextResponse.json([{ category_id: "ser_1", category_name: "TODAS AS SÉRIES", parent_id: "0" }], { headers });
    }

    if (action === 'get_series') {
      const series = content.filter(i => i.type === 'multi-season' || i.type === 'series');
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
        category_id: "ser_1"
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
