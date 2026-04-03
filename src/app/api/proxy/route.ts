
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * ESCUDO MASTER DE TRANSMISSÃO v4400.0
 * Motor de camuflagem total para sinais bloqueados por CORS ou Referer.
 * Blindagem de anúncios e suporte a fragmentação de vídeo (206).
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) return new NextResponse("Sinal Ausente", { status: 400 });

  try {
    const requestHeaders = new Headers();
    const range = req.headers.get('range');
    
    if (range) requestHeaders.set('Range', range);
    
    // CAMUFLAGEM SOBERANA - Identidade de Smart TV High-End
    requestHeaders.set('User-Agent', 'Mozilla/5.0 (SMART-TV; Linux; Tizen 7.0) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/6.2 Chrome/110.0.0.0 TV Safari/537.36');
    requestHeaders.set('Accept', '*/*');
    requestHeaders.set('Accept-Language', 'pt-BR,pt;q=0.9');
    requestHeaders.set('Connection', 'keep-alive');
    
    // BYPASS DE ORIGEM PARA SINAIS ESPECÍFICOS
    const urlObj = new URL(targetUrl);
    if (targetUrl.includes('redecanaistv') || targetUrl.includes('redecanais')) {
      requestHeaders.set('Referer', 'https://redecanaistv.cafe/');
      requestHeaders.set('Origin', 'https://redecanaistv.cafe');
    } else if (targetUrl.includes('samsung.wurl.tv') || targetUrl.includes('wurl.tv')) {
      requestHeaders.set('Referer', 'https://www.samsung.com/');
    } else if (targetUrl.includes('pornhub') || targetUrl.includes('phncdn')) {
      requestHeaders.set('Referer', 'https://www.pornhub.com/');
    } else {
      requestHeaders.set('Referer', `${urlObj.protocol}//${urlObj.host}/`);
    }

    const res = await fetch(targetUrl, { 
      headers: requestHeaders,
      cache: 'no-store',
      redirect: 'follow'
    });

    const status = res.status;
    const responseHeaders = new Headers();
    
    const headersToCopy = [
      'content-type', 
      'content-length', 
      'content-range', 
      'accept-ranges', 
      'cache-control'
    ];
    
    headersToCopy.forEach(h => {
      const v = res.headers.get(h);
      if (v) responseHeaders.set(h, v);
    });

    // GARANTE O CONTENT-TYPE CORRETO
    let contentType = res.headers.get('content-type');
    if (targetUrl.endsWith('.ts')) contentType = 'video/mp2t';
    if (targetUrl.endsWith('.m3u8')) contentType = 'application/vnd.apple.mpegurl';
    if (contentType) responseHeaders.set('content-type', contentType);

    // LIBERAÇÃO CORS TOTAL PARA O PLAYER LÉO TV
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    
    if (!res.body) return new NextResponse("Sinal Vazio", { status: 502 });

    return new Response(res.body, {
      status: status,
      statusText: res.statusText,
      headers: responseHeaders,
    });

  } catch (error: any) {
    return new NextResponse("Falha no Túnel de Sinal", { status: 500 });
  }
}
