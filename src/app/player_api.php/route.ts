
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username'); 
    const password = searchParams.get('password'); 
    const action = searchParams.get('action');

    if (!username || !password) {
      return NextResponse.json({ user_info: { auth: 0 } }, { status: 200, headers });
    }

    // Busca rápida do usuário
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('pin', username)
      .maybeSingle();

    if (userError || !user || user.isBlocked) {
      return NextResponse.json({ 
        user_info: { auth: 0, status: "Inactive", exp_date: "0" } 
      }, { status: 200, headers });
    }

    const expiry = user.expiryDate ? Math.floor(new Date(user.expiryDate).getTime() / 1000).toString() : "0";

    // Resposta básica de login
    if (!action) {
      return NextResponse.json({
        user_info: {
          auth: 1,
          username: user.pin,
          password: user.pin,
          status: "Active",
          exp_date: expiry,
          is_trial: user.subscriptionTier === 'test' ? "1" : "0",
          active_cons: "0",
          max_connections: user.maxScreens?.toString() || "1",
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

    // Busca de conteúdo limitada para evitar 500
    const { data: content, error: contentError } = await supabase
      .from('content')
      .select('*')
      .limit(2000)
      .order('title');

    if (contentError || !content) return NextResponse.json([], { headers });

    if (action === 'get_live_categories' || action === 'get_vod_categories' || action === 'get_series_categories') {
      const genres = Array.from(new Set(content.map(i => (i.genre || "GERAL").toUpperCase())));
      return NextResponse.json(genres.map((g, idx) => ({
        category_id: (idx + 1).toString(),
        category_name: g,
        parent_id: "0"
      })), { headers });
    }

    if (action === 'get_live_streams') {
      return NextResponse.json(content.filter(i => i.type === 'channel').map((i, idx) => ({
        num: (idx + 1),
        name: i.title.toUpperCase(),
        stream_type: "live",
        stream_id: i.id,
        stream_icon: i.imageUrl || "",
        category_id: "1",
        epg_channel_id: "",
        added: "0",
        custom_sid: "",
        direct_source: i.streamUrl || ""
      })), { headers });
    }

    if (action === 'get_vod_streams') {
      return NextResponse.json(content.filter(i => i.type === 'movie').map((i, idx) => ({
        num: (idx + 1),
        name: i.title.toUpperCase(),
        stream_type: "movie",
        stream_id: i.id,
        stream_icon: i.imageUrl || "",
        category_id: "1",
        container_extension: "mp4",
        added: "0",
        rating: "10"
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

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
