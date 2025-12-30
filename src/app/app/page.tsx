
'use client';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { VideoPlayer } from '@/components/video-player';
import { cn } from '@/lib/utils';
import { ChevronLeft, ChevronRight, Tv, Clapperboard, Film, Radio } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useUser, useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, doc, getDocs, query, orderBy, getDoc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

type Channel = {
  id: string;
  name: string;
  category: string;
  url: string;
  type: 'channel' | 'movie' | 'series-episodes' | 'series-seasons';
  createdAt: string;
};

type Episode = {
    id: string;
    number: string;
    url: string;
}

type Season = {
    id: string;
    number: string;
}

type Series = Channel & {
    seasons?: (Season & { episodes: Episode[] })[];
    episodes?: Episode[];
}

export default function App() {
  const [sourceToPlay, setSourceToPlay] = useState('');
  const [currentContent, setCurrentContent] = useState<Channel | Episode | null>(null);
  const [filteredCategory, setFilteredCategory] = useState('all');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [content, setContent] = useState<Channel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.replace('/');
    }
  }, [user, isUserLoading, router]);

  useEffect(() => {
    const fetchContent = async () => {
        if (!firestore) return;
        setIsLoading(true);
        
        const channelsQuery = query(collection(firestore, 'channels'), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(channelsQuery);
        
        const allContent: any[] = [];

        for (const docSnap of querySnapshot.docs) {
            const channelData = { id: docSnap.id, ...docSnap.data() } as Channel;

            if (channelData.type === 'series-seasons') {
                const seasonsQuery = query(collection(docSnap.ref, 'seasons'), orderBy('number'));
                const seasonsSnapshot = await getDocs(seasonsQuery);
                const seasons = [];
                for (const seasonDoc of seasonsSnapshot.docs) {
                    const episodesQuery = query(collection(seasonDoc.ref, 'episodes'), orderBy('number'));
                    const episodesSnapshot = await getDocs(episodesQuery);
                    const episodes = episodesSnapshot.docs.map(epDoc => ({ id: epDoc.id, ...epDoc.data() } as Episode));
                    seasons.push({ id: seasonDoc.id, ...seasonDoc.data(), episodes });
                }
                allContent.push({ ...channelData, seasons });
            } else if (channelData.type === 'series-episodes') {
                const episodesQuery = query(collection(docSnap.ref, 'episodes'), orderBy('number'));
                const episodesSnapshot = await getDocs(episodesQuery);
                const episodes = episodesSnapshot.docs.map(epDoc => ({ id: epDoc.id, ...epDoc.data() } as Episode));
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
        
        setIsLoading(false);
    };

    fetchContent();
  }, [firestore]);


  const handleChannelClick = (item: Channel | Episode) => {
    setSourceToPlay((item as any).url);
    setCurrentContent(item);
  };

  const handleLogout = () => {
    // Clear session, etc.
    router.push('/');
  };
  
  if (isUserLoading || isLoading) {
      return (
          <div className="flex items-center justify-center h-screen">
              <p>Carregando aplicativo...</p>
          </div>
      )
  }

  const categories = ['all', ...Array.from(new Set(content.map((c) => c.category)))];
  const filteredContent =
    filteredCategory === 'all'
      ? content
      : content.filter((c) => c.category === filteredCategory);

  return (
    <div className="user-container">
      <div className={cn('user-sidebar', !sidebarOpen && 'w-0 overflow-hidden border-none')}>
        <div className="user-header">
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
          <Button variant="outline" className="w-full" onClick={handleLogout}>
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
          <VideoPlayer source={sourceToPlay} />
        </div>
        <div className="player-controls">
          <div className="now-playing">▶️ {currentContent?.name || 'Nenhum canal selecionado'}</div>
          <div className="control-buttons">
            <Button variant="secondary" disabled>⏮️ Anterior</Button>
            <Button variant="secondary" disabled>Próximo ⏭️</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ChannelItem({ channel, currentContent, onChannelClick }: { channel: Channel; currentContent: Channel | Episode | null; onChannelClick: (channel: Channel) => void }) {
    const Icon = channel.category.toLowerCase().includes('rádio') ? Radio : Tv;
    return (
        <div
            key={channel.id}
            className={cn('channel-item', currentContent?.id === channel.id && 'active')}
            onClick={() => onChannelClick(channel)}
        >
            <div className='flex items-center gap-3'>
                <Icon className="h-5 w-5 text-muted-foreground" />
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
                        EP {ep.number}
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
                EP {ep.number}
              </button>
          ))}
        </div>
      )}
    </>
  );
}


    