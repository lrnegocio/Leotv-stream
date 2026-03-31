
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * TÚNEL DE SINAL MASTER LÉO TV - VERSÃO 2.0 (STREAMING)
 * Esta rota resolve o bloqueio de "Mixed Content" do Google/Brave.
 * Suporta Range Requests para permitir navegação (seek) em arquivos MP4.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return new NextResponse("Sinal Master ausente", { status: 400 });
  }

  try {
    const headers = new Headers();
    // Encaminha o Range para permitir que o player pule partes do vídeo
    const range = req.headers.get('range');
    if (range) {
      headers.set('Range', range);
    }
    
    headers.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    const response = await fetch(targetUrl, { headers });

    // Prepara os cabeçalhos de resposta para o navegador aceitar o sinal como vídeo legítimo
    const responseHeaders = new Headers();
    const contentType = response.headers.get('Content-Type') || 'video/mp4';
    
    responseHeaders.set('Content-Type', contentType);
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Cache-Control', 'no-cache');
    
    // Cabeçalhos críticos para MP4 e Streaming
    if (response.headers.get('Content-Length')) responseHeaders.set('Content-Length', response.headers.get('Content-Length')!);
    if (response.headers.get('Content-Range')) responseHeaders.set('Content-Range', response.headers.get('Content-Range')!);
    if (response.headers.get('Accept-Ranges')) responseHeaders.set('Accept-Ranges', response.headers.get('Accept-Ranges')!);

    return new NextResponse(response.body, {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    console.error("Erro no Túnel de Sinal:", error);
    return new NextResponse("Falha ao sintonizar sinal externo", { status: 500 });
  }
}
