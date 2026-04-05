
import { NextRequest, NextResponse } from 'next/server';
import { validateDeviceLogin, getRemoteContent } from '@/lib/store';

export const dynamic = 'force-dynamic';

/**
 * SINTONIZADOR UNIVERSAL v35.0 - ISOLAMENTO IPTV TOTAL
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { username: string; password: string; id: string } }
) {
  try {
    const { username, id } = await params;
    const streamId = id.split('.')[0]; 

    const login = await validateDeviceLogin(username, "xtream_api_call");
    if (login.error) return new NextResponse("Acesso Negado", { status: 403 });

    const content = await getRemoteContent(true); // Modo IPTV Ativo
    const item = content.find(i => i.id === streamId);

    if (!item) return new NextResponse("Canal não encontrado ou Sem Link Secundário", { status: 404 });

    // ISOLAMENTO TOTAL: No IPTV, usamos EXCLUSIVAMENTE o link direto
    let streamUrl = item.directStreamUrl;
    if (!streamUrl) return new NextResponse("Sinal Direto Indisponível", { status: 404 });

    const lowerUrl = streamUrl.toLowerCase();

    // SINTONIZADOR EMBED MASTER PARA APPS DE IPTV
    if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
      const vidId = streamUrl.includes('v=') ? streamUrl.split('v=')[1]?.split('&')[0] : streamUrl.split('youtu.be/')[1]?.split('?')[0];
      return NextResponse.redirect(`https://www.youtube-nocookie.com/embed/${vidId}?autoplay=1`);
    }

    if (lowerUrl.includes('dailymotion.com')) {
      const vidId = streamUrl.split('/video/')[1]?.split('?')[0];
      return NextResponse.redirect(`https://www.dailymotion.com/embed/video/${vidId}?autoplay=1`);
    }

    if (lowerUrl.includes('pornhub.com')) {
      const viewKeyMatch = streamUrl.match(/viewkey=([a-z0-9]+)/i);
      const viewKey = viewKeyMatch ? viewKeyMatch[1] : null;
      if (viewKey) return NextResponse.redirect(`https://www.pornhub.com/embed/${viewKey}`);
    }

    if (lowerUrl.includes('xvideos.com')) {
      const vidIdMatch = streamUrl.match(/video\.?([a-z0-9]+)/i) || streamUrl.match(/\/video([0-9]+)/);
      const vidId = vidIdMatch ? vidIdMatch[1] : null;
      if (vidId) return NextResponse.redirect(`https://www.xvideos.com/embedframe/${vidId}`);
    }

    // Rei dos Canais / Blinder (Sempre via Proxy para IPTV se for link direto instável)
    if (lowerUrl.includes('redecanais') || lowerUrl.includes('blinder.space')) {
      const host = req.headers.get('host');
      const protocol = req.headers.get('x-forwarded-proto') || 'https';
      return NextResponse.redirect(`${protocol}://${host}/api/proxy?url=${encodeURIComponent(streamUrl)}`);
    }

    return NextResponse.redirect(streamUrl);
  } catch (error) {
    return new NextResponse("Erro Interno", { status: 500 });
  }
}
