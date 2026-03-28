import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Cache-Control': 'public, s-maxage=600', 
  };

  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username'); 
    const password = searchParams.get('password'); 
    const action = searchParams.get('action');

    if (!username || !password) {
      return NextResponse.json({ user_info: { auth: 0 } }, { status: 200, headers });
    }

    // Bypass Master para testes no PC sem gastar cota
    if (username === 'adm77x2p') {
      const masterInfo = {
        user_info: {
          auth: 1,
          username: "MESTRE LEO",
          status: "Active",
          exp_date: "1999999999",
          is_trial: "0",
          active_cons: "0",
          max_connections: "999"
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
      };
      
      if (!action) return NextResponse.json(masterInfo, { headers });
    }

    // Busca do usuário (PIN)
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

    // Categorias e Canais com Cache Master
    if (action === 'get_live_categories') {
      const { data: content } = await supabase.from('content').select('genre').eq('type', 'channel');
      const genres = Array.from(new Set(content?.map(i => (i.genre || "GERAL").toUpperCase()) || []));
      return NextResponse.json(genres.map((g, idx) => ({
        category_id: (idx + 1).toString(),
        category_name: g,
        parent_id: "0"
      })), { headers });
    }

    if (action === 'get_live_streams') {
      const { data: content } = await supabase.from('content').select('id,title,imageUrl,streamUrl,genre').eq('type', 'channel');
      return NextResponse.json(content?.map((i, idx) => ({
        num: (idx + 1),
        name: i.title.toUpperCase(),
        stream_type: "live",
        stream_id: i.id,
        stream_icon: i.imageUrl || "",
        category_id: "1",
        added: "0",
        direct_source: i.streamUrl || ""
      })) || [], { headers });
    }

    return NextResponse.json([], { headers });
  } catch (err) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 200, headers });
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
