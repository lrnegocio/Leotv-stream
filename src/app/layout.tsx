
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from '@/components/ui/toaster';
import { OfflineIndicator } from '@/components/offline-indicator';
import Script from 'next/script';

export const metadata: Metadata = {
  title: 'Léo Tv & Stream',
  description: 'Plataforma de streaming P2P Master de alta performance',
  manifest: '/manifest.json',
  themeColor: '#1E161D',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Léo Tv',
  },
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0, viewport-fit=cover" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="theme-color" content="#1E161D" />
        <link rel="apple-touch-icon" href="https://picsum.photos/seed/leo/192/192" />
        {/* POLÍTICA DE SEGURANÇA MESTRE: Permite que o túnel sintonize sinais HTTP de forma transparente */}
        <meta httpEquiv="Content-Security-Policy" content="default-src * 'self' 'unsafe-inline' 'unsafe-eval' data: blob:; img-src * 'self' data: blob:; media-src * 'self' data: blob:; frame-src * 'self' data: blob:;" />
      </head>
      <body className="font-body antialiased bg-background text-foreground select-none">
        {children}
        <Toaster />
        <OfflineIndicator />
        {/* MOTORES DE SINAL MESTRE LÉO TV */}
        <Script src="https://cdn.jsdelivr.net/npm/hls.js@latest" strategy="beforeInteractive" />
        <Script src="https://cdn.jsdelivr.net/npm/mpegts.js@latest/dist/mpegts.min.js" strategy="beforeInteractive" />
      </body>
    </html>
  );
}
