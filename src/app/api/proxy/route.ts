import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

/**
 * TÚNEL GHOST v370-S - SUPORTE PUNYCODE, TOKYVIDEO E BYPASS CLOUDFLARE
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) return new NextResponse("Sinal Master Ausente", { status: 400 });

  const lowTarget = targetUrl.toLowerCase();

  try {
    const requestHeaders = new Headers();
    
    // MASCARAMENTO SOBERANO v370
    requestHeaders.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
    requestHeaders.set('Accept', '*/*');
    requestHeaders.set('Accept-Language', 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7');
    requestHeaders.set('Connection', 'keep-alive');
    
    // BYPASS DE REFERER PARA DOMÍNIOS CONHECIDOS
    if (lowTarget.includes('rdcanais') || lowTarget.includes('streamrdc')) {
      requestHeaders.set('Referer', 'https://rdcanais.com/');
    } else if (lowTarget.includes('redecanais')) {
      requestHeaders.set('Referer', 'https://redecanaistv.be/');
    } else if (lowTarget.includes('tokyvideo.com')) {
      requestHeaders.set('Referer', 'https://www.tokyvideo.com/');
    } else {
      try {
        const urlObj = new URL(targetUrl);
        requestHeaders.set('Referer', urlObj.origin + '/');
      } catch (e) {
        requestHeaders.set('Referer', 'https://www.google.com/');
      }
    }

    const res = await fetch(targetUrl, { 
      headers: requestHeaders,
      cache: 'no-store',
      redirect: 'follow'
    });

    const finalUrl = res.url;
    const contentType = res.headers.get('content-type') || '';
    
    // DETECÇÃO DE FORMATO
    let forcedType = contentType;
    if (lowTarget.includes('.mp4') || finalUrl.toLowerCase().endsWith('.mp4')) forcedType = 'video/mp4';
    if (lowTarget.includes('.m3u8') || finalUrl.toLowerCase().endsWith('.m3u8') || contentType.includes('mpegurl')) forcedType = 'application/vnd.apple.mpegurl';
    if (lowTarget.includes('.ts') || finalUrl.toLowerCase().endsWith('.ts')) forcedType = 'video/mp2t';

    const responseHeaders = new Headers();
    const headersToCopy = ['content-length', 'content-range', 'accept-ranges', 'cache-control'];
    headersToCopy.forEach(h => {
      const val = res.headers.get(h);
      if (val) responseHeaders.set(h, val);
    });

    responseHeaders.set('Content-Type', forcedType);
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('X-Frame-Options', 'ALLOWALL');

    // SEGREDO v370: REESCRITA DE M3U8 PARA MANTER SINAL PERMANENTE
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
    return new Response("Falha no Túnel Permanente v370", { status: 500 });
  }
}
