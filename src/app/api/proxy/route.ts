
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * TÚNEL DE FLUXO SOBERANO v8.0 - ESPECIALISTA EM HLS E MP4 CDNs
 * Resolve o problema de Mixed Content e Trava de Referer/Origin.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return new NextResponse("Sinal Master ausente", { status: 400 });
  }

  try {
    const headers = new Headers();
    
    // Repassa o cabeçalho de Range (Vital para MP4 e HLS Seek)
    const range = req.headers.get('range');
    if (range) {
      headers.set('Range', range);
    }
    
    // Máscara de Navegador para CDNs do XVideos e outros players protegidos
    headers.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    headers.set('Accept', '*/*');
    headers.set('Connection', 'keep-alive');
    
    const targetUrlObj = new URL(targetUrl);
    headers.set('Referer', targetUrlObj.origin + '/');
    headers.set('Origin', targetUrlObj.origin);

    const res = await fetch(targetUrl, { 
      headers,
      cache: 'no-store',
      redirect: 'follow'
    });

    const responseHeaders = new Headers();
    
    // Copia cabeçalhos críticos
    const criticalHeaders = [
      'content-type',
      'content-length',
      'content-range',
      'accept-ranges',
      'cache-control'
    ];

    criticalHeaders.forEach(h => {
      const val = res.headers.get(h);
      if (val) responseHeaders.set(h, val);
    });

    // Força tipos HLS para que o player não confunda o sinal
    if (targetUrl.includes('.m3u8')) {
      responseHeaders.set('content-type', 'application/x-mpegurl');
    }

    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    responseHeaders.set('X-Sinal-Status', 'Fluxo-Soberano-v8');

    const status = res.status === 206 ? 206 : 200;

    return new NextResponse(res.body, {
      status: status,
      statusText: res.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Erro no Túnel Master:", error);
    return new NextResponse("Falha ao sintonizar fluxo externo", { status: 500 });
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
