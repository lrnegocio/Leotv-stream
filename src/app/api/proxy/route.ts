
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * TÚNEL MASTER SOBERANO v176 - ENGINE DE FLUXO PURO
 * Otimizado para .ts, .m3u8 e .mp4 (Bypass de CORS e Mixed Content)
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) return new NextResponse("Sinal Master Ausente", { status: 400 });

  try {
    const requestHeaders = new Headers();
    
    // Suporte a Range (Vital para MP4 e busca no vídeo)
    const range = req.headers.get('range');
    if (range) requestHeaders.set('Range', range);
    
    // Finge ser um navegador comum para evitar bloqueios de CDNs (Xvideos/Archive)
    requestHeaders.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
    requestHeaders.set('Referer', new URL(targetUrl).origin);
    requestHeaders.set('Accept', '*/*');
    
    const res = await fetch(targetUrl, { 
      headers: requestHeaders,
      cache: 'no-store',
      redirect: 'follow',
    });
    
    // Detecta expiração da fonte
    if (res.status === 401 || res.status === 403) {
      return NextResponse.json({ error: "SOURCE_EXPIRED" }, { status: 401 });
    }

    if (!res.ok && res.status !== 206) {
      return new Response(`Erro na Origem: ${res.status}`, { status: res.status });
    }

    const responseHeaders = new Headers();
    
    // Copia cabeçalhos vitais da fonte original
    const headersToCopy = ['content-type', 'content-length', 'content-range', 'accept-ranges', 'cache-control'];
    res.headers.forEach((v, k) => {
      if (headersToCopy.includes(k.toLowerCase())) responseHeaders.set(k, v);
    });

    // Força o tipo correto para arquivos .ts (O segredo do motor HLS)
    if (targetUrl.toLowerCase().includes('.ts') || targetUrl.toLowerCase().includes('mpegts')) {
      responseHeaders.set('Content-Type', 'video/mp2t');
    }

    // Liberação total de acesso
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
