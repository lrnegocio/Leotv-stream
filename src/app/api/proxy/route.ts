
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

/**
 * TÚNEL MASTER SOBERANA v380 - PROTOCOLO GHOST SUPREMED
 * Calibrado para domínios instáveis (vyds1001, vcdn, top).
 * Remove Referer e mascara a VPS como um dispositivo iOS Safari real.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) return new NextResponse("Sinal Master Ausente", { status: 400 });

  const lowTarget = targetUrl.toLowerCase();

  // BLOQUEIO DE JUNK v380
  if (lowTarget.includes('googletagmanager') || lowTarget.includes('analytics') || lowTarget.includes('facebook.net')) {
    return new NextResponse("Link de Junk Bloqueado", { status: 403 });
  }

  try {
    const urlObj = new URL(targetUrl);
    const requestHeaders = new Headers();
    
    // MASCARAMENTO SOBERANO - FINGE SER UM ACESSO ORIGINAL DO SAFARI/IOS
    requestHeaders.set('User-Agent', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1');
    requestHeaders.set('Accept', '*/*');
    requestHeaders.set('Accept-Language', 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7');
    requestHeaders.set('Connection', 'keep-alive');
    
    // 🛡️ EXTERMINADOR DE RASTROS GHOST: Remove o que os CDNs usam para bloquear VPS
    requestHeaders.delete('Origin');
    requestHeaders.delete('X-Forwarded-For');
    requestHeaders.delete('Via');

    // BYPASS DE REFERER (O segredo para links instáveis)
    if (lowTarget.includes('rdcanais') || lowTarget.includes('streamrdc')) {
      requestHeaders.set('Referer', 'https://rdcanais.com/');
    } else if (lowTarget.includes('mercadolivre') || lowTarget.includes('mercadopago')) {
      requestHeaders.set('Referer', 'https://play.mercadolivre.com.br/');
    } else if (lowTarget.includes('vyds') || lowTarget.includes('top')) {
      // Para o domínio vyds1001.top, o ideal é referer vazio ou o próprio domínio
      requestHeaders.set('Referer', urlObj.origin + '/');
    } else {
      requestHeaders.set('Referer', urlObj.origin + '/');
    }

    const res = await fetch(targetUrl, { 
      headers: requestHeaders,
      cache: 'no-store',
      redirect: 'follow'
    });

    // Se o link original redirecionou, seguimos o rastro
    const finalUrl = res.url;
    return handleResponse(res, finalUrl, new URL(finalUrl));
  } catch (error) {
    return new Response("Falha no Túnel Ghost v380", { status: 500 });
  }
}

async function handleResponse(res: Response, targetUrl: string, urlObj: URL) {
  const contentType = res.headers.get('content-type') || '';
  const lowUrl = targetUrl.toLowerCase();
  
  const isM3u8 = lowUrl.includes('.m3u8') || contentType.includes('mpegurl') || contentType.includes('application/vnd.apple.mpegurl');
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
    
    const cleanCss = `
      <style>
        header, footer, nav, aside, .ads, .sidebar, #navbar, .rbx-header, .top-nav, .cf-error-details { display: none !important; visibility: hidden !important; }
        body, html { overflow: hidden !important; background: black !important; margin: 0 !important; }
        iframe, video { width: 100% !important; height: 100% !important; }
      </style>
    `;

    htmlText = htmlText.replace('<head>', `<head><base href="${urlObj.origin}${urlObj.pathname}">${cleanCss}`);

    responseHeaders.set('Content-Type', 'text/html; charset=utf-8');
    return new Response(htmlText, { headers: responseHeaders, status: 200 });
  }

  return new Response(res.body, { status: res.status, headers: responseHeaders });
}
