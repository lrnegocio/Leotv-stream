
import { NextRequest, NextResponse } from 'next/server';
import { getRemoteContent, validateDeviceLogin } from '@/lib/store';

export const dynamic = 'force-dynamic';

/**
 * XTREAM CODES API SOBERANA v160
 * Separação rígida de Canais, Filmes e Séries.
 * Compatibilidade total com Smarters, XCIPTV e Televizo.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get('username');
  const password = searchParams.get('password');
  const action = searchParams.get('action');

  if (!username || !password) {
    return NextResponse.json({ user_info: { auth: 0 } });
  }

  // No sistema do Mestre Léo, o PIN é o usuário e a senha
  const loginRes = await validateDeviceLogin(username, 'iptv_app');
  if (loginRes.error) {
    return NextResponse.json({ user_info: { auth: 0 } });
  }

  const user = loginRes.user;

  if (!action) {
    return NextResponse.json({
      user_info: {
        auth: 1,
        status: "Active",
        exp_date: user.expiryDate ? Math.floor(new Date(user.expiryDate).getTime() / 1000) : "1999999999",
        is_trial: user.subscriptionTier === 'test' ? "1" : "0",
        active_cons: "0",
        max_connections: String(user.maxScreens),
        username: user.pin
      },
      server_info: {
        url: req.nextUrl.origin,
        port: "80",
        https_port: "443",
        server_protocol: "https",
        timezone: "America/Sao_Paulo",
        timestamp_now: Math.floor(Date.now() / 1000)
      }
    });
  }

  const allItems = await getRemoteContent();

  // --- LÓGICA DE CATEGORIAS ---
  if (action === 'get_live_categories') {
    const liveItems = allItems.filter(i => i.type === 'channel');
    const genres = Array.from(new Set(liveItems.map(i => i.genre))).sort();
    return NextResponse.json(genres.map((g, idx) => ({ category_id: String(idx + 1), category_name: g, parent_id: 0 })));
  }

  if (action === 'get_vod_categories') {
    const vodItems = allItems.filter(i => i.type === 'movie');
    const genres = Array.from(new Set(vodItems.map(i => i.genre))).sort();
    return NextResponse.json(genres.map((g, idx) => ({ category_id: String(idx + 1), category_name: g, parent_id: 0 })));
  }

  if (action === 'get_series_categories') {
    const seriesItems = allItems.filter(i => i.type === 'series' || i.type === 'multi-season');
    const genres = Array.from(new Set(seriesItems.map(i => i.genre))).sort();
    return NextResponse.json(genres.map((g, idx) => ({ category_id: String(idx + 1), category_name: g, parent_id: 0 })));
  }

  // --- LÓGICA DE STREAMS ---
  if (action === 'get_live_streams') {
    const catId = searchParams.get('category_id');
    const liveItems = allItems.filter(i => i.type === 'channel');
    const genres = Array.from(new Set(liveItems.map(i => i.genre))).sort();
    const targetGenre = catId ? genres[parseInt(catId) - 1] : null;
    const filtered = targetGenre ? liveItems.filter(i => i.genre === targetGenre) : liveItems;

    return NextResponse.json(filtered.map(i => ({
      num: i.id,
      name: i.title,
      stream_type: "live",
      stream_id: i.id,
      stream_icon: i.imageUrl || "",
      category_id: catId || "1",
      direct_source: i.streamUrl,
      added: "1600000000"
    })));
  }

  if (action === 'get_vod_streams') {
    const catId = searchParams.get('category_id');
    const vodItems = allItems.filter(i => i.type === 'movie');
    const genres = Array.from(new Set(vodItems.map(i => i.genre))).sort();
    const targetGenre = catId ? genres[parseInt(catId) - 1] : null;
    const filtered = targetGenre ? vodItems.filter(i => i.genre === targetGenre) : vodItems;

    return NextResponse.json(filtered.map(i => ({
      num: i.id,
      name: i.title,
      stream_type: "movie",
      stream_id: i.id,
      stream_icon: i.imageUrl || "",
      category_id: catId || "1",
      direct_source: i.streamUrl,
      added: "1600000000"
    })));
  }

  if (action === 'get_series') {
    const catId = searchParams.get('category_id');
    const seriesItems = allItems.filter(i => i.type === 'series' || i.type === 'multi-season');
    const genres = Array.from(new Set(seriesItems.map(i => i.genre))).sort();
    const targetGenre = catId ? genres[parseInt(catId) - 1] : null;
    const filtered = targetGenre ? seriesItems.filter(i => i.genre === targetGenre) : seriesItems;

    return NextResponse.json(filtered.map(i => ({
      num: i.id,
      name: i.title,
      series_id: i.id,
      cover: i.imageUrl || "",
      plot: i.description || "",
      cast: "Léo TV Stream",
      director: "Mestre Léo",
      genre: i.genre,
      releaseDate: "",
      last_modified: "1600000000",
      rating: "10",
      category_id: catId || "1"
    })));
  }

  return NextResponse.json([]);
}
