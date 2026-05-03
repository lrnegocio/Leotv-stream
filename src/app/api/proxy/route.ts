
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

/**
 * TÚNEL MASTER SOBERANA v381 - PROTOCOLO GHOST SUPREMED
 * Blindagem Diamante contra "No Supported Sources".
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) return new NextResponse("Sinal Master Ausente", { status: 400 });

  const lowTarget = targetUrl.toLowerCase();

  // BLOQUEIO DE JUNK
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
    
    // REMOVE RASTROS DA VPS
    requestHeaders.delete('Origin');
    requestHeaders.delete('X-Forwarded-For');
    requestHeaders.delete('Via');

    // BYPASS DE REFERER (O segredo para links instáveis)
    if (lowTarget.includes('rdcanais') || lowTarget.includes('streamrdc')) {
      requestHeaders.set('Referer', 'https://rdcanais.com/');
    } else if (lowTarget.includes('mercadolivre') || lowTarget.includes('mercadopago')) {
      requestHeaders.set('Referer', 'https://play.mercadolivre.com.br/');
    } else {
      requestHeaders.set('Referer', urlObj.origin + '/');
    }

    const res = await fetch(targetUrl, { 
      headers: requestHeaders,
      cache: 'no-store',
      redirect: 'follow'
    });

    const finalUrl = res.url;
    const contentType = res.headers.get('content-type') || '';
    
    // FORCE CONTENT TYPE PARA EVITAR "NOT SUPPORTED SOURCES"
    let forcedType = contentType;
    if (finalUrl.toLowerCase().endsWith('.mp4')) forcedType = 'video/mp4';
    if (finalUrl.toLowerCase().endsWith('.m3u8')) forcedType = 'application/vnd.apple.mpegurl';
    if (finalUrl.toLowerCase().endsWith('.ts')) forcedType = 'video/mp2t';

    const responseHeaders = new Headers();
    const headersToCopy = ['content-length', 'content-range', 'accept-ranges', 'cache-control'];
    headersToCopy.forEach(h => {
      const val = res.headers.get(h);
      if (val) responseHeaders.set(h, val);
    });

    responseHeaders.set('Content-Type', forcedType);
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('X-Frame-Options', 'ALLOWALL');

    // Se for M3U8, reescreve os caminhos relativos
    if (forcedType.includes('mpegurl') || finalUrl.includes('.m3u8')) {
      const manifestText = await res.text();
      const baseUrl = finalUrl.split('?')[0].substring(0, finalUrl.split('?')[0].lastIndexOf('/') + 1);
      
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

    return new Response(res.body, { status: res.status, headers: responseHeaders });
  } catch (error) {
    return new Response("Falha no Túnel Ghost v381", { status: 500 });
  }
}
