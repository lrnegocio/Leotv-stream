
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

/**
 * TÚNEL MASTER SOBERANO v196 - BYPASS XUI ONE
 * Otimizado para vencer o erro USER_DISALLOW_EXT e bloqueios de User-Agent.
 */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  let targetUrl = searchParams.get('url');

  if (!targetUrl) return new NextResponse("Sinal Master Ausente", { status: 400 });

  // LIMPEZA MASTER: Remove extensões de script que o player possa ter injetado por erro
  targetUrl = targetUrl.replace('.mpegts.js', '');

  try {
    const requestHeaders = new Headers();
    
    // Suporte a Range para Filmes e Séries
    const range = req.headers.get('range');
    if (range) requestHeaders.set('Range', range);
    
    // IDENTIDADE CAMALEÃO v196: Finge ser o App Oficial IPTV Smarters Pro
    // Este User-Agent é a "Chave Mestra" que abre o painel XUI ONE (Contfree/Blinder)
    requestHeaders.set('User-Agent', 'IPTVSmartersPro/3.0.0 (Linux;Android 11) Mobile');
    requestHeaders.set('Accept', '*/*');
    requestHeaders.set('Accept-Language', 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7');
    requestHeaders.set('Connection', 'keep-alive');
    
    // REMOVE O RASTRO DO SITE (Crucial para evitar o erro USER_DISALLOW_EXT)
    const targetOrigin = new URL(targetUrl).origin;
    requestHeaders.set('Origin', targetOrigin);
    // Não enviamos Referer para o servidor não saber que somos um player web
    
    const res = await fetch(targetUrl, { 
      headers: requestHeaders,
      cache: 'no-store',
      redirect: 'follow',
    });
    
    if (!res.ok && res.status !== 206) {
      console.error(`Erro na Fonte (${res.status}): ${targetUrl}`);
      return new Response("Sinal Bloqueado na Fonte", { status: res.status });
    }

    const responseHeaders = new Headers();
    
    // Copia cabeçalhos vitais
    const copyHeaders = ['content-type', 'content-length', 'content-range', 'accept-ranges', 'icy-metaint', 'icy-name'];
    res.headers.forEach((v, k) => {
      if (copyHeaders.includes(k.toLowerCase())) responseHeaders.set(k, v);
    });

    // Força o Mime-Type correto para enganar o navegador e rodar o player
    if (targetUrl.toLowerCase().includes('.ts') || !responseHeaders.get('content-type')) {
      responseHeaders.set('Content-Type', 'video/mp2t');
    }

    // Liberação Total de Acesso (CORS Bypass)
    responseHeaders.set('Access-Control-Allow-Origin', '*');
    responseHeaders.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
    responseHeaders.set('Cache-Control', 'no-cache, no-store, must-revalidate');

    return new Response(res.body, {
      status: res.status,
      headers: responseHeaders,
    });

  } catch (error: any) {
    console.error("Erro no Proxy Master v196:", error.message);
    return new Response(null, { status: 500 });
  }
}
