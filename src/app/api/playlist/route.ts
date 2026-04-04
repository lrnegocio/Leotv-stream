
import { NextRequest, NextResponse } from 'next/server';
import { generateM3UPlaylist } from '@/lib/store';

export const dynamic = 'force-dynamic';

/**
 * API PLAYLIST v28.0 - AUTO-DETECÇÃO DE ORIGEM
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pin = searchParams.get('pin');
    const host = req.headers.get('host') || "";
    const protocol = req.headers.get('x-forwarded-proto') || "https";
    const origin = `${protocol}://${host}`;

    if (!pin) {
      return new NextResponse("#EXTM3U\n#EXTINF:-1,PIN OBRIGATORIO\n", { 
        status: 200,
        headers: { 'Content-Type': 'application/x-mpegurl; charset=utf-8', 'Access-Control-Allow-Origin': '*' }
      });
    }

    const m3uContent = await generateM3UPlaylist(pin, origin);
    
    return new NextResponse(m3uContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/x-mpegurl; charset=utf-8',
        'Content-Disposition': 'attachment; filename="leotv.m3u"',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store', 
      },
    });
  } catch (error: any) {
    return new NextResponse("#EXTM3U\n#EXTINF:-1,ERRO NO SERVIDOR DE PLAYLIST\n", { 
      status: 200,
      headers: { 'Content-Type': 'application/x-mpegurl; charset=utf-8', 'Access-Control-Allow-Origin': '*' }
    });
  }
}
