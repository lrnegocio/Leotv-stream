
import { NextRequest, NextResponse } from 'next/server';
import { validateDeviceLogin, getRemoteContent, getRemoteGames } from '@/lib/store';

export const dynamic = 'force-dynamic';

/**
 * SINTONIZADOR UNIVERSAL v48.0 - MOVIES & GAMES ISOLAMENTO IPTV
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

    // BUSCA TANTO CONTEÚDO QUANTO JOGOS PARA O IPTV
    const content = await getRemoteContent(true);
    const games = await getRemoteGames();
    const item = [...content, ...games].find(i => i.id === streamId);

    if (!item) return new NextResponse("Não encontrado", { status: 404 });

    // SE FOR UM JOGO, REDIRECIONA PARA A INTERFACE DO PWA
    if (item.genre?.startsWith('ARENA: ')) {
       const host = req.headers.get('host');
       const protocol = req.headers.get('x-forwarded-proto') || 'https';
       return NextResponse.redirect(`${protocol}://${host}/user/home?id=${item.id}`);
    }

    let streamUrl = item.directStreamUrl;
    if (!streamUrl) return new NextResponse("Sinal Indisponível", { status: 404 });

    const lowerUrl = streamUrl.toLowerCase();

    // FILTRO DE BYPASS PARA IPTV
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
