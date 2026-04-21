
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

/**
 * TÚNEL MASTER SOBERANO v311 - PROTOCOLO CAMALEÃO ELITE
 * Ajustado para NUNCA interferir no YouTube e focar em XVideos/RedeCanais.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) return new NextResponse("Sinal Master Ausente", { status: 400 });

  // PROTEÇÃO YOUTUBE: Se por algum erro o YouTube cair aqui, devolvemos um erro 403
  // para o player carregar o link direto sem proxy.
  if (targetUrl.includes('youtube.com') || targetUrl.includes('youtu.be')) {
    return new NextResponse("YouTube deve ser carregado diretamente.", { status: 403 });
  }

  try {
    const urlObj = new URL(targetUrl);
    const requestHeaders = new Headers();
    
    // Repasse de Range (Seek no Archive.org)
    const range = req.headers.get('range');
    if (range) requestHeaders.set('Range', range);

    // Identidade Smart TV
    requestHeaders.set('User-Agent', 'Mozilla/5.0 (Linux; Android 11; BRAVIA 4K Build/RP1A.200720.011) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
    requestHeaders.set('Accept', '*/*');
    
    const lowTarget = targetUrl.toLowerCase();
    
    // CAMUFLAGEM DE REFERER (O segredo para abrir o sinal)
    if (lowTarget.includes('rdcanais') || lowTarget.includes('reidoscanais') || lowTarget.includes('rdcplayer')) {
      requestHeaders.set('Referer', 'https://reidoscanais.ooo/');
    } else if (lowTarget.includes('redecanais')) {
      requestHeaders.set('Referer', 'https://redecanaistv.net/');
    } else if (lowTarget.includes('xvideos')) {
      requestHeaders.set('Referer', 'https://www.xvideos.com/');
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
    return new Response("Falha no Túnel Master v311", { status: 500 });
  }
}

async function handleResponse(res: Response, targetUrl: string, urlObj: URL) {
  const contentType = res.headers.get('content-type') || '';
  const lowUrl = targetUrl.toLowerCase();
  
  const isM3u8 = lowUrl.includes('.m3u8') || contentType.includes('mpegurl');
  const isHtml = contentType.includes('text/html');

  // A. REESCRITA HLS MASTER
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

  // B. LIMPEZA DE BLOQUEIOS (HTML)
  if (isHtml) {
    let htmlText = await res.text();
    
    // Neutraliza scripts que abrem novas abas
    htmlText = htmlText.replace(/window\.open/g, 'console.log');
    htmlText = htmlText.replace(/target=["']_blank["']/g, 'target="_self"');
    htmlText = htmlText.replace(/window\.top/g, 'window.self');
    
    const baseTag = `<base href="${urlObj.origin}${urlObj.pathname}">`;
    htmlText = htmlText.replace('<head>', `<head>${baseTag}`);
    
    const responseHeaders = new Headers();
    responseHeaders.set('Content-Type', 'text/html; charset=utf-8');
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    
    // Mata os erros de CSP e Frame-Options
    responseHeaders.set('X-Frame-Options', 'ALLOWALL');

    return new Response(htmlText, {
      headers: responseHeaders,
      status: 200
    });
  }

  // C. STREAM DIRETO
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

  return new Response(res.body, { 
    status: res.status, 
    headers: responseHeaders 
  });
}
