import { NextRequest, NextResponse } from 'next/server';
import { getRemoteContent } from '@/lib/store';

export const dynamic = 'force-dynamic';

/**
 * MOTOR DE PLAYLIST M3U SOBERANO v189
 * Gera uma lista dinâmica baseada no IP/Domínio atual da VPS.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pin = searchParams.get('pin') || 'ACESSO';
    
    // Pega o domínio atual automaticamente (IP ou DNS)
    const host = req.headers.get('host');
    const protocol = host?.includes('localhost') ? 'http' : 'http'; // VPS usa Porta 80 HTTP
    const baseUrl = `${protocol}://${host}`;

    const items = await getRemoteContent();
    let m3u = "#EXTM3U\n";

    items.forEach(item => {
      const category = item.genre || "LÉO TV AO VIVO";
      const logo = item.imageUrl || "";
      let streamUrl = item.streamUrl || "";

      // Se o sinal for sensível ou HTTP, passamos pelo nosso Proxy interno
      if (streamUrl && (streamUrl.startsWith('http:') || streamUrl.includes('archive.org') || streamUrl.includes('blinder'))) {
        streamUrl = `${baseUrl}/api/proxy?url=${encodeURIComponent(streamUrl)}`;
      }

      if (streamUrl) {
        m3u += `#EXTINF:-1 tvg-logo="${logo}" group-title="${category}",${item.title}\n`;
        m3u += `${streamUrl}\n`;
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
