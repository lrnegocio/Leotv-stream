
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * TÚNEL MASTER v106.0 - HIGH PERFORMANCE STREAMING
 * Suporte total a Range Requests (Status 206) para filmes pesados e sinais IPTV (.ts).
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) return new NextResponse("Sinal Master Ausente", { status: 400 });

  try {
    const requestHeaders = new Headers();
    const range = req.headers.get('range');
    if (range) requestHeaders.set('Range', range);
    
    // Identidade Master para evitar bloqueios
    requestHeaders.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
    requestHeaders.set('Referer', new URL(targetUrl).origin);
    
    const res = await fetch(targetUrl, { 
      headers: requestHeaders,
      cache: 'no-store',
      redirect: 'follow',
    });
    
    const responseHeaders = new Headers();
    // Cabeçalhos críticos para Streaming Real
    const allowedHeaders = [
      'content-type', 
      'content-length', 
      'content-range', 
      'accept-ranges', 
      'cache-control',
      'last-modified',
      'etag'
    ];
    
    res.headers.forEach((v, k) => {
      const lowerKey = k.toLowerCase();
      if (allowedHeaders.includes(lowerKey)) responseHeaders.set(k, v);
    });

    // Permissões Universais CORS
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', '*');

    if (!res.body) return new Response(null, { status: res.status, headers: responseHeaders });

    // O segredo do Status 206: Permite que o player peça pedaços do vídeo sem sair da tela cheia
    return new Response(res.body, {
      status: res.status === 206 ? 206 : res.status,
      headers: responseHeaders,
    });

  } catch (error: any) {
    // Fallback de segurança para manter o player vivo
    return new Response(null, { status: 200, headers: { 'Access-Control-Allow-Origin': '*' } });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    },
  });
}
