
'use client';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { VideoPlayer } from '@/components/video-player';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Tv, Clapperboard, Film, Radio, LogOut, Clock, SkipBack, SkipForward } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUser, useCollection, useFirestore, useMemoFirebase, useAuth, useDoc } from '@/firebase';
import { collection, doc, getDocs, query, orderBy, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type Channel = {
  id: string;
  name: string;
  category: string;
  url: string;
  type: 'channel' | 'movie' | 'series-episodes' | 'series-seasons';
  createdAt: any;
};

type Episode = {
    id: string;
    number: string;
    url: string;
    name?: string;
}

type Season = {
    id: string;
    number: string;
}

type Series = Channel & {
    seasons?: (Season & { episodes: Episode[] })[];
    episodes?: Episode[];
}

type UserProfile = {
    id: string;
    username: string;
    email: string;
    plan: 'trial' | 'monthly' | 'custom';
    planExpiry: string | null;
    isBlocked: boolean;
};


export default function App() {
  const [sourceToPlay, setSourceToPlay] = useState('');
  const [currentContent, setCurrentContent] = useState<Channel | Episode | null>(null);
  const [filteredCategory, setFilteredCategory] = useState('all');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [content, setContent] = useState<Channel[]>([]);
  const [isLoadingContent, setIsLoadingContent] = useState(true);
  const [autoAdvance, setAutoAdvance] = useState(false);


  const { user, isUserLoading } = useUser();
  const auth = useAuth();
  const router = useRouter();
  const firestore = useFirestore();

  const userDocRef = useMemoFirebase(
    () => (firestore && user ? doc(firestore, 'users', user.uid) : null),
    [firestore, user]
  );
  const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);


  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/');
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    const fetchContent = async () => {
        if (!firestore) return;
        setIsLoadingContent(true);
        
        const channelsQuery = query(collection(firestore, 'channels'), orderBy('name', 'asc'));
        const querySnapshot = await getDocs(channelsQuery);
        
        const allContent: any[] = [];

        for (const docSnap of querySnapshot.docs) {
            const channelData = { id: docSnap.id, ...docSnap.data() } as Channel;

            if (channelData.type === 'series-seasons') {
                const seasonsQuery = query(collection(docSnap.ref, 'seasons'), orderBy('seasonNumber'));
                const seasonsSnapshot = await getDocs(seasonsQuery);
                const seasons = [];
                for (const seasonDoc of seasonsSnapshot.docs) {
                    const episodesQuery = query(collection(seasonDoc.ref, 'episodes'), orderBy('episodeNumber'));
                    const episodesSnapshot = await getDocs(episodesQuery);
                    const episodes = episodesSnapshot.docs.map(epDoc => ({ id: epDoc.id, name: epDoc.data().name, number: epDoc.data().episodeNumber.toString(), url: epDoc.data().episodeUrl } as Episode));
                    seasons.push({ id: seasonDoc.id, number: seasonDoc.data().seasonNumber.toString(), episodes });
                }
                allContent.push({ ...channelData, seasons });
            } else if (channelData.type === 'series-episodes') {
                const episodesQuery = query(collection(docSnap.ref, 'episodes'), orderBy('episodeNumber'));
                const episodesSnapshot = await getDocs(episodesQuery);
                const episodes = episodesSnapshot.docs.map(epDoc => ({ id: epDoc.id, name: epDoc.data().name, number: epDoc.data().episodeNumber.toString(), url: epDoc.data().episodeUrl } as Episode));
                allContent.push({ ...channelData, episodes });
            } else {
                allContent.push(channelData);
            }
        }
        setContent(allContent);
        
        const firstPlayable = allContent.find(c => c.type === 'channel' || c.type === 'movie');
        if (firstPlayable) {
            setSourceToPlay(firstPlayable.url);
            setCurrentContent(firstPlayable);
        }
        
        setIsLoadingContent(false);
    };

    if (user) {
        fetchContent();
    }
  }, [firestore, user]);

  const playableContent = useMemo(() => {
    const flatList: (Channel | Episode)[] = [];
    const contentToFilter = filteredCategory === 'all'
      ? content
      : content.filter((c) => c.category === filteredCategory);

    contentToFilter.forEach(item => {
        if (item.type === 'channel' || item.type === 'movie') {
            flatList.push(item);
        } else if (item.type === 'series-episodes' && (item as Series).episodes) {
            flatList.push(...(item as Series).episodes!);
        } else if (item.type === 'series-seasons' && (item as Series).seasons) {
            (item as Series).seasons!.forEach(season => {
                flatList.push(...season.episodes);
            });
        }
    });
    return flatList;
  }, [content, filteredCategory]);


  const handleNavigation = useCallback((direction: 'next' | 'prev') => {
      if (playableContent.length < 2 || !currentContent) return;

      const currentIndex = playableContent.findIndex(item => item.id === currentContent.id);
      if (currentIndex === -1) return;

      let nextIndex;
      if (direction === 'next') {
          nextIndex = (currentIndex + 1) % playableContent.length;
      } else {
          nextIndex = (currentIndex - 1 + playableContent.length) % playableContent.length;
      }
      
      const nextContent = playableContent[nextIndex];
      handleChannelClick(nextContent);
  }, [playableContent, currentContent]);


  const handleChannelClick = (item: Channel | Episode) => {
    const url = (item as any).url || (item as any).episodeUrl || (item as any).url;
    if (url) {
        setSourceToPlay(url);
        setCurrentContent(item);
    }
  };

  const handleLogout = () => {
    if (auth) {
        signOut(auth).then(() => {
            router.push('/');
        });
    }
  };
  
  const handleAutoAdvance = () => {
    if(autoAdvance) {
      handleNavigation('next');
    }
  }

  const isLoading = isUserLoading || isProfileLoading || isLoadingContent;

  if (isLoading) {
      return (
          <div className="flex items-center justify-center h-screen bg-background">
              <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 border-4 border-dashed rounded-full animate-spin border-accent"></div>
                  <p className="text-lg text-muted-foreground">Carregando aplicativo...</p>
              </div>
          </div>
      )
  }

  const categories = ['all', ...Array.from(new Set(content.map((c) => c.category)))];
  const filteredContent =
    filteredCategory === 'all'
      ? content
      : content.filter((c) => c.category === filteredCategory);

  const getPlanStatus = () => {
    if (!userProfile) return null;
    const { plan, planExpiry } = userProfile;
    
    if (plan === 'custom') {
        return 'Plano vitalício ativo';
    }

    if (planExpiry) {
        const expiryDate = new Date(planExpiry);
        if (expiryDate > new Date()) {
            const friendlyTime = formatDistanceToNow(expiryDate, { addSuffix: true, locale: ptBR });
            const planName = plan === 'monthly' ? 'Plano Mensal' : 'Teste Grátis';
            return `${planName} | Vence ${friendlyTime}`;
        }
    }
    return 'Plano expirado';
  }

  return (
    <div className="user-container">
      <div className={cn('user-sidebar', !sidebarOpen && 'w-0 overflow-hidden border-none')}>
        <div className="user-header">
           <div className="flex flex-col gap-2">
                {userProfile && (
                    <div className='bg-background/50 rounded-lg p-3 text-center'>
                        <p className='font-semibold text-lg'>{userProfile.username}</p>
                        <div className='flex items-center justify-center gap-2 text-sm text-amber-300 mt-1'>
                            <Clock className='h-4 w-4' />
                            <span>{getPlanStatus()}</span>
                        </div>
                    </div>
                )}
                <div className="category-tabs">
                    {categories.map((cat) => (
                    <button
                        key={cat}
                        className={cn('category-tab', filteredCategory === cat && 'active')}
                        onClick={() => setFilteredCategory(cat)}
                    >
                        {cat === 'all' ? 'Todos' : cat}
                    </button>
                    ))}
                </div>
            </div>
        </div>

        <div className="channels-list">
        {filteredContent.map(item => {
             if (item.type === 'series-seasons' || item.type === 'series-episodes') {
                return <SeriesItem 
                            key={item.id} 
                            series={item as Series}
                            currentContent={currentContent}
                            onChannelClick={handleChannelClick}
                        />
            } else {
                return <ChannelItem 
                            key={item.id}
                            channel={item}
                            currentContent={currentContent}
                            onChannelClick={handleChannelClick}
                        />
            }
        })}
        {filteredContent.length === 0 && !isLoading && (
            <div className='p-4 text-center text-muted-foreground'>Nenhum conteúdo encontrado nesta categoria.</div>
        )}
        </div>
        <div className="p-4 border-t border-border">
          <Button variant="destructive" className="w-full" onClick={handleLogout}>
            <LogOut className='mr-2' />
            Sair
          </Button>
        </div>
      </div>

      <div className="user-main relative">
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-1/2 -translate-y-1/2 bg-[#667eea] hover:bg-[#764ba2] text-white rounded-l-none rounded-r-lg h-20 w-8 z-10"
          style={{ left: sidebarOpen ? '300px' : '0px', transition: 'left 0.3s ease' }}
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          {sidebarOpen ? <ChevronLeft /> : <ChevronRight />}
        </Button>
        <div className="player-container" id="videoPlayer">
          <VideoPlayer source={sourceToPlay} onEnded={handleAutoAdvance} />
        </div>
        <div className="player-controls">
          <div className="now-playing">▶️ {currentContent?.name || 'Nenhum canal selecionado'}</div>
          <div className="control-buttons">
            <Button variant="secondary" onClick={() => handleNavigation('prev')} disabled={playableContent.length < 2}>
                <SkipBack className='h-4 w-4 mr-2'/> Anterior
            </Button>
            <Button variant="secondary" onClick={() => handleNavigation('next')} disabled={playableContent.length < 2}>
                Próximo <SkipForward className='h-4 w-4 ml-2'/>
            </Button>
          </div>
           <div className="flex items-center space-x-2 mt-2">
            <Checkbox id="auto-advance" checked={autoAdvance} onCheckedChange={(c) => setAutoAdvance(!!c)} />
            <Label htmlFor="auto-advance">Avançar Automaticamente</Label>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChannelItem({ channel, currentContent, onChannelClick }: { channel: Channel; currentContent: Channel | Episode | null; onChannelClick: (channel: Channel) => void }) {
    const Icon = channel.category.toLowerCase().includes('rádio') ? Radio : Tv;
    const isActive = currentContent?.id === channel.id;
    return (
        <div
            key={channel.id}
            className={cn('channel-item', isActive && 'active')}
            onClick={() => onChannelClick(channel)}
        >
            <div className='flex items-center gap-3'>
                <Icon className={cn("h-5 w-5 text-muted-foreground", isActive && "text-accent")} />
                <div>
                    <div className="channel-name">{channel.name}</div>
                    <div className="channel-category">{channel.category}</div>
                </div>
            </div>
        </div>
    )
}

function SeriesItem({ series, currentContent, onChannelClick,}: { series: Series; currentContent: Channel | Episode | null; onChannelClick: (item: Channel | Episode) => void;}) {
  const [isOpen, setIsOpen] = useState(false);
  const Icon = series.type === 'movie' ? Film : Clapperboard;

  return (
    <>
      <div className="series-header" onClick={() => setIsOpen(!isOpen)}>
        <div className='flex items-center gap-3'>
          <Icon className="h-5 w-5 text-muted-foreground" />
          <div>
            <div className="channel-name">{series.name}</div>
            <div className="channel-category">{series.category}</div>
          </div>
        </div>
        <span className={cn('series-arrow', isOpen && 'open')}>▶</span>
      </div>
      {isOpen && (
        <div className="series-episodes-menu open">
          {series.type === 'series-seasons' && series.seasons?.map(season => (
              <div key={season.id} className='mb-2'>
                  <p className='text-sm font-bold p-2'>Temporada {season.number}</p>
                  {season.episodes.map(ep => (
                      <button
                        key={ep.id}
                        className={cn('episode-button', currentContent?.id === ep.id && 'active')}
                        onClick={() => onChannelClick(ep)}
                        >
                        {ep.name ? `${ep.number} - ${ep.name}` : `EP ${ep.number}`}
                        </button>
                  ))}
              </div>
          ))}
          {series.type === 'series-episodes' && series.episodes?.map(ep => (
              <button
                key={ep.id}
                className={cn('episode-button', currentContent?.id === ep.id && 'active')}
                onClick={() => onChannelClick(ep)}
              >
                {ep.name ? `${ep.number} - ${ep.name}` : `EP ${ep.number}`}
              </button>
          ))}
        </div>
      )}
    </>
  );
}
