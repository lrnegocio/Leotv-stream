
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * TÚNEL MASTER v85.0 - OTIMIZADO PARA TODOS OS SINAIS
 * Agora lida com HLS (.m3u8), TS segments, MP4 e streams CORS-sensitive.
 * Suporte a RANGE habilitado para vídeos do Blinder e Archive.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) return new NextResponse("Sinal Ausente", { status: 400 });

  try {
    const requestHeaders = new Headers();
    
    // Suporte a Range - VITAL para vídeos diretos (Blinder/MP4)
    const range = req.headers.get('range');
    if (range) requestHeaders.set('Range', range);
    
    // Identidade Master para evitar bloqueios de bot
    requestHeaders.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
    requestHeaders.set('Accept', '*/*');
    
    const targetUrlObj = new URL(targetUrl);
    requestHeaders.set('Origin', targetUrlObj.origin);
    requestHeaders.set('Referer', targetUrlObj.origin + '/');

    const res = await fetch(targetUrl, { 
      headers: requestHeaders,
      cache: 'no-store',
      redirect: 'follow',
    });
    
    const responseHeaders = new Headers();
    
    // Mapeamento de cabeçalhos de vídeo críticos
    const allowedHeaders = [
      'content-type',
      'content-length',
      'content-range',
      'accept-ranges',
      'cache-control',
      'access-control-allow-origin',
      'access-control-allow-methods'
    ];
    
    res.headers.forEach((v, k) => {
      const lowerKey = k.toLowerCase();
      if (allowedHeaders.includes(lowerKey)) {
        responseHeaders.set(k, v);
      }
    });

    // Força liberação CORS total para o Player Client-Side
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, OPTIONS, HEAD');
    responseHeaders.set('Cache-Control', 'no-cache, no-store, must-revalidate');

    if (!res.body) return new Response(null, { status: res.status, headers: responseHeaders });

    return new Response(res.body, {
      status: res.status === 206 ? 206 : 200,
      headers: responseHeaders,
    });

  } catch (error: any) {
    console.error("Proxy Master Error:", error.message);
    return new Response(null, { status: 200, headers: { 'Access-Control-Allow-Origin': '*' } });
  }
}
