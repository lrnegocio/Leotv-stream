
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * TÚNEL MASTER v74.0 - RECALIBRAGEM ADULTA E IPTV
 * Otimizado para burlar proteções rígidas e garantir fluidez em iFrames e Streams.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) return new NextResponse("Sinal Ausente", { status: 400 });

  try {
    const requestHeaders = new Headers();
    
    // Suporte a Range - VITAL para vídeos fluírem sem travar
    const range = req.headers.get('range');
    if (range) requestHeaders.set('Range', range);
    
    // Camuflagem Ultra-Fiel (Simula Chrome no Windows)
    requestHeaders.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36');
    requestHeaders.set('Accept', '*/*');
    requestHeaders.set('Accept-Language', 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7');
    requestHeaders.set('Accept-Encoding', 'identity');
    requestHeaders.set('Connection', 'keep-alive');
    requestHeaders.set('Sec-Fetch-Dest', 'video');
    requestHeaders.set('Sec-Fetch-Mode', 'no-cors');
    requestHeaders.set('Sec-Fetch-Site', 'cross-site');
    
    const targetUrlObj = new URL(targetUrl);
    requestHeaders.set('Origin', targetUrlObj.origin);
    requestHeaders.set('Referer', targetUrlObj.origin + '/');

    const res = await fetch(targetUrl, { 
      headers: requestHeaders,
      cache: 'no-store',
      redirect: 'follow',
    });
    
    const responseHeaders = new Headers();
    
    // Lista de cabeçalhos que causariam erro no Proxy da Vercel
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

    // Força CORS Total para o Player Web
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, OPTIONS, HEAD');
    responseHeaders.set('Cache-Control', 'no-cache, no-store, must-revalidate');

    if (!res.body) return new Response(null, { status: res.status, headers: responseHeaders });

    return new Response(res.body, {
      status: res.status === 206 ? 206 : (res.status === 200 ? 200 : res.status),
      headers: responseHeaders,
    });

  } catch (error: any) {
    return new Response(null, { status: 200, headers: { 'Access-Control-Allow-Origin': '*' } });
  }
}
