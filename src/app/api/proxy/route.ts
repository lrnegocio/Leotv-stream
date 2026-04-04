
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * TÚNEL MASTER v22.0 - PROTOCOLO DE SUPREMACIA TOTAL
 * Bypass de Cloudflare 520, Identidade Mutante e Filtro Anti-Lixo.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) return new NextResponse("Sinal Ausente", { status: 400 });

  try {
    const requestHeaders = new Headers();
    const range = req.headers.get('range');
    if (range) requestHeaders.set('Range', range);
    
    // IDENTIDADE SOBERANA: Simula Smart TV original
    requestHeaders.set('User-Agent', 'Mozilla/5.0 (SMART-TV; Linux; Tizen 6.0) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/4.0 Chrome/122.0.0.0 TV Safari/537.36');
    requestHeaders.set('Accept', '*/*');
    requestHeaders.set('Accept-Language', 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7');
    
    const urlObj = new URL(targetUrl);
    
    // REGRAS DE CAMUFLAGEM DINÂMICA v22.0
    if (targetUrl.includes('redecanaistv') || targetUrl.includes('redecanais')) {
      requestHeaders.set('Referer', 'https://redecanaistv.cafe/');
      requestHeaders.set('Origin', 'https://redecanaistv.cafe');
    } else if (targetUrl.includes('blinder.space')) {
      requestHeaders.set('Referer', 'http://blinder.space/');
      requestHeaders.set('Origin', 'http://blinder.space');
    } else if (targetUrl.includes('contfree.shop')) {
      requestHeaders.set('Referer', 'http://contfree.shop/');
    } else {
      requestHeaders.set('Referer', `${urlObj.protocol}//${urlObj.host}/`);
    }

    // LIMPEZA DE CABEÇALHOS DE PROXY QUE O CLOUDFLARE DETECTA
    const forbidden = ['host', 'connection', 'x-forwarded-for', 'via', 'proxy-connection', 'forwarded', 'cookie', 'te', 'trailer'];
    forbidden.forEach(h => requestHeaders.delete(h));

    let res = await fetch(targetUrl, { 
      headers: requestHeaders,
      cache: 'no-store',
      redirect: 'follow'
    });

    // XEQUE-MATE NO CLOUDFLARE 520: Giro de Identidade Instantâneo para PC Windows
    if (res.status === 520 || res.status === 403 || res.status === 502) {
      const retryHeaders = new Headers();
      retryHeaders.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
      retryHeaders.set('Accept', '*/*');
      res = await fetch(targetUrl, { headers: retryHeaders, cache: 'no-store', redirect: 'follow' });
    }

    // FILTRO ANTI-LIXO (A CURA DO NOTSUPPORTEDERROR)
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
       // Se o servidor original devolver erro em HTML em vez de vídeo, bloqueamos o sinal lixo
       if (targetUrl.includes('.m3u8') || targetUrl.includes('.ts') || targetUrl.includes('.mp4')) {
         return new NextResponse("Erro no Servidor Original", { status: 503 });
       }
    }

    const responseHeaders = new Headers();
    const headersToCopy = ['content-type', 'content-length', 'content-range', 'accept-ranges', 'cache-control'];
    headersToCopy.forEach(h => {
      const v = res.headers.get(h);
      if (v) responseHeaders.set(h, v);
    });

    // CORREÇÃO DE MIME TYPE PARA HLS (Obrigatório para navegadores PC)
    if (targetUrl.includes('.m3u8') || targetUrl.includes('mpegurl')) {
      responseHeaders.set('content-type', 'application/vnd.apple.mpegurl');
    }

    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Cache-Control', 'no-store, no-cache, must-revalidate');

    if (!res.body) return new NextResponse("Sinal Vazio", { status: 502 });

    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders,
    });

  } catch (error: any) {
    return new NextResponse("Falha crítica no Túnel Master", { status: 500 });
  }
}
