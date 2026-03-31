
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * TÚNEL DE SINAL MASTER LÉO TV
 * Esta rota resolve o erro de "Mixed Content" (links HTTP em site HTTPS).
 * Ela busca o sinal externo e o entrega de forma segura para o player.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) {
    return new NextResponse("Sinal Master ausente", { status: 400 });
  }

  try {
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      },
    });

    const contentType = response.headers.get('Content-Type') || 'video/mp4';
    
    // Encaminha o corpo da resposta como um stream para o player
    return new NextResponse(response.body, {
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error("Erro no Túnel de Sinal:", error);
    return new NextResponse("Falha ao sintonizar sinal externo", { status: 500 });
  }
}
