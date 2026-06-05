
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

/**
 * TÚNEL GHOST v385-S - BYPASS TOTAL TVACABO, SHORTFLIX E DORAMAS
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) return new NextResponse("Sinal Ausente", { status: 400 });

  const lowTarget = targetUrl.toLowerCase();

  try {
    const requestHeaders = new Headers();
    
    // MASCARAMENTO SOBERANO - Android TV / Chrome High Authority
    requestHeaders.set('User-Agent', 'Mozilla/5.0 (Linux; Android 10; SM-G981B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36');
    requestHeaders.set('Accept', '*/*');
    requestHeaders.set('Connection', 'keep-alive');
    
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
    
    ['content-length', 'content-range', 'accept-ranges'].forEach(h => {
      const val = res.headers.get(h);
      if (val) responseHeaders.set(h, val);
    });

    responseHeaders.set('Content-Type', contentType);
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('X-Frame-Options', 'ALLOWALL');
    responseHeaders.set('Content-Security-Policy', "frame-ancestors *;");

    if (contentType.includes('mpegurl') || lowTarget.includes('.m3u8')) {
      const text = await res.text();
      return new Response(text, { headers: responseHeaders });
    }

    return new Response(res.body, { status: res.status, headers: responseHeaders });
  } catch (error) {
    return new Response("Falha no Túnel Independente v385-S", { status: 500 });
  }
}
