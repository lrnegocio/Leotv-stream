"use client";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { VideoPlayer } from "@/components/video-player";
import { cn } from "@/lib/utils";
import { ChevronLeft, ChevronRight } from "lucide-react";

type Channel = {
  id: string;
  name: string;
  category: string;
  url: string;
  isSeries?: boolean;
  seriesName?: string;
  episodeNumber?: number;
  seasonNumber?: number;
};

const sampleChannels: Channel[] = [
  { id: '1', name: 'Canal Aberto 1', category: 'Abertos', url: 'https://www.youtube.com/watch?v=z4ZZhEw0JA0' },
  { id: '2', name: 'Canal Aberto 2', category: 'Abertos', url: 'https://www.canva.com/design/DAG8jqppYd4/qnHkHB9kq5UYfBUkGGY9rw/watch?embed' },
  { id: '3', name: 'Filme Ação 1', category: 'Filmes', url: 'https://www.youtube.com/watch?v=z4ZZhEw0JA0' },
  { id: '4', name: 'Filme Comédia 1', category: 'Filmes', url: 'https://www.canva.com/design/DAG6ONyt5ks/6DuizP3XWwr5xFWBi383CQ/view?embed' },
  { id: '5', name: 'Série Exemplo T1 E1', category: 'Séries', url: 'https://www.youtube.com/watch?v=z4ZZhEw0JA0', isSeries: true, seriesName: 'Série Exemplo', seasonNumber: 1, episodeNumber: 1 },
  { id: '6', name: 'Série Exemplo T1 E2', category: 'Séries', url: 'https://www.canva.com/design/DAG8jqppYd4/qnHkHB9kq5UYfBUkGGY9rw/watch?embed', isSeries: true, seriesName: 'Série Exemplo', seasonNumber: 1, episodeNumber: 2 },
];


export default function Home() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [sourceToPlay, setSourceToPlay] = useState("");
  const [currentChannel, setCurrentChannel] = useState<Channel | null>(null);
  const [filteredCategory, setFilteredCategory] = useState('all');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const handleLogin = () => {
    setIsLoggedIn(true);
    const firstChannel = sampleChannels.find(c => c.category === 'Abertos');
    if (firstChannel) {
        setSourceToPlay(firstChannel.url);
        setCurrentChannel(firstChannel);
    }
  };
  
  const handleChannelClick = (channel: Channel) => {
    setSourceToPlay(channel.url);
    setCurrentChannel(channel);
  }

  if (!isLoggedIn) {
    return (
      <div className="login-container">
        <div className="login-box">
          <h1 className="login-title">Léo TV</h1>
          <div className="space-y-4">
            <div>
              <Label htmlFor="username">Usuário</Label>
              <Input type="text" id="username" />
            </div>
            <div>
              <Label htmlFor="password">Senha</Label>
              <Input type="password" id="password" />
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox id="rememberMe" />
              <Label htmlFor="rememberMe" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Lembrar meus dados</Label>
            </div>
            <Button onClick={handleLogin} className="w-full bg-gradient-to-r from-[#667eea] to-[#764ba2] hover:opacity-90">
              Entrar
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const categories = ['all', ...Array.from(new Set(sampleChannels.map(c => c.category)))];
  const filteredChannels = filteredCategory === 'all'
    ? sampleChannels
    : sampleChannels.filter(c => c.category === filteredCategory);

  const seriesMap = new Map<string, Channel[]>();
    const regularChannels: Channel[] = [];

    filteredChannels.forEach(channel => {
        if (channel.isSeries && channel.seriesName) {
            if (!seriesMap.has(channel.seriesName)) {
                seriesMap.set(channel.seriesName, []);
            }
            seriesMap.get(channel.seriesName)!.push(channel);
        } else {
            regularChannels.push(channel);
        }
    });


  return (
    <div className="user-container">
      <div className={cn("user-sidebar", !sidebarOpen && "w-0 overflow-hidden border-none")}>
        <div className="user-header">
            <div className="category-tabs">
                {categories.map(cat => (
                    <button 
                        key={cat}
                        className={cn("category-tab", filteredCategory === cat && "active")}
                        onClick={() => setFilteredCategory(cat)}
                    >
                        {cat === 'all' ? 'Todos' : cat}
                    </button>
                ))}
            </div>
        </div>

        <div className="channels-list">
        {Array.from(seriesMap.entries()).map(([seriesName, episodes]) => (
              <SeriesItem 
                key={seriesName} 
                seriesName={seriesName} 
                episodes={episodes}
                currentChannel={currentChannel}
                onChannelClick={handleChannelClick}
              />
            ))}
            {regularChannels.map(channel => (
                <div key={channel.id} 
                     className={cn("channel-item", currentChannel?.id === channel.id && "active")}
                     onClick={() => handleChannelClick(channel)}
                >
                    <div className="channel-name">{channel.name}</div>
                    <div className="channel-category">{channel.category}</div>
                </div>
            ))}
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
            <div className="now-playing">▶️ {currentChannel?.name || 'Nenhum canal selecionado'}</div>
             <div className="control-buttons">
                <Button variant="secondary">⏮️ Anterior</Button>
                <Button variant="secondary">Próximo ⏭️</Button>
            </div>
        </div>
      </div>
    </div>
  );
}

function SeriesItem({ seriesName, episodes, currentChannel, onChannelClick }: { seriesName: string, episodes: Channel[], currentChannel: Channel | null, onChannelClick: (channel: Channel) => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const category = episodes[0]?.category;

  return (
    <>
      <div className="series-header" onClick={() => setIsOpen(!isOpen)}>
        <div>
          <div className="channel-name">🎬 {seriesName}</div>
          <div className="channel-category">{category} • {episodes.length} episódios</div>
        </div>
        <span className={cn("series-arrow", isOpen && "open")}>▶</span>
      </div>
      <div className={cn("series-episodes-menu", isOpen && "open")}>
        {episodes.sort((a,b) => (a.episodeNumber || 0) - (b.episodeNumber || 0)).map(ep => {
          const epLabel = ep.seasonNumber
            ? `T${ep.seasonNumber} E${ep.episodeNumber}`
            : `EP ${ep.episodeNumber}`;
          return <button 
                    key={ep.id}
                    className={cn("episode-button", currentChannel?.id === ep.id && "active")}
                    onClick={() => onChannelClick(ep)}
                 >
                   {epLabel}
                 </button>;
        })}
      </div>
    </>
  )
}
