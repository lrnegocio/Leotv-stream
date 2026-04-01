
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const targetUrl = searchParams.get('url');

  if (!targetUrl) return new NextResponse("Sinal ausente", { status: 400 });

  try {
    const requestHeaders = new Headers();
    const range = req.headers.get('range');
    
    if (range) requestHeaders.set('Range', range);
    
    requestHeaders.set('User-Agent', 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36');
    
    if (targetUrl.includes('phncdn.com') || targetUrl.includes('pornhub.com')) {
      requestHeaders.set('Referer', 'https://www.pornhub.com/');
    } else if (targetUrl.includes('xvideos')) {
      requestHeaders.set('Referer', 'https://www.xvideos.com/');
    } else if (targetUrl.includes('archive.org')) {
      requestHeaders.set('Referer', 'https://archive.org/');
    } else if (targetUrl.includes('rdcanais') || targetUrl.includes('redecanais')) {
      requestHeaders.set('Referer', 'https://redecanaistv.cafe/');
    }

    const res = await fetch(targetUrl, { 
      headers: requestHeaders,
      cache: 'no-store',
      redirect: 'follow'
    });

    const responseHeaders = new Headers();
    const headersToCopy = [
      'content-type', 
      'content-length', 
      'content-range', 
      'accept-ranges', 
      'cache-control'
    ];
    
    headersToCopy.forEach(h => {
      const v = res.headers.get(h);
      if (v) responseHeaders.set(h, v);
    });

    responseHeaders.set('Access-Control-Allow-Origin', '*');

    return new NextResponse(res.body, {
      status: res.status,
      statusText: res.statusText,
      headers: responseHeaders,
    });
  } catch (error) {
    return new NextResponse("Falha de sintonização master", { status: 500 });
  }
}
