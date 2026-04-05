
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * TÚNEL MASTER v30.0 - PROTOCOLO ANTI-ERROR 500 (NEXTJS 15)
 * Blindagem total contra conflitos de headers e travamentos de servidor.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) return new NextResponse("Sinal Ausente", { status: 400 });

  try {
    const requestHeaders = new Headers();
    const range = req.headers.get('range');
    if (range) requestHeaders.set('Range', range);
    
    requestHeaders.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36');
    requestHeaders.set('Accept', '*/*');
    
    // Camuflagem Sniper de Referer
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

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s de paciência Master

    const res = await fetch(targetUrl, { 
      headers: requestHeaders,
      cache: 'no-store',
      redirect: 'follow',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    // FILTRO ANTI-LIXO (HTML): Impede que páginas de erro travem o player
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('text/html') && (targetUrl.includes('.m3u8') || targetUrl.includes('.ts'))) {
       return new NextResponse("Sinal Offline na Origem", { status: 503 });
    }

    // CONSTRUÇÃO DE RESPOSTA IMUNE (LIMPEZA DE HEADERS v30)
    // Removemos headers que fazem o Next.js 15 dar Internal Server Error
    const responseHeaders = new Headers();
    const allowedHeaders = ['content-type', 'content-length', 'content-range', 'accept-ranges', 'cache-control'];
    
    allowedHeaders.forEach(h => {
      const v = res.headers.get(h);
      if (v) responseHeaders.set(h, v);
    });

    // Força o tipo HLS se necessário para garantir sintonização
    if (targetUrl.includes('.m3u8') || targetUrl.includes('mpegurl')) {
      responseHeaders.set('content-type', 'application/vnd.apple.mpegurl');
    }

    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Cache-Control', 'no-cache, no-store, must-revalidate');

    if (!res.body) return new NextResponse("Stream Vazia", { status: 502 });

    return new Response(res.body, {
      status: res.status,
      headers: responseHeaders,
    });

  } catch (error: any) {
    return new NextResponse("Falha de Tunelamento - Re-sincronizando", { status: 200 }); // Retorna 200 para não quebrar o player
  }
}
