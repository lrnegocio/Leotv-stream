"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Edit, PlusCircle, CheckCircle, XCircle, Play, Upload } from 'lucide-react';

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
            <Button variant={activeTab === 'channels' ? 'secondary' : 'ghost'} onClick={() => setActiveTab('channels')} className="justify-start">📺 Conteúdo</Button>
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
        // TODO: Show toast notification
    }

    const handleBlock = (userId: string) => {
        setUsers(users.map(u => u.id === userId ? {...u, status: 'blocked'} : u));
        // TODO: Show toast notification
    }

    return (
        <div>
            <div className="admin-header">
                <h1 className="admin-title">Gerenciar Usuários</h1>
                <Button disabled><PlusCircle className="mr-2 h-4 w-4" /> Adicionar Usuário</Button>
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
                                    <Button variant="ghost" size="icon" disabled><Edit className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" className="text-red-500" disabled><Trash2 className="h-4 w-4" /></Button>
                                    {user.status === 'blocked' ? (
                                        <Button variant="outline" size="sm" onClick={() => handleUnblock(user.id)}>Desbloquear</Button>
                                    ) : (
                                        <Button variant="outline" size="sm" variant="destructive" onClick={() => handleBlock(user.id)}>Bloquear</Button>
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
                 <Button disabled><PlusCircle className="mr-2 h-4 w-4" /> Adicionar Conteúdo</Button>
            </div>
            <p className="text-muted-foreground mb-4">Adicione e gerencie canais, filmes, séries e episódios.</p>
             <div className="table-container">
                <table className="w-full">
                    <thead>
                        <tr className="text-left">
                            <th className="p-4">Nome</th>
                            <th className="p-4">Categoria</th>
                            <th className="p-4">Ações</th>
                        </tr>
                    </thead>
                     <tbody>
                        {mockChannels.map(channel => (
                            <tr key={channel.id} className="border-b border-border">
                                <td className="p-4">{channel.name}</td>
                                <td className="p-4">{channel.category}</td>
                                <td className="p-4 flex items-center gap-2">
                                    <Button variant="ghost" size="icon" disabled><Play className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" disabled><Edit className="h-4 w-4" /></Button>
                                    <Button variant="ghost" size="icon" className="text-red-500" disabled><Trash2 className="h-4 w-4" /></Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
             <div className="p-6 bg-card rounded-lg border mt-8">
                <h3 className="text-lg font-semibold mb-2">Adicionar Conteúdo</h3>
                 <form className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="channel-name">Nome do Conteúdo</Label>
                            <Input id="channel-name" placeholder="Ex: Filme Ação" disabled />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="channel-category">Categoria</Label>
                            <Input id="channel-category" placeholder="Ex: Filmes" disabled />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="channel-url">URL do Conteúdo</Label>
                        <Input id="channel-url" placeholder="https://..." disabled/>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox id="is-adult" disabled/>
                        <Label htmlFor="is-adult">Conteúdo Adulto (+18)</Label>
                    </div>
                    <Button type="submit" disabled>Adicionar</Button>
                </form>
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
                        <Input type="password" defaultValue="09120415" />
                        <Button>Salvar Senha</Button>
                    </div>
                </div>
                 <div className="p-6 bg-card rounded-lg border">
                    <h3 className="text-lg font-semibold mb-2">Link do APK</h3>
                    <p className="text-muted-foreground mb-4">URL para o arquivo .apk que aparecerá na tela de login. Você também pode fazer o upload de um novo arquivo.</p>
                    <div className="flex items-center gap-4">
                        <Input defaultValue="http://179.0.178.146/leotv.apk" className="flex-grow"/>
                        <Button>Salvar URL</Button>
                    </div>
                     <div className="flex items-center gap-4 mt-4">
                        <Label htmlFor="apk-upload" className="flex-grow">
                             <Button asChild variant="outline">
                                <div className="flex items-center cursor-pointer">
                                    <Upload className="mr-2 h-4 w-4" />
                                    <span>Fazer Upload do APK</span>
                                </div>
                             </Button>
                        </Label>
                        <Input id="apk-upload" type="file" className="hidden" accept=".apk" disabled/>
                    </div>
                </div>
            </div>
        </div>
    );
}
