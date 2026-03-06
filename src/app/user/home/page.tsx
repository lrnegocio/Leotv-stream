'use client';

import { Suspense } from 'react';
import HomeContent from '@/components/home-content';

export default function HomePage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <HomeContent />
    </Suspense>
  );
}
