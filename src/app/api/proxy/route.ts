
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * TÚNEL MASTER v15.0 - EDIÇÃO BYPASS CLOUDFLARE & FILTRO ANTI-HTML
 * Protege contra NotSupportedError bloqueando respostas que não são vídeo.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) return new NextResponse("Sinal Ausente", { status: 400 });

  try {
    const requestHeaders = new Headers();
    const range = req.headers.get('range');
    if (range) requestHeaders.set('Range', range);
    
    // IDENTIDADE SOBERANA: Simula Smart TV para evitar bloqueios iniciais
    requestHeaders.set('User-Agent', 'Mozilla/5.0 (SMART-TV; Linux; Tizen 6.0) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/4.0 Chrome/122.0.0.0 TV Safari/537.36');
    requestHeaders.set('Accept', '*/*');
    
    const urlObj = new URL(targetUrl);
    if (targetUrl.includes('redecanaistv') || targetUrl.includes('fontedecanais')) {
      requestHeaders.set('Referer', 'https://redecanaistv.cafe/');
      requestHeaders.set('Origin', 'https://redecanaistv.cafe');
    } else {
      requestHeaders.set('Referer', `${urlObj.protocol}//${urlObj.host}/`);
    }

    // LIMPEZA DE CABEÇALHOS SUSPEITOS
    const forbidden = ['host', 'connection', 'x-forwarded-for', 'via', 'proxy-connection', 'forwarded', 'cookie'];
    forbidden.forEach(h => requestHeaders.delete(h));

    let res = await fetch(targetUrl, { 
      headers: requestHeaders,
      cache: 'no-store',
      redirect: 'follow'
    });

    // XEQUE-MATE NO ERRO 520/403: Giro de Identidade Instantâneo (Muda para PC Windows)
    if (res.status === 520 || res.status === 403 || res.status === 502) {
      requestHeaders.delete('Referer');
      requestHeaders.delete('Origin');
      requestHeaders.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
      res = await fetch(targetUrl, { headers: requestHeaders, cache: 'no-store', redirect: 'follow' });
    }

    // FILTRO ANTI-NOTSUPPORTEDERROR: Se o servidor mandar HTML (página de erro), o túnel corta.
    const contentType = res.headers.get('content-type') || '';
    if (contentType.includes('text/html')) {
       return new NextResponse("Erro no Servidor Original - HTML Bloqueado para Segurança", { status: 502 });
    }

    const responseHeaders = new Headers();
    const headersToCopy = ['content-type', 'content-length', 'content-range', 'accept-ranges'];
    headersToCopy.forEach(h => {
      const v = res.headers.get(h);
      if (v) responseHeaders.set(h, v);
    });

    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Cache-Control', 'no-store, no-cache, must-revalidate');

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
