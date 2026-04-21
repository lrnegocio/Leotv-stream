import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

/**
 * TÚNEL MASTER SOBERANO v293 - PROTOCOLO DE CAMUFLAGEM DINÂMICA
 * Resolve "Acesso Negado" e "White Screen" injetando cabeçalhos e tags base.
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
    
    // Lista de domínios que EXIGEM camuflagem de alto nível
    const lowTarget = targetUrl.toLowerCase();
    const isProtectedDomain = 
      lowTarget.includes('redecanaistv') || 
      lowTarget.includes('reidoscanais') || 
      lowTarget.includes('rdcanais') || 
      lowTarget.includes('rdcplayer') ||
      lowTarget.includes('playcnvs.stream') ||
      lowTarget.includes('tvacabo.top');

    if (isProtectedDomain) {
      // CABEÇALHOS DE ELITE v293 (Simula Chrome 124 Nativo)
      requestHeaders.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
      requestHeaders.set('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8');
      requestHeaders.set('Sec-Ch-Ua', '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"');
      requestHeaders.set('Sec-Ch-Ua-Mobile', '?0');
      requestHeaders.set('Sec-Ch-Ua-Platform', '"Windows"');
      
      // Referer Inteligente: Engana o site dizendo que o sinal vem dele mesmo
      if (lowTarget.includes('rdcanais') || lowTarget.includes('reidoscanais')) {
        requestHeaders.set('Referer', 'https://reidoscanais.ooo/');
      } else if (lowTarget.includes('playcnvs')) {
        requestHeaders.set('Referer', 'http://www.playcnvs.stream/');
      } else {
        requestHeaders.set('Referer', urlObj.origin + '/');
      }
    } else {
      requestHeaders.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
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
    const isM3u8 = lowTarget.includes('.m3u8') || contentType.includes('mpegurl') || contentType.includes('application/x-mpegurl');
    const isHtml = contentType.includes('text/html');

    // REESCRITA HLS MASTER: Garante que os pedaços (.ts) também passem pelo proxy
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

    // INJEÇÃO DE TAG BASE PARA HTML (Bypass rdcplayer, playcnvs e outros)
    // Isso resolve o erro de tela branca pois o Iframe acha os arquivos JS do site original
    if (isHtml) {
      let htmlText = await res.text();
      const baseTag = `<base href="${urlObj.origin}${urlObj.pathname}">`;
      htmlText = htmlText.replace('<head>', `<head>${baseTag}`);
      
      // Remove scripts de sandbox e redirects via injeção agressiva
      htmlText = htmlText.replace(/window\.top !== window\.self/g, "false");
      htmlText = htmlText.replace(/parent\.location\.href/g, "''");

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
    return new Response("Falha no Túnel Master VPS", { status: 500 });
  }
}