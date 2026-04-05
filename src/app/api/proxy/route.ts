
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * TÚNEL MASTER v67.0 - PURIFICAÇÃO ATÔMICA
 * Resolve definitivamente o "Internal Server Error" no Next.js 15.
 * Remove todos os cabeçalhos que conflitam com a infraestrutura da Vercel.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) return new NextResponse("Sinal Ausente", { status: 400 });

  try {
    const requestHeaders = new Headers();
    
    // Suporte a Range - VITAL para vídeos e navegação
    const range = req.headers.get('range');
    if (range) requestHeaders.set('Range', range);
    
    // Identidade Sniper para burlar bloqueios de User-Agent
    requestHeaders.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');
    requestHeaders.set('Accept', '*/*');

    const res = await fetch(targetUrl, { 
      headers: requestHeaders,
      cache: 'no-store',
      redirect: 'follow',
    });
    
    const responseHeaders = new Headers();
    
    /**
     * BLACKLIST DE CABEÇALHOS - O FIM DO ERRO 500
     * Removemos tudo o que faz o servidor crashar ou ser bloqueado pelo Brave/Surfshark.
     */
    const blacklistedHeaders = [
      'content-length',    // PROIBIDO EM STREAMS
      'transfer-encoding', // CAUSA CONFLITO DE CHUNK
      'connection',        // GERENCIADO PELA VERCEL
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

    // Força CORS Total e Limpeza de Cache
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    responseHeaders.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    responseHeaders.set('Pragma', 'no-cache');

    if (!res.body) return new Response(null, { status: 200, headers: responseHeaders });

    // Retorna o corpo como um fluxo puro (Stream)
    return new Response(res.body, {
      status: res.status === 206 ? 206 : 200,
      headers: responseHeaders,
    });

  } catch (error: any) {
    console.error("Erro no Túnel Master:", error.message);
    return new Response(null, { status: 200, headers: { 'Access-Control-Allow-Origin': '*' } });
  }
}
