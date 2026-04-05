
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * TÚNEL XUI MASTER v44.0 - PURIFICAÇÃO ABSOLUTA & SUPORTE M3U8/TS
 * Blindado contra Erro 500 no Next.js 15.
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
    
    const lowerTarget = targetUrl.toLowerCase();
    if (lowerTarget.includes('redecanais')) {
      requestHeaders.set('Referer', 'https://redecanaistv.cafe/');
    } else if (lowerTarget.includes('blinder.space')) {
      requestHeaders.set('Referer', 'http://blinder.space/');
    } else if (lowerTarget.includes('webplayer.one')) {
      requestHeaders.set('Referer', 'http://supremo.webplayer.one/');
    } else if (lowerTarget.includes('xvideos')) {
      requestHeaders.set('Referer', 'https://www.xvideos.com/');
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

    const responseHeaders = new Headers();
    
    /**
     * LIMPEZA CIRÚRGICA DE HEADERS (FIM DO ERRO 500 v44)
     * Removemos cabeçalhos que conflitam com o stream do Next.js 15.
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
      'content-length' // CRÍTICO: Next.js 15 dá erro 500 se o tamanho mudar
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
      status: res.status === 0 ? 200 : res.status,
      headers: responseHeaders,
    });

  } catch (error: any) {
    return new Response(null, { status: 200, headers: { 'Access-Control-Allow-Origin': '*' } });
  }
}
