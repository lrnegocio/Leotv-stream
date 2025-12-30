
'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Trash2,
  Edit,
  PlusCircle,
  CheckCircle,
  XCircle,
  Play,
  Upload,
  Plus,
} from 'lucide-react';
import {
  useCollection,
  useFirestore,
  useMemoFirebase,
  useUser,
  updateDocumentNonBlocking,
  deleteDocumentNonBlocking,
  addDocumentNonBlocking,
  setDocumentNonBlocking,
} from '@/firebase';
import { collection, doc } from 'firebase/firestore';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { Skeleton } from '@/components/ui/skeleton';

type User = {
  id: string;
  username: string;
  email: string;
  freeTrialExpiry: string;
  isBlocked: boolean;
};

type Channel = {
  id: string;
  name: string;
  category: string;
  url: string;
  type: 'channel' | 'movie' | 'series';
};

const FIREBASE_ADMIN_EMAIL = "admin@example.com";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('users');
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const auth = getAuth();

  useEffect(() => {
    if (!isUserLoading && (!user || user.email !== FIREBASE_ADMIN_EMAIL)) {
      router.replace('/admin/login');
    }
  }, [user, isUserLoading, router]);
  
  const handleLogout = () => {
    auth.signOut().then(() => {
        router.push('/admin/login');
    });
  }

  if (isUserLoading || !user) {
    return (
        <div className="flex items-center justify-center h-screen">
            <div className="space-y-4">
                <Skeleton className="h-8 w-[250px]" />
                <Skeleton className="h-4 w-[200px]" />
            </div>
        </div>
    );
  }

  return (
    <div className="admin-container">
      <aside className="admin-sidebar">
        <h2 className="login-title">Admin</h2>
        <nav className="flex flex-col gap-2 mt-8">
          <Button
            variant={activeTab === 'users' ? 'secondary' : 'ghost'}
            onClick={() => setActiveTab('users')}
            className="justify-start"
          >
            👤 Usuários
          </Button>
          <Button
            variant={activeTab === 'channels' ? 'secondary' : 'ghost'}
            onClick={() => setActiveTab('channels')}
            className="justify-start"
          >
            📺 Conteúdo
          </Button>
          <Button
            variant={activeTab === 'settings' ? 'secondary' : 'ghost'}
            onClick={() => setActiveTab('settings')}
            className="justify-start"
          >
            ⚙️ Configurações
          </Button>
        </nav>
        <div className="mt-auto">
          <Button variant="destructive" className="w-full" onClick={handleLogout}>
            Sair
          </Button>
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

function AddUserDialog({ onUserAdded }: { onUserAdded: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [trialDays, setTrialDays] = useState(7);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const firestore = useFirestore();

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    if (!username || !password) {
      setError('Usuário e senha são obrigatórios.');
      setIsLoading(false);
      return;
    }

    const email = `${username.toLowerCase().replace(/\s/g, '_')}@videoverse.app`;
    const expiryDate = new Date();
    expiryDate.setDate(expiryDate.getDate() + trialDays);

    try {
      // We need a temporary auth instance to create a user, 
      // as we don't want to use the currently logged in admin's auth state for this.
      const tempAuth = getAuth();
      const userCredential = await createUserWithEmailAndPassword(tempAuth, email, password);
      const user = userCredential.user;

      const newUser: Omit<User, 'id'> = {
        username,
        email,
        freeTrialExpiry: expiryDate.toISOString(),
        isBlocked: false,
      };

      // Use setDocumentNonBlocking as we are setting with a specific ID
      setDocumentNonBlocking(doc(firestore, 'users', user.uid), newUser, {});
      
      onUserAdded();
    } catch (err: any) {
      console.error('Error creating user:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Este nome de usuário já está em uso.');
      } else {
        setError('Ocorreu um erro ao criar o usuário.');
      }
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Adicionar Novo Usuário</DialogTitle>
      </DialogHeader>
      <form onSubmit={handleAddUser} className="space-y-4">
        <div>
          <Label htmlFor="new-username">Usuário</Label>
          <Input
            id="new-username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Ex: novo_usuario"
            disabled={isLoading}
          />
        </div>
        <div>
          <Label htmlFor="new-password">Senha</Label>
          <Input
            id="new-password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Senha forte"
            disabled={isLoading}
          />
        </div>
        <div>
          <Label htmlFor="new-trial">Dias de Teste Grátis</Label>
          <Input
            id="new-trial"
            type="number"
            value={trialDays}
            onChange={(e) => setTrialDays(parseInt(e.target.value, 10) || 0)}
            disabled={isLoading}
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isLoading}>
              Cancelar
            </Button>
          </DialogClose>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Adicionando...' : 'Adicionar Usuário'}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  );
}

function UsersTab() {
  const firestore = useFirestore();
  const usersQuery = useMemoFirebase(
    () => (firestore ? collection(firestore, 'users') : null),
    [firestore]
  );
  const { data: users, isLoading } = useCollection<User>(usersQuery);
  const [isAddUserOpen, setAddUserOpen] = useState(false);

  const handleToggleBlock = (user: User) => {
    if (!firestore) return;
    const userRef = doc(firestore, 'users', user.id);
    updateDocumentNonBlocking(userRef, { isBlocked: !user.isBlocked });
  };
  
  const handleDeleteUser = (user: User) => {
    if(!firestore) return;
    if(confirm(`Tem certeza que deseja excluir o usuário ${user.username}? Esta ação não pode ser desfeita.`)) {
        const userRef = doc(firestore, 'users', user.id);
        deleteDocumentNonBlocking(userRef);
        // Note: This does not delete the user from Firebase Auth. 
        // A cloud function would be needed for that.
    }
  }

  const getStatus = (
    user: User
  ): {
    text: string;
    icon: JSX.Element;
    className: string;
  } => {
    if (user.isBlocked) {
      return {
        text: 'Bloqueado',
        icon: <XCircle className="text-yellow-400" />,
        className: 'status-blocked',
      };
    }
    if (new Date(user.freeTrialExpiry) < new Date()) {
      return {
        text: 'Expirado',
        icon: <XCircle className="text-red-400" />,
        className: 'status-expired',
      };
    }
    return {
      text: 'Ativo',
      icon: <CheckCircle className="text-green-400" />,
      className: 'status-active',
    };
  };

  return (
    <div>
      <div className="admin-header">
        <h1 className="admin-title">Gerenciar Usuários</h1>
        <Dialog open={isAddUserOpen} onOpenChange={setAddUserOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Usuário
            </Button>
          </DialogTrigger>
          <AddUserDialog onUserAdded={() => setAddUserOpen(false)} />
        </Dialog>
      </div>
      <div className="table-container">
        <table className="w-full">
          <thead>
            <tr className="text-left">
              <th className="p-4">Usuário</th>
              <th className="p-4">Expira em</th>
              <th className="p-4">Status</th>
              <th className="p-4">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={4} className="p-4 text-center">
                  Carregando usuários...
                </td>
              </tr>
            )}
            {!isLoading && users?.length === 0 && (
              <tr>
                <td colSpan={4} className="p-4 text-center text-muted-foreground">
                  Nenhum usuário encontrado. Adicione um novo para começar.
                </td>
              </tr>
            )}
            {users?.map((user) => {
              const status = getStatus(user);
              return (
                <tr key={user.id} className="border-b border-border">
                  <td className="p-4">{user.username}</td>
                  <td className="p-4">
                    {new Date(user.freeTrialExpiry).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <span className={`status-badge ${status.className}`}>
                      {status.text}
                    </span>
                  </td>
                  <td className="p-4 flex items-center gap-2">
                    <Button variant="ghost" size="icon" disabled>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500"
                      onClick={() => handleDeleteUser(user)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={user.isBlocked ? 'outline' : 'destructive'}
                      size="sm"
                      onClick={() => handleToggleBlock(user)}
                    >
                      {user.isBlocked ? 'Desbloquear' : 'Bloquear'}
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

type ContentType = 'channel' | 'movie' | 'series-episodes' | 'series-seasons';
type Episode = { number: string; url: string };
type Season = { number: string; episodes: Episode[] };

function ChannelsTab() {
  const firestore = useFirestore();
  const channelsQuery = useMemoFirebase(
      () => (firestore ? collection(firestore, 'channels') : null),
      [firestore]
  );
  const { data: channels, isLoading } = useCollection<Channel>(channelsQuery);

  const [contentType, setContentType] = useState<ContentType>('channel');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [url, setUrl] = useState('');
  const [isAdult, setIsAdult] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [episodes, setEpisodes] = useState<Episode[]>([{ number: '1', url: '' }]);
  const [seasons, setSeasons] = useState<Season[]>([{ number: '1', episodes: [{ number: '1', url: '' }] }]);

  const handleAddEpisode = (seasonIndex?: number) => {
      if(seasonIndex !== undefined) {
          const newSeasons = [...seasons];
          newSeasons[seasonIndex].episodes.push({ number: (newSeasons[seasonIndex].episodes.length + 1).toString(), url: '' });
          setSeasons(newSeasons);
      } else {
          setEpisodes([...episodes, { number: (episodes.length + 1).toString(), url: '' }]);
      }
  };
  
  const handleAddSeason = () => {
    setSeasons([...seasons, { number: (seasons.length + 1).toString(), episodes: [{ number: '1', url: '' }] }]);
  }

  const handleRemoveEpisode = (index: number, seasonIndex?: number) => {
    if(seasonIndex !== undefined) {
        const newSeasons = [...seasons];
        if (newSeasons[seasonIndex].episodes.length > 1) {
            newSeasons[seasonIndex].episodes.splice(index, 1);
            setSeasons(newSeasons);
        }
    } else {
        if (episodes.length > 1) {
            setEpisodes(episodes.filter((_, i) => i !== index));
        }
    }
  }

  const handleRemoveSeason = (index: number) => {
    if (seasons.length > 1) {
      setSeasons(seasons.filter((_, i) => i !== index));
    }
  }
  
  const handleEpisodeChange = (value: string, index: number, field: 'number' | 'url', seasonIndex?: number) => {
       if(seasonIndex !== undefined) {
          const newSeasons = [...seasons];
          newSeasons[seasonIndex].episodes[index][field] = value;
          setSeasons(newSeasons);
       } else {
          const newEpisodes = [...episodes];
          newEpisodes[index][field] = value;
          setEpisodes(newEpisodes);
       }
  }

  const handleSeasonChange = (value: string, index: number) => {
      const newSeasons = [...seasons];
      newSeasons[index].number = value;
      setSeasons(newSeasons);
  }

  const resetForm = () => {
      setName('');
      setCategory('');
      setUrl('');
      setIsAdult(false);
      setEpisodes([{ number: '1', url: '' }]);
      setSeasons([{ number: '1', episodes: [{ number: '1', url: '' }] }]);
      setContentType('channel');
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firestore || !name || !category) return;
    setIsSubmitting(true);

    const channelData: any = {
        name,
        category,
        isAdult,
        type: contentType,
        createdAt: new Date().toISOString(),
    };

    try {
        if (contentType === 'channel' || contentType === 'movie') {
            channelData.url = url;
        }

        const channelRef = await addDocumentNonBlocking(collection(firestore, 'channels'), channelData);
        
        if (contentType === 'series-episodes') {
            const episodesCollection = collection(channelRef, 'episodes');
            for(const ep of episodes) {
                // Not using await to allow parallel writes
                addDocumentNonBlocking(episodesCollection, ep);
            }
        } else if (contentType === 'series-seasons') {
            const seasonsCollection = collection(channelRef, 'seasons');
            for(const season of seasons) {
                const seasonRef = await addDocumentNonBlocking(seasonsCollection, { number: season.number });
                const episodesCollection = collection(seasonRef, 'episodes');
                for(const ep of season.episodes) {
                    // Not using await to allow parallel writes
                     addDocumentNonBlocking(episodesCollection, ep);
                }
            }
        }
        
        resetForm();

    } catch (error) {
        console.error("Error adding content: ", error);
    } finally {
        setIsSubmitting(false);
    }
};


  return (
    <div>
      <div className="admin-header">
        <h1 className="admin-title">Gerenciar Conteúdo</h1>
        <Button onClick={() => document.getElementById('add-content-form')?.scrollIntoView({ behavior: 'smooth' })}>
          <PlusCircle className="mr-2 h-4 w-4" /> Adicionar Conteúdo
        </Button>
      </div>
      <p className="text-muted-foreground mb-4">
        Adicione e gerencie canais, filmes, séries e episódios.
      </p>
      <div className="table-container">
        <table className="w-full">
          <thead>
            <tr className="text-left">
              <th className="p-4">Nome</th>
              <th className="p-4">Categoria</th>
              <th className="p-4">Tipo</th>
              <th className="p-4">Ações</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={4} className="p-4 text-center">Carregando...</td>
              </tr>
            )}
            {!isLoading && channels?.map((channel) => (
              <tr key={channel.id} className="border-b border-border">
                <td className="p-4">{channel.name}</td>
                <td className="p-4">{channel.category}</td>
                <td className="p-4">{channel.type}</td>
                <td className="p-4 flex items-center gap-2">
                  <Button variant="ghost" size="icon" disabled>
                    <Play className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" disabled>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-red-500"
                    onClick={() => deleteDocumentNonBlocking(doc(firestore, 'channels', channel.id))}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
             {!isLoading && channels?.length === 0 && (
                <tr>
                    <td colSpan={4} className="p-4 text-center text-muted-foreground">Nenhum conteúdo adicionado ainda.</td>
                </tr>
            )}
          </tbody>
        </table>
      </div>
      <div id="add-content-form" className="p-6 bg-card rounded-lg border mt-8">
        <h3 className="text-lg font-semibold mb-4">Adicionar Novo Conteúdo</h3>
        <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
                <Label>Tipo de Conteúdo</Label>
                <Select value={contentType} onValueChange={(v) => setContentType(v as ContentType)} disabled={isSubmitting}>
                    <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="channel">Canal ao Vivo</SelectItem>
                        <SelectItem value="movie">Filme (item único)</SelectItem>
                        <SelectItem value="series-episodes">Série (só episódios)</SelectItem>
                        <SelectItem value="series-seasons">Série (com temporadas)</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="channel-name">Nome do Conteúdo</Label>
              <Input id="channel-name" placeholder="Ex: Filme Ação" value={name} onChange={e => setName(e.target.value)} required disabled={isSubmitting}/>
            </div>
            <div className="space-y-2">
              <Label htmlFor="channel-category">Categoria</Label>
              <Input id="channel-category" placeholder="Ex: Filmes" value={category} onChange={e => setCategory(e.target.value)} required disabled={isSubmitting}/>
            </div>
          </div>

          {(contentType === 'channel' || contentType === 'movie') && (
            <div className="space-y-2">
                <Label htmlFor="channel-url">URL do Conteúdo</Label>
                <Input id="channel-url" placeholder="https://..." value={url} onChange={e => setUrl(e.target.value)} required disabled={isSubmitting}/>
            </div>
          )}

          {contentType === 'series-episodes' && (
            <div className="space-y-4 p-4 border rounded-md">
                <Label>Episódios</Label>
                {episodes.map((ep, index) => (
                    <div key={index} className="flex items-end gap-2">
                        <Input placeholder="Nº Ex: 1" value={ep.number} onChange={e => handleEpisodeChange(e.target.value, index, 'number')} className="w-20" disabled={isSubmitting}/>
                        <Input placeholder="URL do episódio" value={ep.url} onChange={e => handleEpisodeChange(e.target.value, index, 'url')} className="flex-grow" disabled={isSubmitting}/>
                        <Button type="button" variant="destructive" size="icon" onClick={() => handleRemoveEpisode(index)} disabled={isSubmitting || episodes.length <= 1}><Trash2 className="h-4 w-4"/></Button>
                    </div>
                ))}
                <Button type="button" variant="outline" onClick={() => handleAddEpisode()} disabled={isSubmitting}><Plus className="mr-2 h-4 w-4" /> Adicionar Episódio</Button>
            </div>
          )}

          {contentType === 'series-seasons' && (
             <div className="space-y-4">
                {seasons.map((season, sIndex) => (
                    <div key={sIndex} className="space-y-4 p-4 border rounded-md relative">
                         <div className="flex items-end gap-2">
                            <Label className="w-24 mb-2">Temporada</Label>
                            <Input placeholder="Nº Ex: 1" value={season.number} onChange={e => handleSeasonChange(e.target.value, sIndex)} className="w-20" disabled={isSubmitting}/>
                         </div>
                        {season.episodes.map((ep, eIndex) => (
                           <div key={eIndex} className="flex items-end gap-2 ml-6">
                                <Input placeholder="EP" value={ep.number} onChange={e => handleEpisodeChange(e.target.value, eIndex, 'number', sIndex)} className="w-16" disabled={isSubmitting}/>
                                <Input placeholder="URL do episódio" value={ep.url} onChange={e => handleEpisodeChange(e.target.value, eIndex, 'url', sIndex)} className="flex-grow" disabled={isSubmitting}/>
                                <Button type="button" variant="destructive" size="icon" onClick={() => handleRemoveEpisode(eIndex, sIndex)} disabled={isSubmitting || season.episodes.length <=1}><Trash2 className="h-4 w-4"/></Button>
                            </div>
                        ))}
                         <Button type="button" variant="outline" size="sm" className="ml-6" onClick={() => handleAddEpisode(sIndex)} disabled={isSubmitting}><Plus className="mr-2 h-4 w-4" /> Episódio</Button>
                         {seasons.length > 1 && <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2 text-red-500" onClick={() => handleRemoveSeason(sIndex)} disabled={isSubmitting}><XCircle /></Button>}
                    </div>
                ))}
                 <Button type="button" variant="secondary" onClick={handleAddSeason} disabled={isSubmitting}><Plus className="mr-2 h-4 w-4" /> Adicionar Temporada</Button>
            </div>
          )}


          <div className="flex items-center space-x-2 pt-4">
            <Checkbox id="is-adult" checked={isAdult} onCheckedChange={c => setIsAdult(!!c)} disabled={isSubmitting}/>
            <Label htmlFor="is-adult">Conteúdo Adulto (+18)</Label>
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Adicionando...' : 'Adicionar Conteúdo'}
          </Button>
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
          <h3 className="text-lg font-semibold mb-2">
            Senha para Conteúdo Adulto
          </h3>
          <p className="text-muted-foreground mb-4">
            Defina uma senha para proteger o acesso a canais marcados como
            conteúdo adulto.
          </p>
          <div className="flex gap-4">
            <Input type="password" defaultValue="09120415" />
            <Button>Salvar Senha</Button>
          </div>
        </div>
        <div className="p-6 bg-card rounded-lg border">
          <h3 className="text-lg font-semibold mb-2">Link do APK</h3>
          <p className="text-muted-foreground mb-4">
            URL para o arquivo .apk que aparecerá na tela de login. Você também
            pode fazer o upload de um novo arquivo.
          </p>
          <div className="flex items-center gap-4">
            <Input
              defaultValue="http://179.0.178.146/leotv.apk"
              className="flex-grow"
            />
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
            <Input id="apk-upload" type="file" className="hidden" accept=".apk" disabled />
          </div>
        </div>
      </div>
    </div>
  );
}
