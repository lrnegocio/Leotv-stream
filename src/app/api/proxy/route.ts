
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

/**
 * TÚNEL MASTER SOBERANO v288 - PROTOCOLO DE CAMUFLAGEM UNIVERSAL
 * Suporte a rdcplayer.online, rdcplayer.xyz, RedeCanais e rdcanais.
 * Injeta Tag Base em HTML para resolver links relativos e bypassar Referer.
 * Remove bloqueios de segurança do navegador para evitar Conexão Recusada.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) return new NextResponse("Sinal Master Ausente", { status: 400 });

  try {
    const urlObj = new URL(targetUrl);
    const requestHeaders = new Headers();
    
    const range = req.headers.get('range');
    if (range) requestHeaders.set('Range', range);
    
    requestHeaders.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
    requestHeaders.set('Accept', '*/*');
    requestHeaders.set('Origin', urlObj.origin);
    requestHeaders.set('Referer', urlObj.origin + '/');

    // BLINDAGEM ESPECÍFICA POR DOMÍNIO
    if (targetUrl.includes('redecanaistv') || targetUrl.includes('reidoscanais') || targetUrl.includes('rdcanais')) {
       requestHeaders.set('Referer', 'https://reidoscanais.ooo/');
    }
    
    if (targetUrl.includes('rdcplayer')) {
       requestHeaders.set('Referer', 'https://rdcanais.com/');
       requestHeaders.set('Origin', 'https://rdcanais.com');
    }

    if (targetUrl.includes('tvacabo')) {
       requestHeaders.set('Referer', 'https://tvacabo.top/');
    }

    if (targetUrl.includes('acplay.live')) {
       requestHeaders.set('Referer', 'https://acplay.live/');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    const res = await fetch(targetUrl, { 
      headers: requestHeaders,
      cache: 'no-store',
      redirect: 'follow',
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);

    if (!res.ok && res.status !== 206) {
       return new Response("Erro de Origem: " + res.status, { status: res.status });
    }

    const contentType = res.headers.get('content-type') || '';
    const isM3u8 = targetUrl.toLowerCase().includes('.m3u8') || contentType.includes('mpegurl') || contentType.includes('application/x-mpegurl');
    const isHtml = contentType.includes('text/html');

    // REESCRITA HLS MASTER
    if (isM3u8) {
      const manifestText = await res.text();
      const baseUrl = targetUrl.split('?')[0].substring(0, targetUrl.split('?')[0].lastIndexOf('/') + 1);
      
      const rewrittenManifest = manifestText.split('\n').map(line => {
        const trimmed = line.trim();
        if (!trimmed) return line;
        if (!trimmed.startsWith('#')) {
          try {
            const absoluteUrl = new URL(trimmed, baseUrl).href;
            return `/api/proxy?url=${encodeURIComponent(absoluteUrl)}`;
          } catch (e) { return line; }
        }
        return line;
      }).join('\n');

      return new Response(rewrittenManifest, {
        headers: { 
          'Content-Type': 'application/vnd.apple.mpegurl', 
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-store'
        }
      });
    }

    // INJEÇÃO DE TAG BASE PARA HTML (Bypass rdcplayer e outros)
    if (isHtml) {
      let htmlText = await res.text();
      const baseTag = `<base href="${urlObj.origin}${urlObj.pathname}">`;
      // Injeta a tag base logo no início do head e remove bloqueios de CSP e Frame
      htmlText = htmlText.replace('<head>', `<head>${baseTag}`);
      
      return new Response(htmlText, {
        headers: { 
          'Content-Type': 'text/html', 
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-store'
        }
      });
    }

    const responseHeaders = new Headers();
    const headersToCopy = ['content-type', 'content-length', 'content-range', 'accept-ranges'];
    headersToCopy.forEach(h => {
      const val = res.headers.get(h);
      if (val) responseHeaders.set(h, val);
    });

    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Cache-Control', 'no-store');

    return new Response(res.body, {
      status: res.status,
      headers: responseHeaders,
    });

  } catch (error: any) {
    return new Response("Falha no Túnel Master", { status: 500 });
  }
}
