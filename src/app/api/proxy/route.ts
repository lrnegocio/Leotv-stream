import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * TÚNEL MASTER v72.0 - PURIFICAÇÃO TOTAL E CAMUFLAGEM
 * Otimizado para Streaming Adulto (XVideos/Brazzers) e IPTV.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) return new NextResponse("Sinal Ausente", { status: 400 });

  try {
    const requestHeaders = new Headers();
    
    // Suporte a Range - VITAL para vídeos e navegação no tempo
    const range = req.headers.get('range');
    if (range) requestHeaders.set('Range', range);
    
    // Camuflagem de Navegador de Alta Fidelidade
    requestHeaders.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    requestHeaders.set('Accept', '*/*');
    requestHeaders.set('Accept-Language', 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7');
    
    // Define a origem e o referer dinamicamente baseados no alvo para burlar hotlink
    const targetOrigin = new URL(targetUrl).origin;
    requestHeaders.set('Origin', targetOrigin);
    requestHeaders.set('Referer', targetOrigin + '/');

    const res = await fetch(targetUrl, { 
      headers: requestHeaders,
      cache: 'no-store',
      redirect: 'follow',
    });
    
    const responseHeaders = new Headers();
    
    /**
     * BLACKLIST DE CABEÇALHOS
     * Removemos itens que a Vercel/NextJS injetam ou que causam erro 500 no proxy de stream.
     */
    const blacklistedHeaders = [
      'content-length',    
      'transfer-encoding', 
      'connection',        
      'keep-alive',
      'content-encoding',
      'host',
      'te',
      'trailer',
      'upgrade',
      'set-cookie',
      'x-frame-options',
      'content-security-policy',
      'strict-transport-security',
      'server',
      'x-powered-by',
      'access-control-allow-origin'
    ];
    
    res.headers.forEach((v, k) => {
      const lowerKey = k.toLowerCase();
      if (!blacklistedHeaders.includes(lowerKey)) {
        responseHeaders.set(k, v);
      }
    });

    // Força CORS Total e Limpeza de Cache para o Player fluir
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    responseHeaders.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    responseHeaders.set('Pragma', 'no-cache');

    if (!res.body) return new Response(null, { status: res.status, headers: responseHeaders });

    // Retorna o fluxo de vídeo (Stream)
    return new Response(res.body, {
      status: res.status === 206 ? 206 : (res.status === 200 ? 200 : res.status),
      headers: responseHeaders,
    });

  } catch (error: any) {
    console.error("Erro no Túnel Master:", error.message);
    return new Response(null, { status: 200, headers: { 'Access-Control-Allow-Origin': '*' } });
  }
}
