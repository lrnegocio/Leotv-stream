
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * TÚNEL XUI MASTER v32.0 - SUPORTE .TS & ANTI-ERROR 500
 * Protocolo de limpeza total de cabeçalhos para evitar Internal Server Error no Next.js 15.
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
    
    // Camuflagem Estratégica
    if (targetUrl.includes('redecanais')) {
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
    const timeoutId = setTimeout(() => controller.abort(), 20000); // 20s de paciência XUI

    const res = await fetch(targetUrl, { 
      headers: requestHeaders,
      cache: 'no-store',
      redirect: 'follow',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    // FILTRO ANTI-HTML: Impede que erros de texto travem o player de vídeo
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('text/html') && (targetUrl.includes('.m3u8') || targetUrl.includes('.ts') || targetUrl.includes('.mp4'))) {
       return new NextResponse("Sinal Offline", { status: 503 });
    }

    // CONSTRUÇÃO DE RESPOSTA IMUNE (LIMPEZA CIRÚRGICA v32)
    const responseHeaders = new Headers();
    
    // Copiamos apenas o essencial para evitar conflito com o processamento do Next.js
    const safeHeaders = ['content-type', 'content-length', 'content-range', 'accept-ranges'];
    safeHeaders.forEach(h => {
      const v = res.headers.get(h);
      if (v) responseHeaders.set(h, v);
    });

    // Forçamos tipos específicos se detectado
    if (targetUrl.includes('.ts')) {
      responseHeaders.set('content-type', 'video/mp2t');
    } else if (targetUrl.includes('.m3u8')) {
      responseHeaders.set('content-type', 'application/vnd.apple.mpegurl');
    }

    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    responseHeaders.set('X-Content-Type-Options', 'nosniff');

    if (!res.body) return new NextResponse("Stream Vazia", { status: 502 });

    return new Response(res.body, {
      status: res.status,
      headers: responseHeaders,
    });

  } catch (error: any) {
    // Retornamos 200 limpo para não quebrar o motor HLS do navegador com uma página de erro 500
    return new Response(null, { status: 200, headers: { 'Access-Control-Allow-Origin': '*' } });
  }
}
