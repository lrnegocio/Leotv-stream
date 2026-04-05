import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * TÚNEL MASTER v63.0 - PURIFICAÇÃO DE FLUXO CONTÍNUO
 * Blindagem total para M3U8, TS e MP4 no Next.js 15.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) return new NextResponse("Sinal Ausente", { status: 400 });

  try {
    const requestHeaders = new Headers();
    
    // Suporte a Range para vídeos MP4/TS (Permite buscar tempo no vídeo)
    const range = req.headers.get('range');
    if (range) requestHeaders.set('Range', range);
    
    // Identidade de Navegador Master para burlar bloqueios
    requestHeaders.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36');
    requestHeaders.set('Accept', '*/*');
    
    // Bypass de Referer para sites de IPTV profissionais
    const lowerTarget = targetUrl.toLowerCase();
    if (lowerTarget.includes('redecanais') || lowerTarget.includes('rdcanais')) {
      requestHeaders.set('Referer', 'https://redecanaistv.cafe/');
    } else if (lowerTarget.includes('blinder')) {
      requestHeaders.set('Referer', 'http://blinder.space/');
    }

    const res = await fetch(targetUrl, { 
      headers: requestHeaders,
      cache: 'no-store',
      redirect: 'follow',
    });
    
    const responseHeaders = new Headers();
    
    // LAVAGEM CEREBRAL DE HEADERS - Next.js 15 Compliance
    const skipHeaders = [
      'transfer-encoding', 
      'content-encoding', 
      'connection', 
      'keep-alive', 
      'host', 
      'te', 
      'trailer', 
      'upgrade',
      'proxy-authenticate',
      'proxy-authorization',
      'content-length', // Evita erro 500 se o tamanho mudar no stream
      'set-cookie',
      'x-frame-options',
      'content-security-policy'
    ];
    
    res.headers.forEach((v, k) => {
      if (!skipHeaders.includes(k.toLowerCase())) {
        responseHeaders.set(k, v);
      }
    });

    // Liberação Total de CORS para o navegador
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    responseHeaders.set('Cache-Control', 'no-cache, no-store, must-revalidate');

    if (!res.body) return new NextResponse("Sinal Vazio", { status: 502 });

    return new Response(res.body, {
      status: res.status === 206 ? 206 : 200,
      headers: responseHeaders,
    });

  } catch (error: any) {
    return new Response(null, { status: 200, headers: { 'Access-Control-Allow-Origin': '*' } });
  }
}
