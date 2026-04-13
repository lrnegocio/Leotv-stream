
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * TÚNEL MASTER SOBERANO v170 - VPS LINUX EDITION
 * Otimizado para não vazar memória e suportar milhares de conexões .ts
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) return new NextResponse("Sinal Master Ausente", { status: 400 });

  try {
    const requestHeaders = new Headers();
    const range = req.headers.get('range');
    if (range) requestHeaders.set('Range', range);
    
    // MÁSCARA PROFISSIONAL DE NAVEGADOR
    requestHeaders.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
    requestHeaders.set('Accept', '*/*');
    
    const res = await fetch(targetUrl, { 
      headers: requestHeaders,
      cache: 'no-store',
      redirect: 'follow',
    });
    
    if (!res.ok) return new Response(`Erro na Origem: ${res.status}`, { status: res.status });

    const responseHeaders = new Headers();
    
    // Cabeçalhos Vitais para o Player do Cliente não travar
    const headersToCopy = [
      'content-type', 
      'content-length', 
      'content-range', 
      'accept-ranges'
    ];
    
    res.headers.forEach((v, k) => {
      if (headersToCopy.includes(k.toLowerCase())) responseHeaders.set(k, v);
    });

    // CORREÇÃO DE MIME-TYPE PARA .TS
    if (targetUrl.toLowerCase().includes('.ts')) {
      responseHeaders.set('Content-Type', 'video/mp2t');
    }

    // Liberação Total de Acesso (CORS)
    responseHeaders.set('Access-Control-Allow-Origin', '*');

    // MODO STREAM: A VPS não salva o vídeo, ela apenas deixa ele passar.
    // Isso garante uso zero de disco e CPU baixíssima.
    return new Response(res.body, {
      status: res.status,
      headers: responseHeaders,
    });

  } catch (error: any) {
    return new Response(null, { status: 500 });
  }
}
