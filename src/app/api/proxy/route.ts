
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * TÚNEL MASTER v16.0 - MOTOR DE STREAMING REAL 206
 * Suporte total a Partial Content para permitir "seek" (avançar/voltar)
 * em vídeos do Archive.org, blinder.space e CDNs de adultos.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) return new NextResponse("Sinal ausente", { status: 400 });

  try {
    const requestHeaders = new Headers();
    const range = req.headers.get('range');
    
    if (range) {
      requestHeaders.set('Range', range);
    }
    
    requestHeaders.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
    
    // Máscaras de Identidade Master
    if (targetUrl.includes('phncdn.com') || targetUrl.includes('pornhub.com')) {
      requestHeaders.set('Referer', 'https://www.pornhub.com/');
    } else if (targetUrl.includes('xvideos')) {
      requestHeaders.set('Referer', 'https://www.xvideos.com/');
    } else if (targetUrl.includes('archive.org')) {
      requestHeaders.set('Referer', 'https://archive.org/');
    } else if (targetUrl.includes('rdcanais') || targetUrl.includes('redecanais')) {
      requestHeaders.set('Referer', 'https://redecanaistv.cafe/');
    }

    const res = await fetch(targetUrl, { 
      headers: requestHeaders,
      cache: 'no-store',
      redirect: 'follow'
    });

    const responseHeaders = new Headers();
    
    // Copia cabeçalhos vitais de streaming para o navegador reconhecer como 206
    const headersToCopy = [
      'content-type', 
      'content-length', 
      'content-range', 
      'accept-ranges', 
      'cache-control',
      'last-modified',
      'etag'
    ];
    
    headersToCopy.forEach(h => {
      const v = res.headers.get(h);
      if (v) responseHeaders.set(h, v);
    });

    // Força o navegador a aceitar o sinal vindo do nosso domínio
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', 'Range, Content-Type');

    return new NextResponse(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    return new NextResponse("Falha de sintonização master", { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Range, Content-Type',
    },
  });
}
