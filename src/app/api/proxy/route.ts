
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * TÚNEL XUI MASTER v53.0 - PURIFICAÇÃO ATÔMICA & ANTI-500
 * Blindagem extrema contra Erro 500 no Next.js 15.
 * Removemos absolutamente tudo que cause conflito de buffer no servidor.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) return new NextResponse("Sinal Ausente", { status: 400 });

  try {
    const requestHeaders = new Headers();
    const range = req.headers.get('range');
    if (range) requestHeaders.set('Range', range);
    
    requestHeaders.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36');
    requestHeaders.set('Accept', '*/*');
    
    const lowerTarget = targetUrl.toLowerCase();
    if (lowerTarget.includes('redecanais')) {
      requestHeaders.set('Referer', 'https://redecanaistv.cafe/');
    } else if (lowerTarget.includes('blinder.space')) {
      requestHeaders.set('Referer', 'http://blinder.space/');
    } else if (lowerTarget.includes('webplayer.one')) {
      requestHeaders.set('Referer', 'http://supremo.webplayer.one/');
    } else if (lowerTarget.includes('xvideos')) {
      requestHeaders.set('Referer', 'https://www.xvideos.com/');
    }

    const res = await fetch(targetUrl, { 
      headers: requestHeaders,
      cache: 'no-store',
      redirect: 'follow',
    });
    
    const responseHeaders = new Headers();
    
    /**
     * LAVAGEM CEREBRAL DE HEADERS v53
     * O Next.js 15 crasha se tentarmos passar o content-length ou transfer-encoding
     * de um sinal de vídeo dinâmico. Forçamos o encerramento de conexão para evitar buffer.
     */
    const skipHeaders = [
      'transfer-encoding', 
      'content-encoding', 
      'connection', 
      'keep-alive', 
      'host', 
      'te', 
      'trailer', 
      'upgrade',
      'proxy-authenticate',
      'proxy-authorization',
      'content-length',
      'set-cookie',
      'x-frame-options',
      'content-security-policy'
    ];
    
    res.headers.forEach((v, k) => {
      if (!skipHeaders.includes(k.toLowerCase())) {
        responseHeaders.set(k, v);
      }
    });

    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    responseHeaders.set('X-Content-Type-Options', 'nosniff');
    responseHeaders.set('Connection', 'close'); // Evita que o NextJS mantenha o socket aberto erradamente
    responseHeaders.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');

    if (!res.body) return new NextResponse("Sinal Vazio", { status: 502 });

    // Retornamos um stream puro para o navegador do cliente processar
    return new Response(res.body, {
      status: res.status === 206 ? 206 : 200,
      headers: responseHeaders,
    });

  } catch (error: any) {
    // Fallback silencioso para não quebrar a interface
    return new Response(null, { status: 200, headers: { 'Access-Control-Allow-Origin': '*' } });
  }
}
