
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * TÚNEL MASTER v16.0 - PROTOCOLO DE SUPREMACIA TOTAL
 * Bypass de Cloudflare, Identidade Mutante e Filtro Anti-HTML.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) return new NextResponse("Sinal Ausente", { status: 400 });

  try {
    const requestHeaders = new Headers();
    const range = req.headers.get('range');
    if (range) requestHeaders.set('Range', range);
    
    // IDENTIDADE SOBERANA: Simula Smart TV para evitar bloqueios iniciais
    requestHeaders.set('User-Agent', 'Mozilla/5.0 (SMART-TV; Linux; Tizen 6.0) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/4.0 Chrome/122.0.0.0 TV Safari/537.36');
    requestHeaders.set('Accept', '*/*');
    
    const urlObj = new URL(targetUrl);
    
    // REGRAS DE CAMUFLAGEM DINÂMICA
    if (targetUrl.includes('redecanaistv') || targetUrl.includes('fontedecanais')) {
      requestHeaders.set('Referer', 'https://redecanaistv.cafe/');
      requestHeaders.set('Origin', 'https://redecanaistv.cafe');
    } else if (targetUrl.includes('blinder.space')) {
      requestHeaders.set('Referer', 'http://blinder.space/');
    } else if (targetUrl.includes('contfree.shop')) {
      requestHeaders.set('Referer', 'http://contfree.shop/');
    } else {
      requestHeaders.set('Referer', `${urlObj.protocol}//${urlObj.host}/`);
    }

    // LIMPEZA DE CABEÇALHOS SUSPEITOS QUE ENTREGAM O PROXY
    const forbidden = ['host', 'connection', 'x-forwarded-for', 'via', 'proxy-connection', 'forwarded', 'cookie', 'te', 'trailer'];
    forbidden.forEach(h => requestHeaders.delete(h));

    let res = await fetch(targetUrl, { 
      headers: requestHeaders,
      cache: 'no-store',
      redirect: 'follow'
    });

    // GIRO DE IDENTIDADE: Se falhar com Smart TV, tenta como PC Windows
    if (res.status === 520 || res.status === 403 || res.status === 502) {
      requestHeaders.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
      res = await fetch(targetUrl, { headers: requestHeaders, cache: 'no-store', redirect: 'follow' });
    }

    // FILTRO ANTI-NOTSUPPORTEDERROR: Se o servidor mandar HTML (página de erro), o túnel corta.
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
       // Se for um .m3u8 ou .ts e retornar HTML, é erro do servidor original
       if (targetUrl.includes('.m3u8') || targetUrl.includes('.ts') || targetUrl.includes('.mp4')) {
         return new NextResponse("O servidor original negou o acesso ao vídeo.", { status: 503 });
       }
    }

    const responseHeaders = new Headers();
    // COPIA CABEÇALHOS ESSENCIAIS PARA O PLAYER
    const headersToCopy = ['content-type', 'content-length', 'content-range', 'accept-ranges', 'cache-control'];
    headersToCopy.forEach(h => {
      const v = res.headers.get(h);
      if (v) responseHeaders.set(h, v);
    });

    // CORREÇÃO DE MIME TYPE PARA HLS SE NECESSÁRIO
    if (targetUrl.includes('.m3u8') && !responseHeaders.get('content-type')?.includes('mpegurl')) {
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
