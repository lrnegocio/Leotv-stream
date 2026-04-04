
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * TÚNEL MASTER v28.0 - PROTOCOLO ANTI-ERROR 500 & ANTI-BLOQUEIO
 * Blindagem total contra conflitos de headers do NextJS 15 e Turbopack.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) return new NextResponse("Sinal Ausente", { status: 400 });

  try {
    const requestHeaders = new Headers();
    const range = req.headers.get('range');
    if (range) requestHeaders.set('Range', range);
    
    // Identidade de Elite: Simula PC Windows para forçar entrada
    requestHeaders.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36');
    requestHeaders.set('Accept', '*/*');
    
    // Camuflagem de Referer Dinâmica
    if (targetUrl.includes('redecanaistv') || targetUrl.includes('redecanais')) {
      requestHeaders.set('Referer', 'https://redecanaistv.cafe/');
    } else if (targetUrl.includes('blinder.space')) {
      requestHeaders.set('Referer', 'http://blinder.space/');
    } else {
      try {
        const urlObj = new URL(targetUrl);
        requestHeaders.set('Referer', `${urlObj.protocol}//${urlObj.host}/`);
      } catch (e) {
        requestHeaders.set('Referer', targetUrl);
      }
    }

    // Limpeza de Headers de Proxy
    const forbidden = ['host', 'connection', 'x-forwarded-for', 'via', 'proxy-connection', 'forwarded', 'cookie', 'x-real-ip'];
    forbidden.forEach(h => requestHeaders.delete(h));

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 20000); // 20s timeout

    const res = await fetch(targetUrl, { 
      headers: requestHeaders,
      cache: 'no-store',
      redirect: 'follow',
      signal: controller.signal
    });
    
    clearTimeout(id);

    // FILTRO ANTI-LIXO (HTML): Impede que páginas de erro travem o player
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('text/html') && (targetUrl.includes('.m3u8') || targetUrl.includes('.ts'))) {
       return new NextResponse("Sinal offline no original", { status: 503 });
    }

    // CONSTRUÇÃO DE RESPOSTA SEGURA (ANTI-ERROR 500)
    // Removemos headers que causam conflito no NextJS 15 (como chunked encoding)
    const responseHeaders = new Headers();
    const headersToCopy = ['content-type', 'content-length', 'content-range', 'accept-ranges', 'cache-control'];
    headersToCopy.forEach(h => {
      const v = res.headers.get(h);
      if (v) responseHeaders.set(h, v);
    });

    // Força o tipo para HLS se necessário
    if (targetUrl.includes('.m3u8') || targetUrl.includes('mpegurl')) {
      responseHeaders.set('content-type', 'application/vnd.apple.mpegurl');
    }

    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Cache-Control', 'no-store, max-age=0');

    if (!res.body) return new NextResponse("Stream Vazia", { status: 502 });

    return new Response(res.body, {
      status: res.status,
      headers: responseHeaders,
    });

  } catch (error: any) {
    console.error("Proxy failure:", error.message);
    return new NextResponse("Falha de Tunelamento - Re-sincronizando", { status: 504 });
  }
}
