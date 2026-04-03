
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * TÚNEL MASTER v4200.0 - MOTOR DE CAMUFLAGEM SNIPER 206
 * Blindagem total para Erro 1106, Erro 500 e Bloqueios de CORS.
 * Suporte a Partial Content (206) para arquivos MP4 gigantes e fluxos HLS.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) return new NextResponse("Sinal Sniper Ausente", { status: 400 });

  try {
    const requestHeaders = new Headers();
    const range = req.headers.get('range');
    
    if (range) requestHeaders.set('Range', range);
    
    // CAMUFLAGEM DE ELITE - Simula uma Smart TV Samsung High-End de 2024
    requestHeaders.set('User-Agent', 'Mozilla/5.0 (SMART-TV; Linux; Tizen 7.0) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/6.2 Chrome/110.0.0.0 TV Safari/537.36');
    requestHeaders.set('Accept', '*/*');
    requestHeaders.set('Accept-Language', 'pt-BR,pt;q=0.9');
    requestHeaders.set('Connection', 'keep-alive');
    
    // BYPASS DINÂMICO DE BLOQUEIO POR DOMÍNIO
    const urlObj = new URL(targetUrl);
    if (targetUrl.includes('redecanaistv') || targetUrl.includes('redecanais')) {
      requestHeaders.set('Referer', 'https://redecanaistv.cafe/');
      requestHeaders.set('Origin', 'https://redecanaistv.cafe');
    } else if (targetUrl.includes('jmvstream')) {
      requestHeaders.set('Referer', 'https://cdn.live.br1.jmvstream.com/');
    } else if (targetUrl.includes('blinder.space')) {
      requestHeaders.set('Referer', 'http://blinder.space/');
    } else if (targetUrl.includes('pornhub') || targetUrl.includes('phncdn')) {
      requestHeaders.set('Referer', 'https://www.pornhub.com/');
    } else if (targetUrl.includes('xvideos')) {
      requestHeaders.set('Referer', 'https://www.xvideos.com/');
    } else {
      requestHeaders.set('Referer', `${urlObj.protocol}//${urlObj.host}/`);
    }

    // TENTATIVA DE FETCH BLINDADA
    const res = await fetch(targetUrl, { 
      headers: requestHeaders,
      cache: 'no-store',
      redirect: 'follow'
    });

    // TRATAMENTO DE RESPOSTA PARCIAL (206) - CRUCIAL PARA MP4 E HLS
    const status = res.status;
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

    // GARANTE O CONTENT-TYPE CORRETO SE O SERVIDOR OMITIR
    let contentType = res.headers.get('content-type');
    if (targetUrl.endsWith('.ts')) contentType = 'video/mp2t';
    if (targetUrl.endsWith('.m3u8')) contentType = 'application/vnd.apple.mpegurl';
    if (targetUrl.endsWith('.mp4')) contentType = 'video/mp4';
    
    if (contentType) responseHeaders.set('content-type', contentType);

    // LIBERAÇÃO CORS TOTAL PARA O PLAYER LÉO TV
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', 'Content-Type, Range, Authorization');
    responseHeaders.set('Access-Control-Expose-Headers', 'Content-Length, Content-Range');
    
    if (!res.body) return new NextResponse("Sinal Vazio", { status: 502 });

    return new Response(res.body, {
      status: status,
      statusText: res.statusText,
      headers: responseHeaders,
    });

  } catch (error: any) {
    console.error("Erro no Túnel Sniper 206:", error.message);
    return new NextResponse("Falha Sniper no Túnel 206", { status: 500 });
  }
}
