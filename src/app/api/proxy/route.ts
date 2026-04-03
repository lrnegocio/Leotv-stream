
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * TÚNEL DE SINAL MASTER v4.0 (RESTAURAÇÃO TOTAL)
 * Motor de bypass limpo para m3u8, mp4 e canais ao vivo.
 * Suporte a Range (206) e injeção de Referer inteligente.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) return new NextResponse("Sinal Ausente", { status: 400 });

  try {
    const requestHeaders = new Headers();
    const range = req.headers.get('range');
    
    if (range) requestHeaders.set('Range', range);
    
    // Identidade camaleão Smart TV
    requestHeaders.set('User-Agent', 'Mozilla/5.0 (SMART-TV; Linux; Tizen 7.0) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/6.2 Chrome/110.0.0.0 TV Safari/537.36');
    requestHeaders.set('Accept', '*/*');
    
    // Bypass de Referer dinâmico
    const urlObj = new URL(targetUrl);
    if (targetUrl.includes('redecanais')) {
      requestHeaders.set('Referer', 'https://redecanaistv.cafe/');
      requestHeaders.set('Origin', 'https://redecanaistv.cafe');
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
    
    // Copia apenas cabeçalhos essenciais para não quebrar a decodificação
    const safeHeaders = ['content-type', 'content-length', 'content-range', 'accept-ranges'];
    safeHeaders.forEach(h => {
      const v = res.headers.get(h);
      if (v) responseHeaders.set(h, v);
    });

    // Liberação total de CORS
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Cache-Control', 'no-cache, no-store, must-revalidate');

    if (!res.body) return new NextResponse("Sinal Vazio", { status: 502 });

    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders,
    });

  } catch (error: any) {
    console.error("Erro no Túnel Master:", error.message);
    return new NextResponse("Falha no Túnel de Sinal", { status: 500 });
  }
}
