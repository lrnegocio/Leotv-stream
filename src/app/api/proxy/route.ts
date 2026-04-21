
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

/**
 * TÚNEL MASTER SOBERANO v309 - PROTOCOLO CAMALEÃO SUPREMO
 * Blinda o sinal contra bloqueios de CORS, X-Frame-Options e Mixed Content.
 * Neutraliza 'Iframe Breakout' e suporta SEEK (Archive.org).
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) return new NextResponse("Sinal Master Ausente", { status: 400 });

  try {
    const urlObj = new URL(targetUrl);
    const requestHeaders = new Headers();
    
    // REPASSE DE RANGE (Vital para Seek/Avançar vídeos no Archive.org)
    const range = req.headers.get('range');
    if (range) {
      requestHeaders.set('Range', range);
    }

    // IDENTIDADE DE ELITE (Chrome 133)
    requestHeaders.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36');
    requestHeaders.set('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8');
    requestHeaders.set('Accept-Language', 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7');
    requestHeaders.set('Cache-Control', 'no-cache');
    requestHeaders.set('Pragma', 'no-cache');
    
    const lowTarget = targetUrl.toLowerCase();
    
    // PROTOCOLO DE REFERER INTELIGENTE - CAMUFLAGEM DE ORIGEM
    if (lowTarget.includes('rdcanais') || lowTarget.includes('reidoscanais') || lowTarget.includes('rdcplayer')) {
      requestHeaders.set('Referer', 'https://reidoscanais.ooo/');
      requestHeaders.set('Origin', 'https://reidoscanais.ooo');
    } else if (lowTarget.includes('redecanais')) {
      requestHeaders.set('Referer', 'https://redecanaistv.net/');
      requestHeaders.set('Origin', 'https://redecanaistv.net');
    } else if (lowTarget.includes('playcnvs.stream')) {
      requestHeaders.set('Referer', 'http://www.playcnvs.stream/');
    } else {
      requestHeaders.set('Referer', urlObj.origin + '/');
    }

    const res = await fetch(targetUrl, { 
      headers: requestHeaders,
      cache: 'no-store',
      redirect: 'follow'
    });

    return handleResponse(res, targetUrl, urlObj);
  } catch (error) {
    return new Response("Falha no Túnel Master v309", { status: 500 });
  }
}

async function handleResponse(res: Response, targetUrl: string, urlObj: URL) {
  const contentType = res.headers.get('content-type') || '';
  const lowUrl = targetUrl.toLowerCase();
  
  const isM3u8 = lowUrl.includes('.m3u8') || contentType.includes('mpegurl') || contentType.includes('apple-mpegurl');
  const isHtml = contentType.includes('text/html');

  // REESCRITA HLS MASTER (Para canais ao vivo)
  if (isM3u8) {
    const manifestText = await res.text();
    const baseUrl = targetUrl.split('?')[0].substring(0, targetUrl.split('?')[0].lastIndexOf('/') + 1);
    
    const rewrittenManifest = manifestText.split('\n').map(line => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return line;
      try {
        const absoluteUrl = new URL(trimmed, baseUrl).href;
        return `/api/proxy?url=${encodeURIComponent(absoluteUrl)}`;
      } catch (e) { return line; }
    }).join('\n');

    return new Response(rewrittenManifest, {
      headers: { 
        'Content-Type': 'application/vnd.apple.mpegurl', 
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store'
      }
    });
  }

  // FILTRAGEM ANTI-BLOQUEIO PARA PLAYERS WEB (HTML)
  if (isHtml) {
    let htmlText = await res.text();
    
    // NEUTRALIZADOR DE IFRAME BREAKOUT (Impedir que o site saia do seu player)
    htmlText = htmlText.replace(/window\.top/g, 'window.self');
    htmlText = htmlText.replace(/top\.location/g, 'self.location');
    htmlText = htmlText.replace(/parent\.location/g, 'self.location');
    
    // Injeta Base Href para que imagens e scripts do site original funcionem
    const baseTag = `<base href="${urlObj.origin}${urlObj.pathname}">`;
    htmlText = htmlText.replace('<head>', `<head>${baseTag}`);
    
    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', 'text/html');
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    
    // EXTERMINADOR DE BLOQUEIOS DE FRAME
    responseHeaders.set('X-Frame-Options', 'ALLOWALL');
    responseHeaders.set('Content-Security-Policy', "frame-ancestors *");

    return new Response(htmlText, {
      headers: responseHeaders,
      status: 200
    });
  }

  // STREAMS DE VÍDEO DIRETO (REPASSA STATUS 206 PARA PERMITIR AVANÇAR VÍDEO)
  const responseHeaders = new Headers();
  const headersToCopy = [
    'content-type', 
    'content-length', 
    'content-range', 
    'accept-ranges', 
    'cache-control',
    'last-modified',
    'etag'
  ];
  
  headersToCopy.forEach(h => {
    const val = res.headers.get(h);
    if (val) responseHeaders.set(h, val);
  });
  
  responseHeaders.set('Access-Control-Allow-Origin', '*');

  return new Response(res.body, { 
    status: res.status, 
    statusText: res.statusText,
    headers: responseHeaders 
  });
}
