
"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { LogOut, Tv, Lock, Loader2, ChevronLeft, Film, Layers, Baby, Music, Heart, Radio, Sparkles, MessageSquare, Laugh, Play, Bell, Gamepad2, X, Trophy, Swords, Bot, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getRemoteContent, ContentItem, User, getGlobalSettings, getCategoryCount, Episode, getGameRankings, GameRanking, updateGameScore, getWaitingPlayers, setUserSearchingMatch, validateDeviceLogin, getRemoteGames, GameItem } from "@/lib/store"
import { toast } from "@/hooks/use-toast"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { VideoPlayer } from "@/components/video-player"
import { VoiceSearch } from "@/components/voice-search"
import Image from "next/image"

const CATEGORIES = [
  { id: 'LIVE', name: 'LÉO TV AO VIVO', icon: Tv, color: 'bg-emerald-500', genre: 'LÉO TV AO VIVO' },
  { id: 'MOVIES', name: 'LÉO TV FILMES', icon: Film, color: 'bg-blue-500', genre: 'LÉO TV FILMES' },
  { id: 'SERIES', name: 'LÉO TV SERIES', icon: Layers, iconColor: 'text-purple-500', genre: 'LÉO TV SERIES' },
  { id: 'CLIPES', name: 'LÉO TV VIDEO CLIPES', icon: Music, iconColor: 'text-pink-500', genre: 'LÉO TV VIDEO CLIPES' },
  { id: 'PIADAS', name: 'LÉO TV PIADAS', icon: Laugh, iconColor: 'text-yellow-400', genre: 'LÉO TV PIADAS' },
  { id: 'REELS', name: 'LÉO TV REELS', icon: Play, iconColor: 'text-pink-500', genre: 'LÉO TV REELS', restricted: true },
  { id: 'DORAMAS', name: 'LÉO TV DORAMAS', icon: Sparkles, iconColor: 'text-pink-400', genre: 'LÉO TV DORAMAS' },
  { id: 'KIDS', name: 'LÉO TV DESENHOS', icon: Baby, iconColor: 'text-yellow-500', genre: 'LÉO TV DESENHOS' },
  { id: 'RADIO', name: 'LÉO TV RÁDIOS', icon: Radio, iconColor: 'text-orange-400', genre: 'LÉO TV RÁDIOS' },
  { id: 'NOVELAS', name: 'LÉO TV NOVELAS', icon: Heart, iconColor: 'text-orange-500', genre: 'LÉO TV NOVELAS' },
  { id: 'GAMES', name: 'ARENA GAMES RETRO', icon: Gamepad2, iconColor: 'text-emerald-600', special: 'games' },
  { id: 'ADULT', name: 'LÉO TV ADULTOS', icon: Lock, iconColor: 'text-red-600', genre: 'LÉO TV ADULTOS', restricted: true },
]

export default function HomeContent() {
  const [content, setContent] = React.useState<ContentItem[]>([])
  const [games, setGames] = React.useState<GameItem[]>([])
  const [user, setUser] = React.useState<User | null>(null)
  const [activeVideo, setActiveVideo] = React.useState<{ items: ContentItem[], index: number } | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [selectedCat, setSelectedCat] = React.useState<string | null>(null)
  const [isPinOpen, setIsPinOpen] = React.useState(false)
  const [pinInput, setPinInput] = React.useState("")
  const [announcement, setAnnouncement] = React.useState("")
  const [selectedSeries, setSelectedSeries] = React.useState<ContentItem | null>(null)
  const [catCounts, setCatCounts] = React.useState<Record<string, number>>({})
  const [unlockTarget, setUnlockTarget] = React.useState<'ADULT' | 'GAMES' | null>(null)
  
  const [gamesMenuOpen, setGamesMenuOpen] = React.useState(false)
  const [activeGame, setActiveGame] = React.useState<GameItem | null>(null)
  const [gameRankings, setGameRankings] = React.useState<GameRanking[]>([])
  const [waitingPlayers, setWaitingPlayers] = React.useState<User[]>([])
  const [searchingOpponent, setSearchingOpponent] = React.useState(false)
  const [opponent, setOpponent] = React.useState<{pin: string, rank: number} | null>(null)
  
  const lastCloseTime = React.useRef(0)
  const lastClickTime = React.useRef(0)
  
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
      
      const fresh = await validateDeviceLogin(currentUser.pin, currentUser.deviceId || "web");
      if (!fresh.error && fresh.user) {
        setUser(fresh.user);
        localStorage.setItem("user_session", JSON.stringify(fresh.user));
      } else {
        setUser(currentUser);
      }

      const settings = await getGlobalSettings();
      setAnnouncement(settings.announcement || "");

      const targetGenre = categoryId ? CATEGORIES.find(c => c.id === categoryId)?.genre : "";
      const data = await getRemoteContent(false, queryStr, targetGenre);
      setContent(data);

      if (channelId && !activeVideo) {
        const item = data.find(i => i.id === channelId);
        if (item) {
          if (item.type === 'series' || item.type === 'multi-season') {
            if (!selectedSeries) setSelectedSeries(item);
          } else {
            setActiveVideo({ items: data, index: data.indexOf(item) });
          }
        }
      }

      if (!categoryId && !queryStr) {
        const counts: Record<string, number> = {};
        for (const cat of CATEGORIES) { if (cat.genre) counts[cat.id] = await getCategoryCount(cat.genre); }
        setCatCounts(counts);
      }

      const [ranks, waiting, gList] = await Promise.all([
        getGameRankings(),
        getWaitingPlayers(),
        getRemoteGames()
      ]);
      setGameRankings(ranks);
      setWaitingPlayers(waiting);
      setGames(gList);

    } catch (err) { } finally { setLoading(false); }
  }, [router, channelId, activeVideo, selectedSeries]);

  React.useEffect(() => { loadData(q, selectedCat) }, [q, selectedCat, loadData]);

  const handleItemClick = (idx: number, e?: React.MouseEvent) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    
    const now = Date.now();
    // BLOQUEIO DE CLIQUES FANTASMAS v59: Ignora cliques por 1.2s após fechar algo
    if (now - lastCloseTime.current < 1200) return;
    if (now - lastClickTime.current < 800) return;
    lastClickTime.current = now;
    
    const item = content[idx];
    const params = new URLSearchParams(window.location.search);
    params.set('id', item.id);
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
    
    if (item.type === 'series' || item.type === 'multi-season') {
      setSelectedSeries(item);
    } else {
      setActiveVideo({ items: content, index: idx });
    }
  };

  const navigateVideo = (direction: 'next' | 'prev') => {
    if (!activeVideo) return;
    const len = activeVideo.items.length;
    const nextIdx = direction === 'next' ? (activeVideo.index + 1) % len : (activeVideo.index - 1 + len) % len;
    
    const nextItem = activeVideo.items[nextIdx];
    setActiveVideo({ ...activeVideo, index: nextIdx });
    
    const params = new URLSearchParams(window.location.search);
    params.set('id', nextItem.id);
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
  };

  const handleCategoryClick = async (cat: any, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    const now = Date.now();
    if (now - lastCloseTime.current < 1200) return;

    setPinInput("");
    if (cat.special === 'games') {
      if (!user?.isGamesEnabled) { toast({ variant: "destructive", title: "ARENA BLOQUEADA" }); return; }
      setUnlockTarget('GAMES');
      setIsPinOpen(true);
      return;
    }
    if (cat.restricted) {
      if (!user?.isAdultEnabled) { toast({ variant: "destructive", title: "ACESSO BLOQUEADO" }); return; }
      setUnlockTarget('ADULT');
      setIsPinOpen(true);
    } else {
      setSelectedCat(cat.id);
    }
  };

  const verifyGlobalPassword = async () => {
    setLoading(true);
    const settings = await getGlobalSettings();
    setLoading(false);
    if (pinInput === settings.parentalPin) {
      if (unlockTarget === 'ADULT') setSelectedCat('ADULT');
      else if (unlockTarget === 'GAMES') setGamesMenuOpen(true);
      setIsPinOpen(false);
      setPinInput("");
      setUnlockTarget(null);
    } else {
      toast({ variant: "destructive", title: "SENHA INVÁLIDA" });
      setPinInput("");
    }
  };

  const startMatch = async (game: GameItem) => {
    setSearchingOpponent(true);
    if (user) await setUserSearchingMatch(user.pin, true);
    setTimeout(async () => {
      const waiting = await getWaitingPlayers();
      const possible = waiting.filter(w => w.pin !== user?.pin);
      if (possible.length > 0) {
        setOpponent({ pin: possible[0].pin, rank: gameRankings.findIndex(r => r.pin === possible[0].pin) + 1 || 99 });
      } else {
        setOpponent({ pin: `IA LÉO TV (NÍVEL 5)`, rank: 1 });
      }
      setActiveGame(game);
      setSearchingOpponent(false);
    }, 2000);
  };

  const finishGame = async (res: 'win' | 'draw' | 'loss') => {
    if (user) {
      await updateGameScore(user.pin, res);
      await setUserSearchingMatch(user.pin, false);
      const ranks = await getGameRankings();
      setGameRankings(ranks);
    }
    setActiveGame(null);
    setOpponent(null);
  };

  if (loading && content.length === 0) return <div className="min-h-screen flex flex-col items-center justify-center bg-cinematic"><Loader2 className="h-16 w-16 animate-spin text-primary" /><p className="text-[10px] font-black uppercase text-primary tracking-widest mt-4">Sincronizando Sistema Master Léo TV...</p></div>;

  const consolesList = Array.from(new Set(games.map(g => g.console))).sort();

  return (
    <div className="min-h-screen bg-cinematic text-foreground pb-20 select-none">
      <header className="h-24 border-b border-white/5 bg-card/30 backdrop-blur-3xl flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          {selectedCat || q ? (
            <Button variant="ghost" onClick={() => { setSelectedCat(null); router.replace("/user/home"); }} className="h-14 w-14 rounded-full bg-white/5 hover:bg-primary transition-all"><ChevronLeft className="h-8 w-8 text-white" /></Button>
          ) : <div className="bg-primary p-2.5 rounded-2xl rotate-2 shadow-lg shadow-primary/20"><Tv className="h-7 w-7 text-white" /></div>}
          <div className="hidden lg:block"><span className="text-2xl font-black text-primary uppercase italic tracking-tighter block leading-none">LÉO TV MASTER</span><span className="text-[9px] font-black opacity-40 uppercase tracking-widest">Sinais Unificados v10600.0</span></div>
        </div>
        <div className="flex-1 max-w-xl mx-4"><VoiceSearch /></div>
        <div className="flex items-center gap-2">
           <Button variant="ghost" onClick={() => { localStorage.removeItem("user_session"); router.push("/login"); }} className="text-destructive h-12 w-12 rounded-full hover:bg-destructive/10"><LogOut className="h-6 w-6" /></Button>
        </div>
      </header>

      <main className="p-8 max-w-[1800px] mx-auto">
        {!selectedCat && !q ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in duration-500">
            {CATEGORIES.map(c => {
              const count = catCounts[c.id] || 0;
              return (
                <button key={c.id} onClick={(e) => handleCategoryClick(c, e)} className={`group relative h-56 rounded-[2.5rem] overflow-hidden border-2 border-white/5 hover:border-primary transition-all hover:scale-105 shadow-2xl ${c.color || 'bg-card'} bg-opacity-20`}>
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6">
                    <div className={`p-4 rounded-3xl ${c.color || 'bg-primary'} text-white shadow-xl group-hover:rotate-12 transition-transform`}><c.icon className="h-10 w-10" /></div>
                    <div className="text-center"><span className="text-lg font-black uppercase italic text-white block">{c.name}</span>{count > 0 && <span className="bg-black/40 px-3 py-1 rounded-full text-[9px] font-black text-primary border border-primary/20 uppercase mt-2 inline-block">{count.toLocaleString()} SINAIS</span>}</div>
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="space-y-10 animate-in slide-in-from-bottom-10">
            <div className="flex items-center justify-between border-b border-white/5 pb-6"><h2 className="text-4xl font-black uppercase italic tracking-tighter text-white">{q ? `BUSCANDO: ${q}` : CATEGORIES.find(c => c.id === selectedCat)?.name}</h2></div>
            <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
              {content.map((item, idx) => (
                <div key={item.id} onClick={(e) => handleItemClick(idx, e)} className="group relative aspect-[2/3] bg-card rounded-[2rem] overflow-hidden cursor-pointer border border-white/5 hover:border-primary transition-all hover:scale-105 shadow-2xl">
                  {item.imageUrl ? <Image src={item.imageUrl} alt="Capa" fill className="object-cover opacity-80 group-hover:opacity-100" unoptimized /> : <div className="absolute inset-0 flex items-center justify-center bg-primary/10"><Tv className="h-12 w-12 text-primary opacity-20" /></div>}
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent p-5 flex flex-col justify-end"><h3 className="font-black text-[12px] uppercase italic truncate text-white group-hover:text-primary leading-tight">{item.title}</h3></div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      <Dialog open={!!activeVideo} onOpenChange={(val) => { 
        if(!val) { 
          lastCloseTime.current = Date.now();
          setActiveVideo(null); 
          const p = new URLSearchParams(window.location.search); 
          p.delete('id'); 
          window.history.replaceState(null, '', `${window.location.pathname}?${p.toString()}`); 
        } 
      }}>
        <DialogContent className="max-w-6xl bg-black border-white/10 p-0 overflow-hidden rounded-[2.5rem] shadow-2xl">
          {activeVideo && (
            <VideoPlayer 
              key={`player-${activeVideo.items[activeVideo.index].id}`}
              url={activeVideo.items[activeVideo.index].streamUrl || ""} 
              title={activeVideo.items[activeVideo.index].title} 
              id={activeVideo.items[activeVideo.index].id} 
              onNext={() => navigateVideo('next')} 
              onPrev={() => navigateVideo('prev')} 
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedSeries} onOpenChange={(val) => { if(!val) { lastCloseTime.current = Date.now(); setSelectedSeries(null); } }}>
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
                      <Button key={ep.id} variant="outline" onClick={(e) => { 
                        e.stopPropagation();
                        const eps = selectedSeries.episodes!.map(itemEp => ({
                          ...selectedSeries, 
                          streamUrl: itemEp.streamUrl, 
                          title: `${selectedSeries.title} - EP ${itemEp.number}`, 
                          id: itemEp.id,
                          type: 'movie' as any
                        }));
                        setActiveVideo({ items: eps, index: selectedSeries.episodes!.indexOf(ep) }); 
                        setSelectedSeries(null);
                      }} className="w-full h-16 justify-start bg-white/5 border-white/5 hover:border-primary rounded-2xl px-8 transition-all"><div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center font-black text-xs text-primary mr-6">{ep.number}</div><span className="font-black uppercase text-sm">EP {ep.number} - {ep.title}</span></Button>
                    ))}
                  </div>
                ) : selectedSeries.seasons?.map(season => (
                  <div key={season.id} className="space-y-3 mb-8 last:mb-0">
                    <h4 className="text-xs font-black uppercase text-primary tracking-[0.2em] pl-4 border-l-4 border-primary mb-4">Temporada {season.number}</h4>
                    <div className="flex flex-col gap-2">
                      {season.episodes.sort((a,b) => a.number - b.number).map(ep => (
                        <Button key={ep.id} variant="outline" onClick={(e) => { 
                          e.stopPropagation();
                          const eps = season.episodes.map(itemEp => ({
                            ...selectedSeries, 
                            streamUrl: itemEp.streamUrl, 
                            title: `${selectedSeries.title} - T${season.number} EP ${itemEp.number}`, 
                            id: itemEp.id,
                            type: 'movie' as any
                          }));
                          setActiveVideo({ items: eps, index: season.episodes.indexOf(ep) }); 
                          setSelectedSeries(null);
                        }} className="w-full h-14 justify-start bg-white/5 border-white/5 hover:border-primary rounded-xl px-8 transition-all"><div className="w-8 h-8 rounded-full bg-primary/5 flex items-center justify-center font-black text-[10px] text-primary mr-6">{ep.number}</div><span className="font-bold uppercase text-xs">EP {ep.number} - {ep.title}</span></Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={gamesMenuOpen} onOpenChange={(val) => { if(!val) { lastCloseTime.current = Date.now(); setGamesMenuOpen(false); if(user) setUserSearchingMatch(user.pin, false); } }}>
        <DialogContent className="max-w-[95vw] w-full h-[90vh] bg-card border-white/10 rounded-[3rem] p-0 overflow-hidden outline-none flex flex-col">
          <div className="h-20 bg-emerald-600/20 border-b border-white/5 px-8 flex items-center justify-between">
            <div className="flex items-center gap-4"><Gamepad2 className="h-8 w-8 text-emerald-500" /><h2 className="text-2xl font-black uppercase italic text-emerald-500 tracking-tighter">Léo Arena Multiplayer</h2></div>
            <Button variant="ghost" onClick={() => { setActiveGame(null); setGamesMenuOpen(false); if(user) setUserSearchingMatch(user.pin, false); }} className="rounded-full hover:bg-red-500/20 text-red-500"><X className="h-6 w-6" /></Button>
          </div>
          <div className="flex-1 flex overflow-hidden bg-black/40">
            <div className={`w-80 border-r border-white/5 p-6 overflow-y-auto custom-scroll ${activeGame ? 'hidden lg:block' : 'block'}`}>
               <div className="space-y-8">
                  {consolesList.map(consoleName => (
                    <div key={consoleName} className="space-y-3">
                       <div className="flex items-center gap-2 text-[10px] font-black uppercase opacity-40">🎮 {consoleName}</div>
                       <div className="grid gap-2">
                          {games.filter(g => g.console === consoleName).map(game => (
                            <Button key={game.id} variant="outline" onClick={() => startMatch(game)} className="justify-start h-12 bg-white/5 border-white/5 hover:border-emerald-500 rounded-xl font-bold uppercase text-[9px] px-4">{game.title}</Button>
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
                       <div className="flex items-center gap-4"><span className="text-[10px] font-black uppercase text-primary">{user?.pin}</span><Swords className="h-4 w-4 text-white/20" /><span className="text-[10px] font-black uppercase text-emerald-500">{opponent?.pin}</span></div>
                       <div className="flex gap-2"><Button size="sm" onClick={() => finishGame('win')} className="bg-green-600 text-[8px] font-black h-8 uppercase">Venci</Button><Button size="sm" variant="destructive" onClick={() => finishGame('loss')} className="text-[8px] font-black h-8 uppercase">Perdi</Button></div>
                    </div>
                    {activeGame.type === 'embed' ? (
                      <iframe src={activeGame.url} className="flex-1 w-full border-0" allowFullScreen />
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center p-10 text-center bg-black/80">
                         <Download className="h-20 w-20 text-emerald-500 mb-6 animate-bounce" />
                         <h3 className="text-3xl font-black uppercase italic text-emerald-500">Baixando ROM no Aparelho...</h3>
                         <Button className="mt-8 bg-emerald-500 font-black uppercase" onClick={() => window.open(activeGame.url, '_blank')}>INSTALAR AGORA</Button>
                      </div>
                    )}
                 </div>
               ) : (
                 <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
                    {searchingOpponent ? <div className="space-y-6 animate-pulse"><Loader2 className="h-20 w-20 animate-spin text-emerald-500 mx-auto" /><h3 className="text-2xl font-black uppercase italic text-emerald-500">Buscando Guerreiros...</h3></div> : <div className="max-w-md space-y-8"><Trophy className="h-24 w-24 text-yellow-500 mx-auto" /><h3 className="text-4xl font-black uppercase italic tracking-tighter">Arena dos Melhores</h3></div>}
                 </div>
               )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isPinOpen} onOpenChange={(val) => { if(!val) { lastCloseTime.current = Date.now(); setIsPinOpen(false); setPinInput(""); } }}>
        <DialogContent className="sm:max-w-md bg-card border-white/10 rounded-[2.5rem] p-10 text-center">
          <Lock className="h-16 w-16 text-primary mx-auto mb-6" />
          <div className="text-2xl font-black uppercase italic text-primary mb-6">Segurança Master</div>
          <input 
            type="password" 
            title="PIN" 
            maxLength={4} 
            className="h-20 w-56 bg-black/40 border-white/10 text-center text-4xl font-black tracking-[0.6em] rounded-3xl outline-none border-2 focus:border-primary mb-6" 
            value={pinInput} 
            onChange={e => setPinInput(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && verifyGlobalPassword()} 
            autoFocus 
          />
          <Button onClick={verifyGlobalPassword} disabled={loading} className="w-full h-16 bg-primary text-lg font-black uppercase rounded-3xl shadow-xl">
            {loading ? <Loader2 className="animate-spin" /> : 'DESBLOQUEAR ACESSO'}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}
