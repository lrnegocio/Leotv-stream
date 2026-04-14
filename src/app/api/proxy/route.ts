import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

/**
 * TÚNEL MASTER SOBERANO v202
 * Limpeza agressiva de .mpegts.js e suporte total a MP4/TS.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  let targetUrl = searchParams.get('url');

  if (!targetUrl) return new NextResponse("Sinal Master Ausente", { status: 400 });

  // LIMPEZA XUI ONE: Remove extensões de código injetadas por erro
  targetUrl = targetUrl.replace('.mpegts.js', '').replace('.js', '');

  try {
    const requestHeaders = new Headers();
    
    // Suporte a Range (Vital para pular partes do filme .mp4)
    const range = req.headers.get('range');
    if (range) requestHeaders.set('Range', range);
    
    // IDENTIDADE IPTV SMARTERS PRO (O painel confia nesse App)
    requestHeaders.set('User-Agent', 'IPTVSmartersPro/3.0.0 (Linux;Android 11) Mobile');
    requestHeaders.set('Accept', '*/*');
    requestHeaders.set('Connection', 'keep-alive');
    
    // BURLA REFERER
    const targetOrigin = new URL(targetUrl).origin;
    requestHeaders.set('Origin', targetOrigin);
    
    const res = await fetch(targetUrl, { 
      headers: requestHeaders,
      cache: 'no-store',
      redirect: 'follow',
    });
    
    // Fallback se o servidor de origem for chato
    if (!res.ok && res.status !== 206) {
       const resRetry = await fetch(targetUrl, { redirect: 'follow' });
       if (!resRetry.ok) return new Response(null, { status: resRetry.status });
       return new Response(resRetry.body, { headers: { 'Content-Type': resRetry.headers.get('content-type') || 'video/mp4' } });
    }

    const responseHeaders = new Headers();
    const copyHeaders = ['content-type', 'content-length', 'content-range', 'accept-ranges'];
    res.headers.forEach((v, k) => {
      if (copyHeaders.includes(k.toLowerCase())) responseHeaders.set(k, v);
    });

    // Força MIME correto
    if (targetUrl.toLowerCase().includes('.ts')) {
      responseHeaders.set('Content-Type', 'video/mp2t');
    }

    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Cache-Control', 'no-cache, no-store, must-revalidate');

    return new Response(res.body, {
      status: res.status,
      headers: responseHeaders,
    });

  } catch (error: any) {
    return new Response(null, { status: 500 });
  }
}