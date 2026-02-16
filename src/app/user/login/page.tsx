'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authFirebase } from '@/lib/authFirebase';

export default function UserLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await authFirebase.loginUser(email, password);
      
      if (result.success) {
        router.push('/user/dashboard');
      } else {
        setError(result.error || 'Erro ao fazer login');
      }
    } catch (err) {
      setError('Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-gray-800 rounded-lg shadow-2xl p-8 border border-gray-700">
          <h1 className="text-3xl font-bold text-center mb-2 text-cyan-400">LeoTV</h1>
          <p className="text-center text-gray-400 mb-8">Streaming de Conteúdo</p>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-cyan-400 transition"
                placeholder="seu@email.com"
                disabled={loading}
                required
              />
            </div>

            <div>
              <label className="block text-gray-300 text-sm font-medium mb-2">Senha</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-cyan-400 transition"
                placeholder="Sua senha"
                disabled={loading}
                required
              />
            </div>

            {error && (
              <div className="bg-red-900/30 border border-red-600 text-red-400 px-4 py-2 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-cyan-600 hover:bg-cyan-700 disabled:bg-gray-600 text-white font-semibold py-2 rounded-lg transition"
            >
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
