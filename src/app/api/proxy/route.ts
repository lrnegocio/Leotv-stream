
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

/**
 * TÚNEL MASTER SOBERANO v290 - PROTOCOLO BYPASS INTELIGENTE
 * Diferencia domínios protegidos de domínios abertos para não quebrar links legados.
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
    
    // Lista de domínios que EXIGEM camuflagem Chrome Elite
    const isProtectedDomain = 
      targetUrl.includes('redecanaistv') || 
      targetUrl.includes('reidoscanais') || 
      targetUrl.includes('rdcanais') || 
      targetUrl.includes('rdcplayer') ||
      targetUrl.includes('tvacabo.top');

    if (isProtectedDomain) {
      // CABEÇALHOS DE ELITE v290 (Simula Chrome 124 para pular Cloudflare)
      requestHeaders.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
      requestHeaders.set('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8');
      requestHeaders.set('Sec-Ch-Ua', '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"');
      requestHeaders.set('Sec-Ch-Ua-Mobile', '?0');
      requestHeaders.set('Sec-Ch-Ua-Platform', '"Windows"');
      requestHeaders.set('Referer', 'https://reidoscanais.ooo/');
    } else {
      // CABEÇALHOS PADRÃO para links abertos (webtvninjas, etc.)
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
    return new Response("Falha no Túnel Master VPS", { status: 500 });
  }
}
