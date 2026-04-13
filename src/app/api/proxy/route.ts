
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * TÚNEL MASTER SOBERANO v177 - O CANO DE ALTA PRESSÃO
 * Otimizado para .ts, .m3u8 e .mp4 (Bypass de CORS e Mixed Content)
 * Suporte a Range Requests para carregamento fluido.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) return new NextResponse("Sinal Master Ausente", { status: 400 });

  try {
    const requestHeaders = new Headers();
    
    // Suporte a Range (Vital para MP4 e busca no vídeo sem travar)
    const range = req.headers.get('range');
    if (range) requestHeaders.set('Range', range);
    
    // Finge ser um navegador real para evitar bloqueios de CDNs
    requestHeaders.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
    requestHeaders.set('Accept', '*/*');
    
    const res = await fetch(targetUrl, { 
      headers: requestHeaders,
      cache: 'no-store',
      redirect: 'follow',
    });
    
    // Detecta expiração da fonte original (Blinder / XVideos / etc)
    if (res.status === 401 || res.status === 403) {
      return new Response("SOURCE_EXPIRED", { status: 401 });
    }

    if (!res.ok && res.status !== 206) {
      return new Response(`Erro na Origem: ${res.status}`, { status: res.status });
    }

    const responseHeaders = new Headers();
    
    // Copia cabeçalhos vitais da fonte
    const headersToCopy = ['content-type', 'content-length', 'content-range', 'accept-ranges', 'cache-control'];
    res.headers.forEach((v, k) => {
      if (headersToCopy.includes(k.toLowerCase())) responseHeaders.set(k, v);
    });

    // Garante que arquivos .ts e .m3u8 sejam tratados como vídeo fluido
    if (targetUrl.toLowerCase().includes('.ts')) {
      responseHeaders.set('Content-Type', 'video/mp2t');
    }

    // Liberação total de CORS (Igual ao Canva)
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, OPTIONS');

    return new Response(res.body, {
      status: res.status,
      headers: responseHeaders,
    });

  } catch (error: any) {
    console.error("Erro no Proxy Master:", error.message);
    return new Response(null, { status: 500 });
  }
}
