
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';
import { getRemoteContent } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const headers = {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
  };

  try {
    const { searchParams } = new URL(req.url);
    const username = searchParams.get('username'); 
    const action = searchParams.get('action');

    if (!username) return NextResponse.json({ user_info: { auth: 0 } }, { headers });

    // BUSCA DE USUÁRIO MASTER
    const isMaster = username === 'adm77x2p';
    let activeUser: any = null;

    if (isMaster) {
      activeUser = { pin: 'adm77x2p', is_blocked: false, is_adult_enabled: true, expiry_date: null, subscription_tier: 'lifetime', max_screens: 999 };
    } else {
      // FIX MESTRE LÉO: Supabase retorna colunas snake_case.
      const { data, error } = await supabase.from('users').select('*').eq('pin', username).maybeSingle();
      if (error || !data || data.is_blocked) return NextResponse.json({ user_info: { auth: 0 } }, { headers });
      activeUser = data;
    }

    const baseUrl = req.nextUrl.origin;

    if (!action) {
      const expDate = activeUser.expiry_date || activeUser.expiryDate;
      const subTier = activeUser.subscription_tier || activeUser.subscriptionTier;
      const maxScreens = activeUser.max_screens || activeUser.maxScreens;

      return NextResponse.json({
        user_info: {
          auth: 1,
          status: "Active",
          exp_date: expDate ? Math.floor(new Date(expDate).getTime() / 1000).toString() : "1999999999",
          is_trial: subTier === 'test' ? "1" : "0",
          active_cons: "1",
          max_connections: maxScreens?.toString() || "1",
          allowed_output_formats: ["m3u8", "ts", "mp4", "mkv", "mpeg"]
        },
        server_info: {
          url: baseUrl.replace('https://', '').replace('http://', ''),
          port: "443",
          https_port: "443",
          server_protocol: "https",
          rtmp_port: "80",
          timezone: "America/Sao_Paulo",
          timestamp: Math.floor(Date.now() / 1000),
          name: "Léo Tv Master Server"
        }
      }, { headers });
    }

    const content = await getRemoteContent(true);

    if (action === 'get_live_categories') {
      const cats = Array.from(new Set(content.filter(i => i.type === 'channel').map(i => (i.genre || "GERAL").toUpperCase()))).sort();
      return NextResponse.json(cats.map((name, idx) => ({ category_id: (idx + 1).toString(), category_name: name, parent_id: "0" })), { headers });
    }

    if (action === 'get_vod_categories') {
      const cats = Array.from(new Set(content.filter(i => i.type === 'movie').map(i => (i.genre || "FILMES").toUpperCase()))).sort();
      return NextResponse.json(cats.map((name, idx) => ({ category_id: (idx + 1000).toString(), category_name: name, parent_id: "0" })), { headers });
    }

    if (action === 'get_series_categories') {
      const cats = Array.from(new Set(content.filter(i => i.type === 'series' || i.type === 'multi-season').map(i => (i.genre || "SÉRIES").toUpperCase()))).sort();
      return NextResponse.json(cats.map((name, idx) => ({ category_id: (idx + 2000).toString(), category_name: name, parent_id: "0" })), { headers });
    }

    if (action === 'get_live_streams') {
      let items = content.filter(i => i.type === 'channel');
      const isAdultEnabled = activeUser.is_adult_enabled || activeUser.isAdultEnabled;
      if (!isAdultEnabled) items = items.filter(i => !i.isRestricted);
      
      return NextResponse.json(items.map(i => ({
        num: i.id,
        name: i.title.toUpperCase(),
        stream_id: i.id,
        stream_icon: i.imageUrl || "",
        added: "1700000000",
        category_id: "1",
        direct_source: i.directStreamUrl || i.streamUrl || "",
        stream_type: "live"
      })), { headers });
    }

    if (action === 'get_vod_streams') {
      let items = content.filter(i => i.type === 'movie');
      const isAdultEnabled = activeUser.is_adult_enabled || activeUser.isAdultEnabled;
      if (!isAdultEnabled) items = items.filter(i => !i.isRestricted);

      return NextResponse.json(items.map(i => ({
        num: i.id,
        name: i.title.toUpperCase(),
        stream_id: i.id,
        stream_icon: i.imageUrl || "",
        added: "1700000000",
        category_id: "1000",
        direct_source: i.directStreamUrl || i.streamUrl || "",
        stream_type: "movie"
      })), { headers });
    }

    if (action === 'get_series') {
      let items = content.filter(i => i.type === 'series' || i.type === 'multi-season');
      return NextResponse.json(items.map(i => ({
        num: i.id,
        name: i.title.toUpperCase(),
        series_id: i.id,
        cover: i.imageUrl || "",
        plot: i.description || "Série Léo Tv Master",
        genre: i.genre || "Série",
        category_id: "2000"
      })), { headers });
    }

    return NextResponse.json([], { headers });
  } catch (err) {
    return NextResponse.json({ user_info: { auth: 0 } }, { headers });
  }
}
