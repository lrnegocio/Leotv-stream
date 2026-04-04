
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * TÚNEL MASTER v14.0 - EDIÇÃO BYPASS CLOUDFLARE 520 & FILTRO ANTI-HTML
 * Bloqueia páginas de erro HTML para evitar o NotSupportedError no player.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) return new NextResponse("Sinal Ausente", { status: 400 });

  try {
    const requestHeaders = new Headers();
    const range = req.headers.get('range');
    if (range) requestHeaders.set('Range', range);
    
    // IDENTIDADE SOBERANA: Simula Smart TV Premium para enganar o Cloudflare
    requestHeaders.set('User-Agent', 'Mozilla/5.0 (SMART-TV; Linux; Tizen 6.0) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/4.0 Chrome/122.0.0.0 TV Safari/537.36');
    requestHeaders.set('Accept', 'video/webm,video/ogg,video/*;q=0.9,application/ogg;q=0.7,audio/*;q=0.6,*/*;q=0.5');
    requestHeaders.set('Accept-Language', 'pt-BR,pt;q=0.9');
    
    // CAMUFLAGEM DINÂMICA DE ORIGEM
    const urlObj = new URL(targetUrl);
    if (targetUrl.includes('redecanaistv') || targetUrl.includes('fontedecanais') || targetUrl.includes('reidoscanais')) {
      requestHeaders.set('Referer', 'https://redecanaistv.cafe/');
      requestHeaders.set('Origin', 'https://redecanaistv.cafe');
    } else if (targetUrl.includes('wurl.tv') || targetUrl.includes('samsung')) {
      requestHeaders.set('Referer', 'https://www.samsung.com/');
    } else {
      requestHeaders.set('Referer', `${urlObj.protocol}//${urlObj.host}/`);
    }

    // LIMPEZA AGRESSIVA DE RASTROS
    const forbidden = ['host', 'connection', 'x-forwarded-for', 'x-real-ip', 'via', 'proxy-connection', 'forwarded', 'cookie'];
    forbidden.forEach(h => requestHeaders.delete(h));

    let res = await fetch(targetUrl, { 
      headers: requestHeaders,
      cache: 'no-store',
      redirect: 'follow'
    });

    // XEQUE-MATE NO ERRO 520/403: Giro de Identidade Instantâneo
    if (res.status === 520 || res.status === 403 || res.status === 502) {
      requestHeaders.delete('Referer');
      requestHeaders.delete('Origin');
      res = await fetch(targetUrl, { headers: requestHeaders, cache: 'no-store', redirect: 'follow' });
    }

    // FILTRO ANTI-NOTSUPPORTEDERROR: Se não for vídeo ou stream, bloqueia!
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
       return new NextResponse("Erro no Servidor Original - HTML Bloqueado", { status: 502 });
    }

    const responseHeaders = new Headers();
    const headersToCopy = ['content-type', 'content-length', 'content-range', 'accept-ranges', 'cache-control'];
    headersToCopy.forEach(h => {
      const v = res.headers.get(h);
      if (v) responseHeaders.set(h, v);
    });

    // BLINDAGEM CORS
    responseHeaders.set('Access-Control-Allow-Origin', '*');

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
