
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * TÚNEL MASTER v26.0 - PROTOCOLO ANTI-ERROR 500
 * Blindagem contra falhas de Wi-Fi e timeouts de servidor original.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) return new NextResponse("Sinal Ausente", { status: 400 });

  try {
    const requestHeaders = new Headers();
    const range = req.headers.get('range');
    if (range) requestHeaders.set('Range', range);
    
    // Identidade Sniper v26
    requestHeaders.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36');
    requestHeaders.set('Accept', '*/*');
    
    const urlObj = new URL(targetUrl);
    
    // Camuflagem Dinâmica
    if (targetUrl.includes('redecanaistv') || targetUrl.includes('redecanais')) {
      requestHeaders.set('Referer', 'https://redecanaistv.cafe/');
    } else if (targetUrl.includes('blinder.space')) {
      requestHeaders.set('Referer', 'http://blinder.space/');
    } else {
      requestHeaders.set('Referer', `${urlObj.protocol}//${urlObj.host}/`);
    }

    // Limpeza de Headers de Proxy
    const forbidden = ['host', 'connection', 'x-forwarded-for', 'via', 'proxy-connection', 'forwarded', 'cookie'];
    forbidden.forEach(h => requestHeaders.delete(h));

    let res = await fetch(targetUrl, { 
      headers: requestHeaders,
      cache: 'no-store',
      redirect: 'follow',
      signal: AbortSignal.timeout(12000) // Timeout de 12s para evitar 500 no NextJS
    });

    // Bypass de Erro 520
    if (res.status === 520 || res.status === 403 || res.status === 502) {
      const retryHeaders = new Headers();
      retryHeaders.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36');
      res = await fetch(targetUrl, { headers: retryHeaders, cache: 'no-store', redirect: 'follow' });
    }

    // Filtro Anti-HTML (Impede o player de travar com texto de erro)
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('text/html') && (targetUrl.includes('.m3u8') || targetUrl.includes('.ts'))) {
       return new NextResponse("Erro no sinal original", { status: 503 });
    }

    const responseHeaders = new Headers();
    ['content-type', 'content-length', 'content-range', 'accept-ranges', 'cache-control'].forEach(h => {
      const v = res.headers.get(h);
      if (v) responseHeaders.set(h, v);
    });

    // Força o tipo para Streaming
    if (targetUrl.includes('.m3u8') || targetUrl.includes('mpegurl')) {
      responseHeaders.set('content-type', 'application/vnd.apple.mpegurl');
    }

    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Cache-Control', 'no-store, max-age=0');

    if (!res.body) return new NextResponse("Vazio", { status: 502 });

    return new Response(res.body, {
      status: res.status,
      headers: responseHeaders,
    });

  } catch (error: any) {
    // PROTEÇÃO MESTRE: Nunca deixe o servidor dar 500
    console.error("Proxy crash caught:", error.message);
    return new NextResponse("Falha de Conexão no Túnel", { status: 504 });
  }
}
