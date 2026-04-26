
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

/**
 * TÚNEL MASTER SOBERANA v368 - O GOLPE FINAL
 * Protocolo de Desbloqueio Mercado Play, XVideos e Deep-Cleaning Roblox v3.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) return new NextResponse("Sinal Master Ausente", { status: 400 });

  const lowTarget = targetUrl.toLowerCase();

  // EXTERMINADOR DE JUNK v368
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

    // MASCARAMENTO SOBERANO v368 - AGRESSIVO
    requestHeaders.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
    requestHeaders.set('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8');
    
    // CALIBRAGEM DE REFERER E ORIGIN v368
    if (lowTarget.includes('mercadolivre') || lowTarget.includes('mercadopago')) {
      requestHeaders.set('Referer', 'https://play.mercadolivre.com.br/');
      requestHeaders.set('Origin', 'https://play.mercadolivre.com.br');
    } else if (lowTarget.includes('roblox.com')) {
      requestHeaders.set('Referer', 'https://www.roblox.com/');
      requestHeaders.set('Origin', 'https://www.roblox.com');
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
    return new Response("Falha no Túnel Master v368", { status: 500 });
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
  
  // DECAPITADOR DE SEGURANÇA v368 - MODO EXTREMO (MATA CSP E X-FRAME)
  const headersToNuke = [
    'X-Frame-Options', 'Content-Security-Policy', 'X-Content-Security-Policy',
    'X-WebKit-CSP', 'Report-To', 'NEL', 'Cross-Origin-Opener-Policy',
    'Cross-Origin-Resource-Policy', 'X-Content-Type-Options'
  ];
  headersToNuke.forEach(h => responseHeaders.delete(h));
  
  responseHeaders.set('X-Frame-Options', 'ALLOWALL');
  // INJEÇÃO DE CSP TOTALMENTE LIBERAL v368
  responseHeaders.set('Content-Security-Policy', "default-src * 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; frame-src *; img-src *; media-src *; connect-src *; frame-ancestors *;");

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

    return new Response(rewrittenManifest, { headers: responseHeaders });
  }

  if (isHtml) {
    let htmlText = await res.text();

    // v368: INJEÇÃO DE DEEP-CLEANING ROBLOX v3
    if (lowUrl.includes('roblox.com')) {
      const robloxCleanCss = `
        <style>
          #navbar-container, .rbx-header, .footer-container, .ad-slot, 
          .chat-container, .left-col-container, .setup-install-modal-container,
          .user-status-container, .notification-stream-container, #notification-stream-data,
          div[class*="header"], div[class*="footer"], div[id*="ad"], section[class*="sidebar"],
          .full-height { display: none !important; visibility: hidden !important; height: 0 !important; opacity: 0 !important; }
          .content, body, #container-main { background: black !important; padding: 0 !important; margin: 0 !important; width: 100% !important; max-width: 100% !important; overflow: hidden !important; }
          .game-main-content { width: 100% !important; margin: 0 !important; }
          .game-buttons-container { background: rgba(0,0,0,0.9) !important; padding: 40px !important; border-radius: 50px !important; border: 3px solid #00ff00 !important; }
        </style>
      `;
      htmlText = htmlText.replace('<head>', `<head>${robloxCleanCss}`);
    }

    // v368: TRATAMENTO MERCADO PLAY
    if (lowUrl.includes('mercadolivre.com.br')) {
      const mlCleanCss = `<style>header, footer, .nav-header, .nav-footer { display: none !important; }</style>`;
      htmlText = htmlText.replace('<head>', `<head>${mlCleanCss}`);
    }

    htmlText = htmlText.replace(/window\.open/g, 'console.log');
    htmlText = htmlText.replace(/target=["']_blank["']/g, 'target="_self"');
    htmlText = htmlText.replace(/window\.top/g, 'window.self');
    htmlText = htmlText.replace(/top\.location/g, 'window.location');
    
    const baseTag = `<base href="${urlObj.origin}${urlObj.pathname}">`;
    htmlText = htmlText.replace('<head>', `<head>${baseTag}`);
    
    responseHeaders.set('Content-Type', 'text/html; charset=utf-8');
    return new Response(htmlText, { headers: responseHeaders, status: 200 });
  }

  return new Response(res.body, { status: res.status, headers: responseHeaders });
}
