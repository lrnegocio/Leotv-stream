
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * TÚNEL DE SINAL MASTER LÉO TV - VERSÃO 4.0 (FLUXO CINEMA)
 * Suporte total a Range Requests para permitir Seek (pular partes) em MP4.
 * Resolve o bloqueio de Mixed Content (HTTP em HTTPS).
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return new NextResponse("Sinal Master ausente", { status: 400 });
  }

  try {
    const headers = new Headers();
    // Repassa o Range para permitir que o player pule partes do vídeo (Seek)
    const range = req.headers.get('range');
    if (range) {
      headers.set('Range', range);
    }
    
    // Identidade Master para pular bloqueios de alguns servidores
    headers.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    headers.set('Referer', new URL(targetUrl).origin);

    const response = await fetch(targetUrl, { 
      headers,
      cache: 'no-store'
    });

    // Prepara os cabeçalhos de resposta para o navegador aceitar o sinal
    const responseHeaders = new Headers();
    
    // Copia cabeçalhos essenciais do servidor de origem para permitir streaming correto
    const contentHeaders = [
      'content-type',
      'content-length',
      'content-range',
      'accept-ranges',
      'cache-control'
    ];

    contentHeaders.forEach(h => {
      const val = response.headers.get(h);
      if (val) responseHeaders.set(h, val);
    });

    // Força o navegador a aceitar o fluxo
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('X-Sinal-Status', 'Blindado-Master');

    return new NextResponse(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Erro no Túnel de Sinal Master:", error);
    return new NextResponse("Falha ao sintonizar sinal externo", { status: 500 });
  }
}
