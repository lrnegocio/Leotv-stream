
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * TÚNEL MASTER v3400.0 - MOTOR DE CAMUFLAGEM SNIPER
 * Blindagem total para Erro 1106, Erro 500 e Carregamento Infinito.
 * Suporte a Partial Content (206) para arquivos gigantes e fluxos HLS.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) return new NextResponse("Sinal Sniper Ausente", { status: 400 });

  try {
    const requestHeaders = new Headers();
    const range = req.headers.get('range');
    
    if (range) requestHeaders.set('Range', range);
    
    // CAMUFLAGEM DE ELITE - Simula uma Smart TV Samsung High-End
    requestHeaders.set('User-Agent', 'Mozilla/5.0 (SMART-TV; Linux; Tizen 5.0) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/2.2 Chrome/63.0.3239.84 TV Safari/537.36');
    requestHeaders.set('Accept', '*/*');
    requestHeaders.set('Accept-Language', 'pt-BR,pt;q=0.9');
    requestHeaders.set('Connection', 'keep-alive');
    
    // BYPASS DE BLOQUEIO POR DOMÍNIO
    const urlObj = new URL(targetUrl);
    if (targetUrl.includes('redecanaistv') || targetUrl.includes('redecanais')) {
      requestHeaders.set('Referer', 'https://redecanaistv.cafe/');
      requestHeaders.set('Origin', 'https://redecanaistv.cafe');
    } else if (targetUrl.includes('jmvstream')) {
      requestHeaders.set('Referer', 'https://cdn.live.br1.jmvstream.com/');
    } else if (targetUrl.includes('blinder.space')) {
      requestHeaders.set('Referer', 'http://blinder.space/');
    } else {
      requestHeaders.set('Referer', `${urlObj.protocol}//${urlObj.host}/`);
    }

    // TENTATIVA DE FETCH BLINDADA
    const res = await fetch(targetUrl, { 
      headers: requestHeaders,
      cache: 'no-store',
      redirect: 'follow'
    });

    if (!res.ok && res.status !== 206) {
      // Se falhar, tenta sem referer como fallback
      requestHeaders.delete('Referer');
      requestHeaders.delete('Origin');
      const retryRes = await fetch(targetUrl, { headers: requestHeaders });
      if (!retryRes.ok) return new NextResponse(`Erro Master: ${retryRes.status}`, { status: retryRes.status });
    }

    const responseHeaders = new Headers();
    const headersToCopy = ['content-type', 'content-length', 'content-range', 'accept-ranges', 'cache-control'];
    
    // Garante que o content-type seja preservado ou inferido
    let contentType = res.headers.get('content-type');
    if (targetUrl.endsWith('.ts')) contentType = 'video/mp2t';
    if (targetUrl.endsWith('.m3u8')) contentType = 'application/vnd.apple.mpegurl';
    
    headersToCopy.forEach(h => {
      const v = res.headers.get(h);
      if (v) responseHeaders.set(h, v);
    });

    if (contentType) responseHeaders.set('content-type', contentType);

    // LIBERAÇÃO CORS TOTAL PARA O PLAYER
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    
    if (!res.body) return new NextResponse("Sinal Vazio", { status: 502 });

    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders,
    });

  } catch (error: any) {
    console.error("Erro no Túnel Master:", error.message);
    return new NextResponse("Falha Sniper no Túnel 206", { status: 500 });
  }
}
