
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

/**
 * TÚNEL MASTER SOBERANO v222 - PROTOCOLO CAMALEÃO ULTRA
 * Finge ser uma Smart TV oficial para abrir sinais IPTV e Filmes.
 * Agora suporta Range Requests para evitar carregamento infinito.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) return new NextResponse("Sinal Master Ausente", { status: 400 });

  try {
    const urlObj = new URL(targetUrl);
    const requestHeaders = new Headers();
    
    // Encaminha o Range (Vital para vídeos longos e .mp4)
    const range = req.headers.get('range');
    if (range) requestHeaders.set('Range', range);
    
    // MÁSCARA SOBERANA: Identidade de Smart TV de Elite
    requestHeaders.set('User-Agent', 'Mozilla/5.0 (SMART-TV; LINUX; Tizen 6.0) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/14.0 Chrome/87.0.4280.141 TV Safari/537.36');
    requestHeaders.set('Accept', '*/*');
    requestHeaders.set('Accept-Language', 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7');
    requestHeaders.set('Origin', urlObj.origin);
    requestHeaders.set('Referer', urlObj.origin + '/');
    requestHeaders.set('Connection', 'keep-alive');

    const res = await fetch(targetUrl, { 
      headers: requestHeaders,
      cache: 'no-store',
      redirect: 'follow',
    });

    if (!res.ok && res.status !== 206) {
       // RECOVERY MODE: Tentativa via Mobile se a TV falhar
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
    const headersToCopy = ['content-type', 'content-length', 'content-range', 'accept-ranges', 'content-encoding'];
    headersToCopy.forEach(h => {
      const val = res.headers.get(h);
      if (val) responseHeaders.set(h, val);
    });

    // Força tipos conhecidos se o servidor omitir
    const lowerUrl = targetUrl.toLowerCase();
    if (lowerUrl.includes('.ts')) {
      responseHeaders.set('Content-Type', 'video/mp2t');
    } else if (lowerUrl.includes('.m3u8')) {
      responseHeaders.set('Content-Type', 'application/vnd.apple.mpegurl');
    }

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
