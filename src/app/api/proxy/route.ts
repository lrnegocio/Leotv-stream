
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * TÚNEL DE SINAL MASTER v5.0
 * Motor de bypass transparente para m3u8, mp4 e players PHP.
 * Resolve bloqueios de Referer, Origin e Mixed Content (HTTP/HTTPS).
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) return new NextResponse("Sinal Ausente", { status: 400 });

  try {
    const requestHeaders = new Headers();
    const range = req.headers.get('range');
    
    if (range) requestHeaders.set('Range', range);
    
    // Identidade de Smart TV Premium para evitar bloqueios de segurança
    requestHeaders.set('User-Agent', 'Mozilla/5.0 (SMART-TV; Linux; Tizen 7.0) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/6.2 Chrome/110.0.0.0 TV Safari/537.36');
    requestHeaders.set('Accept', '*/*');
    
    // INJEÇÃO DE REFERER INTELIGENTE (O SEGREDO DO SINAL)
    const urlObj = new URL(targetUrl);
    if (targetUrl.includes('redecanais') || targetUrl.includes('fontedecanais')) {
      requestHeaders.set('Referer', 'https://redecanaistv.cafe/');
      requestHeaders.set('Origin', 'https://redecanaistv.cafe');
    } else if (targetUrl.includes('blinder.space')) {
      requestHeaders.set('Referer', 'http://blinder.space/');
    } else if (targetUrl.includes('wurl.tv')) {
      requestHeaders.set('Referer', 'https://www.samsung.com/');
    } else {
      requestHeaders.set('Referer', `${urlObj.protocol}//${urlObj.host}/`);
    }

    const res = await fetch(targetUrl, { 
      headers: requestHeaders,
      cache: 'no-store',
      redirect: 'follow'
    });

    const responseHeaders = new Headers();
    
    // Copia cabeçalhos vitais para streaming fluido e suporte a Range (avanço de vídeo)
    const headersToCopy = [
      'content-type', 
      'content-length', 
      'content-range', 
      'accept-ranges', 
      'cache-control'
    ];

    headersToCopy.forEach(h => {
      const v = res.headers.get(h);
      if (v) responseHeaders.set(h, v);
    });

    // Liberação total de CORS e remoção de travas de Iframe (X-Frame-Options)
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    responseHeaders.delete('x-frame-options');
    responseHeaders.delete('content-security-policy');

    if (!res.body) return new NextResponse("Sinal Vazio", { status: 502 });

    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders,
    });

  } catch (error: any) {
    console.error("Erro no Túnel Master v5.0:", error.message);
    return new NextResponse("Falha no Túnel de Sinal", { status: 500 });
  }
}
