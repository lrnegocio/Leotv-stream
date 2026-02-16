'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase';
import { authFirebase } from '@/lib/authFirebase';
import { collection, getDocs } from 'firebase/firestore';

interface Content {
  id: string;
  title: string;
  description: string;
  url: string;
  type: 'video' | 'stream';
}

export default function UserDashboard() {
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(true);
  const [contents, setContents] = useState<Content[]>([]);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = authFirebase.onAuthStateChanged(async (user) => {
      if (!user) {
        router.push('/user/login');
        return;
      }

      const userDoc = await (async () => {
        const { getDoc, doc } = await import('firebase/firestore');
        return await getDoc(doc(db, 'users', user.uid));
      })();

      if (!userDoc?.exists?.()) {
        router.push('/user/login');
        return;
      }

      setUsername(userDoc?.data?.()?.username || '');
      loadContents();
      setLoading(false);
    });

    return () => unsubscribe();
  }, [router]);

  const loadContents = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'contents'));
      const data = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Content[];
      setContents(data);
    } catch (error) {
      console.error('Erro ao carregar conteúdo:', error);
    }
  };

  const handleLogout = async () => {
    await authFirebase.logout();
    router.push('/user/login');
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-900 flex items-center justify-center text-white">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <nav className="bg-gray-800 border-b border-gray-700 p-4 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-cyan-400">LeoTV - Streaming</h1>
        <button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition"
        >
          Sair
        </button>
      </nav>

      <div className="p-8">
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-2">Bem-vindo, {username}!</h2>
          <p className="text-gray-400">Confira nosso conteúdo exclusivo.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {contents.map((content) => (
            <div key={content.id} className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-cyan-400 transition">
              <div className="bg-gray-700 h-40 flex items-center justify-center">
                <span className="text-gray-500">📺 {content.type === 'stream' ? 'AO VIVO' : 'VÍDEO'}</span>
              </div>
              <div className="p-4">
                <h3 className="font-semibold mb-2">{content.title}</h3>
                <p className="text-gray-400 text-sm mb-4">{content.description}</p>
                <a
                  href={content.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-cyan-600 hover:bg-cyan-700 text-white py-2 rounded-lg transition block text-center"
                >
                  Assistir
                </a>
              </div>
            </div>
          ))}
        </div>

        {contents.length === 0 && (
          <div className="text-center text-gray-400 py-12">
            <p>Nenhum conteúdo disponível no momento.</p>
          </div>
        )}
      </div>
    </div>
  );
}
