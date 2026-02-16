'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, RotateCcw, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface UserData {
  id: string;
  username: string;
  email: string;
  accessType?: string;
  expiresAt?: string;
  maxSimultaneousLogins?: number;
  createdAt?: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'active' | 'expired'>('all');

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'users'));
      const usersList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as UserData[];

      setUsers(usersList.sort((a, b) => {
        const dateA = new Date(a.createdAt || '').getTime();
        const dateB = new Date(b.createdAt || '').getTime();
        return dateB - dateA;
      }));
    } catch (error) {
      console.error('Erro ao carregar usuarios:', error);
    } finally {
      setLoading(false);
    }
  };

  const isExpired = (user: UserData): boolean => {
    if (!user.expiresAt) return false;
    const expiresAt = new Date(user.expiresAt).getTime();
    const now = new Date().getTime();
    return now > expiresAt;
  };

  const getAccessStatus = (user: UserData) => {
    if (!user.accessType) return 'Livre';
    if (isExpired(user)) return 'EXPIRADO';
    return 'Ativo';
  };

  const handleRenewAccess = async (userId: string) => {
    const months = parseInt(prompt('Renovar por quantos meses?') || '1');
    if (isNaN(months) || months < 1) return;

    try {
      const expiresAt = new Date();
      expiresAt.setMonth(expiresAt.getMonth() + months);

      await updateDoc(doc(db, 'users', userId), {
        expiresAt: expiresAt.toISOString(),
      });

      alert('Acesso renovado com sucesso!');
      loadUsers();
    } catch (error) {
      console.error('Erro ao renovar:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm('Tem certeza que deseja deletar este usuario?')) {
      try {
        await deleteDoc(doc(db, 'users', userId));
        alert('Usuario deletado!');
        loadUsers();
      } catch (error) {
        console.error('Erro ao deletar:', error);
      }
    }
  };

  const handleResetSessions = async (userId: string) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        activeSessions: {},
      });
      alert('Sessoes resetadas!');
      loadUsers();
    } catch (error) {
      console.error('Erro ao resetar:', error);
    }
  };

  const filteredUsers = users.filter(user => {
    if (filter === 'expired') return isExpired(user);
    if (filter === 'active') return !isExpired(user) && user.accessType;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center">
        <p className="text-white text-xl">Carregando usuarios...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin/dashboard">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-5 w-5" />
              Voltar
            </Button>
          </Link>
          <h1 className="text-4xl font-bold text-white">Gerenciar Usuarios</h1>
        </div>

        <div className="flex gap-2 mb-6">
          <Button
            onClick={() => setFilter('all')}
            className={filter === 'all' ? 'bg-purple-600' : 'bg-gray-700'}
          >
            Todos ({users.length})
          </Button>
          <Button
            onClick={() => setFilter('active')}
            className={filter === 'active' ? 'bg-green-600' : 'bg-gray-700'}
          >
            Ativos ({users.filter(u => !isExpired(u) && u.accessType).length})
          </Button>
          <Button
            onClick={() => setFilter('expired')}
            className={filter === 'expired' ? 'bg-red-600' : 'bg-gray-700'}
          >
            Expirados ({users.filter(u => isExpired(u)).length})
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredUsers.map(user => (
            <Card
              key={user.id}
              className={`border-2 ${
                isExpired(user)
                  ? 'bg-red-900/20 border-red-500'
                  : 'bg-gray-800 border-purple-500'
              }`}
            >
              <CardHeader>
                <CardTitle className="text-white text-lg flex justify-between items-start">
                  <span>{user.username}</span>
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      isExpired(user)
                        ? 'bg-red-600 text-white'
                        : user.accessType
                          ? 'bg-green-600 text-white'
                          : 'bg-gray-600 text-white'
                    }`}
                  >
                    {getAccessStatus(user)}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <p className="text-gray-400 text-sm">Email:</p>
                  <p className="text-white break-all">{user.email}</p>
                </div>

                {user.accessType && (
                  <>
                    <div>
                      <p className="text-gray-400 text-sm">Plano:</p>
                      <p className="text-white">{user.accessType}</p>
                    </div>

                    <div>
                      <p className="text-gray-400 text-sm">Expira em:</p>
                      <p
                        className={`${
                          isExpired(user) ? 'text-red-400' : 'text-green-400'
                        }`}
                      >
                        {user.expiresAt
                          ? new Date(user.expiresAt).toLocaleDateString('pt-BR')
                          : 'N/A'}
                      </p>
                    </div>
                  </>
                )}

                <div>
                  <p className="text-gray-400 text-sm">Criado em:</p>
                  <p className="text-white text-xs">
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString('pt-BR')
                      : 'N/A'}
                  </p>
                </div>

                <div className="flex gap-2 pt-4 border-t border-gray-700">
                  {isExpired(user) && (
                    <Button
                      onClick={() => handleRenewAccess(user.id)}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Renovar
                    </Button>
                  )}
                  <Button
                    onClick={() => handleResetSessions(user.id)}
                    className="flex-1 bg-blue-600 hover:bg-blue-700"
                  >
                    Reset Sessoes
                  </Button>
                  <Button
                    onClick={() => handleDeleteUser(user.id)}
                    variant="destructive"
                    className="flex-1"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Deletar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredUsers.length === 0 && (
          <div className="text-center text-gray-400 py-12">
            <p className="text-lg">Nenhum usuario encontrado neste filtro</p>
          </div>
        )}
      </div>
    </div>
  );
}
