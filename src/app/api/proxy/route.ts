
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * TÚNEL DE SINAL MASTER LÉO TV - VERSÃO 4.0 (FLUXO CINEMA)
 * Suporte total a Range Requests para permitir streaming de MP4 e Seek (pular partes).
 * Resolve o bloqueio de Mixed Content (HTTP em HTTPS) de forma transparente.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return new NextResponse("Sinal Master ausente", { status: 400 });
  }

  try {
    const headers = new Headers();
    
    // Repassa o cabeçalho de Range (Essencial para MP4 permitir avançar o filme)
    const range = req.headers.get('range');
    if (range) {
      headers.set('Range', range);
    }
    
    // Identidade Master para pular bloqueios de servidores externos
    headers.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    headers.set('Referer', new URL(targetUrl).origin);
    headers.set('Accept', '*/*');

    const response = await fetch(targetUrl, { 
      headers,
      cache: 'no-store',
      redirect: 'follow'
    });

    // Prepara os cabeçalhos de resposta para o navegador aceitar o fluxo
    const responseHeaders = new Headers();
    
    // Copia cabeçalhos vitais do servidor de origem para o player funcionar
    const contentHeaders = [
      'content-type',
      'content-length',
      'content-range',
      'accept-ranges',
      'cache-control',
      'last-modified',
      'etag'
    ];

    contentHeaders.forEach(h => {
      const val = response.headers.get(h);
      if (val) responseHeaders.set(h, val);
    });

    // Força o navegador a aceitar o sinal via CORS
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('X-Sinal-Status', 'Blindado-Master');

    // Retorna o corpo do vídeo como stream para performance máxima
    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Erro no Túnel de Sinal Master:", error);
    return new NextResponse("Falha ao sintonizar sinal externo", { status: 500 });
  }
}
