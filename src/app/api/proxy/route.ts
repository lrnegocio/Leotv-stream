
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

/**
 * TÚNEL MASTER SOBERANO v224 - PROTOCOLO CAMALEÃO 5.0
 * Simula um Navegador Desktop Windows 11 de alta performance para abrir CDNs restritas.
 * Suporta Range Requests e manipulação de headers para enganar bloqueios de IP e Referer.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) return new NextResponse("Sinal Master Ausente", { status: 400 });

  try {
    const urlObj = new URL(targetUrl);
    const requestHeaders = new Headers();
    
    // Encaminha o Range (Obrigatório para HLS e MP4)
    const range = req.headers.get('range');
    if (range) requestHeaders.set('Range', range);
    
    // MÁSCARA SOBERANA: Identidade de Chrome Desktop em Windows 11 (A mais confiável para CDNs)
    requestHeaders.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
    requestHeaders.set('Accept', '*/*');
    requestHeaders.set('Accept-Language', 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7');
    requestHeaders.set('Origin', urlObj.origin);
    requestHeaders.set('Referer', urlObj.origin + '/');
    requestHeaders.set('Connection', 'keep-alive');
    requestHeaders.set('Cache-Control', 'no-cache');
    requestHeaders.set('Pragma', 'no-cache');

    const res = await fetch(targetUrl, { 
      headers: requestHeaders,
      cache: 'no-store',
      redirect: 'follow',
    });

    if (!res.ok && res.status !== 206) {
       // MODO DE EMERGÊNCIA: Simula uma Smart TV caso o desktop seja bloqueado
       const resTV = await fetch(targetUrl, {
         headers: {
           'User-Agent': 'Mozilla/5.0 (SMART-TV; LINUX; Tizen 7.0) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/21.0 Chrome/110.0.0.0 TV Safari/537.36',
           'Referer': urlObj.origin + '/'
         },
         redirect: 'follow'
       });
       if (!resTV.ok) return new Response(null, { status: resTV.status });
       return new Response(resTV.body, { headers: { 'Content-Type': resTV.headers.get('content-type') || 'video/mp4', 'Access-Control-Allow-Origin': '*' } });
    }

    const responseHeaders = new Headers();
    const headersToCopy = ['content-type', 'content-length', 'content-range', 'accept-ranges', 'content-encoding'];
    headersToCopy.forEach(h => {
      const val = res.headers.get(h);
      if (val) responseHeaders.set(h, val);
    });

    // TIPAGEM FORÇADA: Evita erro de "No supported sources" no navegador
    const lowerUrl = targetUrl.toLowerCase();
    if (lowerUrl.includes('.ts')) {
      responseHeaders.set('Content-Type', 'video/mp2t');
    } else if (lowerUrl.includes('.m3u8')) {
      responseHeaders.set('Content-Type', 'application/vnd.apple.mpegurl');
    } else if (lowerUrl.includes('.mp4')) {
      responseHeaders.set('Content-Type', 'video/mp4');
    }

    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Cache-Control', 'no-cache, no-store, must-revalidate');

    return new Response(res.body, {
      status: res.status,
      headers: responseHeaders,
    });

  } catch (error) {
    return new Response(null, { status: 500 });
  }
}
