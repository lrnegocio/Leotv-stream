import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

/**
 * TÚNEL MASTER SOBERANA v370 - PROTOCOLO DEEP-TRACE
 * Calibrado para RDCanais e camuflagem total de domínios.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) return new NextResponse("Sinal Master Ausente", { status: 400 });

  const lowTarget = targetUrl.toLowerCase();

  // BLOQUEIO DE JUNK v370
  if (lowTarget.includes('googletagmanager') || lowTarget.includes('analytics') || lowTarget.includes('facebook.net')) {
    return new NextResponse("Link de Junk Bloqueado", { status: 403 });
  }

  try {
    const urlObj = new URL(targetUrl);
    const requestHeaders = new Headers();
    
    // MASCARAMENTO SOBERANO - FINGE SER UM PLAYER OFICIAL DE IPTV
    requestHeaders.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
    requestHeaders.set('Accept', '*/*');
    requestHeaders.set('Connection', 'keep-alive');
    
    // PROTOCOLO BYPASS RDCANAIS v370: Remove qualquer rastro da VPS leotv.fun
    if (lowTarget.includes('rdcanais') || lowTarget.includes('streamrdc')) {
      requestHeaders.set('Referer', 'https://rdcanais.com/');
      requestHeaders.set('Origin', 'https://rdcanais.com');
    } else {
      requestHeaders.set('Referer', urlObj.origin + '/');
    }

    const res = await fetch(targetUrl, { 
      headers: requestHeaders,
      cache: 'no-store',
      redirect: 'follow'
    });

    const finalUrl = res.url;
    return handleResponse(res, finalUrl, new URL(finalUrl));
  } catch (error) {
    return new Response("Falha no Túnel Deep-Trace v370", { status: 500 });
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
  
  responseHeaders.set('Access-Control-Allow-Origin', '*');
  responseHeaders.set('X-Frame-Options', 'ALLOWALL');
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
    
    // INJEÇÃO DE LIMPEZA E BYPASS v370
    const cleanCss = `
      <style>
        header, footer, nav, aside, .ads, .sidebar, #navbar, .rbx-header, .top-nav, .footer-content { display: none !important; visibility: hidden !important; }
        body, html { overflow: hidden !important; background: black !important; margin: 0 !important; padding: 0 !important; }
      </style>
    `;

    // Protocolo de reescrita de links de vídeo internos no HTML
    htmlText = htmlText.replace(/(https?:\/\/[^"']+\.(?:m3u8|mp4|ts))/gi, (match) => {
      return `/api/proxy?url=${encodeURIComponent(match)}`;
    });

    htmlText = htmlText.replace('<head>', `<head><base href="${urlObj.origin}${urlObj.pathname}">${cleanCss}`);

    responseHeaders.set('Content-Type', 'text/html; charset=utf-8');
    return new Response(htmlText, { headers: responseHeaders, status: 200 });
  }

  return new Response(res.body, { status: res.status, headers: responseHeaders });
}