
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

/**
 * TÚNEL MASTER SOBERANO v223 - PROTOCOLO CAMALEÃO UNIVERSAL
 * Finge ser uma Smart TV oficial para abrir sinais IPTV, Filmes e Portais (PlayCNVS, Rei dos Canais).
 * Suporta redirecionamentos e Range Requests para evitar carregamento infinito.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) return new NextResponse("Sinal Master Ausente", { status: 400 });

  try {
    const urlObj = new URL(targetUrl);
    const requestHeaders = new Headers();
    
    // Encaminha o Range (Vital para vídeos longos e .mp4 não travarem)
    const range = req.headers.get('range');
    if (range) requestHeaders.set('Range', range);
    
    // MÁSCARA SOBERANA: Identidade de Smart TV Samsung 2024 (Engana CDNs e Bloqueios)
    requestHeaders.set('User-Agent', 'Mozilla/5.0 (SMART-TV; LINUX; Tizen 7.0) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/21.0 Chrome/110.0.0.0 TV Safari/537.36');
    requestHeaders.set('Accept', '*/*');
    requestHeaders.set('Accept-Language', 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7');
    requestHeaders.set('Origin', urlObj.origin);
    requestHeaders.set('Referer', urlObj.origin + '/');
    requestHeaders.set('Connection', 'keep-alive');

    const res = await fetch(targetUrl, { 
      headers: requestHeaders,
      cache: 'no-store',
      redirect: 'follow', // Essencial para links que mudam (Redirecionamento)
    });

    if (!res.ok && res.status !== 206) {
       // RECOVERY MODE: Tentativa via Mobile se a TV for bloqueada
       const resMobile = await fetch(targetUrl, {
         headers: {
           'User-Agent': 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Mobile Safari/537.36',
           'Referer': urlObj.origin + '/'
         },
         redirect: 'follow'
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

    // FORÇA TIPAGEM SE O SERVIDOR OMITIR (Evita NotSupportedError no navegador)
    const lowerUrl = targetUrl.toLowerCase();
    if (lowerUrl.includes('.ts')) {
      responseHeaders.set('Content-Type', 'video/mp2t');
    } else if (lowerUrl.includes('.m3u8')) {
      responseHeaders.set('Content-Type', 'application/vnd.apple.mpegurl');
    } else if (lowerUrl.includes('.mp4')) {
      responseHeaders.set('Content-Type', 'video/mp4');
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
