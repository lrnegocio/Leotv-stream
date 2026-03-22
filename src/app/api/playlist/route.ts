
import { NextRequest, NextResponse } from 'next/server';
import { generateM3UPlaylist } from '@/lib/store';

/**
 * SERVIDOR DE PLAYLIST MASTER - LÉO STREAM
 * Endpoint para aplicativos de IPTV externos (IPTV Smarters, etc)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pin = searchParams.get('pin');

    if (!pin) {
      return new NextResponse("#EXTM3U\n#EXTINF:-1,PIN OBRIGATORIO", { 
        status: 200,
        headers: { 'Content-Type': 'application/x-mpegurl' }
      });
    }

    const m3uContent = await generateM3UPlaylist(pin);
    
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
    return new NextResponse("#EXTM3U\n#EXTINF:-1,ERRO NO SERVIDOR P2P", { status: 200 });
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
