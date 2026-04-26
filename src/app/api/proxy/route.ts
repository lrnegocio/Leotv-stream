
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

/**
 * TÚNEL MASTER SOBERANO v364 - O EXTERMINADOR DE BLOQUEIOS E JUNK-LINKS
 * Calibragem especial para googleapis, roblox e mascaramento de TV.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) return new NextResponse("Sinal Master Ausente", { status: 400 });

  const lowTarget = targetUrl.toLowerCase();

  // EXTERMINADOR DE JUNK v364: Bloqueia analytics e junk links que travam o painel
  if (lowTarget.includes('googletagmanager') || lowTarget.includes('analytics') || lowTarget.includes('facebook.net') || lowTarget.includes('pixel')) {
    return new NextResponse("Link de Junk Bloqueado", { status: 403 });
  }

  if (lowTarget.includes('youtube.com') || lowTarget.includes('youtu.be')) {
    return new NextResponse("YouTube deve ser carregado diretamente.", { status: 403 });
  }

  try {
    const urlObj = new URL(targetUrl);
    const requestHeaders = new Headers();
    
    const headersToForward = ['range', 'cookie', 'accept-language'];
    headersToForward.forEach(h => {
      const val = req.headers.get(h);
      if (val) requestHeaders.set(h, val);
    });

    // MASCARAMENTO SOBERANO: Força a TV a se identificar como um PC Desktop Windows 11
    requestHeaders.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
    requestHeaders.set('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8');
    requestHeaders.set('Cache-Control', 'no-cache');
    requestHeaders.set('Sec-Fetch-Dest', 'document');
    requestHeaders.set('Sec-Fetch-Mode', 'navigate');
    requestHeaders.set('Sec-Fetch-Site', 'none');
    requestHeaders.set('Upgrade-Insecure-Requests', '1');
    
    // CALIBRAGEM DE REFERER SOBERANA v364
    if (lowTarget.includes('roblox.com')) {
      requestHeaders.set('Referer', 'https://www.roblox.com/');
      requestHeaders.set('Origin', 'https://www.roblox.com');
      // Roblox exige que o host seja exato
      requestHeaders.set('Host', 'www.roblox.com');
    } else if (lowTarget.includes('googleapis.com.de')) {
      requestHeaders.set('Referer', 'https://googleapis.com.de/');
      requestHeaders.set('Origin', 'https://googleapis.com.de');
    } else if (lowTarget.includes('hoathinh3d')) {
      requestHeaders.set('Referer', 'https://hoathinh3d.co.in/');
      requestHeaders.set('Origin', 'https://hoathinh3d.co.in');
    } else if (lowTarget.includes('rdcanais') || lowTarget.includes('reidoscanais') || lowTarget.includes('rdcplayer')) {
      requestHeaders.set('Referer', 'https://rdcanais.com/');
      requestHeaders.set('Origin', 'https://rdcanais.com');
    } else if (lowTarget.includes('redecanais')) {
      const origin = targetUrl.includes('.be') ? 'https://redecanaistv.be/' : 'https://redecanaistv.net/';
      requestHeaders.set('Referer', origin);
      requestHeaders.set('Origin', origin.replace(/\/$/, ''));
    } else if (lowTarget.includes('xvideos')) {
      requestHeaders.set('Referer', 'https://www.xvideos.com/');
      requestHeaders.set('Origin', 'https://www.xvideos.com');
    } else if (lowTarget.includes('ok.ru')) {
      requestHeaders.set('Referer', 'https://ok.ru/');
      requestHeaders.set('Origin', 'https://ok.ru');
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
    return new Response("Falha no Túnel Master v364", { status: 500 });
  }
}

async function handleResponse(res: Response, targetUrl: string, urlObj: URL) {
  const contentType = res.headers.get('content-type') || '';
  const lowUrl = targetUrl.toLowerCase();
  
  const isM3u8 = lowUrl.includes('.m3u8') || contentType.includes('mpegurl');
  const isHtml = contentType.includes('text/html');

  const responseHeaders = new Headers();
  
  const headersToCopy = [
    'content-type', 'content-length', 'content-range', 
    'accept-ranges', 'cache-control'
  ];
  
  headersToCopy.forEach(h => {
    const val = res.headers.get(h);
    if (val) responseHeaders.set(h, val);
  });
  
  const setCookies = res.headers.getSetCookie();
  setCookies.forEach(cookie => {
    responseHeaders.append('Set-Cookie', cookie);
  });
  
  responseHeaders.set('Access-Control-Allow-Origin', '*');
  responseHeaders.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
  responseHeaders.set('Access-Control-Allow-Headers', '*');
  
  // DECAPITADOR DE SEGURANÇA v364 - EXTERMINADOR DE TELA BRANCA
  responseHeaders.delete('X-Frame-Options');
  responseHeaders.delete('Content-Security-Policy');
  responseHeaders.delete('X-Content-Security-Policy');
  responseHeaders.delete('X-WebKit-CSP');
  responseHeaders.delete('Report-To');
  responseHeaders.delete('NEL');
  responseHeaders.delete('Cross-Origin-Opener-Policy');
  responseHeaders.delete('Cross-Origin-Resource-Policy');
  
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
    htmlText = htmlText.replace(/window\.open/g, 'console.log');
    htmlText = htmlText.replace(/target=["']_blank["']/g, 'target="_self"');
    htmlText = htmlText.replace(/window\.top/g, 'window.self');
    htmlText = htmlText.replace(/top\.location/g, 'window.location');
    
    // Injeção de base para garantir que assets relativos funcionem
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
