
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

/**
 * TÚNEL MASTER SOBERANO v354 - PROTOCOLO DE DECAPITAÇÃO DE HEADERS ELITE
 * Calibragem extrema para XVideos e sites com proteção CSP agressiva.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) return new NextResponse("Sinal Master Ausente", { status: 400 });

  if (targetUrl.includes('youtube.com') || targetUrl.includes('youtu.be')) {
    return new NextResponse("YouTube deve ser carregado diretamente.", { status: 403 });
  }

  try {
    const urlObj = new URL(targetUrl);
    const requestHeaders = new Headers();
    
    // Encaminha headers essenciais do cliente
    const headersToForward = ['range', 'cookie', 'accept-language'];
    headersToForward.forEach(h => {
      const val = req.headers.get(h);
      if (val) requestHeaders.set(h, val);
    });

    requestHeaders.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
    requestHeaders.set('Accept', '*/*');
    requestHeaders.set('Cache-Control', 'no-cache');
    
    const lowTarget = targetUrl.toLowerCase();
    
    // CALIBRAGEM DE REFERER POR DOMÍNIO
    if (lowTarget.includes('rdcanais') || lowTarget.includes('reidoscanais') || lowTarget.includes('rdcplayer')) {
      requestHeaders.set('Referer', 'https://rdcanais.com/');
      requestHeaders.set('Origin', 'https://rdcanais.com');
    } else if (lowTarget.includes('redecanais')) {
      const origin = targetUrl.includes('.be') ? 'https://redecanaistv.be/' : 'https://redecanaistv.net/';
      requestHeaders.set('Referer', origin);
      requestHeaders.set('Origin', origin.replace(/\/$/, ''));
    } else if (lowTarget.includes('xvideos')) {
      // SPOOFING ELITE PARA XVIDEOS
      requestHeaders.set('Referer', 'https://www.xvideos.com/');
      requestHeaders.set('Origin', 'https://www.xvideos.com');
      requestHeaders.set('Sec-Fetch-Dest', 'iframe');
      requestHeaders.set('Sec-Fetch-Mode', 'navigate');
      requestHeaders.set('Sec-Fetch-Site', 'same-origin');
    } else if (lowTarget.includes('tokyvideo')) {
      requestHeaders.set('Referer', 'https://www.tokyvideo.com/'); 
      requestHeaders.set('Origin', 'https://www.tokyvideo.com');
    } else if (lowTarget.includes('shortflix')) {
      requestHeaders.set('Referer', 'https://www.shortflix.net/');
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
    return new Response("Falha no Túnel Master v354", { status: 500 });
  }
}

async function handleResponse(res: Response, targetUrl: string, urlObj: URL) {
  const contentType = res.headers.get('content-type') || '';
  const lowUrl = targetUrl.toLowerCase();
  
  const isM3u8 = lowUrl.includes('.m3u8') || contentType.includes('mpegurl');
  const isHtml = contentType.includes('text/html');

  const responseHeaders = new Headers();
  
  // Copia headers básicos
  const headersToCopy = [
    'content-type', 'content-length', 'content-range', 
    'accept-ranges', 'cache-control'
  ];
  
  headersToCopy.forEach(h => {
    const val = res.headers.get(h);
    if (val) responseHeaders.set(h, val);
  });
  
  // Repassa Cookies para manter sessões ativas
  const setCookies = res.headers.getSetCookie();
  setCookies.forEach(cookie => {
    responseHeaders.append('Set-Cookie', cookie);
  });
  
  // EXTERMINADOR DE BLOQUEIOS (Resolve Tela Branca XVideos e RDC)
  responseHeaders.set('Access-Control-Allow-Origin', '*');
  responseHeaders.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  responseHeaders.set('Access-Control-Allow-Headers', '*');
  
  // DECAPITAÇÃO DE HEADERS DE SEGURANÇA
  responseHeaders.delete('X-Frame-Options');
  responseHeaders.delete('Content-Security-Policy');
  responseHeaders.delete('X-Content-Security-Policy');
  responseHeaders.delete('X-WebKit-CSP');
  responseHeaders.delete('Report-To');
  responseHeaders.delete('NEL');
  
  // FORÇA LIBERAÇÃO DE IFRAME
  responseHeaders.set('X-Frame-Options', 'ALLOWALL');
  responseHeaders.set('Content-Security-Policy', "default-src * 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; frame-ancestors *;");

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
      headers: responseHeaders
    });
  }

  if (isHtml) {
    let htmlText = await res.text();
    // Neutraliza scripts que tentam detectar frames ou abrir janelas
    htmlText = htmlText.replace(/window\.open/g, 'console.log');
    htmlText = htmlText.replace(/target=["']_blank["']/g, 'target="_self"');
    htmlText = htmlText.replace(/window\.top/g, 'window.self');
    htmlText = htmlText.replace(/top\.location/g, 'window.location');
    
    const baseTag = `<base href="${urlObj.origin}${urlObj.pathname}">`;
    htmlText = htmlText.replace('<head>', `<head>${baseTag}`);
    
    responseHeaders.set('Content-Type', 'text/html; charset=utf-8');
    return new Response(htmlText, {
      headers: responseHeaders,
      status: 200
    });
  }

  return new Response(res.body, { 
    status: res.status, 
    headers: responseHeaders 
  });
}
