
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
    const item = content.find(i => i.id === streamId);

    if (!item) return new NextResponse("Filme não encontrado", { status: 404 });

    const streamUrl = item.directStreamUrl || item.streamUrl;
    if (!streamUrl) return new NextResponse("Sinal offline", { status: 404 });

    return NextResponse.redirect(streamUrl);
  } catch (error) {
    return new NextResponse("Erro Interno", { status: 500 });
  }
}
