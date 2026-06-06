
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

/**
 * TÚNEL GHOST v385-S PLUS - EXTRAÇÃO MASTER
 * Otimizado para Hardware (Sky), tvacabo.top e shortflix.net.
 * Mascara o tráfego da VPS como se fosse uma Smart TV authority.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) return new NextResponse("Sinal Ausente", { status: 400 });

  const lowTarget = targetUrl.toLowerCase();

  try {
    const requestHeaders = new Headers();
    
    // MASCARAMENTO SOBERANO - Android TV High Authority (BRAZIL)
    requestHeaders.set('User-Agent', 'Mozilla/5.0 (Linux; Android 11; BRAVIA 4K VH2 Build/RP1A.200720.011) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Mobile Safari/537.36');
    requestHeaders.set('Accept', '*/*');
    requestHeaders.set('Accept-Language', 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7');
    requestHeaders.set('Connection', 'keep-alive');
    
    // BYPASS PARA HARDWARE SKY/ENCODER (Mascara o IP residencial)
    // Usamos o IP da VPS (177.153.202.104) como porta de saída segura
    if (lowTarget.includes('192.168.') || lowTarget.includes('177.') || lowTarget.includes('sky') || lowTarget.includes('encoder')) {
      requestHeaders.set('X-Forwarded-For', '177.153.202.104'); 
    }

    // BYPASS DE REFERER PARA DOMÍNIOS PROTEGIDOS
    if (lowTarget.includes('tvacabo.top')) {
      requestHeaders.set('Referer', 'https://tvacabo.top/');
      requestHeaders.set('Origin', 'https://tvacabo.top');
    } else if (lowTarget.includes('shortflix.net')) {
      requestHeaders.set('Referer', 'https://www.shortflix.net/');
      requestHeaders.set('Origin', 'https://www.shortflix.net');
    } else {
      try {
        const urlObj = new URL(targetUrl);
        requestHeaders.set('Referer', urlObj.origin + '/');
      } catch (e) {
        requestHeaders.set('Referer', 'https://www.google.com/');
      }
    }

    const res = await fetch(targetUrl, { 
      headers: requestHeaders,
      redirect: 'follow'
    });

    const contentType = res.headers.get('content-type') || '';
    const responseHeaders = new Headers();
    
    // Repassa headers de stream para estabilidade HD e evitar travamentos
    ['content-length', 'content-range', 'accept-ranges', 'cache-control'].forEach(h => {
      const val = res.headers.get(h);
      if (val) responseHeaders.set(h, val);
    });

    responseHeaders.set('Content-Type', contentType);
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('X-Frame-Options', 'ALLOWALL');
    responseHeaders.set('Content-Security-Policy', "frame-ancestors *;");

    return new Response(res.body, { status: res.status, headers: responseHeaders });
  } catch (error) {
    return new Response("Falha no Túnel Independente v385-S", { status: 500 });
  }
}
