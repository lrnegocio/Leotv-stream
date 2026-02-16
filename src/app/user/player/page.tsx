'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { Suspense } from 'react';

function PlayerContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const url = searchParams.get('url');
  const name = searchParams.get('name');

  if (!url) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-white text-xl mb-4">URL inválida</p>
          <Button onClick={() => router.back()} className="bg-purple-600 hover:bg-purple-700">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black">
      <div className="fixed top-4 left-4 z-50">
        <Button onClick={() => router.back()} className="bg-purple-600 hover:bg-purple-700">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>
      </div>

      <div className="flex items-center justify-center min-h-screen">
        <div className="w-full h-screen">
          <iframe
            src={url}
            title={name || 'Player'}
            width="100%"
            height="100%"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            style={{ border: 'none' }}
          />
        </div>
      </div>
    </div>
  );
}

export default function PlayerPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><p className="text-white">Carregando...</p></div>}>
      <PlayerContent />
    </Suspense>
  );
}
