import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { cn } from '@/lib/utils';
import { FirebaseClientProvider } from '@/firebase';

export const metadata: Metadata = {
  title: 'Léo TV & Stream',
  description: 'Sua plataforma de streaming de vídeo aprimorada.',
  manifest: '/manifest.json'
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
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <meta name="theme-color" content="#1a1a2e" />
      </head>
      <body className={cn("font-sans antialiased")} suppressHydrationWarning>
        <FirebaseClientProvider>
          {children}
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
