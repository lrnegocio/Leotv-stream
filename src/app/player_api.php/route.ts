import { NextResponse } from 'next/server';

/**
 * IPTV API DESATIVADA v62 - FOCO EXCLUSIVO PWA
 */
export async function GET() {
  return NextResponse.json({ error: "O suporte a apps de IPTV foi descontinuado. Use o Web App oficial." }, { status: 403 });
}
