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
        }
      });
    }

    // ECONOMIA DE DADOS: Cache de 1 hora para o arquivo M3U
    const m3uContent = await generateM3UPlaylist(pin);
    
    return new NextResponse(m3uContent, {
      status: 200,
      headers: {
        'Content-Type': 'application/x-mpegurl; charset=utf-8',
        'Content-Disposition': 'attachment; filename="playlist.m3u"',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=600', // Cache Master
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