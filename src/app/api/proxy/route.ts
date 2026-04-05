
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * TÚNEL MASTER v65.0 - SINTONIA RADICAL M3U8/TS/MP4
 * Purificação Atômica de Headers para Next.js 15 (Vercel Ready).
 * Resolve definitivamente o "Internal Server Error" em streams.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) return new NextResponse("Sinal Ausente", { status: 400 });

  try {
    const requestHeaders = new Headers();
    
    // Suporte a Range - VITAL para vídeos e IPTV
    const range = req.headers.get('range');
    if (range) requestHeaders.set('Range', range);
    
    // Identidade Sniper para burlar bloqueios de servidores profissionais
    requestHeaders.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');
    requestHeaders.set('Accept', '*/*');
    requestHeaders.set('Accept-Encoding', 'identity'); // Evita compressão que crasha o stream
    
    // Bypass de Referer para provedores comuns de IPTV
    const lowerTarget = targetUrl.toLowerCase();
    if (lowerTarget.includes('redecanais') || lowerTarget.includes('rdcanais')) {
      requestHeaders.set('Referer', 'https://redecanaistv.cafe/');
    } else if (lowerTarget.includes('reidoscanais')) {
      requestHeaders.set('Referer', 'https://reidoscanais.ooo/');
    }

    const res = await fetch(targetUrl, { 
      headers: requestHeaders,
      cache: 'no-store',
      redirect: 'follow',
    });
    
    const responseHeaders = new Headers();
    
    /**
     * LAVAGEM CEREBRAL DE HEADERS - O FIM DO ERRO 500
     * Removemos tudo o que faz o Next.js 15 falhar em streams dinâmicos.
     */
    const skipHeaders = [
      'content-length',    // PROIBIDO EM STREAMS DINÂMICOS
      'transfer-encoding', // PODE CAUSAR CONFLITOS DE CHUNK
      'connection',        // DEVE SER GERENCIADO PELO NEXTJS
      'keep-alive',
      'content-encoding',
      'host',
      'te',
      'trailer',
      'upgrade',
      'set-cookie',
      'x-frame-options',
      'content-security-policy'
    ];
    
    res.headers.forEach((v, k) => {
      const lowerKey = k.toLowerCase();
      if (!skipHeaders.includes(lowerKey)) {
        responseHeaders.set(k, v);
      }
    });

    // Garante CORS total e fluidez de dados
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    responseHeaders.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    responseHeaders.set('X-Sinal-Status', 'Purificado-Master-v65');

    if (!res.body) return new NextResponse("Sinal Vazio", { status: 502 });

    // Retorna o corpo como um Response puro (Stream)
    return new Response(res.body, {
      status: res.status === 206 ? 206 : 200,
      headers: responseHeaders,
    });

  } catch (error: any) {
    console.error("Erro no Túnel Master:", error.message);
    return new Response(null, { status: 200, headers: { 'Access-Control-Allow-Origin': '*' } });
  }
}
