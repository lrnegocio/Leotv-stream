
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
    
    // MÁSCARA MASTER: Oculta a origem real enviando um User-Agent genérico
    requestHeaders.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
    requestHeaders.set('Referer', new URL(targetUrl).origin);
    
    const res = await fetch(targetUrl, { 
      headers: requestHeaders,
      cache: 'no-store',
      redirect: 'follow',
    });
    
    // FAILOVER: Se a origem retornar erro de acesso, o proxy retorna erro para o player buscar alternativa
    if (res.status === 401 || res.status === 403) {
      return new Response("ACESSO EXPIRADO NA ORIGEM", { status: 401 });
    }

    const responseHeaders = new Headers();
    const allowedHeaders = [
      'content-type', 
      'content-length', 
      'content-range', 
      'accept-ranges', 
      'cache-control'
    ];
    
    res.headers.forEach((v, k) => {
      const lowerKey = k.toLowerCase();
      if (allowedHeaders.includes(lowerKey)) responseHeaders.set(k, v);
    });

    // REGRA SOBERANA: Força o content-type correto para evitar o erro de 0:00
    if (targetUrl.toLowerCase().endsWith('.ts') || targetUrl.toLowerCase().includes('.ts?')) {
      responseHeaders.set('Content-Type', 'video/mp2t');
    }

    responseHeaders.set('Access-Control-Allow-Origin', '*');

    if (!res.body) return new Response(null, { status: res.status, headers: responseHeaders });

    return new Response(res.body, {
      status: res.status,
      headers: responseHeaders,
    });

  } catch (error: any) {
    return new Response(null, { status: 500, headers: { 'Access-Control-Allow-Origin': '*' } });
  }
}
