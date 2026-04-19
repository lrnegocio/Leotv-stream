
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

/**
 * TÚNEL MASTER SOBERANO v248 - PROTOCOLO DE REESCRITA PROFUNDA 7.0
 * Atravessa bloqueios de CORS, Referer e VPS para Punycode ESPN, AgroPesca, AcPlay e CDNs rígidas.
 * Suporta reescrita de Variantes, Segmentos e Chaves de Criptografia.
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
    
    requestHeaders.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
    requestHeaders.set('Accept', '*/*');
    requestHeaders.set('Origin', urlObj.origin);
    requestHeaders.set('Referer', urlObj.origin + '/');
    requestHeaders.set('Cache-Control', 'no-cache');

    // BLINDAGEM ACPLAY DORAMAS: Simula o acesso nativo do site para desbloquear cadeados
    if (targetUrl.includes('acplay.live')) {
       requestHeaders.set('Referer', 'https://acplay.live/');
       requestHeaders.set('Sec-Fetch-Dest', 'video');
       requestHeaders.set('Sec-Fetch-Mode', 'no-cors');
       requestHeaders.set('Sec-Fetch-Site', 'cross-site');
    }

    // Timeout de 15 segundos para evitar carregamento infinito em links mortos
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

    // REESCRITA PROFUNDA 7.0: Suporte a Variantes de Qualidade e Chaves de Segurança
    if (isM3u8) {
      const manifestText = await res.text();
      // Calcula a Base URL correta para reconstrução de caminhos relativos
      const baseUrl = targetUrl.split('?')[0].substring(0, targetUrl.split('?')[0].lastIndexOf('/') + 1);
      
      const rewrittenManifest = manifestText.split('\n').map(line => {
        const trimmed = line.trim();
        if (!trimmed) return line;

        // Caso 1: Linhas que são URLs diretas (Segmentos ou Variantes)
        if (!trimmed.startsWith('#')) {
          try {
            const absoluteUrl = new URL(trimmed, baseUrl).href;
            return `/api/proxy?url=${encodeURIComponent(absoluteUrl)}`;
          } catch (e) {
            return line;
          }
        }

        // Caso 2: Chaves de Criptografia (#EXT-X-KEY:URI="...")
        if (trimmed.startsWith('#EXT-X-KEY') || trimmed.startsWith('#EXT-X-MAP')) {
          return trimmed.replace(/URI="(.*?)"/, (match, uri) => {
            try {
              const absoluteUri = new URL(uri, baseUrl).href;
              return `URI="/api/proxy?url=${encodeURIComponent(absoluteUri)}"`;
            } catch (e) {
              return match;
            }
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

    // Fluxo normal para Segmentos de Vídeo (.ts), MP4 ou outros arquivos
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
    return new Response("Falha no Túnel Master 7.0", { status: 500 });
  }
}
