
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

/**
 * TÚNEL MASTER SOBERANO v304 - PROTOCOLO ULTRA-COMPATIBILIDADE
 * Ajustado para resolver o problema de "funciona no teste, mas não no cliente".
 * Garante que Referer e Origin sejam simulados corretamente para qualquer domínio de streaming.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) return new NextResponse("Sinal Master Ausente", { status: 400 });

  try {
    const urlObj = new URL(targetUrl);
    const requestHeaders = new Headers();
    
    // IDENTIDADE DE ELITE (CHROME 133)
    requestHeaders.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Safari/537.36');
    requestHeaders.set('Accept', '*/*');
    requestHeaders.set('Accept-Language', 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7');
    requestHeaders.set('Cache-Control', 'no-cache');
    
    const lowTarget = targetUrl.toLowerCase();
    
    // PROTOCOLO DE REFERER AUTOMÁTICO
    // Se o domínio for conhecido, usa o referer dele, senão usa a própria origem do link
    if (lowTarget.includes('rdcanais') || lowTarget.includes('reidoscanais') || lowTarget.includes('rdcplayer')) {
      requestHeaders.set('Referer', 'https://reidoscanais.ooo/');
      requestHeaders.set('Origin', 'https://reidoscanais.ooo');
    } else if (lowTarget.includes('redecanais')) {
      requestHeaders.set('Referer', 'https://redecanaistv.net/');
      requestHeaders.set('Origin', 'https://redecanaistv.net');
    } else if (lowTarget.includes('playcnvs.stream')) {
      requestHeaders.set('Referer', 'https://reidoscanais.ooo/');
    } else {
      // Fallback soberano: o referer é a raiz do próprio site de origem do vídeo
      requestHeaders.set('Referer', urlObj.origin + '/');
    }

    const res = await fetch(targetUrl, { 
      headers: requestHeaders,
      cache: 'no-store',
      redirect: 'follow'
    });

    // Rota de emergência se bloqueado
    if (res.status === 403 || res.status === 401) {
      requestHeaders.delete('Referer');
      requestHeaders.delete('Origin');
      const retryRes = await fetch(targetUrl, { headers: requestHeaders, cache: 'no-store' });
      if (retryRes.ok) return handleResponse(retryRes, targetUrl, urlObj);
    }

    return handleResponse(res, targetUrl, urlObj);
  } catch (error) {
    return new Response("Falha no Túnel Master v304", { status: 500 });
  }
}

async function handleResponse(res: Response, targetUrl: string, urlObj: URL) {
  const contentType = res.headers.get('content-type') || '';
  const lowUrl = targetUrl.toLowerCase();
  
  const isM3u8 = lowUrl.includes('.m3u8') || contentType.includes('mpegurl') || contentType.includes('apple-mpegurl');
  const isHtml = contentType.includes('text/html');

  // REESCRITA HLS MASTER (Sincronização de caminhos relativos)
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

  // FILTRAGEM ANTI-BLOQUEIO PARA HTML (Players Embutidos)
  if (isHtml) {
    let htmlText = await res.text();
    const baseTag = `<base href="${urlObj.origin}${urlObj.pathname}">`;
    
    // Limpeza agressiva de scripts que detectam IFrames e bloqueiam o site do cliente
    htmlText = htmlText.replace(/<script\b[^>]*>([\s\S]*?)<\/script>/gim, (match) => {
      const lowMatch = match.toLowerCase();
      if (lowMatch.includes('top.location') || lowMatch.includes('window.top') || lowMatch.includes('ads') || lowMatch.includes('analytics')) {
        return '<!-- Script de Bloqueio Removido pelo Túnel Master -->';
      }
      return match;
    });

    htmlText = htmlText.replace('<head>', `<head>${baseTag}`);
    // Bypass de detecção de frame
    htmlText = htmlText.replace(/window\.top !== window\.self/g, "false");
    htmlText = htmlText.replace(/top\.location\.href/g, "''");

    return new Response(htmlText, {
      headers: { 
        'Content-Type': 'text/html', 
        'Access-Control-Allow-Origin': '*', 
        'Cache-Control': 'no-store' 
      }
    });
  }

  // Streams de Vídeo Direto (TS, MP4, etc)
  const responseHeaders = new Headers();
  const headersToCopy = ['content-type', 'content-length', 'content-range', 'accept-ranges'];
  headersToCopy.forEach(h => {
    const val = res.headers.get(h);
    if (val) responseHeaders.set(h, val);
  });
  responseHeaders.set('Access-Control-Allow-Origin', '*');

  return new Response(res.body, { status: res.status, headers: responseHeaders });
}
