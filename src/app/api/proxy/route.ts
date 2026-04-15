
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

/**
 * TÚNEL MASTER SOBERANO v217 - MODO IDENTIDADE GLOBAL
 * Finge ser um navegador real para burlar bloqueios de CDNs (XVideos, Blinder, etc).
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  let targetUrl = searchParams.get('url');

  if (!targetUrl) return new NextResponse("Sinal Master Ausente", { status: 400 });

  try {
    const requestHeaders = new Headers();
    const range = req.headers.get('range');
    if (range) requestHeaders.set('Range', range);
    
    // IDENTIDADE CAMALEÃO: Finge ser um Navegador Chrome em Windows (Aceito por quase todas as CDNs)
    requestHeaders.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
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
    
    // RECOVERY MODE: Se o primeiro falhar, tenta com identidade mobile
    if (!res.ok && res.status !== 206) {
       const resRetry = await fetch(targetUrl, { 
         headers: { 
           'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36',
           'Accept': '*/*'
         },
         redirect: 'follow' 
       });
       if (!resRetry.ok) return new Response(null, { status: resRetry.status });
       return new Response(resRetry.body, { headers: { 'Content-Type': resRetry.headers.get('content-type') || 'video/mp4', 'Access-Control-Allow-Origin': '*' } });
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

    // Força o tipo de conteúdo se necessário para o player não bugar
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
