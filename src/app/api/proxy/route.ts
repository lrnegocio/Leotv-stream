
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * TÚNEL XUI MASTER v37.0 - PURIFICAÇÃO TOTAL & ANTI-500
 * Esta versão remove cabeçalhos conflitantes que causam Internal Server Error no Next.js 15.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) return new NextResponse("Sinal Ausente", { status: 400 });

  try {
    const requestHeaders = new Headers();
    const range = req.headers.get('range');
    if (range) requestHeaders.set('Range', range);
    
    // Identidade Master para Bypass de Provedor
    requestHeaders.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36');
    requestHeaders.set('Accept', '*/*');
    
    // Camuflagem de Origem (Bypass Blinder & Canais Profissionais)
    const lowerTarget = targetUrl.toLowerCase();
    if (lowerTarget.includes('redecanais')) {
      requestHeaders.set('Referer', 'https://redecanaistv.cafe/');
    } else if (lowerTarget.includes('blinder.space')) {
      requestHeaders.set('Referer', 'http://blinder.space/');
    } else if (lowerTarget.includes('webplayer.one')) {
      requestHeaders.set('Referer', 'http://supremo.webplayer.one/');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); 

    const res = await fetch(targetUrl, { 
      headers: requestHeaders,
      cache: 'no-store',
      redirect: 'follow',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    // Filtro Anti-Lixo: Se o servidor original mandar erro em HTML, barramos para não travar o player.
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('text/html') && (targetUrl.includes('.m3u8') || targetUrl.includes('.ts') || targetUrl.includes('.mp4'))) {
       return new NextResponse("Sinal Offline ou Erro de Origem", { status: 503 });
    }

    const responseHeaders = new Headers();
    
    /**
     * LIMPEZA CIRÚRGICA v37.0
     * Removemos cabeçalhos que o Next.js 15 proíbe de repassar em Responses de streaming.
     */
    const forbiddenHeaders = [
      'transfer-encoding', 
      'content-encoding', 
      'connection', 
      'keep-alive', 
      'host', 
      'te', 
      'trailer', 
      'upgrade',
      'proxy-authenticate',
      'proxy-authorization',
      'content-length' // Recalculado pelo servidor
    ];
    
    res.headers.forEach((v, k) => {
      const lowerKey = k.toLowerCase();
      if (!forbiddenHeaders.includes(lowerKey)) {
        responseHeaders.set(k, v);
      }
    });

    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('X-Content-Type-Options', 'nosniff');
    responseHeaders.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

    if (!res.body) return new NextResponse("Sinal Vazio", { status: 502 });

    return new Response(res.body, {
      status: res.status,
      headers: responseHeaders,
    });

  } catch (error: any) {
    // Silencia o erro para o servidor não entrar em colapso
    return new Response(null, { status: 200, headers: { 'Access-Control-Allow-Origin': '*' } });
  }
}
