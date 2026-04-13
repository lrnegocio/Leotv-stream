
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * TUNEL MASTER SOBERANO v169 - Otimizado para VPS
 * Este túnel transforma links HTTP e sinais .TS em fluxos compatíveis com HTTPS e PWA.
 * Não consome espaço em disco, apenas redireciona o tráfego em tempo real.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) return new NextResponse("Sinal Master Ausente", { status: 400 });

  try {
    const requestHeaders = new Headers();
    const range = req.headers.get('range');
    if (range) requestHeaders.set('Range', range);
    
    // MÁSCARA MASTER: Envia cabeçalhos de alta compatibilidade
    requestHeaders.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
    requestHeaders.set('Accept', '*/*');
    requestHeaders.set('Connection', 'keep-alive');
    
    // Referer dinâmico para evitar bloqueios de servidores como o do Blinder
    try {
      const urlObj = new URL(targetUrl);
      requestHeaders.set('Referer', urlObj.origin);
      requestHeaders.set('Origin', urlObj.origin);
    } catch (e) {}

    const res = await fetch(targetUrl, { 
      headers: requestHeaders,
      cache: 'no-store',
      redirect: 'follow',
    });
    
    if (!res.ok) {
      return new Response(`Erro na Origem: ${res.status}`, { status: res.status });
    }

    const responseHeaders = new Headers();
    const headersToCopy = [
      'content-type', 
      'content-length', 
      'content-range', 
      'accept-ranges', 
      'cache-control'
    ];
    
    res.headers.forEach((v, k) => {
      if (headersToCopy.includes(k.toLowerCase())) {
        responseHeaders.set(k, v);
      }
    });

    // CORREÇÃO CRÍTICA DE MIME-TYPE PARA .TS E M3U8
    const lowerTarget = targetUrl.toLowerCase();
    if (lowerTarget.includes('.ts') || lowerTarget.includes('.mpegts')) {
      responseHeaders.set('Content-Type', 'video/mp2t');
    } else if (lowerTarget.includes('.m3u8')) {
      responseHeaders.set('Content-Type', 'application/vnd.apple.mpegurl');
    } else if (lowerTarget.includes('.mp4')) {
      responseHeaders.set('Content-Type', 'video/mp4');
    }

    // Liberação total de CORS para o PWA e Apps de IPTV
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', '*');

    if (!res.body) return new Response(null, { status: res.status, headers: responseHeaders });

    // Pipe de sinal: não armazena nada, apenas deixa o vídeo passar
    return new Response(res.body, {
      status: res.status,
      headers: responseHeaders,
    });

  } catch (error: any) {
    console.error("Erro no Túnel Master:", error);
    return new Response(null, { status: 500 });
  }
}
