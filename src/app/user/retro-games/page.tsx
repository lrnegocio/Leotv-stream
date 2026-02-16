'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Gamepad2 } from 'lucide-react';
import Link from 'next/link';

interface RetroGame {
  id: string;
  name: string;
  console: string;
  image: string;
  emulator: string;
}

export default function RetroGamesPage() {
  const router = useRouter();
  const [games, setGames] = useState<RetroGame[]>([]);

  const RETRO_GAMES: RetroGame[] = [
    { id: '1', name: 'Super Mario Bros', console: 'NES', image: '🎮', emulator: 'nes' },
    { id: '2', name: 'The Legend of Zelda', console: 'NES', image: '🎮', emulator: 'nes' },
    { id: '3', name: 'Donkey Kong', console: 'NES', image: '🎮', emulator: 'nes' },
    { id: '4', name: 'Sonic the Hedgehog', console: 'Genesis', image: '🎮', emulator: 'genesis' },
    { id: '5', name: 'Mega Man', console: 'NES', image: '🎮', emulator: 'nes' },
    { id: '6', name: 'Pac-Man', console: 'Arcade', image: '🕹️', emulator: 'arcade' },
    { id: '7', name: 'Street Fighter II', console: 'SNES', image: '🎮', emulator: 'snes' },
    { id: '8', name: 'Final Fantasy', console: 'NES', image: '🎮', emulator: 'nes' },
    { id: '9', name: 'Castlevania', console: 'NES', image: '🎮', emulator: 'nes' },
    { id: '10', name: 'Contra', console: 'NES', image: '🎮', emulator: 'nes' },
    { id: '11', name: 'Metal Gear', console: 'NES', image: '🎮', emulator: 'nes' },
    { id: '12', name: 'Double Dragon', console: 'NES', image: '🎮', emulator: 'nes' },
  ];

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      router.push('/user/login');
      return;
    }
    setGames(RETRO_GAMES);
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <header className="bg-black/50 backdrop-blur border-b border-purple-500 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Gamepad2 className="h-8 w-8" />
            Jogos Retrô
          </h1>
          <Link href="/user/dashboard">
            <Button className="bg-purple-600 hover:bg-purple-700">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {games.map(game => (
            <Card key={game.id} className="bg-gray-800 border-purple-500 hover:border-purple-400 transition cursor-pointer">
              <CardContent className="p-4 text-center">
                <div className="text-4xl mb-3">{game.image}</div>
                <h3 className="text-white font-bold text-sm mb-1">{game.name}</h3>
                <p className="text-purple-300 text-xs mb-3">{game.console}</p>
                <Button className="w-full bg-purple-600 hover:bg-purple-700 text-xs" disabled>
                  Em Breve
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
