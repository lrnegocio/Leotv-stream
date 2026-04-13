
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * TÚNEL MASTER SOBERANO v192 - O CANO DE ALTA PRESSÃO
 * Otimizado para Bypassar bloqueios de servidores de IPTV (Contfree, Blinder, etc)
 * Disfarça a requisição como um App de Smart TV real.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) return new NextResponse("Sinal Master Ausente", { status: 400 });

  try {
    const requestHeaders = new Headers();
    
    // Suporte a Range (Vital para fluidez e não travar o carregamento)
    const range = req.headers.get('range');
    if (range) requestHeaders.set('Range', range);
    
    // DISFARCE MASTER: Finge ser um App de IPTV real (Smarters Pro / XCIPTV)
    // Isso engana servidores que bloqueiam navegadores (como o contfree.shop)
    requestHeaders.set('User-Agent', 'IPTVSmartersPlayer/1.0.3 (Linux;Android 11) Web-Client');
    requestHeaders.set('Accept', '*/*');
    requestHeaders.set('Connection', 'keep-alive');
    
    const res = await fetch(targetUrl, { 
      headers: requestHeaders,
      cache: 'no-store',
      redirect: 'follow',
    });
    
    if (res.status === 401 || res.status === 403) {
      return new Response("Sinal Protegido ou Exppirado na Origem", { status: res.status });
    }

    const responseHeaders = new Headers();
    
    // Copia cabeçalhos vitais
    const headersToCopy = ['content-type', 'content-length', 'content-range', 'accept-ranges', 'cache-control'];
    res.headers.forEach((v, k) => {
      if (headersToCopy.includes(k.toLowerCase())) responseHeaders.set(k, v);
    });

    // Força o tipo de vídeo para fluxos .ts ou .m3u8 vindos de servidores brutos
    if (targetUrl.toLowerCase().includes('.ts')) {
      responseHeaders.set('Content-Type', 'video/mp2t');
    }

    // Liberação Total de CORS (Faz o navegador aceitar o sinal vindo da sua VPS)
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, OPTIONS');

    return new Response(res.body, {
      status: res.status,
      headers: responseHeaders,
    });

  } catch (error: any) {
    console.error("Erro no Proxy Master v192:", error.message);
    return new Response(null, { status: 500 });
  }
}
