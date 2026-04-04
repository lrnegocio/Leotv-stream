
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * TÚNEL DE SINAL MASTER v6.0
 * Suporte total a Range (Pausa/Fullscreen), m3u8 e mp4.
 * Resolve bloqueios de Referer e CORS em tempo real.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) return new NextResponse("Sinal Ausente", { status: 400 });

  try {
    const requestHeaders = new Headers();
    const range = req.headers.get('range');
    
    if (range) requestHeaders.set('Range', range);
    
    // Identidade de Smart TV de Última Geração
    requestHeaders.set('User-Agent', 'Mozilla/5.0 (SMART-TV; Linux; Tizen 7.0) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/6.2 Chrome/110.0.0.0 TV Safari/537.36');
    requestHeaders.set('Accept', '*/*');
    requestHeaders.set('Connection', 'keep-alive');
    
    // CAMUFLAGEM DE ORIGEM (BYPASS DE REFERER)
    const urlObj = new URL(targetUrl);
    if (targetUrl.includes('redecanais') || targetUrl.includes('fontedecanais')) {
      requestHeaders.set('Referer', 'https://redecanaistv.cafe/');
      requestHeaders.set('Origin', 'https://redecanaistv.cafe');
    } else if (targetUrl.includes('blinder.space')) {
      requestHeaders.set('Referer', 'http://blinder.space/');
    } else if (targetUrl.includes('wurl.tv')) {
      requestHeaders.set('Referer', 'https://www.samsung.com/');
    } else {
      requestHeaders.set('Referer', `${urlObj.protocol}//${urlObj.host}/`);
    }

    const res = await fetch(targetUrl, { 
      headers: requestHeaders,
      cache: 'no-store',
      redirect: 'follow' // Segue redirecionamentos do contfree.shop automaticamente
    });

    const responseHeaders = new Headers();
    
    // Copia cabeçalhos essenciais para o player (Range, Content-Type, Length)
    const headersToCopy = [
      'content-type', 
      'content-length', 
      'content-range', 
      'accept-ranges', 
      'cache-control',
      'etag',
      'last-modified'
    ];

    headersToCopy.forEach(h => {
      const v = res.headers.get(h);
      if (v) responseHeaders.set(h, v);
    });

    // LIBERAÇÃO TOTAL DE CORS E REMOÇÃO DE BLOQUEIOS DE IFRAME
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    responseHeaders.set('Access-Control-Expose-Headers', '*');
    responseHeaders.delete('x-frame-options');
    responseHeaders.delete('content-security-policy');

    if (!res.body) return new NextResponse("Sinal Vazio", { status: 502 });

    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders,
    });

  } catch (error: any) {
    console.error("Erro no Túnel Master v6.0:", error.message);
    return new NextResponse("Falha no Túnel de Sinal", { status: 500 });
  }
}
