
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase-client';
import { getRemoteContent, getRemoteGames } from '@/lib/store';

export const dynamic = 'force-dynamic';

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
    const pinsToTry = Array.from(new Set([username, password])).filter(p => p.length > 0);
    
    for (const pin of pinsToTry) {
      if (pin.toLowerCase() === 'adm77x2p') {
        activeUser = { pin: 'adm77x2p', isBlocked: false, isAdultEnabled: true, isGamesEnabled: true, maxScreens: 999 };
        break;
      }
      
      const { data } = await supabase
        .from('users')
        .select('*')
        .eq('pin', pin.toUpperCase().trim())
        .maybeSingle();

      if (data && !data.isBlocked) {
        if (data.expiryDate && new Date(data.expiryDate) < new Date()) continue;
        activeUser = data;
        break;
      }
    }

    if (!activeUser) {
      return NextResponse.json({ 
        user_info: { auth: 0, status: "Acesso Negado", message: "PIN INVÁLIDO OU EXPIRADO" } 
      }, { headers });
    }

    // No IPTV, só mostramos itens com directStreamUrl (ISOLAMENTO v39)
    const content = await getRemoteContent(true);

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
        server_info: { 
          url: req.nextUrl.origin.replace('https://', '').replace('http://', ''), 
          port: "443", 
          https_port: "443", 
          server_protocol: "https", 
          mac_device_id: null,
          timestamp: Math.floor(Date.now()/1000) 
        }
      }, { headers });
    }

    if (action === 'get_live_categories') {
      const cats = Array.from(new Set(content.filter(i => i.type === 'channel').map(i => i.genre.toUpperCase()))).sort();
      return NextResponse.json(cats.map((name, idx) => ({ category_id: (idx + 1).toString(), category_name: name, parent_id: "0" })), { headers });
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
        num: i.id, 
        name: i.title.toUpperCase(), 
        stream_id: i.id, 
        stream_icon: i.imageUrl || "", 
        category_id: catId || "1", 
        stream_type: "live" 
      })), { headers });
    }

    if (action === 'get_vod_categories') {
      const cats = Array.from(new Set(content.filter(i => i.type === 'movie').map(i => i.genre.toUpperCase()))).sort();
      const response = cats.map((name, idx) => ({ category_id: (idx + 100).toString(), category_name: name, parent_id: "0" }));
      
      // Injeta Arena Games se autorizado
      if (activeUser.isGamesEnabled) {
        response.push({ category_id: "999", category_name: "🎮 ARENA GAMES LÉO TV", parent_id: "0" });
      }
      
      return NextResponse.json(response, { headers });
    }

    if (action === 'get_vod_streams') {
      const catId = searchParams.get('category_id');
      
      // Entrega Jogos na categoria 999
      if (catId === '999' && activeUser.isGamesEnabled) {
        const games = await getRemoteGames();
        return NextResponse.json(games.map(g => ({
          num: g.id,
          name: `🎮 ${g.title.toUpperCase()}`,
          stream_id: g.id,
          stream_icon: g.imageUrl || "",
          category_id: "999",
          container_extension: "mp4" // Dummy extension for IPTV compatibility
        })), { headers });
      }

      let items = content.filter(i => i.type === 'movie');
      if (!activeUser.isAdultEnabled) items = items.filter(i => !i.isRestricted);
      
      if (catId) {
        const cats = Array.from(new Set(content.filter(i => i.type === 'movie').map(i => i.genre.toUpperCase()))).sort();
        const targetGenre = cats[parseInt(catId) - 100];
        if (targetGenre) items = items.filter(i => i.genre.toUpperCase() === targetGenre);
      }

      return NextResponse.json(items.map(i => ({ 
        num: i.id, 
        name: i.title.toUpperCase(), 
        stream_id: i.id, 
        stream_icon: i.imageUrl || "", 
        category_id: catId || "100", 
        container_extension: "mp4" 
      })), { headers });
    }

    return NextResponse.json([], { headers });
  } catch (err) {
    return NextResponse.json({ user_info: { auth: 0 } }, { headers });
  }
}
