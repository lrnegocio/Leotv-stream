
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * TÚNEL DE FLUXO SOBERANO v9.1 - MOTOR DE STREAMING BRUTO
 * Resolve Mixed Content, Trava de Referer e Range para MP4 (blinder.space, archive.org).
 * Suporta Partial Content (206) para permitir Seek (Avançar/Voltar).
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return new NextResponse("Sinal Master ausente", { status: 400 });
  }

  try {
    const headers = new Headers();
    
    // Repassa o cabeçalho de Range (VITAL para MP4 e HLS Seek)
    const range = req.headers.get('range');
    if (range) {
      headers.set('Range', range);
    }
    
    // Máscara de Navegador Master para burlar CDNs (XVideos, Archive.org)
    headers.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
    headers.set('Accept', '*/*');
    headers.set('Connection', 'keep-alive');
    
    const targetUrlObj = new URL(targetUrl);
    // Mascarar a origem para enganar a proteção de Hotlink/CORS
    headers.set('Referer', targetUrlObj.origin + '/');
    headers.set('Origin', targetUrlObj.origin);

    const res = await fetch(targetUrl, { 
      headers,
      cache: 'no-store',
      redirect: 'follow'
    });

    const responseHeaders = new Headers();
    
    // Copia cabeçalhos críticos do servidor original para manter a integridade do vídeo
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

    // Força o tipo correto se for M3U8
    if (targetUrl.includes('.m3u8')) {
      responseHeaders.set('content-type', 'application/x-mpegurl');
    }

    // Liberação de CORS Total para o Navegador aceitar o sinal do Túnel
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    responseHeaders.set('X-Sinal-Status', 'Fluxo-Soberano-v9.1');

    // Suporte para Partial Content (206) - Necessário para Seek de Vídeo MP4
    const status = res.status === 206 ? 206 : res.status;

    return new NextResponse(res.body, {
      status: status,
      statusText: res.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Erro no Túnel Master v9.1:", error);
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
