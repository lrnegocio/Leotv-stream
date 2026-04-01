import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * TÚNEL DE FLUXO SOBERANO v7.0 - ESPECIALISTA EM MP4 E M3U8
 * Resolve o problema de Mixed Content (HTTP em site HTTPS).
 * Suporta Range Requests para MP4 (permitindo seek/avançar).
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return new NextResponse("Sinal Master ausente", { status: 400 });
  }

  try {
    const headers = new Headers();
    
    // Repassa o cabeçalho de Range (Vital para MP4 carregar e permitir avançar o filme)
    const range = req.headers.get('range');
    if (range) {
      headers.set('Range', range);
    }
    
    // Identidade de Navegador Master para pular bloqueios de servidores externos
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
    
    // Copia cabeçalhos críticos do servidor original para o player não bugar
    const criticalHeaders = [
      'content-type',
      'content-length',
      'content-range',
      'accept-ranges',
      'cache-control',
      'last-modified',
      'etag'
    ];

    criticalHeaders.forEach(h => {
      const val = res.headers.get(h);
      if (val) responseHeaders.set(h, val);
    });

    // Se o servidor original não enviou accept-ranges, nós forçamos para permitir o seek em MP4
    if (!responseHeaders.has('accept-ranges')) {
      responseHeaders.set('accept-ranges', 'bytes');
    }

    // Liberação total de CORS para o navegador não barrar o sinal
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    responseHeaders.set('X-Sinal-Status', 'Fluxo-Soberano-v7');

    // Se o sinal for parcial (Range), retornamos 206 para o navegador não cancelar o download
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
