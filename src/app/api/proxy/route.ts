
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) return new NextResponse("Sinal Master Ausente", { status: 400 });

  try {
    const requestHeaders = new Headers();
    const range = req.headers.get('range');
    if (range) requestHeaders.set('Range', range);
    
    // MÁSCARA MASTER: Envia cabeçalhos que enganam o servidor de origem
    requestHeaders.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
    requestHeaders.set('Accept', '*/*');
    requestHeaders.set('Connection', 'keep-alive');
    
    // Referer dinâmico baseado na origem do link
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

    // CORREÇÃO DE CONTENT-TYPE PARA SINAL DE TV
    const lowerTarget = targetUrl.toLowerCase();
    if (lowerTarget.includes('.ts') || lowerTarget.includes('.mpegts')) {
      responseHeaders.set('Content-Type', 'video/mp2t');
    } else if (lowerTarget.includes('.m3u8')) {
      responseHeaders.set('Content-Type', 'application/vnd.apple.mpegurl');
    }

    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, OPTIONS');

    if (!res.body) return new Response(null, { status: res.status, headers: responseHeaders });

    return new Response(res.body, {
      status: res.status,
      headers: responseHeaders,
    });

  } catch (error: any) {
    console.error("Proxy Error:", error);
    return new Response(null, { status: 500 });
  }
}
