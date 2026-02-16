'use client';

import { useEffect } from 'react';

export default function RegisterSW() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => console.log('✅ SW registrado:', registration.scope))
        .catch((error) => console.log('❌ SW falhou:', error));
    }
  }, []);

  return null;
}
