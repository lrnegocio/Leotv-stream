import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { OfflineIndicator } from '@/components/offline-indicator';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'Léo TV Stream - O Sinal Master v370',
  description: 'Acesse seus canais, filmes e séries com a melhor tecnologia de streaming do Mestre Léo.',
  manifest: '/manifest.webmanifest',
  icons: {
    icon: [
      { url: 'https://picsum.photos/seed/leotv/32/32', sizes: '32x32' },
      { url: 'https://picsum.photos/seed/leotv/192/192', sizes: '192x192' }
    ],
    apple: 'https://picsum.photos/seed/leotv/192/192',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Léo TV Stream',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'application-name': 'Léo TV',
    'msapplication-TileColor': '#6D2DCC',
    'theme-color': '#6D2DCC',
    'tv-app-capable': 'yes',
    'handheldfriendly': 'true',
  }
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
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet" />
        <meta httpEquiv="Content-Security-Policy" content="default-src * 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; img-src * 'self' data: blob:; media-src * 'self' data: blob:; frame-src * 'self' data: blob:;" />
        <style dangerouslySetInnerHTML={{ __html: `
          /* SEGURANÇA DIAMANTE v370-S: BLOQUEIO TOTAL */
          body {
            -webkit-user-select: none !important;
            -moz-user-select: none !important;
            -ms-user-select: none !important;
            user-select: none !important;
            -webkit-touch-callout: none !important;
          }
          img { pointer-events: none !important; }

          /* Limpeza de overlays externos */
          .cf-error-details, #cf-error-details, .cf-browser-verification,
          [id*="cf-"], [class*="cf-"], .ads-wrapper, .ad-overlay, 
          .reidoscanais-ads, #over-video {
            display: none !important;
            visibility: hidden !important;
            opacity: 0 !important;
          }
        `}} />
        <script dangerouslySetInnerHTML={{ __html: `
          /* BLOQUEIO DE MODO DESENVOLVEDOR v370-S */
          (function() {
            if (typeof window === 'undefined') return;
            
            // Bloqueia botão direito
            document.addEventListener('contextmenu', function(e) { e.preventDefault(); return false; });
            
            // Bloqueia atalhos de teclado
            document.addEventListener('keydown', function(e) {
              if (
                e.keyCode == 123 || // F12
                (e.ctrlKey && e.shiftKey && (e.keyCode == 73 || e.keyCode == 74 || e.keyCode == 67)) || // Ctrl+Shift+I/J/C
                (e.ctrlKey && (e.keyCode == 85 || e.keyCode == 83)) // Ctrl+U/S
              ) {
                e.preventDefault();
                return false;
              }
            });

            // Detecta abertura do console por redimensionamento
            let checkStatus = false;
            const element = new Image();
            Object.defineProperty(element, 'id', {
              get: function() { checkStatus = true; }
            });
            setInterval(function() {
              checkStatus = false;
              console.log(element);
              if(checkStatus) {
                window.location.href = "about:blank";
              }
            }, 1000);
          })();
        `}} />
      </head>
      <body className="font-body antialiased bg-background text-foreground overflow-x-hidden">
        {children}
        <Toaster />
        <OfflineIndicator />
        <Script src="https://cdn.jsdelivr.net/npm/hls.js@latest" strategy="afterInteractive" />
        <Script src="https://cdn.jsdelivr.net/npm/mpegts.js@latest/dist/mpegts.min.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}