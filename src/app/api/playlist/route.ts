import { NextResponse } from 'next/server';

/**
 * PLAYLIST API DESATIVADA v62 - FOCO EXCLUSIVO PWA
 */
export async function GET() {
  return new NextResponse("#EXTM3U\n#EXTINF:-1,IPTV DESATIVADO - USE O WEB APP\n", { 
    status: 403,
    headers: { 'Content-Type': 'application/x-mpegurl' }
  });
}
