
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

/**
 * TÚNEL MASTER SOBERANO v299 - PROTOCOLO ULTRA-IDENTIDADE (CHROME 133)
 * Simula um navegador real de última geração para pular bloqueios de Cloudflare em VPS.
 * Inclui Referer específico para playcnvs.stream e rdcanais.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) return new NextResponse("Sinal Master Ausente", { status: 400 });

  try {
    const urlObj = new URL(targetUrl);
    const requestHeaders = new Headers();
    
    // IDENTIDADE DE ELITE (CHROME 133 - FEVEREIRO 2025)
    requestHeaders.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36');
    requestHeaders.set('sec-ch-ua', '"Not(A:Brand";v="99", "Google Chrome";v="133", "Chromium";v="133"');
    requestHeaders.set('sec-ch-ua-mobile', '?0');
    requestHeaders.set('sec-ch-ua-platform', '"Windows"');
    
    requestHeaders.set('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7');
    requestHeaders.set('Accept-Language', 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7');
    requestHeaders.set('Cache-Control', 'no-cache');
    requestHeaders.set('Pragma', 'no-cache');
    requestHeaders.set('Sec-Fetch-Dest', 'document');
    requestHeaders.set('Sec-Fetch-Mode', 'navigate');
    requestHeaders.set('Sec-Fetch-Site', 'cross-site');
    requestHeaders.set('Sec-Fetch-User', '?1');
    requestHeaders.set('Upgrade-Insecure-Requests', '1');
    
    const lowTarget = targetUrl.toLowerCase();
    
    // PROTOCOLO DE REFERER DINÂMICO SOBERANO
    if (lowTarget.includes('rdcanais') || lowTarget.includes('reidoscanais') || lowTarget.includes('rdcplayer')) {
      requestHeaders.set('Referer', 'https://reidoscanais.ooo/');
      requestHeaders.set('Origin', 'https://reidoscanais.ooo');
    } else if (lowTarget.includes('playcnvs.stream')) {
      requestHeaders.set('Referer', 'https://reidoscanais.ooo/');
    } else if (lowTarget.includes('redecanais')) {
      requestHeaders.set('Referer', 'https://redecanaistv.net/');
      requestHeaders.set('Origin', 'https://redecanaistv.net');
    } else {
      requestHeaders.set('Referer', urlObj.origin + '/');
    }

    const res = await fetch(targetUrl, { 
      headers: requestHeaders,
      cache: 'no-store',
      redirect: 'follow'
    });

    // Rota de emergência se bloqueado
    if (res.status === 403) {
      requestHeaders.delete('Referer');
      requestHeaders.delete('Origin');
      const retryRes = await fetch(targetUrl, { headers: requestHeaders, cache: 'no-store' });
      if (retryRes.ok) return handleResponse(retryRes, targetUrl, urlObj);
    }

    return handleResponse(res, targetUrl, urlObj);
  } catch (error) {
    return new Response("Falha no Túnel Master v299", { status: 500 });
  }
}

async function handleResponse(res: Response, targetUrl: string, urlObj: URL) {
  const contentType = res.headers.get('content-type') || '';
  const lowUrl = targetUrl.toLowerCase();
  
  const isM3u8 = lowUrl.includes('.m3u8') || contentType.includes('mpegurl');
  const isHtml = contentType.includes('text/html');

  // REESCRITA HLS MASTER
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

  // FILTRAGEM ANTI-BLOQUEIO PARA HTML
  if (isHtml) {
    let htmlText = await res.text();
    const baseTag = `<base href="${urlObj.origin}${urlObj.pathname}">`;
    
    // Limpeza de Scripts de Anúncio e Popups
    htmlText = htmlText.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, (match) => {
      const lowMatch = match.toLowerCase();
      if (lowMatch.includes('ads') || lowMatch.includes('popunder') || lowMatch.includes('analytics') || lowMatch.includes('track') || lowMatch.includes('click')) {
        return '<!-- Sinal Master: Script Removido -->';
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
}
