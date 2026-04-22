
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

/**
 * TÚNEL MASTER SOBERANO v341 - PROTOCOLO PERSISTÊNCIA ELITE
 * Blindagem total para RedeCanais, Rei dos Canais e TokyVideo.
 * Remove a necessidade do Admin "aquecer" o link para o cliente.
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
    
    const range = req.headers.get('range');
    if (range) requestHeaders.set('Range', range);

    requestHeaders.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
    requestHeaders.set('Accept', '*/*');
    requestHeaders.set('Accept-Language', 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7');
    requestHeaders.set('Cache-Control', 'no-cache');
    requestHeaders.set('Pragma', 'no-cache');
    
    const lowTarget = targetUrl.toLowerCase();
    
    // CALIBRAGEM DE REFERER POR DOMÍNIO v341
    if (lowTarget.includes('rdcanais') || lowTarget.includes('reidoscanais') || lowTarget.includes('rdcplayer')) {
      requestHeaders.set('Referer', 'https://reidoscanais.ooo/');
      requestHeaders.set('Origin', 'https://reidoscanais.ooo');
    } else if (lowTarget.includes('redecanais')) {
      // Ajuste RedeCanais: Alguns usam o .be outros o .ooo
      const origin = targetUrl.includes('.be') ? 'https://redecanaistv.be/' : 'https://redecanaistv.net/';
      requestHeaders.set('Referer', origin);
      requestHeaders.set('Origin', origin.replace(/\/$/, ''));
    } else if (lowTarget.includes('xvideos')) {
      requestHeaders.set('Referer', 'https://www.xvideos.com/');
      requestHeaders.set('Origin', 'https://www.xvideos.com');
    } else if (lowTarget.includes('tokyvideo')) {
      requestHeaders.set('Referer', 'https://www.tokyvideo.com/'); 
      requestHeaders.set('Origin', 'https://www.tokyvideo.com');
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
    return new Response("Falha no Túnel Master v341", { status: 500 });
  }
}

async function handleResponse(res: Response, targetUrl: string, urlObj: URL) {
  const contentType = res.headers.get('content-type') || '';
  const lowUrl = targetUrl.toLowerCase();
  
  const isM3u8 = lowUrl.includes('.m3u8') || contentType.includes('mpegurl');
  const isHtml = contentType.includes('text/html');

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

  if (isHtml) {
    let htmlText = await res.text();
    
    // Desativa scripts que tentam detectar o iframe ou abrir novas janelas
    htmlText = htmlText.replace(/window\.open/g, 'console.log');
    htmlText = htmlText.replace(/target=["']_blank["']/g, 'target="_self"');
    htmlText = htmlText.replace(/window\.top/g, 'window.self');
    htmlText = htmlText.replace(/parent\.location\.reload/g, 'console.log');
    
    const baseTag = `<base href="${urlObj.origin}${urlObj.pathname}">`;
    htmlText = htmlText.replace('<head>', `<head>${baseTag}`);
    
    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', 'text/html; charset=utf-8');
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    
    // Limpeza radical de bloqueios de frame para o Brave e outros navegadores
    responseHeaders.delete('X-Frame-Options');
    responseHeaders.delete('Content-Security-Policy');
    responseHeaders.delete('X-Content-Security-Policy');
    responseHeaders.delete('X-WebKit-CSP');
    responseHeaders.set('X-Frame-Options', 'ALLOWALL');

    return new Response(htmlText, {
      headers: responseHeaders,
      status: 200
    });
  }

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
  responseHeaders.delete('X-Frame-Options');
  responseHeaders.delete('Content-Security-Policy');

  return new Response(res.body, { 
    status: res.status, 
    headers: responseHeaders 
  });
}
