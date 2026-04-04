
import { NextRequest, NextResponse } from 'next/server';
import { generateM3UPlaylist } from '@/lib/store';

export const dynamic = 'force-dynamic';

/**
 * API PLAYLIST v26.0 - IMUNE A INTERNAL SERVER ERROR
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pin = searchParams.get('pin');

    if (!pin) {
      return new NextResponse("#EXTM3U\n#EXTINF:-1,PIN OBRIGATORIO\n", { 
        status: 200,
        headers: { 'Content-Type': 'application/x-mpegurl; charset=utf-8', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // Tenta gerar a lista com timeout de segurança
    const m3uContent = await generateM3UPlaylist(pin);
    
    return new NextResponse(m3uContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/x-mpegurl; charset=utf-8',
        'Content-Disposition': 'attachment; filename="leotv.m3u"',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, s-maxage=300', 
      },
    });
  } catch (error: any) {
    return new NextResponse("#EXTM3U\n#EXTINF:-1,ERRO INTERNO NO SERVIDOR\n", { 
      status: 200,
      headers: { 'Content-Type': 'application/x-mpegurl; charset=utf-8', 'Access-Control-Allow-Origin': '*' }
    });
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}
