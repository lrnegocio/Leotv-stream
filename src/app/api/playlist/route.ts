
import { NextRequest, NextResponse } from 'next/server';
import { getRemoteContent } from '@/lib/store';

export const dynamic = 'force-dynamic';

/**
 * MOTOR DE PLAYLIST M3U SOBERANO v191
 * Suporte a episódios de séries expandidos para compatibilidade total.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pin = searchParams.get('pin') || 'ACESSO';
    
    const host = req.headers.get('host');
    const protocol = 'http'; 
    const baseUrl = `${protocol}://${host}`;

    const items = await getRemoteContent();
    let m3u = "#EXTM3U\n";

    items.forEach(item => {
      const category = item.genre || "LÉO TV AO VIVO";
      const logo = item.imageUrl || "";

      // Canais e Filmes (Simples)
      if (item.type === 'channel' || item.type === 'movie') {
        let streamUrl = item.streamUrl || "";
        if (streamUrl) {
          if (streamUrl.startsWith('http:') || streamUrl.includes('archive.org') || streamUrl.includes('blinder')) {
            streamUrl = `${baseUrl}/api/proxy?url=${encodeURIComponent(streamUrl)}`;
          }
          m3u += `#EXTINF:-1 tvg-logo="${logo}" group-title="${category}",${item.title}\n`;
          m3u += `${streamUrl}\n`;
        }
      } 
      // Séries (Expande episódios no M3U para aparecer em todos os apps)
      else if (item.type === 'series' || item.type === 'multi-season') {
        const episodes: any[] = [];
        
        if (item.type === 'series' && item.episodes) {
          item.episodes.forEach(ep => episodes.push({ ...ep, seasonNum: 1 }));
        } else if (item.type === 'multi-season' && item.seasons) {
          item.seasons.forEach(s => {
            if (s.episodes) s.episodes.forEach(ep => episodes.push({ ...ep, seasonNum: s.number }));
          });
        }

        episodes.forEach(ep => {
          let epUrl = ep.streamUrl || "";
          if (epUrl) {
            if (epUrl.startsWith('http:') || epUrl.includes('archive.org') || epUrl.includes('blinder')) {
              epUrl = `${baseUrl}/api/proxy?url=${encodeURIComponent(epUrl)}`;
            }
            const epTitle = `${item.title} - S${String(ep.seasonNum).padStart(2, '0')}E${String(ep.number).padStart(2, '0')} ${ep.title || ''}`;
            m3u += `#EXTINF:-1 tvg-logo="${logo}" group-title="${category}",${epTitle}\n`;
            m3u += `${epUrl}\n`;
          }
        });
      }
    });

    return new NextResponse(m3u, {
      headers: {
        'Content-Type': 'application/x-mpegurl',
        'Content-Disposition': `attachment; filename="leotv_${pin}.m3u"`,
        'Access-Control-Allow-Origin': '*',
      }
    });
  } catch (error) {
    return new NextResponse("#EXTM3U\n#EXTINF:-1,Erro ao gerar lista Master\n", { status: 500 });
  }
}
