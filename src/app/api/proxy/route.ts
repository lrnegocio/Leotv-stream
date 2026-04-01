
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * TÚNEL DE FLUXO SOBERANO v9.4 - MOTOR DE STREAMING DE ELITE
 * Resolve Archive.org, Pornhub CDN, XVideos, Mixed Content e Trava de Referer.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return new NextResponse("Sinal Master ausente", { status: 400 });
  }

  try {
    const requestHeaders = new Headers();
    
    // Repassa o cabeçalho de Range (VITAL para MP4, M3U8 e seeks no player)
    const range = req.headers.get('range');
    if (range) {
      requestHeaders.set('Range', range);
    }
    
    // Máscara de Navegador Master para burlar CDNs rígidas
    requestHeaders.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
    requestHeaders.set('Accept', '*/*');
    requestHeaders.set('Connection', 'keep-alive');
    
    // Máscara de Referer Baseada na Origem do Sinal
    const targetUrlObj = new URL(targetUrl);
    
    if (targetUrl.includes('phncdn.com') || targetUrl.includes('pornhub.com')) {
      requestHeaders.set('Referer', 'https://www.pornhub.com/');
      requestHeaders.set('Origin', 'https://www.pornhub.com');
    } else {
      requestHeaders.set('Referer', targetUrlObj.origin + '/');
      requestHeaders.set('Origin', targetUrlObj.origin);
    }

    const res = await fetch(targetUrl, { 
      headers: requestHeaders,
      cache: 'no-store',
      redirect: 'follow',
      method: 'GET'
    });

    const responseHeaders = new Headers();
    
    // Copia cabeçalhos críticos para garantir o funcionamento do Player
    const criticalHeaders = [
      'content-type',
      'content-length',
      'content-range',
      'accept-ranges',
      'cache-control',
      'last-modified',
      'etag',
      'content-disposition'
    ];

    criticalHeaders.forEach(h => {
      const val = res.headers.get(h);
      if (val) responseHeaders.set(h, val);
    });

    // Liberação de CORS Total para o Navegador do Cliente
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    responseHeaders.set('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges');
    responseHeaders.set('X-Sinal-Status', 'Fluxo-Soberano-v9.4');

    // Forçar Content-Type para garantir carregamento em sites exigentes
    if (targetUrl.includes('archive.org') && !responseHeaders.get('content-type')) {
      responseHeaders.set('content-type', 'video/mp4');
    }

    return new NextResponse(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Erro no Túnel Master v9.4:", error);
    return new NextResponse("Falha ao sintonizar fluxo soberano", { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    },
  });
}
