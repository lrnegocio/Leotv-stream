
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

/**
 * TÚNEL MASTER SOBERANO v208 - MODO FLUXO CONTÍNUO
 * Repasse de sinais (.ts, .m3u8, .mp4, html) sem processamento intermediário.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  let targetUrl = searchParams.get('url');

  if (!targetUrl) return new NextResponse("Sinal Master Ausente", { status: 400 });

  // Limpeza de segurança XUI
  targetUrl = targetUrl.replace('.mpegts.js', '').replace('.js', '');

  try {
    const requestHeaders = new Headers();
    const range = req.headers.get('range');
    if (range) requestHeaders.set('Range', range);
    
    // Identidade de Elite (Fingindo ser o App IPTV Smarters Pro Oficial)
    requestHeaders.set('User-Agent', 'IPTVSmartersPro/3.0.0 (Linux;Android 11) Mobile');
    requestHeaders.set('Accept', '*/*');
    requestHeaders.set('Connection', 'keep-alive');
    
    const res = await fetch(targetUrl, { 
      headers: requestHeaders,
      cache: 'no-store',
      redirect: 'follow',
    });
    
    if (!res.ok && res.status !== 206) {
       const resRetry = await fetch(targetUrl, { 
         headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
         redirect: 'follow' 
       });
       if (!resRetry.ok) return new Response(null, { status: resRetry.status });
       return new Response(resRetry.body, { headers: { 'Content-Type': resRetry.headers.get('content-type') || 'video/mp4' } });
    }

    const responseHeaders = new Headers();
    const copyHeaders = [
      'content-type', 
      'content-length', 
      'content-range', 
      'accept-ranges',
      'cache-control'
    ];
    
    res.headers.forEach((v, k) => {
      if (copyHeaders.includes(k.toLowerCase())) responseHeaders.set(k, v);
    });

    const lowerUrl = targetUrl.toLowerCase();
    if (lowerUrl.includes('.ts')) responseHeaders.set('Content-Type', 'video/mp2t');
    if (lowerUrl.includes('.m3u8')) responseHeaders.set('Content-Type', 'application/vnd.apple.mpegurl');
    if (lowerUrl.includes('.mp4')) responseHeaders.set('Content-Type', 'video/mp4');

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
