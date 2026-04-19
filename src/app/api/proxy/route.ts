
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

/**
 * TÚNEL MASTER SOBERANO v245 - PROTOCOLO DE REESCRITA DE MANIFESTO 6.0
 * Atravessa bloqueios de CORS, Referer e VPS.
 * Se o link for um M3U8, reescreve as rotas internas para que os segmentos também passem pelo proxy.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) return new NextResponse("Sinal Master Ausente", { status: 400 });

  try {
    const urlObj = new URL(targetUrl);
    const requestHeaders = new Headers();
    
    // Encaminha o Range (Obrigatório para HLS, MP4 e CDNs VOD)
    const range = req.headers.get('range');
    if (range) requestHeaders.set('Range', range);
    
    // IDENTIDADE MASTER: Chrome em Windows 11 para CDNs rígidas
    requestHeaders.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
    requestHeaders.set('Accept', '*/*');
    requestHeaders.set('Origin', urlObj.origin);
    requestHeaders.set('Referer', urlObj.origin + '/');
    requestHeaders.set('Cache-Control', 'no-cache');

    const res = await fetch(targetUrl, { 
      headers: requestHeaders,
      cache: 'no-store',
      redirect: 'follow',
    });

    if (!res.ok && res.status !== 206) {
       return new Response("Erro de Origem: " + res.status, { status: res.status });
    }

    const contentType = res.headers.get('content-type') || '';
    const isM3u8 = targetUrl.toLowerCase().includes('.m3u8') || contentType.includes('mpegurl');

    // REESCRITA MASTER DE MANIFESTO: Se for M3U8, ajustamos os links dos segmentos (.ts)
    if (isM3u8) {
      const manifestText = await res.text();
      const baseUrl = targetUrl.substring(0, targetUrl.lastIndexOf('/') + 1);
      
      const rewrittenManifest = manifestText.split('\n').map(line => {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          // Se for um link relativo ou absoluto de outra origem, roteamos pelo proxy
          try {
            const absoluteUrl = new URL(trimmed, baseUrl).href;
            return `/api/proxy?url=${encodeURIComponent(absoluteUrl)}`;
          } catch (e) {
            return line;
          }
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

    // Fluxo normal para Vídeos (.mp4) ou Segmentos (.ts)
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

  } catch (error) {
    return new Response("Falha no Túnel Master", { status: 500 });
  }
}
