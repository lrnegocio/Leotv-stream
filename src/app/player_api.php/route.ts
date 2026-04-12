
import { NextRequest, NextResponse } from 'next/server';
import { getRemoteContent, validateDeviceLogin } from '@/lib/store';

export const dynamic = 'force-dynamic';

/**
 * XTREAM CODES API SOBERANA v157
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

  const items = await getRemoteContent();

  if (action === 'get_live_categories' || action === 'get_vod_categories' || action === 'get_series_categories') {
    const genres = Array.from(new Set(items.map(i => i.genre))).sort();
    return NextResponse.json(genres.map((g, idx) => ({ category_id: String(idx + 1), category_name: g, parent_id: 0 })));
  }

  if (action === 'get_live_streams' || action === 'get_vod_streams' || action === 'get_series') {
    const catId = searchParams.get('category_id');
    const genres = Array.from(new Set(items.map(i => i.genre))).sort();
    const targetGenre = catId ? genres[parseInt(catId) - 1] : null;

    const filtered = targetGenre ? items.filter(i => i.genre === targetGenre) : items;

    return NextResponse.json(filtered.map(i => ({
      num: i.id,
      name: i.title,
      stream_type: i.type === 'channel' ? "live" : "vod",
      stream_id: i.id,
      stream_icon: i.imageUrl || "",
      category_id: catId || "1",
      direct_source: i.streamUrl,
      added: "1600000000"
    })));
  }

  return NextResponse.json([]);
}
