import { NextRequest, NextResponse } from 'next/server';
import { generateM3UPlaylist } from '@/lib/store';

/**
 * SERVIDOR DE PLAYLIST MASTER - LÉO STREAM
 * Endpoint para aplicativos de IPTV externos (IPTV Smarters, etc)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const pin = searchParams.get('pin');

  if (!pin) {
    return new NextResponse("PIN é obrigatório", { status: 400 });
  }

  try {
    const m3uContent = await generateM3UPlaylist(pin);
    
    return new NextResponse(m3uContent, {
      headers: {
        'Content-Type': 'application/x-mpegurl',
        'Content-Disposition': 'attachment; filename="playlist.m3u"',
      },
    });
  } catch (error) {
    return new NextResponse("Erro ao gerar playlist", { status: 500 });
  }
}
