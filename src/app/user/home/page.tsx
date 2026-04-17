'use client';

import * as React from 'react';
import { Suspense } from 'react';
import HomeContent from '@/components/home-content';
import { Loader2 } from 'lucide-react';
import { PwaInstall } from '@/components/pwa-install';

export default function HomePage() {
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  // Blindagem Master: Se não estiver montado, renderiza um fundo neutro 
  // que combina com o servidor para evitar erro de Hydration na TV.
  if (!isMounted) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
    </div>
  );

  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    }>
      <PwaInstall />
      <HomeContent />
    </Suspense>
  );
}
