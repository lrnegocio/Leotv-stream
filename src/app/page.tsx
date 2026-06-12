
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Redirecionamento forçado para garantir que o IP abra o sistema
    router.push('/login');
  }, [router]);

  return (
    <div className="min-h-screen bg-[#0A051A] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="text-primary font-black uppercase italic tracking-widest text-xs">
          Sintonizando Léo TV v385-S...
        </p>
      </div>
    </div>
  );
}
