import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * TÚNEL MASTER v100.0 - SOBERANO (TECNOLOGIA IPTV NATIVA)
 * Suporte total a Range (Blinder/MP4) e Fluxo Contínuo de Fragmentos (.ts)
 * Resolve definitivamente erros de CORS, Mixed Content e Bloqueio de IP.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) return new NextResponse("Sinal Master Ausente", { status: 400 });

  try {
    const requestHeaders = new Headers();
    
    // SUPORTE A RANGE - CRÍTICO PARA FILMES MP4 (BLINDER/ARCHIVE) E STREAMING LONGO
    const range = req.headers.get('range');
    if (range) requestHeaders.set('Range', range);
    
    requestHeaders.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
    
    const targetUrlObj = new URL(targetUrl);
    requestHeaders.set('Origin', targetUrlObj.origin);
    requestHeaders.set('Referer', targetUrlObj.origin + '/');

    const res = await fetch(targetUrl, { 
      headers: requestHeaders,
      cache: 'no-store',
      redirect: 'follow',
    });
    
    const responseHeaders = new Headers();
    
    // Repassa cabeçalhos cruciais de vídeo do sinal original
    const allowedHeaders = [
      'content-type',
      'content-length',
      'content-range',
      'accept-ranges',
      'cache-control',
      'last-modified'
    ];
    
    res.headers.forEach((v, k) => {
      const lowerKey = k.toLowerCase();
      if (allowedHeaders.includes(lowerKey)) {
        responseHeaders.set(k, v);
      }
    });

    // LIBERAÇÃO CORS TOTAL (TECNOLOGIA IPTV WEB)
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, OPTIONS, HEAD');
    responseHeaders.set('Access-Control-Allow-Headers', '*');
    responseHeaders.set('X-Content-Type-Options', 'nosniff');

    if (!res.body) return new Response(null, { status: res.status, headers: responseHeaders });

    // Retorna o corpo como stream para performance máxima (sem delay)
    return new Response(res.body, {
      status: res.status === 206 ? 206 : (res.ok ? 200 : res.status),
      headers: responseHeaders,
    });

  } catch (error: any) {
    console.error("Erro no Túnel Master:", error.message);
    return new Response(null, { status: 200, headers: { 'Access-Control-Allow-Origin': '*' } });
  }
}

export async function OPTIONS() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS, HEAD',
      'Access-Control-Allow-Headers': '*',
    },
  });
}
