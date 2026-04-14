
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

/**
 * TÚNEL MASTER SOBERANO v195 - FLUXO DE ALTA PRESSÃO
 * Otimizado para evitar o carregamento infinito e suportar Range (VOD)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) return new NextResponse("Sinal Master Ausente", { status: 400 });

  try {
    const requestHeaders = new Headers();
    
    // Suporte a Range para Filmes e Séries não travarem
    const range = req.headers.get('range');
    if (range) requestHeaders.set('Range', range);
    
    // Falsificação de Identidade (User-Agent de Smart TV Android 11)
    requestHeaders.set('User-Agent', 'Mozilla/5.0 (Linux; Android 11; Smart TV Build/RP1A.200720.011; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/83.0.4103.101 Safari/537.36');
    requestHeaders.set('Accept', '*/*');
    requestHeaders.set('Connection', 'keep-alive');
    requestHeaders.set('Icy-MetaData', '1');
    
    const targetOrigin = new URL(targetUrl).origin;
    requestHeaders.set('Origin', targetOrigin);
    requestHeaders.set('Referer', targetOrigin + '/');
    
    const res = await fetch(targetUrl, { 
      headers: requestHeaders,
      cache: 'no-store',
      redirect: 'follow',
    });
    
    if (!res.ok && res.status !== 206) {
      return new Response("Erro na Fonte: " + res.status, { status: res.status });
    }

    const responseHeaders = new Headers();
    
    // Copia headers vitais da fonte para o navegador
    const copyHeaders = ['content-type', 'content-length', 'content-range', 'accept-ranges', 'icy-metaint', 'icy-name'];
    res.headers.forEach((v, k) => {
      if (copyHeaders.includes(k.toLowerCase())) responseHeaders.set(k, v);
    });

    // Força o Mime-Type correto para sinais IPTV (.ts e .m3u8 sem tipo)
    if (targetUrl.toLowerCase().includes('.ts') || !responseHeaders.get('content-type')) {
      responseHeaders.set('Content-Type', 'video/mp2t');
    }

    // Liberação Total de Acesso
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    responseHeaders.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    responseHeaders.set('Pragma', 'no-cache');
    responseHeaders.set('Expires', '0');

    return new Response(res.body, {
      status: res.status,
      headers: responseHeaders,
    });

  } catch (error: any) {
    console.error("Erro no Proxy Master v195:", error.message);
    return new Response(null, { status: 500 });
  }
}
