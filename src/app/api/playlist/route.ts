
import { NextRequest, NextResponse } from 'next/server';
import { generateM3UPlaylist } from '@/lib/store';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const pin = searchParams.get('pin');

    if (!pin) {
      return new NextResponse("#EXTM3U\n#EXTINF:-1,PIN OBRIGATORIO NO LINK\n", { 
        status: 200,
        headers: { 
          'Content-Type': 'application/x-mpegurl; charset=utf-8',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Cache-Control': 'no-store, no-cache, must-revalidate'
        }
      });
    }

    const m3uContent = await generateM3UPlaylist(pin);
    
    // Cabeçalhos de ultra-compatibilidade para apps de IPTV (Smarters, etc.)
    return new NextResponse(m3uContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/x-mpegurl; charset=utf-8',
        'Content-Disposition': 'inline; filename="playlist.m3u"',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Content-Type-Options': 'nosniff'
      },
    });
  } catch (error: any) {
    return new NextResponse("#EXTM3U\n#EXTINF:-1,ERRO NO SERVIDOR MASTER\n", { 
      status: 200,
      headers: { 
        'Content-Type': 'application/x-mpegurl; charset=utf-8',
        'Access-Control-Allow-Origin': '*'
      }
    });
  }
}

export async function POST(req: NextRequest) {
  return GET(req);
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}
