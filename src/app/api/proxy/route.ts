
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

/**
 * TÚNEL GHOST DIAMANTE v384 - PROTOCOLO DE ESTABILIDADE ETERNA
 * Este túnel reescreve manifestos M3U8 para garantir que todos os segmentos passem pelo proxy.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) return new NextResponse("Sinal Master Ausente", { status: 400 });

  const lowTarget = targetUrl.toLowerCase();

  // BLOQUEIO DE JUNK E ANALYTICS QUE TRAVAM O PLAYER
  if (lowTarget.includes('googletagmanager') || lowTarget.includes('analytics') || lowTarget.includes('facebook.net')) {
    return new NextResponse("Link de Junk Bloqueado", { status: 403 });
  }

  try {
    const urlObj = new URL(targetUrl);
    const requestHeaders = new Headers();
    
    // MASCARAMENTO SOBERANO - FINGE SER UM IPHONE 15 PRO MAX ACESSANDO
    requestHeaders.set('User-Agent', 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1');
    requestHeaders.set('Accept', '*/*');
    requestHeaders.set('Accept-Language', 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7');
    requestHeaders.set('Connection', 'keep-alive');
    
    // BYPASS DE REFERER - O SEGREDO PARA VYDS E CDNS INSTÁVEIS
    if (lowTarget.includes('rdcanais') || lowTarget.includes('streamrdc')) {
      requestHeaders.set('Referer', 'https://rdcanais.com/');
    } else if (lowTarget.includes('mercadolivre') || lowTarget.includes('mercadopago')) {
      requestHeaders.set('Referer', 'https://play.mercadolivre.com.br/');
    } else if (lowTarget.includes('vyds')) {
      requestHeaders.set('Referer', 'https://vyds1001.top/');
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
    
    // DETECÇÃO AGRESSIVA DE FORMATO
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

    // SEGREDO v384: REESCRITA DE M3U8 PARA PERMANÊNCIA DO SINAL
    if (forcedType.includes('mpegurl') || finalUrl.includes('.m3u8')) {
      const manifestText = await res.text();
      const baseUrl = finalUrl.split('?')[0].substring(0, finalUrl.split('?')[0].lastIndexOf('/') + 1);
      
      const rewrittenManifest = manifestText.split('\n').map(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return line;
        try {
          // Garante que TODOS os segmentos (.ts) e sub-playlists usem o Proxy do Léo TV
          const absoluteUrl = new URL(trimmed, baseUrl).href;
          return `/api/proxy?url=${encodeURIComponent(absoluteUrl)}`;
        } catch (e) { return line; }
      }).join('\n');

      return new Response(rewrittenManifest, { headers: responseHeaders });
    }

    // Retorna o binário do vídeo (MP4 ou TS)
    return new Response(res.body, { status: res.status, headers: responseHeaders });
  } catch (error) {
    return new Response("Falha no Túnel Permanente v384", { status: 500 });
  }
}
