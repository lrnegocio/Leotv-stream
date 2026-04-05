
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * TÚNEL XUI MASTER v36.0 - LIMPEZA BRUTA & ANTI-500
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
    
    // Camuflagem Estratégica v36 (Bypass Blinder & RedeCanais)
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

    // FILTRO ANTI-LIXO: Se o servidor mandar erro em HTML em link de vídeo, barramos.
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('text/html') && (targetUrl.includes('.m3u8') || targetUrl.includes('.ts') || targetUrl.includes('.mp4'))) {
       return new NextResponse("Sinal Offline", { status: 503 });
    }

    const responseHeaders = new Headers();
    
    // LIMPEZA CIRÚRGICA DE HEADERS v36 - EVITA INTERNAL SERVER ERROR NO NEXT.JS 15
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
      'proxy-authorization'
    ];
    
    res.headers.forEach((v, k) => {
      const lowerKey = k.toLowerCase();
      if (!forbiddenHeaders.includes(lowerKey)) {
        responseHeaders.set(k, v);
      }
    });

    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('X-Content-Type-Options', 'nosniff'); // FIX: Aspas adicionadas para evitar Erro 500

    if (!res.body) return new NextResponse("Stream Vazia", { status: 502 });

    return new Response(res.body, {
      status: res.status,
      headers: responseHeaders,
    });

  } catch (error: any) {
    // Silencia o erro para o servidor não travar
    return new Response(null, { status: 200, headers: { 'Access-Control-Allow-Origin': '*' } });
  }
}
