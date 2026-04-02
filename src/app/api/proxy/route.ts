import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * TÚNEL MASTER v2400.0 - MOTOR DE CAMUFLAGEM SOBERANO
 * Blindagem total para Cloudflare Error 1106 e sinais bloqueados.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) return new NextResponse("Sinal Sniper Ausente", { status: 400 });

  try {
    const requestHeaders = new Headers();
    const range = req.headers.get('range');
    
    if (range) requestHeaders.set('Range', range);
    
    // CAMUFLAGEM DE ELITE v2400 - Simula uma Smart TV de alta performance para burlar o Cloudflare
    requestHeaders.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36');
    requestHeaders.set('Accept', '*/*');
    requestHeaders.set('Accept-Language', 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7');
    requestHeaders.set('Connection', 'keep-alive');
    requestHeaders.set('Sec-Fetch-Dest', 'video');
    requestHeaders.set('Sec-Fetch-Mode', 'no-cors');
    requestHeaders.set('Sec-Fetch-Site', 'cross-site');
    
    // TRATAMENTO CIRÚRGICO DE REFERRER PARA BYPASS DE BLOQUEIO
    if (targetUrl.includes('redecanaistv')) {
      requestHeaders.set('Referer', 'https://redecanaistv.cafe/');
      requestHeaders.set('Origin', 'https://redecanaistv.cafe');
    } else if (targetUrl.includes('xvideos')) {
      requestHeaders.set('Referer', 'https://www.xvideos.com/');
    } else if (targetUrl.includes('jmvstream')) {
      requestHeaders.set('Origin', 'https://cdn.live.br1.jmvstream.com');
    }

    const res = await fetch(targetUrl, { 
      headers: requestHeaders,
      cache: 'no-store',
      redirect: 'follow'
    });

    const responseHeaders = new Headers();
    const headersToCopy = ['content-type', 'content-length', 'content-range', 'accept-ranges', 'cache-control'];
    
    headersToCopy.forEach(h => {
      const v = res.headers.get(h);
      if (v) responseHeaders.set(h, v);
    });

    // LIBERAÇÃO CORS ABSOLUTA
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    
    if (!res.body) return new NextResponse("Corpo do Sinal Vazio", { status: 502 });

    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error("Falha no Túnel Master v2400:", error.message);
    return new NextResponse("Falha Sniper 206", { status: 500 });
  }
}
