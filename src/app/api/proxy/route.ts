import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * TÚNEL MASTER v70.0 - MOTOR DE STREAMING SOBERANO
 * Blindagem total para Partial Content, headers camuflados e suporte a JMVStream.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) return new NextResponse("Sinal Sniper Ausente", { status: 400 });

  try {
    const requestHeaders = new Headers();
    const range = req.headers.get('range');
    
    if (range) {
      requestHeaders.set('Range', range);
    }
    
    // CAMUFLAGEM MASTER v70 - Simula um navegador real de alta performance
    requestHeaders.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36');
    requestHeaders.set('Accept', '*/*');
    requestHeaders.set('Accept-Language', 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7');
    requestHeaders.set('Connection', 'keep-alive');
    
    // TRATAMENTO DE REFERER POR DOMÍNIO
    if (targetUrl.includes('phncdn.com') || targetUrl.includes('pornhub.com')) {
      requestHeaders.set('Referer', 'https://www.pornhub.com/');
      requestHeaders.set('Origin', 'https://www.pornhub.com');
    } else if (targetUrl.includes('xvideos')) {
      requestHeaders.set('Referer', 'https://www.xvideos.com/');
      requestHeaders.set('Origin', 'https://www.xvideos.com');
    } else if (targetUrl.includes('jmvstream.com')) {
      requestHeaders.set('Referer', 'https://jmvstream.com/');
      requestHeaders.set('Origin', 'https://jmvstream.com');
    } else if (targetUrl.includes('dailymotion')) {
      requestHeaders.set('Referer', 'https://www.dailymotion.com/');
    }

    const res = await fetch(targetUrl, { 
      headers: requestHeaders,
      cache: 'no-store',
      redirect: 'follow'
    });

    const responseHeaders = new Headers();
    const headersToCopy = [
      'content-type', 
      'content-length', 
      'content-range', 
      'accept-ranges', 
      'cache-control',
      'last-modified',
      'etag'
    ];
    
    headersToCopy.forEach(h => {
      const v = res.headers.get(h);
      if (v) responseHeaders.set(h, v);
    });

    // LIBERAÇÃO CORS PARA O PLAYER
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', 'Range, Content-Type, Referer, User-Agent');

    const status = (range && (res.status === 200 || res.status === 206)) ? 206 : res.status;

    return new Response(res.body, {
      status: status,
      statusText: res.statusText,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error("Erro no Túnel Master v70:", error.message);
    return new NextResponse("Falha de sintonização Sniper 206", { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Range, Content-Type, Referer, User-Agent',
    },
  });
}
