
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * TÚNEL MASTER v3300.0 - MOTOR DE CAMUFLAGEM SOBERANO
 * Blindagem total para Erro 1106, Erro 500 e Carregamento Infinito.
 * Suporte a Partial Content (206) para arquivos gigantes.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) return new NextResponse("Sinal Sniper Ausente", { status: 400 });

  try {
    const requestHeaders = new Headers();
    const range = req.headers.get('range');
    
    if (range) requestHeaders.set('Range', range);
    
    // CAMUFLAGEM DE ELITE - Simula uma Smart TV High-End Samsung
    requestHeaders.set('User-Agent', 'Mozilla/5.0 (SMART-TV; Linux; Tizen 5.0) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/2.2 Chrome/63.0.3239.84 TV Safari/537.36');
    requestHeaders.set('Accept', '*/*');
    requestHeaders.set('Accept-Language', 'pt-BR,pt;q=0.9');
    requestHeaders.set('Connection', 'keep-alive');
    
    // TRATAMENTO DE REFERRER PARA BYPASS DE BLOQUEIO 1106 E CLOUDFLARE
    if (targetUrl.includes('redecanaistv') || targetUrl.includes('redecanais')) {
      requestHeaders.set('Referer', 'https://redecanaistv.cafe/');
      requestHeaders.set('Origin', 'https://redecanaistv.cafe');
    } else if (targetUrl.includes('jmvstream')) {
      requestHeaders.set('Referer', 'https://cdn.live.br1.jmvstream.com/');
    } else if (targetUrl.includes('blinder.space')) {
      requestHeaders.set('Referer', 'http://blinder.space/');
    }

    // TENTATIVA DE FETCH BLINDADA
    const res = await fetch(targetUrl, { 
      headers: requestHeaders,
      cache: 'no-store',
      redirect: 'follow'
    });

    if (!res.ok && res.status !== 206) {
      return new NextResponse(`Erro do Servidor Remoto: ${res.status}`, { status: res.status });
    }

    // SUPORTE A PARTIAL CONTENT 206 (ESSENCIAL PARA MP4 E M3U8 PESADOS)
    const responseHeaders = new Headers();
    const headersToCopy = ['content-type', 'content-length', 'content-range', 'accept-ranges', 'cache-control'];
    
    headersToCopy.forEach(h => {
      const v = res.headers.get(h);
      if (v) responseHeaders.set(h, v);
    });

    // LIBERAÇÃO CORS TOTAL PARA O PLAYER
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    
    if (!res.body) return new NextResponse("Sinal Vazio", { status: 502 });

    // RETORNA O STREAM DIRETAMENTE PARA O PLAYER (NEXTJS 15 COMPATÍVEL)
    return new Response(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders,
    });

  } catch (error: any) {
    console.error("Erro no Túnel Master:", error.message);
    return new NextResponse("Falha Sniper no Túnel 206", { status: 500 });
  }
}
