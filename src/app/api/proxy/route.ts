
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * TÚNEL MASTER SOBERANO v175 - CONTINGÊNCIA ATIVA
 * Detecta expiração da fonte (Blinder/Outros) e evita tela branca.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) return new NextResponse("Sinal Master Ausente", { status: 400 });

  try {
    const requestHeaders = new Headers();
    const range = req.headers.get('range');
    if (range) requestHeaders.set('Range', range);
    
    requestHeaders.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
    requestHeaders.set('Accept', '*/*');
    
    const res = await fetch(targetUrl, { 
      headers: requestHeaders,
      cache: 'no-store',
      redirect: 'follow',
    });
    
    // SE A FONTE EXPIRAR (401/403), ENVIAMOS UM STATUS ESPECIAL
    if (res.status === 401 || res.status === 403) {
      console.error("FONTE EXPIROU: Redirecionando para vídeo de manutenção.");
      // Retorna um JSON informando ao player que a fonte caiu
      return NextResponse.json({ error: "SOURCE_EXPIRED", message: "O sinal da fonte expirou." }, { status: 401 });
    }

    if (!res.ok) return new Response(`Erro na Origem: ${res.status}`, { status: res.status });

    const responseHeaders = new Headers();
    const headersToCopy = ['content-type', 'content-length', 'content-range', 'accept-ranges', 'cache-control'];
    
    res.headers.forEach((v, k) => {
      if (headersToCopy.includes(k.toLowerCase())) responseHeaders.set(k, v);
    });

    if (targetUrl.toLowerCase().includes('.ts') || targetUrl.toLowerCase().includes('mpegts')) {
      responseHeaders.set('Content-Type', 'video/mp2t');
    }

    responseHeaders.set('Access-Control-Allow-Origin', '*');

    return new Response(res.body, {
      status: res.status,
      headers: responseHeaders,
    });

  } catch (error: any) {
    return new Response(null, { status: 500 });
  }
}
