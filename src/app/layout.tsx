
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { OfflineIndicator } from '@/components/offline-indicator';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'Léo TV Stream - O Sinal Master',
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
          /* PROTOCOLO BRAVE SUPREMO v281 - EXTERMINADOR DE OVERLAYS E POPUPS */
          
          /* Esconde avisos de sandbox e bloqueios do site original */
          .aviso-sandbox, #aviso-bloqueio, .reidoscanais-alerta, 
          .aviso-sandbox-container, [class*="reidoscanais-premium"],
          .sandbox-warning, #sandbox-notice, [id*="aviso-sandbox"] {
            display: none !important;
            visibility: hidden !important;
            pointer-events: none !important;
          }

          /* Hole-punch em anúncios invisíveis de players como PlayCNVS e Rei dos Canais */
          /* Isso deleta as camadas que abrem novas abas no clique */
          .ads-wrapper, .video-overlay, .ad-overlay, .overlay-ads,
          .ad-layer, .click-to-play, #click-to-play-overlay,
          [id*="ad-"], [class*="ad-"], .pop-under, .mgid-ad, 
          .ad-container, .reidoscanais-ads, #over-video,
          .vjs-overlay, .player-poster, .click-to-start {
            display: none !important;
            opacity: 0 !important;
            pointer-events: none !important;
            z-index: -1 !important;
          }

          /* Garante que o botão de play original fique visível mas atrás dos nossos comandos */
          .vjs-big-play-button, .vjs-big-play-centered, .play-button {
            opacity: 0.1 !important;
            pointer-events: auto !important;
            z-index: 5 !important;
          }

          /* Bloqueio de redirecionamentos e downloads indesejados */
          [href*="opera.com"], [href*="browser"], .download-button {
            display: none !important;
          }

          body { -webkit-tap-highlight-color: transparent; }
          @media all and (display-mode: standalone) {
            body { padding-top: env(safe-area-inset-top); }
          }
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
