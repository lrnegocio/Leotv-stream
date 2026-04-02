
"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { LogOut, Tv, Lock, Loader2, ChevronLeft, Film, Layers, Baby, Music, Heart, Radio, Sparkles, MessageSquare, Laugh, Play, Bell, Gamepad2, X, Trophy, Send, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getRemoteContent, ContentItem, User, getGlobalSettings, getCategoryCount, Episode, getGameRankings, GameRanking, updateGameScore } from "@/lib/store"
import { toast } from "@/hooks/use-toast"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { VideoPlayer } from "@/components/video-player"
import { VoiceSearch } from "@/components/voice-search"
import Image from "next/image"

const CATEGORIES = [
  { id: 'LIVE', name: 'LÉO TV AO VIVO', icon: Tv, color: 'bg-emerald-500', genre: 'LÉO TV AO VIVO' },
  { id: 'MOVIES', name: 'LÉO TV FILMES', icon: Film, color: 'bg-blue-500', genre: 'LÉO TV FILMES' },
  { id: 'SERIES', name: 'LÉO TV SERIES', icon: Layers, color: 'bg-purple-500', genre: 'LÉO TV SERIES' },
  { id: 'CLIPES', name: 'LÉO TV VÍDEO CLIPES', icon: Music, color: 'bg-pink-500', genre: 'LÉO TV VÍDEO CLIPES' },
  { id: 'PIADAS', name: 'LÉO TV PIADAS', icon: Laugh, color: 'bg-yellow-400', genre: 'LÉO TV PIADAS' },
  { id: 'REELS', name: 'LÉO TV REELS', icon: Play, color: 'bg-pink-500', genre: 'LÉO TV REELS', restricted: true },
  { id: 'DORAMAS', name: 'LÉO TV DORAMAS', icon: Sparkles, color: 'bg-pink-400', genre: 'LÉO TV DORAMAS' },
  { id: 'KIDS', name: 'LÉO TV DESENHOS', icon: Baby, color: 'bg-yellow-500', genre: 'LÉO TV DESENHOS' },
  { id: 'RADIO', name: 'LÉO TV RÁDIOS', icon: Radio, color: 'bg-orange-400', genre: 'LÉO TV RÁDIOS' },
  { id: 'NOVELAS', name: 'LÉO TV NOVELAS', icon: Heart, color: 'bg-orange-500', genre: 'LÉO TV NOVELAS' },
  { id: 'GAMES', name: 'ARENA GAMES RETRO', icon: Gamepad2, color: 'bg-emerald-600', special: 'games' },
  { id: 'ADULT', name: 'LÉO TV ADULTOS', icon: Lock, color: 'bg-red-600', genre: 'LÉO TV ADULTOS', restricted: true },
]

const CONSOLES = [
  { name: "MASTER SYSTEM", icon: "🕹️", games: [
    { name: "Alex Kidd in Miracle World", url: "https://www.retrogames.cc/embed/29166-alex-kidd-in-miracle-world-usa-europe.html" },
    { name: "Sonic The Hedgehog (MS)", url: "https://www.retrogames.cc/embed/29167-sonic-the-hedgehog-usa-europe.html" },
    { name: "Shinobi", url: "https://www.retrogames.cc/embed/29168-shinobi-usa-europe.html" }
  ]},
  { name: "MEGA DRIVE", icon: "🌀", games: [
    { name: "Sonic 2", url: "https://www.retrogames.cc/embed/29161-sonic-the-hedgehog-usa-europe.html" },
    { name: "Street of Rage 2", url: "https://www.retrogames.cc/embed/29165-streets-of-rage-usa-europe.html" }
  ]},
  { name: "SUPER NINTENDO", icon: "🔴", games: [
    { name: "Super Mario World", url: "https://www.retrogames.cc/embed/16847-super-mario-world-usa.html" },
    { name: "Donkey Kong Country", url: "https://www.retrogames.cc/embed/18852-donkey-kong-country-usa.html" },
    { name: "Mortal Kombat 3", url: "https://www.retrogames.cc/embed/17161-mortal-kombat-3-usa.html" }
  ]},
  { name: "ARENA MULTIPLAYER (WEB)", icon: "⚔️", games: [
    { name: "Counter-Strike Web", url: "https://v6p9d9t4.ssl.hwcdn.net/html/1671333/index.html" },
    { name: "Crazy Taxi Arcade", url: "https://www.retrogames.cc/embed/22456-crazy-taxi-usa.html" },
    { name: "Alien vs Predator", url: "https://www.retrogames.cc/embed/9264-alien-vs-predator-world.html" }
  ]},
  { name: "CLÁSSICOS (BOT / PVP)", icon: "♟️", games: [
    { name: "Xadrez Master", url: "https://www.sparkchess.com/play-chess-online.html" },
    { name: "Damas Online", url: "https://www.247checkers.com/" },
    { name: "Sinuca 8 Ball", url: "https://games.atribuna.com.br/jogos/8ballpool/" },
    { name: "Dominó Master", url: "https://www.coolmathgames.com/0-dominoes" }
  ]}
]

export default function HomeContent() {
  const [content, setContent] = React.useState<ContentItem[]>([])
  const [user, setUser] = React.useState<User | null>(null)
  const [activeVideo, setActiveVideo] = React.useState<{ items: ContentItem[], index: number } | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [selectedCat, setSelectedCat] = React.useState<string | null>(null)
  const [isPinOpen, setIsPinOpen] = React.useState(false)
  const [isGamesPinOpen, setIsGamesPinOpen] = React.useState(false)
  const [pinInput, setPinInput] = React.useState("")
  const [gamesPinInput, setGamesPinInput] = React.useState("")
  const [parentalPin, setParentalPin] = React.useState("1234")
  const [announcement, setAnnouncement] = React.useState("")
  const [selectedSeries, setSelectedSeries] = React.useState<ContentItem | null>(null)
  const [catCounts, setCatCounts] = React.useState<Record<string, number>>({})
  const [pendingCategory, setPendingCategory] = React.useState<string | null>(null)
  
  // ESTADOS DA ARENA GAMES
  const [gamesMenuOpen, setGamesMenuOpen] = React.useState(false)
  const [activeGame, setActiveGame] = React.useState<{name: string, url: string} | null>(null)
  const [gameRankings, setGameRankings] = React.useState<GameRanking[]>([])
  const [opponent, setOpponent] = React.useState<{pin: string, rank: number} | null>(null)
  const [chatMessages, setChatMessages] = React.useState<{pin: string, msg: string}[]>([])
  const [chatInput, setChatInput] = React.useState("")
  const [searchingOpponent, setSearchingOpponent] = React.useState(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const q = searchParams.get('q') || ""
  const channelId = searchParams.get('id') || ""

  const loadData = React.useCallback(async (queryStr = "", categoryId: string | null = null) => {
    setLoading(true);
    try {
      const session = localStorage.getItem("user_session");
      if (!session) { router.push("/login"); return; }
      const currentUser = JSON.parse(session);
      setUser(currentUser);

      const settings = await getGlobalSettings();
      setParentalPin(settings.parentalPin || "1234");
      setAnnouncement(settings.announcement || "");

      const targetGenre = categoryId ? CATEGORIES.find(c => c.id === categoryId)?.genre : "";
      const data = await getRemoteContent(false, queryStr, targetGenre);
      
      const filtered = data.filter(item => !!item.streamUrl || (item.type === 'series' && item.episodes?.length) || (item.type === 'multi-season' && item.seasons?.length));
      setContent(filtered);

      if (channelId && filtered.length > 0) {
        const targetIdx = filtered.findIndex(i => i.id === channelId);
        if (targetIdx !== -1) {
          const item = filtered[targetIdx];
          if (item.type === 'series' || item.type === 'multi-season') setSelectedSeries(item);
          else setActiveVideo({ items: filtered, index: targetIdx });
        }
      }

      if (!categoryId && !queryStr) {
        const counts: Record<string, number> = {};
        for (const cat of CATEGORIES) { if (cat.genre) counts[cat.id] = await getCategoryCount(cat.genre); }
        setCatCounts(counts);
      }

      const ranks = await getGameRankings();
      setGameRankings(ranks);

    } catch (err) { } finally { setLoading(false); }
  }, [router, channelId]);

  React.useEffect(() => { loadData(q, selectedCat) }, [q, selectedCat, loadData]);

  const updateUrlWithId = (id: string | null) => {
    const params = new URLSearchParams(window.location.search);
    if (id) params.set('id', id);
    else params.delete('id');
    const newUrl = `${window.location.pathname}${params.toString() ? '?' + params.toString() : ''}`;
    window.history.pushState({ path: newUrl }, '', newUrl);
  };

  const handleItemClick = (idx: number) => {
    const item = content[idx];
    updateUrlWithId(item.id);
    if (item.type === 'series' || item.type === 'multi-season') setSelectedSeries(item);
    else setActiveVideo({ items: content, index: idx });
  };

  const handleEpisodeClick = (ep: Episode, parent: ContentItem) => {
    const episodesToPlay = parent.episodes || parent.seasons?.flatMap(s => s.episodes) || [];
    const contentItems = episodesToPlay.map(e => ({
      ...parent,
      streamUrl: e.streamUrl,
      title: `${parent.title} - EP ${e.number} ${e.title}`,
      id: e.id
    }));
    const startIndex = episodesToPlay.findIndex(e => e.id === ep.id);
    setActiveVideo({ items: contentItems, index: startIndex });
  };

  const navigateChannel = (direction: 'next' | 'prev') => {
    if (!activeVideo) return;
    let nextIdx = direction === 'next' ? activeVideo.index + 1 : activeVideo.index - 1;
    if (nextIdx < 0) nextIdx = activeVideo.items.length - 1;
    if (nextIdx >= activeVideo.items.length) nextIdx = 0;
    const nextItem = activeVideo.items[nextIdx];
    updateUrlWithId(nextItem.id);
    setActiveVideo({ ...activeVideo, index: nextIdx });
  }

  const handleCategoryClick = (cat: any) => {
    if (cat.special === 'games') {
      if (!user?.isGamesEnabled) {
        toast({ variant: "destructive", title: "ALA CARTE BLOQUEADO", description: "Fale com o Mestre Léo para liberar seu Painel de Arena Games." });
        return;
      }
      setIsGamesPinOpen(true);
      return;
    }
    if (cat.restricted && !user?.isAdultEnabled) {
      setPendingCategory(cat.id);
      setIsPinOpen(true);
    } else setSelectedCat(cat.id);
  };

  const verifyPin = () => {
    if (pinInput === parentalPin) { 
      if (pendingCategory) setSelectedCat(pendingCategory);
      setIsPinOpen(false); setPinInput(""); setPendingCategory(null);
    } else { toast({ variant: "destructive", title: "PIN INCORRETO" }); setPinInput(""); }
  };

  const verifyGamesPin = () => {
    if (gamesPinInput === user?.gamesPassword) {
      setIsGamesPinOpen(false);
      setGamesPinInput("");
      setGamesMenuOpen(true);
    } else {
      toast({ variant: "destructive", title: "SENHA DE GAMES INVÁLIDA" });
      setGamesPinInput("");
    }
  };

  const startMatch = (game: {name: string, url: string}) => {
    setSearchingOpponent(true);
    setOpponent(null);
    setChatMessages([]);
    
    setTimeout(() => {
      const myPoints = user?.gamePoints || 0;
      const possibleOpponents = gameRankings.filter(r => 
        r.pin !== user?.pin && 
        (user?.role === 'admin' || Math.abs(r.points - myPoints) <= 50)
      );

      if (possibleOpponents.length > 0) {
        const selected = possibleOpponents[Math.floor(Math.random() * possibleOpponents.length)];
        setOpponent({ pin: selected.pin, rank: gameRankings.findIndex(r => r.pin === selected.pin) + 1 });
        toast({ title: "OPONENTE LOCALIZADO!", description: `Desafiando: ${selected.pin}` });
      } else {
        setOpponent({ pin: "ROBÔ LÉO TV", rank: 999 });
        toast({ title: "SINAL DE ROBÔ ATIVO", description: "Nenhum combatente do seu nível online. Treine com a IA!" });
      }
      
      setActiveGame(game);
      setSearchingOpponent(false);
    }, 2000);
  };

  const sendChatMessage = () => {
    if (!chatInput.trim() || !user) return;
    setChatMessages(prev => [...prev, { pin: user.pin, msg: chatInput }]);
    setChatInput("");
  };

  const finishGame = async (result: 'win' | 'draw' | 'loss') => {
    if (!user) return;
    const success = await updateGameScore(user.pin, result);
    if (success) {
      toast({ title: result === 'win' ? "VITÓRIA SUPREMA! +10 PTS" : "COMBATE ENCERRADO" });
      const ranks = await getGameRankings();
      setGameRankings(ranks);
    }
    setActiveGame(null);
    setOpponent(null);
  };

  if (loading && content.length === 0) return <div className="min-h-screen flex flex-col items-center justify-center bg-cinematic"><Loader2 className="h-16 w-16 animate-spin text-primary" /><p className="text-[10px] font-black uppercase text-primary tracking-widest mt-4">Sincronizando Sistema Master Léo TV...</p></div>;

  return (
    <div className="min-h-screen bg-cinematic text-foreground pb-20 select-none">
      <header className="h-24 border-b border-white/5 bg-card/30 backdrop-blur-3xl flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          {selectedCat || q ? (
            <Button variant="ghost" onClick={() => { setSelectedCat(null); updateUrlWithId(null); router.replace("/user/home"); }} className="h-14 w-14 rounded-full bg-white/5 hover:bg-primary transition-all"><ChevronLeft className="h-8 w-8 text-white" /></Button>
          ) : <div className="bg-primary p-2.5 rounded-2xl rotate-2 shadow-lg shadow-primary/20"><Tv className="h-7 w-7 text-white" /></div>}
          <div className="hidden lg:block"><span className="text-2xl font-black text-primary uppercase italic tracking-tighter block leading-none">LÉO TV MASTER</span><span className="text-[9px] font-black opacity-40 uppercase tracking-widest">Sinais Unificados v3200.0</span></div>
        </div>
        <div className="flex-1 max-w-xl mx-4"><VoiceSearch /></div>
        <div className="flex items-center gap-2">
           <Button variant="ghost" onClick={() => { localStorage.removeItem("user_session"); router.push("/login"); }} className="text-destructive h-12 w-12 rounded-full hover:bg-destructive/10"><LogOut className="h-6 w-6" /></Button>
        </div>
      </header>

      <div className="max-w-[1800px] mx-auto px-8 mt-6 space-y-4">
        {announcement && !selectedCat && !q && (
          <div className="bg-primary/10 border border-primary/30 p-4 rounded-3xl flex items-center gap-4 animate-in slide-in-from-top-4 duration-500">
            <div className="bg-primary p-2 rounded-xl"><MessageSquare className="h-5 w-5 text-white" /></div>
            <p className="text-[11px] font-black uppercase text-primary tracking-widest italic">{announcement}</p>
          </div>
        )}
        {user?.individualMessage && !selectedCat && !q && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 p-4 rounded-3xl flex items-center gap-4 animate-pulse">
            <div className="bg-emerald-500 p-2 rounded-xl"><Bell className="h-5 w-5 text-white" /></div>
            <p className="text-[11px] font-black uppercase text-emerald-500 tracking-widest italic">NOTIFICAÇÃO VIP: {user.individualMessage}</p>
          </div>
        )}
      </div>

      <main className="p-8 max-w-[1800px] mx-auto">
        {!selectedCat && !q ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in duration-500">
            {CATEGORIES.map(c => {
              const count = catCounts[c.id] || 0;
              return (
                <button key={c.id} onClick={() => handleCategoryClick(c)} className={`group relative h-56 rounded-[2.5rem] overflow-hidden border-2 border-white/5 hover:border-primary transition-all hover:scale-105 shadow-2xl ${c.color} bg-opacity-20`}>
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6">
                    <div className={`p-4 rounded-3xl ${c.color} text-white shadow-xl group-hover:rotate-12 transition-transform`}><c.icon className="h-10 w-10" /></div>
                    <div className="text-center"><span className="text-lg font-black uppercase italic text-white block">{c.name}</span>{count > 0 && <span className="bg-black/40 px-3 py-1 rounded-full text-[9px] font-black text-primary border border-primary/20 uppercase mt-2 inline-block">{count.toLocaleString()} SINAIS</span>}</div>
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="space-y-10 animate-in slide-in-from-bottom-10 duration-500">
            <div className="flex items-center justify-between border-b border-white/5 pb-6"><h2 className="text-4xl font-black uppercase italic tracking-tighter text-white">{q ? `BUSCANDO: ${q}` : CATEGORIES.find(c => c.id === selectedCat)?.name}</h2></div>
            <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
              {content.map((item, idx) => (
                <div key={item.id} onClick={() => handleItemClick(idx)} className="group relative aspect-[2/3] bg-card rounded-[2rem] overflow-hidden cursor-pointer border border-white/5 hover:border-primary transition-all hover:scale-105 shadow-2xl">
                  {item.imageUrl ? <Image src={item.imageUrl} alt="Capa" fill className="object-cover opacity-80 group-hover:opacity-100" unoptimized /> : <div className="absolute inset-0 flex items-center justify-center bg-primary/10"><Tv className="h-12 w-12 text-primary opacity-20" /></div>}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent p-5 flex flex-col justify-end"><h3 className="font-black text-[12px] uppercase italic truncate text-white group-hover:text-primary leading-tight">{item.title}</h3></div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <Dialog open={gamesMenuOpen} onOpenChange={(val) => { if(!val) { setGamesMenuOpen(false); setActiveGame(null); } }}>
        <DialogContent className="max-w-[95vw] w-full h-[90vh] bg-card border-white/10 rounded-[3rem] p-0 overflow-hidden outline-none flex flex-col">
          <div className="h-20 bg-emerald-600/20 border-b border-white/5 px-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Gamepad2 className="h-8 w-8 text-emerald-500" />
              <h2 className="text-2xl font-black uppercase italic text-emerald-500 tracking-tighter">Léo Arena Multiplayer</h2>
            </div>
            <div className="flex items-center gap-6">
               <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-full border border-white/5">
                  <Trophy className="h-4 w-4 text-yellow-500" />
                  <span className="text-[10px] font-black uppercase text-yellow-500">Seu Rank: #{gameRankings.findIndex(r => r.pin === user?.pin) + 1 || '--'} | {user?.gamePoints || 0} Pts</span>
               </div>
               <Button variant="ghost" onClick={() => { setActiveGame(null); if(!activeGame) setGamesMenuOpen(false); }} className="rounded-full hover:bg-red-500/20 text-red-500"><X className="h-6 w-6" /></Button>
            </div>
          </div>
          
          <div className="flex-1 flex overflow-hidden bg-black/40">
            <div className={`w-80 border-r border-white/5 p-6 overflow-y-auto custom-scroll ${activeGame ? 'hidden lg:block' : 'block'}`}>
               <h3 className="text-[10px] font-black uppercase text-emerald-500 mb-6 tracking-widest italic">Consoles de Elite</h3>
               <div className="space-y-8">
                  {CONSOLES.map(console => (
                    <div key={console.name} className="space-y-3">
                       <div className="flex items-center gap-2 text-xs font-black uppercase opacity-40"><span>{console.icon}</span> {console.name}</div>
                       <div className="grid gap-2">
                          {console.games.map(game => (
                            <Button key={game.name} variant="outline" onClick={() => startMatch(game)} className="justify-start h-12 bg-white/5 border-white/5 hover:border-emerald-500 hover:bg-emerald-500/10 rounded-xl font-bold uppercase text-[9px] px-4">
                               {game.name}
                            </Button>
                          ))}
                       </div>
                    </div>
                  ))}
               </div>
            </div>

            <div className="flex-1 relative flex flex-col">
               {activeGame ? (
                 <div className="flex-1 flex flex-col">
                    <div className="h-14 bg-black/60 flex items-center justify-between px-6 border-b border-white/5">
                       <div className="flex items-center gap-4">
                          <div className="flex items-center gap-2">
                             <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                             <span className="text-[10px] font-black uppercase text-primary">{user?.pin}</span>
                          </div>
                          <span className="text-white opacity-20">VS</span>
                          <div className="flex items-center gap-2">
                             <span className="text-[10px] font-black uppercase text-emerald-500">{opponent?.pin}</span>
                             <span className="text-[8px] font-bold opacity-40">RANK #{opponent?.rank}</span>
                          </div>
                       </div>
                       <div className="flex gap-2">
                          <Button size="sm" onClick={() => finishGame('win')} className="bg-green-600 text-[8px] font-black h-8 uppercase">Venci</Button>
                          <Button size="sm" variant="destructive" onClick={() => finishGame('loss')} className="text-[8px] font-black h-8 uppercase">Perdi</Button>
                       </div>
                    </div>
                    <iframe src={activeGame.url} className="flex-1 w-full border-0" allowFullScreen />
                    
                    <div className="h-40 bg-black/80 border-t border-white/5 p-4 flex flex-col">
                       <div className="flex-1 overflow-y-auto mb-2 space-y-1">
                          {chatMessages.map((m, i) => (
                            <p key={i} className="text-[9px] font-bold">
                               <span className={m.pin === user?.pin ? 'text-primary' : 'text-emerald-500'}>{m.pin}:</span> {m.msg}
                            </p>
                          ))}
                       </div>
                       <div className="flex gap-2">
                          <input 
                            value={chatInput} 
                            onChange={e => setChatInput(e.target.value)} 
                            onKeyDown={e => e.key === 'Enter' && sendChatMessage()}
                            placeholder="Mande um recado..." 
                            className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 text-[10px] font-bold outline-none focus:border-emerald-500" 
                          />
                          <Button size="icon" onClick={sendChatMessage} className="bg-emerald-600 h-10 w-10 rounded-lg"><Send className="h-4 w-4" /></Button>
                       </div>
                    </div>
                 </div>
               ) : (
                 <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
                    {searchingOpponent ? (
                      <div className="space-y-6 animate-pulse">
                         <Loader2 className="h-20 w-20 animate-spin text-emerald-500 mx-auto" />
                         <h3 className="text-2xl font-black uppercase italic text-emerald-500">Buscando Oponente...</h3>
                         <p className="text-[10px] font-bold uppercase opacity-40">Sintonizando sinal de combate nível Sniper.</p>
                      </div>
                    ) : (
                      <div className="max-w-md space-y-8">
                         <Trophy className="h-24 w-24 text-yellow-500 mx-auto mb-4" />
                         <h3 className="text-4xl font-black uppercase italic tracking-tighter leading-none">Arena dos Melhores</h3>
                         <p className="text-xs font-bold uppercase opacity-40 leading-relaxed">Escolha um console ao lado para iniciar um duelo. Somente os melhores sobem no ranking global do Mestre Léo.</p>
                         <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/5 p-4 rounded-3xl border border-white/5">
                               <p className="text-2xl font-black text-emerald-500">#{gameRankings.length}</p>
                               <p className="text-[8px] font-black uppercase opacity-40">Players Ativos</p>
                            </div>
                            <div className="bg-white/5 p-4 rounded-3xl border border-white/5">
                               <p className="text-2xl font-black text-primary">{user?.gamePoints || 0}</p>
                               <p className="text-[8px] font-black uppercase opacity-40">Seus Pontos</p>
                            </div>
                         </div>
                      </div>
                    )}
                 </div>
               )}
            </div>

            <div className="w-72 border-l border-white/5 p-6 overflow-y-auto custom-scroll hidden xl:block">
               <h3 className="text-[10px] font-black uppercase text-yellow-500 mb-6 tracking-widest italic">Top Guerreiros</h3>
               <div className="space-y-4">
                  {gameRankings.slice(0, 10).map((r, i) => (
                    <div key={r.pin} className={`flex items-center gap-3 p-3 rounded-2xl border ${r.pin === user?.pin ? 'bg-primary/10 border-primary/30' : 'bg-white/5 border-white/5'}`}>
                       <div className="w-8 h-8 rounded-lg bg-black/40 flex items-center justify-center text-[10px] font-black italic">{i+1}</div>
                       <div className="flex-1">
                          <p className="text-[10px] font-black uppercase truncate">{r.pin}</p>
                          <p className="text-[8px] font-bold text-emerald-500">{r.points} PONTOS</p>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isGamesPinOpen} onOpenChange={setIsGamesPinOpen}>
        <DialogContent className="sm:max-w-md bg-card border-white/10 rounded-[2.5rem] p-10 text-center">
          <Gamepad2 className="h-16 w-16 text-emerald-500 mx-auto mb-6" />
          <div className="text-2xl font-black uppercase italic text-emerald-500 mb-6">Senha Exclusiva Arena</div>
          <input type="password" title="Games PIN" maxLength={4} className="h-20 w-56 bg-black/40 border-white/10 text-center text-4xl font-black tracking-[0.6em] rounded-3xl outline-none border-2 focus:border-emerald-500 mb-6" value={gamesPinInput} onChange={e => setGamesPinInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && verifyGamesPin()} autoFocus />
          <Button onClick={verifyGamesPin} className="w-full h-16 bg-emerald-600 text-lg font-black uppercase rounded-3xl shadow-xl shadow-emerald-500/20">ACESSAR ARENA</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={isPinOpen} onOpenChange={setIsPinOpen}>
        <DialogContent className="sm:max-w-md bg-card border-white/10 rounded-[2.5rem] p-10 text-center">
          <Lock className="h-16 w-16 text-primary mx-auto mb-6" /><div className="text-2xl font-black uppercase italic text-primary mb-6">Trava Parental Master</div>
          <input type="password" title="PIN" maxLength={4} className="h-20 w-56 bg-black/40 border-white/10 text-center text-4xl font-black tracking-[0.6em] rounded-3xl outline-none border-2 focus:border-primary mb-6" value={pinInput} onChange={e => setPinInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && verifyPin()} autoFocus />
          <Button onClick={verifyPin} className="w-full h-16 bg-primary text-lg font-black uppercase rounded-3xl shadow-xl shadow-primary/20">DESBLOQUEAR ACESSO</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedSeries} onOpenChange={(val) => { if(!val) { setSelectedSeries(null); updateUrlWithId(null); } }}>
        <DialogContent className="max-w-3xl bg-card border-white/10 rounded-[3rem] p-0 overflow-hidden outline-none">
          {selectedSeries && (
            <div className="flex flex-col h-[85vh]">
              <div className="relative h-64 shrink-0">
                {selectedSeries.imageUrl && <Image src={selectedSeries.imageUrl} alt="Capa" fill className="object-cover" unoptimized />}
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent p-10 flex flex-col justify-end"><div className="text-5xl font-black uppercase italic tracking-tighter text-white leading-none">{selectedSeries.title}</div></div>
              </div>
              <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scroll scrollbar-visible">
                {selectedSeries.episodes && selectedSeries.episodes.length > 0 ? (
                  <div className="flex flex-col gap-2">
                    {selectedSeries.episodes.sort((a,b) => a.number - b.number).map((ep) => (
                      <Button key={ep.id} variant="outline" onClick={() => handleEpisodeClick(ep, selectedSeries)} className="w-full h-16 justify-start bg-white/5 border-white/5 hover:border-primary rounded-2xl px-8 group transition-all"><div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-black text-xs text-primary mr-6">{ep.number}</div><span className="font-black uppercase text-sm">EP {ep.number} - {ep.title}</span></Button>
                    ))}
                  </div>
                ) : selectedSeries.seasons && selectedSeries.seasons.length > 0 ? (
                  selectedSeries.seasons.sort((a,b) => a.number - b.number).map(season => (
                    <div key={season.id} className="space-y-3 mb-8 last:mb-0">
                      <h4 className="text-xs font-black uppercase text-primary tracking-[0.2em] pl-4 border-l-4 border-primary mb-4">Temporada {season.number}</h4>
                      <div className="flex flex-col gap-2">
                        {season.episodes.sort((a,b) => a.number - b.number).map(ep => (
                          <Button key={ep.id} variant="outline" onClick={() => handleEpisodeClick(ep, selectedSeries)} className="w-full h-14 justify-start bg-white/5 border-white/5 hover:border-primary rounded-xl px-8 group transition-all"><div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center font-black text-[10px] text-primary mr-6">{ep.number}</div><span className="font-bold uppercase text-xs">EP {ep.number} - {ep.title}</span></Button>
                        ))}
                      </div>
                    </div>
                  ))
                ) : null}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!activeVideo} onOpenChange={(val) => { if(!val) { setActiveVideo(null); updateUrlWithId(null); } }}>
        <DialogContent className="max-w-6xl bg-black border-white/10 p-0 overflow-hidden rounded-[2.5rem] shadow-2xl">
          {activeVideo && <VideoPlayer url={activeVideo.items[activeVideo.index].streamUrl || ""} title={activeVideo.items[activeVideo.index].title} id={activeVideo.items[activeVideo.index].id} onNext={() => navigateChannel('next')} onPrev={() => navigateChannel('prev')} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}
