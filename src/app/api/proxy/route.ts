
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * TÚNEL MASTER v11.0 - EDIÇÃO BYPASS CLOUDFLARE 520
 * Suporte total a m3u8, mp4 e players PHP.
 * Injeção de identidade Smart TV e limpeza de cabeçalhos suspeitos.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) return new NextResponse("Sinal Ausente", { status: 400 });

  try {
    const requestHeaders = new Headers();
    const range = req.headers.get('range');
    
    if (range) requestHeaders.set('Range', range);
    
    // IDENTIDADE SOBERANA: Simula Smart TV de 2024 para enganar o Cloudflare
    requestHeaders.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
    requestHeaders.set('Accept', 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8');
    requestHeaders.set('Accept-Language', 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7');
    
    // CAMUFLAGEM DINÂMICA DE ORIGEM
    const urlObj = new URL(targetUrl);
    if (targetUrl.includes('redecanaistv') || targetUrl.includes('fontedecanais') || targetUrl.includes('reidoscanais')) {
      requestHeaders.set('Referer', 'https://redecanaistv.cafe/');
      requestHeaders.set('Origin', 'https://redecanaistv.cafe');
    } else if (targetUrl.includes('wurl.tv') || targetUrl.includes('samsung')) {
      requestHeaders.set('Referer', 'https://www.samsung.com/');
      requestHeaders.set('Origin', 'https://www.samsung.com');
    } else if (targetUrl.includes('blinder')) {
      requestHeaders.set('Referer', 'http://blinder.space/');
    } else {
      requestHeaders.set('Referer', `${urlObj.protocol}//${urlObj.host}/`);
    }

    // LIMPEZA DE RASTROS: Remove cabeçalhos que Cloudflare usa para bloquear proxies
    const forbidden = ['host', 'connection', 'x-forwarded-for', 'x-real-ip', 'via'];
    forbidden.forEach(h => requestHeaders.delete(h));

    const res = await fetch(targetUrl, { 
      headers: requestHeaders,
      cache: 'no-store',
      redirect: 'follow'
    });

    // Se o sinal original deu erro 520, tentamos uma última vez sem referer (fallback)
    if (res.status === 520) {
      requestHeaders.delete('Referer');
      requestHeaders.delete('Origin');
      const retryRes = await fetch(targetUrl, { headers: requestHeaders, cache: 'no-store', redirect: 'follow' });
      if (retryRes.ok) return new Response(retryRes.body, { status: 200, headers: retryRes.headers });
    }

    const responseHeaders = new Headers();
    
    // Copia cabeçalhos vitais para fluidez e bypass de segurança
    const headersToCopy = [
      'content-type', 
      'content-length', 
      'content-range', 
      'accept-ranges',
      'last-modified'
    ];

    headersToCopy.forEach(h => {
      const v = res.headers.get(h);
      if (v) responseHeaders.set(h, v);
    });

    // BLINDAGEM CORS E FRAME
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('X-Frame-Options', 'ALLOWALL');
    responseHeaders.set('Cache-Control', 'no-cache, no-store, must-revalidate');

    if (!res.body) return new NextResponse("Sinal Vazio", { status: 502 });

    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders,
    });

  } catch (error: any) {
    return new NextResponse("Falha no Túnel Master", { status: 500 });
  }
}
