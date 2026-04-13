
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * TÚNEL MASTER SOBERANO v171 - ALMA LINUX EDITION
 * Otimizado para não vazar memória e suportar milhares de conexões .ts simultâneas.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) return new NextResponse("Sinal Master Ausente", { status: 400 });

  try {
    const requestHeaders = new Headers();
    const range = req.headers.get('range');
    if (range) requestHeaders.set('Range', range);
    
    // MÁSCARA PROFISSIONAL DE NAVEGADOR PARA EVITAR BLOQUEIOS
    requestHeaders.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
    requestHeaders.set('Accept', '*/*');
    requestHeaders.set('Referer', new URL(targetUrl).origin);
    
    const res = await fetch(targetUrl, { 
      headers: requestHeaders,
      cache: 'no-store',
      redirect: 'follow',
    });
    
    if (!res.ok) return new Response(`Erro na Origem: ${res.status}`, { status: res.status });

    const responseHeaders = new Headers();
    
    // Cabeçalhos Vitais para o Player do Cliente não travar (DNA do Canva)
    const headersToCopy = [
      'content-type', 
      'content-length', 
      'content-range', 
      'accept-ranges',
      'cache-control'
    ];
    
    res.headers.forEach((v, k) => {
      if (headersToCopy.includes(k.toLowerCase())) responseHeaders.set(k, v);
    });

    // CORREÇÃO DE MIME-TYPE PARA .TS (SINAL DE TV)
    if (targetUrl.toLowerCase().includes('.ts') || targetUrl.toLowerCase().includes('mpegts')) {
      responseHeaders.set('Content-Type', 'video/mp2t');
    }

    // Liberação Total de Acesso (CORS) - Fundamental para Smart TVs
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    responseHeaders.set('Access-Control-Allow-Headers', '*');

    // MODO STREAM PURO: A VPS age como um cano de alta pressão.
    return new Response(res.body, {
      status: res.status,
      headers: responseHeaders,
    });

  } catch (error: any) {
    console.error("Erro no Túnel Master:", error);
    return new Response(null, { status: 500 });
  }
}
