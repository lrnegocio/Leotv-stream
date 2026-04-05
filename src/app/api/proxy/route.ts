
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * TÚNEL XUI MASTER v33.0 - SUPORTE .TS & BLINDER FIX
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
    
    // Camuflagem Estratégica v33
    const lowerTarget = targetUrl.toLowerCase();
    if (lowerTarget.includes('redecanais')) {
      requestHeaders.set('Referer', 'https://redecanaistv.cafe/');
    } else if (lowerTarget.includes('blinder.space')) {
      requestHeaders.set('Referer', 'http://blinder.space/');
    } else if (lowerTarget.includes('webplayer.one')) {
      requestHeaders.set('Referer', 'http://supremo.webplayer.one/');
    } else {
      try {
        const urlObj = new URL(targetUrl);
        requestHeaders.set('Referer', `${urlObj.protocol}//${urlObj.host}/`);
      } catch (e) {
        requestHeaders.set('Referer', targetUrl);
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s para .ts pesados

    const res = await fetch(targetUrl, { 
      headers: requestHeaders,
      cache: 'no-store',
      redirect: 'follow',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    // FILTRO ANTI-HTML: Impede que erros de texto travem o player
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('text/html') && (targetUrl.includes('.m3u8') || targetUrl.includes('.ts') || targetUrl.includes('.mp4'))) {
       return new NextResponse("Sinal Offline", { status: 503 });
    }

    const responseHeaders = new Headers();
    
    // Limpeza Cirúrgica de Headers (Fix Next.js 15 Error 500)
    const perigoHeaders = ['transfer-encoding', 'content-encoding', 'connection', 'keep-alive'];
    const safeHeaders = ['content-type', 'content-length', 'content-range', 'accept-ranges', 'cache-control'];
    
    res.headers.forEach((v, k) => {
      if (!perigoHeaders.includes(k.toLowerCase()) && safeHeaders.includes(k.toLowerCase())) {
        responseHeaders.set(k, v);
      }
    });

    // Forçamos tipos específicos para arquivos .ts e .m3u8
    if (targetUrl.includes('.ts')) {
      responseHeaders.set('content-type', 'video/mp2t');
    } else if (targetUrl.includes('.m3u8')) {
      responseHeaders.set('content-type', 'application/vnd.apple.mpegurl');
    }

    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('X-Content-Type-Options', 'nosniff');

    if (!res.body) return new NextResponse("Stream Vazia", { status: 502 });

    return new Response(res.body, {
      status: res.status,
      headers: responseHeaders,
    });

  } catch (error: any) {
    return new Response(null, { status: 200, headers: { 'Access-Control-Allow-Origin': '*' } });
  }
}
