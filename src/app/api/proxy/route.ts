
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

/**
 * TÚNEL MASTER SOBERANO v194 - FLUXO CONTÍNUO
 * Otimizado para evitar o carregamento infinito em links .ts e .m3u8
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) return new NextResponse("Sinal Master Ausente", { status: 400 });

  try {
    const requestHeaders = new Headers();
    const range = req.headers.get('range');
    if (range) requestHeaders.set('Range', range);
    
    // CABEÇALHOS DE SMART TV REAIS (Bypass agressivo)
    requestHeaders.set('User-Agent', 'Mozilla/5.0 (Linux; Android 11; Smart TV Build/RP1A.200720.011; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/83.0.4103.101 Safari/537.36');
    requestHeaders.set('Accept', '*/*');
    requestHeaders.set('Connection', 'keep-alive');
    
    // Remove rastros de origem para evitar bloqueio por Cross-Origin no servidor fonte
    const targetOrigin = new URL(targetUrl).origin;
    requestHeaders.set('Origin', targetOrigin);
    requestHeaders.set('Referer', targetOrigin + '/');
    
    const res = await fetch(targetUrl, { 
      headers: requestHeaders,
      cache: 'no-store',
      redirect: 'follow',
    });
    
    if (!res.ok) {
      return new Response("Erro na Fonte: " + res.status, { status: res.status });
    }

    // Prepara os cabeçalhos de resposta para STREAMING REAL
    const responseHeaders = new Headers();
    
    // Copia apenas o essencial para não quebrar o fluxo
    const essentialHeaders = ['content-type', 'content-length', 'content-range', 'accept-ranges'];
    res.headers.forEach((v, k) => {
      if (essentialHeaders.includes(k.toLowerCase())) responseHeaders.set(k, v);
    });

    // Se for .ts ou se o content-type for genérico, força o tipo de vídeo IPTV
    if (targetUrl.toLowerCase().includes('.ts') || !responseHeaders.get('content-type')) {
      responseHeaders.set('Content-Type', 'video/mp2t');
    }

    // CORS LIBERADO TOTAL E NO-CACHE AGRESSIVO
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    responseHeaders.set('Pragma', 'no-cache');
    responseHeaders.set('Expires', '0');

    // Retorna o corpo da resposta como um stream direto (Pipeline)
    return new Response(res.body, {
      status: res.status,
      headers: responseHeaders,
    });

  } catch (error: any) {
    console.error("Erro no Proxy Master v194:", error.message);
    return new Response(null, { status: 500 });
  }
}
