import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

/**
 * TÚNEL MASTER SOBERANO v200 - BYPASS SUPREMO MP4/TS
 * Otimizado para vencer o erro USER_DISALLOW_EXT e garantir stream fluido.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  let targetUrl = searchParams.get('url');

  if (!targetUrl) return new NextResponse("Sinal Master Ausente", { status: 400 });

  // LIMPEZA MASTER: Remove extensões de script que o player possa ter injetado por erro
  targetUrl = targetUrl.replace('.mpegts.js', '').replace('.js', '');

  try {
    const requestHeaders = new Headers();
    
    // Suporte a Range para Filmes e Séries (Essencial para não travar MP4)
    const range = req.headers.get('range');
    if (range) requestHeaders.set('Range', range);
    
    // IDENTIDADE CAMALEÃO v200: Finge ser o App Oficial IPTV Smarters Pro
    requestHeaders.set('User-Agent', 'IPTVSmartersPro/3.0.0 (Linux;Android 11) Mobile');
    requestHeaders.set('Accept', '*/*');
    requestHeaders.set('Accept-Language', 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7');
    requestHeaders.set('Connection', 'keep-alive');
    
    // REMOVE O RASTRO DO SITE (Crucial para evitar o erro USER_DISALLOW_EXT)
    const targetOrigin = new URL(targetUrl).origin;
    requestHeaders.set('Origin', targetOrigin);
    
    const res = await fetch(targetUrl, { 
      headers: requestHeaders,
      cache: 'no-store',
      redirect: 'follow',
    });
    
    // Se a fonte responder com erro, tentamos sem os headers extras
    if (!res.ok && res.status !== 206) {
       const resRetry = await fetch(targetUrl, { redirect: 'follow' });
       if (!resRetry.ok) return new Response("Sinal Bloqueado na Fonte", { status: resRetry.status });
       return new Response(resRetry.body, { headers: { 'Content-Type': resRetry.headers.get('content-type') || 'video/mp4' } });
    }

    const responseHeaders = new Headers();
    
    // Copia cabeçalhos vitais da fonte para o navegador
    const copyHeaders = ['content-type', 'content-length', 'content-range', 'accept-ranges'];
    res.headers.forEach((v, k) => {
      if (copyHeaders.includes(k.toLowerCase())) responseHeaders.set(k, v);
    });

    // Força o Mime-Type correto se necessário
    const contentType = responseHeaders.get('content-type');
    if (targetUrl.toLowerCase().includes('.ts') || (contentType && contentType.includes('mpegts'))) {
      responseHeaders.set('Content-Type', 'video/mp2t');
    } else if (targetUrl.toLowerCase().includes('.mp4')) {
      responseHeaders.set('Content-Type', 'video/mp4');
    }

    // Liberação Total de Acesso (CORS Bypass)
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Cache-Control', 'no-cache, no-store, must-revalidate');

    return new Response(res.body, {
      status: res.status,
      headers: responseHeaders,
    });

  } catch (error: any) {
    console.error("Proxy Error:", error);
    return new Response(null, { status: 500 });
  }
}