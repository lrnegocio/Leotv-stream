import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * TÚNEL MASTER v98.0 - SOBERANO
 * Suporte total a Range (Blinder/Archive/MP4) e HLS (.m3u8/.ts)
 * Resolvendo travamentos de sinais pesados e erros de CORS.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) return new NextResponse("Sinal Ausente", { status: 400 });

  try {
    const requestHeaders = new Headers();
    
    // SUPORTE A RANGE - CRÍTICO PARA FILMES MP4 (BLINDER/ARCHIVE)
    const range = req.headers.get('range');
    if (range) requestHeaders.set('Range', range);
    
    requestHeaders.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
    
    const targetUrlObj = new URL(targetUrl);
    requestHeaders.set('Origin', targetUrlObj.origin);
    requestHeaders.set('Referer', targetUrlObj.origin + '/');

    const res = await fetch(targetUrl, { 
      headers: requestHeaders,
      cache: 'no-store',
      redirect: 'follow',
    });
    
    const responseHeaders = new Headers();
    
    const allowedHeaders = [
      'content-type',
      'content-length',
      'content-range',
      'accept-ranges',
      'cache-control'
    ];
    
    res.headers.forEach((v, k) => {
      const lowerKey = k.toLowerCase();
      if (allowedHeaders.includes(lowerKey)) {
        responseHeaders.set(k, v);
      }
    });

    // LIBERAÇÃO CORS TOTAL
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, OPTIONS, HEAD');
    responseHeaders.set('Access-Control-Allow-Headers', '*');

    if (!res.body) return new Response(null, { status: res.status, headers: responseHeaders });

    return new Response(res.body, {
      status: res.status === 206 ? 206 : 200,
      headers: responseHeaders,
    });

  } catch (error: any) {
    return new Response(null, { status: 200, headers: { 'Access-Control-Allow-Origin': '*' } });
  }
}
