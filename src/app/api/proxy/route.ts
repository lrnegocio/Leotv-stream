
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * TÚNEL MASTER v10.0
 * Suporte total a m3u8, mp4 e redirecionamentos.
 * Injeção de Referer dinâmica para RedeCanais, Samsung e Blinder.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) return new NextResponse("Sinal Ausente", { status: 400 });

  try {
    const requestHeaders = new Headers();
    const range = req.headers.get('range');
    
    if (range) requestHeaders.set('Range', range);
    
    // Identidade: Simula Smart TV de 2024
    requestHeaders.set('User-Agent', 'Mozilla/5.0 (SMART-TV; Linux; Tizen 7.0) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/6.2 Chrome/110.0.0.0 TV Safari/537.36');
    requestHeaders.set('Accept', '*/*');
    
    // CAMUFLAGEM DE ORIGEM
    const urlObj = new URL(targetUrl);
    if (targetUrl.includes('redecanaistv') || targetUrl.includes('fontedecanais') || targetUrl.includes('contfree')) {
      requestHeaders.set('Referer', 'https://redecanaistv.cafe/');
      requestHeaders.set('Origin', 'https://redecanaistv.cafe');
    } else if (targetUrl.includes('wurl.tv') || targetUrl.includes('samsung')) {
      requestHeaders.set('Referer', 'https://www.samsung.com/');
      requestHeaders.set('Origin', 'https://www.samsung.com');
    } else if (targetUrl.includes('blinder')) {
      requestHeaders.set('Referer', 'http://blinder.space/');
    } else {
      requestHeaders.set('Referer', `${urlObj.protocol}//${urlObj.host}/`);
    }

    const res = await fetch(targetUrl, { 
      headers: requestHeaders,
      cache: 'no-store',
      redirect: 'follow'
    });

    const responseHeaders = new Headers();
    
    // Copia cabeçalhos vitais para fluidez do vídeo
    const headersToCopy = [
      'content-type', 
      'content-length', 
      'content-range', 
      'accept-ranges',
      'last-modified'
    ];

    headersToCopy.forEach(h => {
      const v = res.headers.get(h);
      if (v) responseHeaders.set(h, v);
    });

    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('X-Frame-Options', 'ALLOWALL');

    if (!res.body) return new NextResponse("Sinal Vazio", { status: 502 });

    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders,
    });

  } catch (error: any) {
    return new NextResponse("Falha no Túnel Master", { status: 500 });
  }
}
