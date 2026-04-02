
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * TÚNEL MASTER v2000.0 - MOTOR DE STREAMING SOBERANO (ANTI-ERRO 500)
 * Blindagem total para links HTTP (Blinder Space) e sinais bloqueados (JMVStream).
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) return new NextResponse("Sinal Sniper Ausente", { status: 400 });

  try {
    const requestHeaders = new Headers();
    const range = req.headers.get('range');
    
    if (range) requestHeaders.set('Range', range);
    
    // CAMUFLAGEM MASTER v2000 - Simula um navegador real de alta performance
    requestHeaders.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36');
    requestHeaders.set('Accept', '*/*');
    requestHeaders.set('Connection', 'keep-alive');
    
    // TRATAMENTO DE REFERRER PARA DOMÍNIOS ESPECÍFICOS
    if (targetUrl.includes('xvideos')) {
      requestHeaders.set('Referer', 'https://www.xvideos.com/');
    } else if (targetUrl.includes('jmvstream')) {
      requestHeaders.set('Origin', 'https://cdn.live.br1.jmvstream.com');
    }

    const res = await fetch(targetUrl, { 
      headers: requestHeaders,
      cache: 'no-store',
      redirect: 'follow'
    });

    const responseHeaders = new Headers();
    const headersToCopy = ['content-type', 'content-length', 'content-range', 'accept-ranges', 'cache-control'];
    
    headersToCopy.forEach(h => {
      const v = res.headers.get(h);
      if (v) responseHeaders.set(h, v);
    });

    // LIBERAÇÃO CORS PARA O PLAYER
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    
    // ANTI-ERRO 500: Se res.body for null, retorna erro amigável em vez de quebrar
    if (!res.body) return new NextResponse("Corpo do Sinal Vazio", { status: 502 });

    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders,
    });
  } catch (error: any) {
    console.error("Falha no Túnel Master:", error.message);
    return new NextResponse("Falha Sniper 206", { status: 500 });
  }
}
