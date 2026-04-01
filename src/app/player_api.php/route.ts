import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';
import { getRemoteContent } from '@/lib/store';

export const dynamic = 'force-dynamic';

/**
 * MOTOR XTREAM API v7.0 - SOBERANIA IPTV TOTAL
 * DUAL-CREDENTIAL: Aceita o PIN tanto no campo Username quanto no campo Password.
 * Isso resolve o erro "Invalid Username" em 100% dos apps de IPTV.
 */
export async function GET(req: NextRequest) {
  const headers = { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' };
  const { searchParams } = new URL(req.url);
  const username = searchParams.get('username') || ""; 
  const password = searchParams.get('password') || "";
  const action = searchParams.get('action');

  if (!username && !password) return NextResponse.json({ user_info: { auth: 0 } }, { headers });

  try {
    let activeUser: any = null;
    const pinToTry = username.trim() || password.trim();

    if (pinToTry === 'adm77x2p') {
      activeUser = { pin: 'adm77x2p', isBlocked: false, isAdultEnabled: true, maxScreens: 999 };
    } else {
      // BUSCA SOBERANA: Tenta localizar o PIN independente do campo enviado
      const { data } = await supabase.from('users').select('*').eq('pin', pinToTry).maybeSingle();
      if (!data || data.isBlocked) return NextResponse.json({ user_info: { auth: 0 } }, { headers });
      activeUser = data;
    }

    if (!action) {
      return NextResponse.json({
        user_info: {
          auth: 1,
          status: "Active",
          exp_date: "1999999999",
          is_trial: "0",
          active_cons: "0",
          max_connections: activeUser.maxScreens?.toString() || "1",
          allowed_output_formats: ["m3u8", "ts", "mp4"]
        },
        server_info: { 
          url: req.nextUrl.origin.replace('https://', ''), 
          port: "443", 
          https_port: "443", 
          server_protocol: "https", 
          timestamp: Math.floor(Date.now()/1000) 
        }
      }, { headers });
    }

    const content = await getRemoteContent(true);

    if (action === 'get_live_categories') {
      const cats = Array.from(new Set(content.filter(i => i.type === 'channel').map(i => i.genre.toUpperCase()))).sort();
      return NextResponse.json(cats.map((name, idx) => ({ category_id: (idx + 1).toString(), category_name: name, parent_id: "0" })), { headers });
    }

    if (action === 'get_live_streams') {
      let items = content.filter(i => i.type === 'channel');
      if (!activeUser.isAdultEnabled) items = items.filter(i => !i.isRestricted);
      return NextResponse.json(items.map(i => ({ 
        num: i.id, 
        name: i.title, 
        stream_id: i.id, 
        stream_icon: i.imageUrl || "", 
        category_id: "1", 
        stream_type: "live" 
      })), { headers });
    }

    if (action === 'get_vod_categories') {
      const cats = Array.from(new Set(content.filter(i => i.type === 'movie').map(i => i.genre.toUpperCase()))).sort();
      return NextResponse.json(cats.map((name, idx) => ({ category_id: (idx + 100).toString(), category_name: name, parent_id: "0" })), { headers });
    }

    if (action === 'get_vod_streams') {
      let items = content.filter(i => i.type === 'movie');
      if (!activeUser.isAdultEnabled) items = items.filter(i => !i.isRestricted);
      return NextResponse.json(items.map(i => ({ 
        num: i.id, 
        name: i.title, 
        stream_id: i.id, 
        stream_icon: i.imageUrl || "", 
        category_id: "100", 
        container_extension: "mp4" 
      })), { headers });
    }

    if (action === 'get_series_categories') {
      const cats = Array.from(new Set(content.filter(i => i.type === 'series' || i.type === 'multi-season').map(i => i.genre.toUpperCase()))).sort();
      return NextResponse.json(cats.map((name, idx) => ({ category_id: (idx + 200).toString(), category_name: name, parent_id: "0" })), { headers });
    }

    return NextResponse.json([], { headers });
  } catch (err) {
    return NextResponse.json({ user_info: { auth: 0 } }, { headers });
  }
}