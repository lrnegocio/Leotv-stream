import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

/**
 * TÚNEL MASTER SOBERANO v218 - MODO CAMALEÃO CDNs
 * Finge ser um navegador real para abrir sinais da XVideos, Blinder e Contfree.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) return new NextResponse("Sinal Master Ausente", { status: 400 });

  try {
    const requestHeaders = new Headers();
    const range = req.headers.get('range');
    if (range) requestHeaders.set('Range', range);
    
    const urlObj = new URL(targetUrl);

    // IDENTIDADE CAMALEÃO: Finge ser o Chrome mais recente em Windows 10
    requestHeaders.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');
    requestHeaders.set('Accept', '*/*');
    requestHeaders.set('Accept-Language', 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7');
    requestHeaders.set('Origin', urlObj.origin);
    requestHeaders.set('Referer', urlObj.origin + '/');
    requestHeaders.set('Sec-Fetch-Dest', 'video');
    requestHeaders.set('Sec-Fetch-Mode', 'no-cors');
    requestHeaders.set('Sec-Fetch-Site', 'cross-site');

    const res = await fetch(targetUrl, { 
      headers: requestHeaders,
      cache: 'no-store',
      redirect: 'follow',
    });

    if (!res.ok && res.status !== 206) {
       // RECOVERY MOBILE: Tenta como Android se o desktop falhar
       const resMobile = await fetch(targetUrl, {
         headers: {
           'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Mobile Safari/537.36',
           'Referer': urlObj.origin + '/'
         }
       });
       if (!resMobile.ok) return new Response(null, { status: resMobile.status });
       return new Response(resMobile.body, { headers: { 'Content-Type': resMobile.headers.get('content-type') || 'video/mp4', 'Access-Control-Allow-Origin': '*' } });
    }

    const responseHeaders = new Headers();
    const headersToCopy = ['content-type', 'content-length', 'content-range', 'accept-ranges'];
    headersToCopy.forEach(h => {
      const val = res.headers.get(h);
      if (val) responseHeaders.set(h, val);
    });

    // CORREÇÃO DE TIPO: Garante que o Player saiba o que está recebendo
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

  } catch (error) {
    return new Response(null, { status: 500 });
  }
}
