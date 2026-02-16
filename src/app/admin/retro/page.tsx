'use client';

export const dynamic = "force-dynamic";

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Trash2, Plus, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface RetroGame {
  id: string;
  name: string;
  console: string;
  downloadUrl: string;
  fileSize: string;
}

const CONSOLES = ['Nintendo', 'SNES', 'Mega Drive', 'Mame', 'PSP', 'PS1', 'PS2', 'PS3', 'Xbox', 'Xbox 360', 'Wii'];

export default function AdminRetroGames() {
  const router = useRouter();
  const [games, setGames] = useState<RetroGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    console: '',
    downloadUrl: '',
    fileSize: '',
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const adminId = localStorage.getItem('adminId');
    if (!adminId) {
      router.push('/admin/login');
      return;
    }
    loadGames();
  }, [router]);

  const loadGames = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'retro_games'));
      const gamesList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as RetroGame[];
      setGames(gamesList);
    } catch (error) {
      console.error('Erro ao carregar jogos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.console || !formData.downloadUrl || !formData.fileSize) {
      alert('Preencha todos os campos!');
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'retro_games'), formData);
      alert('Jogo adicionado com sucesso!');
      setFormData({ name: '', console: '', downloadUrl: '', fileSize: '' });
      loadGames();
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao adicionar jogo');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteGame = async (gameId: string) => {
    if (!confirm('Tem certeza?')) return;
    
    try {
      await deleteDoc(doc(db, 'retro_games', gameId));
      loadGames();
    } catch (error) {
      console.error('Erro ao deletar:', error);
      alert('Erro ao deletar jogo');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminId');
    router.push('/admin/login');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <p className="text-white text-xl">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <header className="bg-black/50 backdrop-blur border-b border-purple-500 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">🎮 Admin - Retro Games</h1>
          <div className="flex gap-2">
            <Button onClick={() => router.push('/admin/dashboard')} className="bg-purple-600 hover:bg-purple-700">
              Dashboard
            </Button>
            <Button onClick={handleLogout} variant="destructive">
              <LogOut className="mr-2 h-5 w-5" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gray-800 border-2 border-purple-500 rounded-lg p-6">
            <h2 className="text-2xl font-bold text-white mb-4">Adicionar Novo Jogo</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-white block mb-2">Nome do Jogo:</label>
                <Input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-gray-700 text-white border-purple-500"
                  placeholder="Ex: Super Mario Bros"
                  required
                />
              </div>

              <div>
                <label className="text-white block mb-2">Console:</label>
                <select
                  value={formData.console}
                  onChange={(e) => setFormData({ ...formData, console: e.target.value })}
                  className="w-full bg-gray-700 text-white border-2 border-purple-500 rounded p-2"
                  required
                >
                  <option value="">Selecione um console</option>
                  {CONSOLES.map(console => (
                    <option key={console} value={console}>{console}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-white block mb-2">URL de Download (Magnet ou Link direto):</label>
                <Input
                  type="text"
                  value={formData.downloadUrl}
                  onChange={(e) => setFormData({ ...formData, downloadUrl: e.target.value })}
                  className="bg-gray-700 text-white border-purple-500"
                  placeholder="magnet:?xt=urn:btih:... ou https://..."
                  required
                />
              </div>

              <div>
                <label className="text-white block mb-2">Tamanho do Arquivo:</label>
                <Input
                  type="text"
                  value={formData.fileSize}
                  onChange={(e) => setFormData({ ...formData, fileSize: e.target.value })}
                  className="bg-gray-700 text-white border-purple-500"
                  placeholder="Ex: 50MB, 1.2GB, 2.5GB"
                  required
                />
              </div>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Plus className="mr-2 h-5 w-5" />
                {submitting ? 'Adicionando...' : 'Adicionar Jogo'}
              </Button>
            </form>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-white mb-4">Jogos Cadastrados ({games.length})</h2>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {games.length === 0 ? (
                <p className="text-gray-400 text-center py-8">Nenhum jogo cadastrado ainda</p>
              ) : (
                games.map(game => (
                  <Card key={game.id} className="bg-gray-800 border-purple-500">
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1">
                          <p className="text-white font-semibold">{game.name}</p>
                          <p className="text-purple-300 text-sm">{game.console}</p>
                          <p className="text-gray-400 text-xs">{game.fileSize}</p>
                          <p className="text-gray-500 text-xs truncate mt-1">{game.downloadUrl}</p>
                        </div>
                        <Button
                          onClick={() => handleDeleteGame(game.id)}
                          className="bg-red-600 hover:bg-red-700 p-2 flex-shrink-0"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
