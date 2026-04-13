
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * TÚNEL MASTER SOBERANO v193 - O CANO DE ALTA PRESSÃO
 * Otimizado com cabeçalhos reais de Smart TV (Estilo Blinder/Supremo)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) return new NextResponse("Sinal Master Ausente", { status: 400 });

  try {
    const requestHeaders = new Headers();
    const range = req.headers.get('range');
    if (range) requestHeaders.set('Range', range);
    
    // CABEÇALHOS DE SMART TV REAIS (Bypass de segurança Blinder)
    requestHeaders.set('User-Agent', 'Mozilla/5.0 (Linux; Android 11; Smart TV Build/RP1A.200720.011; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/83.0.4103.101 Safari/537.36');
    requestHeaders.set('Accept', '*/*');
    requestHeaders.set('Accept-Language', 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7');
    requestHeaders.set('Connection', 'keep-alive');
    requestHeaders.set('Origin', new URL(targetUrl).origin);
    requestHeaders.set('Referer', new URL(targetUrl).origin + '/');
    
    const res = await fetch(targetUrl, { 
      headers: requestHeaders,
      cache: 'no-store',
      redirect: 'follow',
    });
    
    if (res.status === 401 || res.status === 403) {
      return new Response("Sinal Protegido ou Expirado na Origem", { status: res.status });
    }

    const responseHeaders = new Headers();
    const headersToCopy = ['content-type', 'content-length', 'content-range', 'accept-ranges', 'cache-control'];
    res.headers.forEach((v, k) => {
      if (headersToCopy.includes(k.toLowerCase())) responseHeaders.set(k, v);
    });

    // Identifica se é um arquivo de vídeo .ts para garantir o processamento pelo mpegts.js
    if (targetUrl.toLowerCase().includes('.ts')) {
      responseHeaders.set('Content-Type', 'video/mp2t');
    }

    // CORS LIBERADO TOTAL (Estilo Web Player Supremo)
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', 'Range, Content-Type');

    return new Response(res.body, {
      status: res.status,
      headers: responseHeaders,
    });

  } catch (error: any) {
    console.error("Erro no Proxy Master v193:", error.message);
    return new Response(null, { status: 500 });
  }
}
