import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { OfflineIndicator } from '@/components/offline-indicator';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'StreamSight - Plataforma de Streaming Inteligente',
  description: 'Acesse seus canais, filmes e séries com a melhor tecnologia de streaming.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: 'https://picsum.photos/seed/streamsight/32/32', sizes: '32x32' },
      { url: 'https://picsum.photos/seed/streamsight/192/192', sizes: '192x192' }
    ],
    apple: 'https://picsum.photos/seed/streamsight/192/192',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'StreamSight',
  },
};

export const viewport: Viewport = {
  themeColor: '#6D2DCC',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <meta httpEquiv="Content-Security-Policy" content="default-src * 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; img-src * 'self' data: blob:; media-src * 'self' data: blob:; frame-src * 'self' data: blob:;" />
        <style dangerouslySetInnerHTML={{ __html: `
          iframe {
            pointer-events: auto !important;
          }
          .adsbygoogle, .ad-unit, [id*="google_ads_iframe"], .floating-ad, 
          [class*="ad-"], [id*="ad-"], .pop-under, .overlay-ads {
            display: none !important;
            visibility: hidden !important;
            height: 0 !important;
            opacity: 0 !important;
          }
        `}} />
      </head>
      <body className="font-body antialiased bg-background text-foreground select-none overflow-x-hidden">
        <SecurityBlocker />
        {children}
        <Toaster />
        <OfflineIndicator />
        <Script src="https://cdn.jsdelivr.net/npm/hls.js@latest" strategy="beforeInteractive" />
      </body>
    </html>
  );
}

function SecurityBlocker() {
  return (
    <script dangerouslySetInnerHTML={{ __html: `
      (function() {
        const isLocal = window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1';
        
        if (isLocal) return;

        document.addEventListener('contextmenu', e => e.preventDefault());
        document.addEventListener('keydown', e => {
          if (
            e.key === 'F12' || 
            (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) || 
            (e.ctrlKey && e.key === 'u') ||
            (e.metaKey && e.altKey && e.key === 'i')
          ) {
            e.preventDefault();
            return false;
          }
        });
      })();
    `}} />
  );
}