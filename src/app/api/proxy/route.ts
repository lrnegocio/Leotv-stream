
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

/**
 * TÚNEL MASTER SOBERANO v251 - PROTOCOLO DE CAMUFLAGEM E EXTRAÇÃO
 * Atravessa bloqueios de CORS, Referer e cadeados de Doramas (AcPlay).
 * Suporte nativo a Extração de Links de Games e Reescrita de Manifestos.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) return new NextResponse("Sinal Master Ausente", { status: 400 });

  try {
    const urlObj = new URL(targetUrl);
    const requestHeaders = new Headers();
    
    // Encaminha cabeçalhos vitais para CDNs VOD e Streams protegidos
    const range = req.headers.get('range');
    if (range) requestHeaders.set('Range', range);
    
    // Identidade Padrão Master
    requestHeaders.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
    requestHeaders.set('Accept', '*/*');
    requestHeaders.set('Origin', urlObj.origin);
    requestHeaders.set('Referer', urlObj.origin + '/');
    requestHeaders.set('Cache-Control', 'no-cache');

    /**
     * BLINDAGEM ACPLAY DORAMAS (BYPASS DE CADEADO)
     */
    if (targetUrl.includes('acplay.live')) {
       requestHeaders.set('Origin', 'https://acplay.live');
       requestHeaders.set('Referer', 'https://acplay.live/');
       requestHeaders.set('User-Agent', 'Mozilla/5.0 (Linux; Android 10; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/80.0.3987.162 Mobile Safari/537.36');
    }

    /**
     * BLINDAGEM RETROGAMES
     */
    if (targetUrl.includes('retrogames.cc')) {
       requestHeaders.set('Referer', 'https://www.retrogames.cc/');
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

    // REESCRITA PROFUNDA HLS
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

        if (trimmed.startsWith('#EXT-X-KEY') || trimmed.startsWith('#EXT-X-MAP')) {
          return trimmed.replace(/URI="(.*?)"/, (match, uri) => {
            try {
              const absoluteUri = new URL(uri, baseUrl).href;
              return `URI="/api/proxy?url=${encodeURIComponent(absoluteUri)}"`;
            } catch (e) { return match; }
          });
        }
        return line;
      }).join('\n');

      return new Response(rewrittenManifest, {
        headers: {
          'Content-Type': 'application/vnd.apple.mpegurl',
          'Access-Control-Allow-Origin': '*',
          'Cache-Control': 'no-cache, no-store, must-revalidate'
        }
      });
    }

    // Fluxo para outros arquivos (MP4, TS, HTML de Games)
    const responseHeaders = new Headers();
    const headersToCopy = ['content-type', 'content-length', 'content-range', 'accept-ranges', 'content-encoding'];
    headersToCopy.forEach(h => {
      const val = res.headers.get(h);
      if (val) responseHeaders.set(h, val);
    });

    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Cache-Control', 'no-cache, no-store, must-revalidate');

    return new Response(res.body, {
      status: res.status,
      headers: responseHeaders,
    });

  } catch (error: any) {
    if (error.name === 'AbortError') return new Response("Timeout no Sinal Master", { status: 504 });
    return new Response("Falha no Túnel Master 7.5", { status: 500 });
  }
}
