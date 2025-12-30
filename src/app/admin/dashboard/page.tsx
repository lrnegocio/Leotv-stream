"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Trash2, Edit, PlusCircle, CheckCircle, XCircle } from 'lucide-react';

type User = {
  id: string;
  name: string;
  username: string;
  status: 'active' | 'expired' | 'blocked';
  expiresAt: string;
};

type Channel = {
    id: string;
    name: string;
    category: string;
    url: string;
}

// Mock data - to be replaced with Firebase
const mockUsers: User[] = [
    { id: '1', name: 'Usuário Teste 1', username: 'teste1', status: 'active', expiresAt: '2024-12-31' },
    { id: '2', name: 'Usuário Bloqueado', username: 'bloqueado', status: 'blocked', expiresAt: '2025-01-15' },
    { id: '3', name: 'Usuário Expirado', username: 'expirado', status: 'expired', expiresAt: '2024-01-01' },
];

const mockChannels: Channel[] = [
    {id: '1', name: 'Canal Aberto 1', category: 'Abertos', url: 'https://www.youtube.com/watch?v=z4ZZhEw0JA0'},
    {id: '2', name: 'Filme Ação 1', category: 'Filmes', url: 'https://www.youtube.com/watch?v=z4ZZhEw0JA0'},
    {id: '3', name: 'Série Exemplo T1 E1', category: 'Séries', url: 'https://www.youtube.com/watch?v=z4ZZhEw0JA0'},
];

const statusConfig = {
    active: { text: 'Ativo', icon: <CheckCircle className="text-green-400" />, className: "status-active" },
    expired: { text: 'Expirado', icon: <XCircle className="text-red-400" />, className: "status-expired" },
    blocked: { text: 'Bloqueado', icon: <XCircle className="text-yellow-400" />, className: "status-blocked" },
};

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('users');

  return (
    <div className="admin-container">
      <aside className="admin-sidebar">
        <h2 className="login-title">Admin</h2>
        <nav className="flex flex-col gap-2 mt-8">
            <Button variant={activeTab === 'users' ? 'secondary' : 'ghost'} onClick={() => setActiveTab('users')} className="justify-start">👤 Usuários</Button>
            <Button variant={activeTab === 'channels' ? 'secondary' : 'ghost'} onClick={() => setActiveTab('channels')} className="justify-start">📺 Canais e Séries</Button>
            <Button variant={activeTab === 'settings' ? 'secondary' : 'ghost'} onClick={() => setActiveTab('settings')} className="justify-start">⚙️ Configurações</Button>
        </nav>
        <div className="mt-auto">
            <Button variant="destructive" className="w-full">Sair</Button>
        </div>
      </aside>
      <main className="admin-content">
        {activeTab === 'users' && <UsersTab />}
        {activeTab === 'channels' && <ChannelsTab />}
        {activeTab === 'settings' && <SettingsTab />}
      </main>
    </div>
  );
}

function UsersTab() {
    const [users, setUsers] = useState(mockUsers);
    
    const handleUnblock = (userId: string) => {
        setUsers(users.map(u => u.id === userId ? {...u, status: 'active'} : u));
        // Show toast notification
    }

    return (
        <div>
            <div className="admin-header">
                <h1 className="admin-title">Gerenciar Usuários</h1>
                <Button><PlusCircle className="mr-2 h-4 w-4" /> Adicionar Usuário</Button>
            </div>
            <div className="table-container">
                <table className="w-full">
                    <thead>
                        <tr className="text-left">
                            <th className="p-4">Nome</th>
                            <th className="p-4">Usuário</th>
                            <th className="p-4">Expira em</th>
                            <th className="p-4">Status</th>
                            <th className="p-4">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id} className="border-b border-border">
                                <td className="p-4">{user.name}</td>
                                <td className="p-4">{user.username}</td>
                                <td className="p-4">{new Date(user.expiresAt).toLocaleDateString()}</td>
                                <td className="p-4">
                                    <span className={`status-badge ${statusConfig[user.status].className}`}>
                                        {statusConfig[user.status].text}
                                    </span>
                                </td>
                                <td className="p-4 flex items-center gap-2">
                                    <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
                                    {user.status === 'blocked' && (
                                        <Button variant="outline" size="sm" onClick={() => handleUnblock(user.id)}>Desbloquear</Button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function ChannelsTab() {
    return (
        <div>
            <div className="admin-header">
                <h1 className="admin-title">Gerenciar Conteúdo</h1>
                 <Button><PlusCircle className="mr-2 h-4 w-4" /> Adicionar Conteúdo</Button>
            </div>
            <p className="text-muted-foreground mb-4">Adicione e gerencie canais, filmes, séries e episódios.</p>
            {/* Placeholder for channel management UI */}
             <div className="table-container">
                <table className="w-full">
                    <thead>
                        <tr className="text-left">
                            <th className="p-4">Nome</th>
                            <th className="p-4">Categoria</th>
                            <th className="p-4">URL</th>
                            <th className="p-4">Ações</th>
                        </tr>
                    </thead>
                     <tbody>
                        {mockChannels.map(channel => (
                            <tr key={channel.id} className="border-b border-border">
                                <td className="p-4">{channel.name}</td>
                                <td className="p-4">{channel.category}</td>
                                <td className="p-4 truncate max-w-xs">{channel.url}</td>
                                <td className="p-4 flex items-center gap-2">
                                    <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" className="text-red-500"><Trash2 className="h-4 w-4" /></Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function SettingsTab() {
    return (
        <div>
            <div className="admin-header">
                <h1 className="admin-title">Configurações</h1>
            </div>
            <div className="space-y-8 max-w-2xl">
                <div className="p-6 bg-card rounded-lg border">
                    <h3 className="text-lg font-semibold mb-2">Senha para Conteúdo Adulto</h3>
                    <p className="text-muted-foreground mb-4">Defina uma senha para proteger o acesso a canais marcados como conteúdo adulto.</p>
                    <div className="flex gap-4">
                        <Input type="password" placeholder="Nova senha" />
                        <Button>Salvar Senha</Button>
                    </div>
                </div>
                 <div className="p-6 bg-card rounded-lg border">
                    <h3 className="text-lg font-semibold mb-2">Link do APK</h3>
                    <p className="text-muted-foreground mb-4">URL para o arquivo .apk que aparecerá na tela de login.</p>
                    <div className="flex gap-4">
                        <Input defaultValue="http://179.0.178.146/leotv.apk" />
                        <Button>Salvar URL</Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
