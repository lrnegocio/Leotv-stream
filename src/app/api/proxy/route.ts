
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * TÚNEL MASTER v30.0 - MOTOR DE STREAMING PROFISSIONAL 206
 * Blindagem total para CDNs protegidas (XVideos, Pornhub, Archive.org, JMVStream).
 * Suporte nativo para SEEK (Avançar/Voltar) via cabeçalhos de Range.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) return new NextResponse("Sinal Sniper ausente", { status: 400 });

  try {
    const requestHeaders = new Headers();
    const range = req.headers.get('range');
    
    if (range) {
      requestHeaders.set('Range', range);
    }
    
    // CAMUFLAGEM SNIPER: Identidade de Navegador Real para evitar bloqueios de CDN
    requestHeaders.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
    
    // REFERER SNIPER: Engana o servidor original conforme o domínio
    if (targetUrl.includes('phncdn.com') || targetUrl.includes('pornhub.com')) {
      requestHeaders.set('Referer', 'https://www.pornhub.com/');
    } else if (targetUrl.includes('xvideos')) {
      requestHeaders.set('Referer', 'https://www.xvideos.com/');
    } else if (targetUrl.includes('dailymotion')) {
      requestHeaders.set('Referer', 'https://www.dailymotion.com/');
    } else if (targetUrl.includes('archive.org')) {
      requestHeaders.set('Referer', 'https://archive.org/');
    } else if (targetUrl.includes('jmvstream.com')) {
      requestHeaders.set('Referer', 'https://jmvstream.com/');
    }

    const res = await fetch(targetUrl, { 
      headers: requestHeaders,
      cache: 'no-store',
      redirect: 'follow'
    });

    const responseHeaders = new Headers();
    
    // CABEÇALHOS DE STREAMING: Vital para o navegador não dar NotSupportedError
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

    // CORS SOBERANO: Libera o sinal para qualquer origem
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', 'Range, Content-Type');

    // MODO STREAMING: Se houver pedido de pedaço (Range), o status DEVE ser 206
    const status = (range && res.status === 200) ? 206 : res.status;

    return new Response(res.body, {
      status: status,
      statusText: res.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    return new NextResponse("Falha de sintonização Sniper (Erro de Rede)", { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Range, Content-Type',
    },
  });
}
