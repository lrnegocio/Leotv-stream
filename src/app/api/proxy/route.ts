
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

/**
 * TÚNEL MASTER SOBERANO v295 - PROTOCOLO DE FILTRAGEM ANTI-TRACKER
 * Remove scripts de anúncios e rastreadores antes de entregar ao navegador.
 * Isso silencia os alertas do Brave e evita quebra de site.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) return new NextResponse("Sinal Master Ausente", { status: 400 });

  try {
    const urlObj = new URL(targetUrl);
    const requestHeaders = new Headers();
    
    requestHeaders.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
    requestHeaders.set('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8');
    requestHeaders.set('Accept-Language', 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7');
    requestHeaders.set('Cache-Control', 'no-cache');
    
    const lowTarget = targetUrl.toLowerCase();
    
    // Referer Spoofing Inteligente
    if (lowTarget.includes('rdcanais') || lowTarget.includes('reidoscanais') || lowTarget.includes('rdcplayer')) {
      requestHeaders.set('Referer', 'https://reidoscanais.ooo/');
    } else if (lowTarget.includes('redecanais')) {
      requestHeaders.set('Referer', 'https://redecanaistv.net/');
    } else {
      requestHeaders.set('Referer', urlObj.origin + '/');
    }

    const res = await fetch(targetUrl, { 
      headers: requestHeaders,
      cache: 'no-store',
      redirect: 'follow'
    });

    const contentType = res.headers.get('content-type') || '';
    const isM3u8 = lowTarget.includes('.m3u8') || contentType.includes('mpegurl');
    const isHtml = contentType.includes('text/html');

    // REESCRITA HLS MASTER (Garante chunks via proxy)
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
        headers: { 'Content-Type': 'application/vnd.apple.mpegurl', 'Access-Control-Allow-Origin': '*' }
      });
    }

    // FILTRAGEM ANTI-TRACKER PARA HTML
    if (isHtml) {
      let htmlText = await res.text();
      const baseTag = `<base href="${urlObj.origin}${urlObj.pathname}">`;
      
      // EXTERMINADOR DE SCRIPTS DE ANÚNCIO (Faz o Brave ver o site como limpo)
      htmlText = htmlText.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, (match) => {
        const lowMatch = match.toLowerCase();
        if (lowMatch.includes('ads') || lowMatch.includes('popunder') || lowMatch.includes('analytics') || lowMatch.includes('track') || lowMatch.includes('counter')) {
          return '<!-- Sinal Master: Script Invasivo Removido -->';
        }
        return match;
      });

      htmlText = htmlText.replace('<head>', `<head>${baseTag}`);
      htmlText = htmlText.replace(/window\.top !== window\.self/g, "false");
      htmlText = htmlText.replace(/top\.location\.href/g, "''");

      return new Response(htmlText, {
        headers: { 'Content-Type': 'text/html', 'Access-Control-Allow-Origin': '*', 'Cache-Control': 'no-store' }
      });
    }

    const responseHeaders = new Headers();
    const headersToCopy = ['content-type', 'content-length', 'content-range', 'accept-ranges'];
    headersToCopy.forEach(h => {
      const val = res.headers.get(h);
      if (val) responseHeaders.set(h, val);
    });
    responseHeaders.set('Access-Control-Allow-Origin', '*');

    return new Response(res.body, { status: res.status, headers: responseHeaders });
  } catch (error) {
    return new Response("Falha no Túnel Master v295", { status: 500 });
  }
}
