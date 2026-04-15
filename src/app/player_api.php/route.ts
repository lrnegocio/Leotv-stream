
import { NextRequest, NextResponse } from 'next/server';
import { getRemoteContent, validateDeviceLogin, getContentById, formatMasterLink } from '@/lib/store';

export const dynamic = 'force-dynamic';

/**
 * XTREAM CODES API SOBERANA v207
 * IDs Estáveis e links tunelados via Proxy Master.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const username = searchParams.get('username');
  const password = searchParams.get('password');
  const action = searchParams.get('action');

  if (!username || !password) {
    return NextResponse.json({ user_info: { auth: 0 } });
  }

  const loginRes = await validateDeviceLogin(username, 'iptv_app');
  if (loginRes.error) {
    return NextResponse.json({ user_info: { auth: 0 } });
  }

  const user = loginRes.user;
  const baseUrl = req.nextUrl.origin;
  const allItems = await getRemoteContent();

  const getStableId = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = ((hash << 5) - hash) + str.charCodeAt(i);
    return String(Math.abs(hash % 1000000));
  };

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
        url: baseUrl,
        port: "80",
        server_protocol: "http",
        timezone: "America/Sao_Paulo",
        timestamp_now: Math.floor(Date.now() / 1000)
      }
    });
  }

  if (action === 'get_live_categories' || action === 'get_vod_categories' || action === 'get_series_categories') {
    const filterType = action === 'get_live_categories' ? 'channel' : action === 'get_vod_categories' ? 'movie' : 'series';
    const genres = Array.from(new Set(allItems.filter(i => filterType === 'series' ? (i.type === 'series' || i.type === 'multi-season') : i.type === filterType).map(i => i.genre))).sort();
    return NextResponse.json(genres.map(g => ({ category_id: getStableId(g), category_name: g, parent_id: 0 })));
  }

  if (action === 'get_live_streams' || action === 'get_vod_streams') {
    const catId = searchParams.get('category_id');
    const type = action === 'get_live_streams' ? 'channel' : 'movie';
    let filtered = allItems.filter(i => i.type === type);
    if (catId) filtered = filtered.filter(i => getStableId(i.genre) === catId);

    return NextResponse.json(filtered.map(i => ({
      num: i.id,
      name: i.title,
      stream_type: type === 'channel' ? "live" : "movie",
      stream_id: i.id,
      stream_icon: i.imageUrl || "",
      category_id: getStableId(i.genre),
      // Tunela o link para os Apps de TV
      direct_source: formatMasterLink(i.streamUrl, baseUrl),
      added: "1600000000",
      container_extension: type === 'movie' ? "mp4" : null
    })));
  }

  if (action === 'get_series') {
    const catId = searchParams.get('category_id');
    let filtered = allItems.filter(i => i.type === 'series' || i.type === 'multi-season');
    if (catId) filtered = filtered.filter(i => getStableId(i.genre) === catId);

    return NextResponse.json(filtered.map(i => ({
      num: i.id,
      name: i.title,
      series_id: i.id,
      cover: i.imageUrl || "",
      plot: i.description || "Sinal Master Léo TV",
      cast: "Léo TV",
      director: "Mestre Léo",
      genre: i.genre,
      rating: "10",
      category_id: getStableId(i.genre)
    })));
  }

  if (action === 'get_series_info') {
    const seriesId = searchParams.get('series_id');
    if (!seriesId) return NextResponse.json({});
    const series = await getContentById(seriesId);
    if (!series) return NextResponse.json({});

    const formattedEpisodes: any = {};
    const processEp = (ep: any, sNum: number) => ({
      id: ep.id,
      episode_num: ep.number,
      title: ep.title || `Episódio ${ep.number}`,
      container_extension: "mp4",
      season: sNum,
      // Tunela o link do episódio via Proxy
      direct_source: formatMasterLink(ep.streamUrl, baseUrl)
    });

    if (series.type === 'multi-season' && series.seasons) {
      series.seasons.forEach((s: any) => {
        formattedEpisodes[String(s.number)] = (s.episodes || []).map((ep: any) => processEp(ep, s.number));
      });
    } else if (series.type === 'series' && series.episodes) {
      formattedEpisodes["1"] = series.episodes.map((ep: any) => processEp(ep, 1));
    }

    return NextResponse.json({
      seasons: series.type === 'multi-season' ? (series.seasons || []).map((s: any) => ({
        season_number: s.number,
        name: `Temporada ${s.number}`,
        episode_count: s.episodes?.length || 0
      })) : [{ season_number: 1, name: "Temporada 1", episode_count: series.episodes?.length || 0 }],
      info: { name: series.title, cover: series.imageUrl, plot: series.description, genre: series.genre },
      episodes: formattedEpisodes
    });
  }

  return NextResponse.json([]);
}
