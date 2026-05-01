import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

/**
 * TÚNEL MASTER SOBERANA v370 - PROTOCOLO DEEP-TRACE
 * Calibrado para seguir redirecionamentos e extrair a fonte final do sinal.
 * Adicionado: Protocolo RDC-Bypass para liberar sinais da RDCanais e StreamRDC.
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
    requestHeaders.set('User-Agent', 'IPTVSmarters/1.0.3 (iPad; iOS 16.1; Scale/2.00)');
    requestHeaders.set('Accept', '*/*');
    requestHeaders.set('Connection', 'keep-alive');
    
    // PROTOCOLO DE BYPASS DE DOMÍNIO v370
    if (lowTarget.includes('mercadolivre')) {
      requestHeaders.set('Referer', 'https://play.mercadolivre.com.br/');
    } else if (lowTarget.includes('rdcanais') || lowTarget.includes('streamrdc')) {
      // Engana o servidor fazendo-o pensar que o acesso vem do site oficial autorizado
      requestHeaders.set('Referer', 'https://rdcanais.com/');
      requestHeaders.set('Origin', 'https://rdcanais.com');
    } else {
      requestHeaders.set('Referer', urlObj.origin + '/');
    }

    // PROTOCOLO DEEP-TRACE: Segue o sinal até a CDN final
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
    
    // INJEÇÃO DE LIMPEZA UNIVERSAL v370
    const cleanCss = `
      <style>
        header, footer, nav, aside, .ads, .sidebar, #navbar, .rbx-header, .top-nav, .footer-content { display: none !important; visibility: hidden !important; }
        body, html { overflow: hidden !important; background: black !important; }
        #over-video, .video-ads, .ads-wrapper { display: none !important; }
      </style>
    `;
    htmlText = htmlText.replace('<head>', `<head>${cleanCss}<base href="${urlObj.origin}${urlObj.pathname}">`);

    responseHeaders.set('Content-Type', 'text/html; charset=utf-8');
    return new Response(htmlText, { headers: responseHeaders, status: 200 });
  }

  return new Response(res.body, { status: res.status, headers: responseHeaders });
}