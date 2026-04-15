
import { NextResponse } from 'next/server';

/**
 * API XTREAM CODES - DESATIVADA POR ORDEM DO MESTRE LÉO
 * O sistema agora opera exclusivamente via Web/PWA.
 */
export async function GET() {
  return new NextResponse("Sinal IPTV Desativado. Use o App Web Oficial.", { status: 404 });
}

export async function POST() {
  return new NextResponse("Sinal IPTV Desativado. Use o App Web Oficial.", { status: 404 });
}
