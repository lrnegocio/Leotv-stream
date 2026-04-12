import { NextRequest, NextResponse } from 'next/server';
import { getRemoteContent, validateResellerLogin } from '@/lib/store';

export const dynamic = 'force-dynamic';

/**
 * XTREAM CODES API SOBERANA v156
 * Permite que apps de IPTV conectem diretamente à sua rede.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get('username');
  const password = searchParams.get('password');
  const action = searchParams.get('action');

  // Simulação de login básica para compatibilidade
  if (!username || !password) {
    return NextResponse.json({ user_info: { auth: 0 } });
  }

  // Resposta padrão de login do Xtream Codes
  if (!action) {
    return NextResponse.json({
      user_info: {
        auth: 1,
        status: "Active",
        exp_date: "1999999999",
        is_trial: "0",
        active_cons: "0",
        max_connections: "999",
        username: username
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

  if (action === 'get_live_categories') {
    const genres = Array.from(new Set(items.map(i => i.genre))).sort();
    return NextResponse.json(genres.map((g, idx) => ({ category_id: String(idx + 1), category_name: g, parent_id: 0 })));
  }

  if (action === 'get_live_streams') {
    const catId = searchParams.get('category_id');
    const genres = Array.from(new Set(items.map(i => i.genre))).sort();
    const targetGenre = catId ? genres[parseInt(catId) - 1] : null;

    const filtered = targetGenre ? items.filter(i => i.genre === targetGenre) : items;

    return NextResponse.json(filtered.map(i => ({
      num: i.id,
      name: i.title,
      stream_type: "live",
      stream_id: i.id,
      stream_icon: i.imageUrl || "",
      epg_channel_id: "",
      added: "1600000000",
      category_id: catId || "1",
      custom_sid: "",
      tv_archive: 0,
      direct_source: i.streamUrl
    })));
  }

  return NextResponse.json([]);
}
