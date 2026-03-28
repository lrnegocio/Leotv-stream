
import { NextRequest, NextResponse } from 'next/server';
import { validateDeviceLogin, getRemoteContent } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET(
  req: NextRequest,
  { params }: { params: { username: string; password: string; id: string } }
) {
  try {
    const { username, password, id } = await params;
    const streamId = id.split('.')[0];

    const login = await validateDeviceLogin(username, "xtream_api_call");
    if (login.error) return new NextResponse("Acesso Negado", { status: 403 });

    const content = await getRemoteContent();
    
    // BUSCA XUI MASTER: Procura nos episódios de todas as séries salvas
    let streamUrl = "";
    content.forEach(item => {
      if (item.type === 'series' && item.episodes) {
        const ep = item.episodes.find(e => e.id === streamId);
        if (ep) streamUrl = ep.directStreamUrl || ep.streamUrl;
      } else if (item.type === 'multi-season' && item.seasons) {
        item.seasons.forEach(s => {
          const ep = s.episodes.find(e => e.id === streamId);
          if (ep) streamUrl = ep.directStreamUrl || ep.streamUrl;
        });
      }
    });

    if (!streamUrl) return new NextResponse("Episódio não encontrado", { status: 404 });

    return NextResponse.redirect(streamUrl);
  } catch (error) {
    return new NextResponse("Erro Interno", { status: 500 });
  }
}
