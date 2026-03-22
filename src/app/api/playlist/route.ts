import { NextRequest, NextResponse } from 'next/server';
import { generateM3UPlaylist } from '@/lib/store';

/**
 * SERVIDOR DE PLAYLIST MASTER - LÉO STREAM
 * Endpoint para aplicativos de IPTV externos (IPTV Smarters, etc)
 * URL: /api/playlist?pin=SEU_PIN
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pin = searchParams.get('pin');

    if (!pin) {
      return new NextResponse("PIN é obrigatório para acessar o servidor.", { 
        status: 400,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' }
      });
    }

    const m3uContent = await generateM3UPlaylist(pin);
    
    // Configura headers para o sinal ser reconhecido como M3U real em qualquer app
    return new NextResponse(m3uContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/x-mpegurl',
        'Content-Disposition': 'inline; filename="playlist.m3u"',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    });
  } catch (error: any) {
    console.error("Erro Crítico API Playlist:", error);
    return new NextResponse("Erro interno no servidor P2P.", { status: 500 });
  }
}