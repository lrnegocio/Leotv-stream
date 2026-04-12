import { NextRequest, NextResponse } from 'next/server';
import { getRemoteContent } from '@/lib/store';

export const dynamic = 'force-dynamic';

/**
 * MOTOR DE PLAYLIST M3U SOBERANO v156
 * Gera uma lista compatível com todos os aplicativos de IPTV.
 */
export async function GET(req: NextRequest) {
  try {
    const items = await getRemoteContent();
    let m3u = "#EXTM3U\n";

    items.forEach(item => {
      const category = item.genre || "LÉO TV AO VIVO";
      const logo = item.imageUrl || "";
      const streamUrl = item.streamUrl || "";

      if (streamUrl) {
        m3u += `#EXTINF:-1 tvg-logo="${logo}" group-title="${category}",${item.title}\n`;
        m3u += `${streamUrl}\n`;
      }
    });

    return new NextResponse(m3u, {
      headers: {
        'Content-Type': 'application/x-mpegurl',
        'Content-Disposition': 'attachment; filename="playlist.m3u"',
        'Access-Control-Allow-Origin': '*',
      }
    });
  } catch (error) {
    return new NextResponse("#EXTM3U\n#EXTINF:-1,Erro ao gerar lista\n", { status: 500 });
  }
}
