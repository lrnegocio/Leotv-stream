
"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { LogOut, Tv, Lock, Loader2, ChevronLeft, Film, Layers, Baby, Music, Heart, Radio, Sparkles, MessageSquare, Laugh, Play, Bell, Gamepad2, X, Trophy, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getRemoteContent, ContentItem, User, getGlobalSettings, getCategoryCount, getGameRankings, GameRanking, updateGameScore, getRemoteGames, GameItem, validateDeviceLogin } from "@/lib/store"
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
  const [selectedSeries, setSelectedSeries] = React.useState<ContentItem | null>(null)
  const [catCounts, setCatCounts] = React.useState<Record<string, number>>({})
  const [unlockTarget, setUnlockTarget] = React.useState<'ADULT' | 'GAMES' | null>(null)
  
  const [gamesMenuOpen, setGamesMenuOpen] = React.useState(false)
  const [activeGame, setActiveGame] = React.useState<GameItem | null>(null)
  
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

      if (games.length === 0) {
        const gList = await getRemoteGames();
        setGames(gList);
      }

    } catch (err) { } finally { setLoading(false); }
  }, [router, channelId, activeVideo, selectedSeries, games.length]);

  React.useEffect(() => { loadData(q, selectedCat) }, [q, selectedCat, loadData]);

  const handleItemClick = (idx: number, e?: React.MouseEvent) => {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    
    const now = Date.now();
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

  const handleCategoryClick = async (cat: any, e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    const now = Date.now();
    if (now - lastCloseTime.current < 1200) return;

    setPinInput("");
    if (cat.special === 'games' || cat.restricted) {
      if (cat.special === 'games' && !user?.isGamesEnabled) { 
        toast({ variant: "destructive", title: "ARENA BLOQUEADA PARA ESTE PIN" }); 
        return; 
      }
      if (cat.restricted && !user?.isAdultEnabled) { 
        toast({ variant: "destructive", title: "ACESSO ADULTO BLOQUEADO PARA ESTE PIN" }); 
        return; 
      }
      setUnlockTarget(cat.special === 'games' ? 'GAMES' : 'ADULT');
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
    } else {
      toast({ variant: "destructive", title: "SENHA PARENTAL INCORRETA" });
      setPinInput("");
    }
  };

  const closeRestrictedArea = () => {
    lastCloseTime.current = Date.now();
    setSelectedCat(null);
    setGamesMenuOpen(false);
    setActiveGame(null);
    setUnlockTarget(null);
    setPinInput("");
    const p = new URLSearchParams(window.location.search);
    p.delete('q');
    p.delete('id');
    router.replace(`/user/home?${p.toString()}`);
  };

  if (loading && content.length === 0) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-cinematic">
      <Loader2 className="h-16 w-16 animate-spin text-primary" />
      <p className="text-[10px] font-black uppercase text-primary tracking-widest mt-4">Sincronizando Sistema Master Léo TV...</p>
    </div>
  );

  const consolesList = Array.from(new Set(games.map(g => g.console))).sort();

  return (
    <div className="min-h-screen bg-cinematic text-foreground pb-20 select-none">
      <header className="h-24 border-b border-white/5 bg-card/30 backdrop-blur-3xl flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          {selectedCat || q ? (
            <button onClick={closeRestrictedArea} className="h-14 w-14 rounded-full bg-white/5 hover:bg-primary transition-all flex items-center justify-center shadow-lg">
              <ChevronLeft className="h-8 w-8 text-white" />
            </button>
          ) : (
            <div className="bg-primary p-2.5 rounded-2xl rotate-2 shadow-xl shadow-primary/20">
              <Tv className="h-7 w-7 text-white" />
            </div>
          )}
          <div className="hidden lg:block">
            <span className="text-2xl font-black text-primary uppercase italic tracking-tighter block leading-none">LÉO TV MASTER</span>
            <span className="text-[9px] font-black opacity-40 uppercase tracking-widest">Sinal Unificado v11500.0</span>
          </div>
        </div>
        
        <div className="flex-1 max-w-2xl mx-4">
          <VoiceSearch />
        </div>

        <div className="flex items-center gap-2">
           <Button variant="ghost" onClick={() => { localStorage.removeItem("user_session"); router.push("/login"); }} className="text-destructive h-12 w-12 rounded-full hover:bg-destructive/10">
             <LogOut className="h-6 w-6" />
           </Button>
        </div>
      </header>

      <main className="p-8 max-w-[1800px] mx-auto">
        {!selectedCat && !q ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in duration-500">
            {CATEGORIES.map(c => {
              const count = catCounts[c.id] || 0;
              return (
                <button 
                  key={c.id} 
                  onClick={(e) => handleCategoryClick(c, e)} 
                  className={`group relative h-56 rounded-[2.5rem] overflow-hidden border-2 border-white/5 hover:border-primary transition-all hover:scale-105 shadow-2xl ${c.color || 'bg-card'} bg-opacity-20`}
                >
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6">
                    <div className={`p-4 rounded-3xl ${c.color || 'bg-primary'} text-white shadow-xl group-hover:rotate-12 transition-transform`}>
                      <c.icon className="h-10 w-10" />
                    </div>
                    <div className="text-center">
                      <span className="text-lg font-black uppercase italic text-white block">{c.name}</span>
                      {count > 0 && (
                        <span className="bg-black/40 px-3 py-1 rounded-full text-[9px] font-black text-primary border border-primary/20 uppercase mt-2 inline-block">
                          {count.toLocaleString()} SINAIS
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="space-y-10 animate-in slide-in-from-bottom-10">
            <div className="flex items-center justify-between border-b border-white/5 pb-6">
              <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white">
                {q ? `SINAL: ${q.toUpperCase()}` : CATEGORIES.find(c => c.id === selectedCat)?.name}
              </h2>
            </div>
            {content.length === 0 ? (
              <div className="py-20 text-center space-y-4 opacity-20">
                <Tv className="h-20 w-20 mx-auto" />
                <p className="font-black uppercase italic text-lg">Nenhum sinal localizado nesta frequência.</p>
              </div>
            ) : (
              <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8">
                {content.map((item, idx) => (
                  <div 
                    key={item.id} 
                    onClick={(e) => handleItemClick(idx, e)} 
                    className="group relative aspect-[2/3] bg-card rounded-[2rem] overflow-hidden cursor-pointer border border-white/5 hover:border-primary transition-all hover:scale-105 shadow-2xl"
                  >
                    {item.imageUrl ? (
                      <Image src={item.imageUrl} alt="Capa" fill className="object-cover opacity-80 group-hover:opacity-100" unoptimized />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-primary/10">
                        <Tv className="h-12 w-12 text-primary opacity-20" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent p-5 flex flex-col justify-end">
                      <h3 className="font-black text-[12px] uppercase italic truncate text-white group-hover:text-primary leading-tight">{item.title}</h3>
                      <p className="text-[8px] font-bold text-muted-foreground uppercase mt-1 truncate">{item.genre}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
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
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isPinOpen} onOpenChange={(val) => { if(!val) { setIsPinOpen(false); setPinInput(""); setUnlockTarget(null); } }}>
        <DialogContent className="sm:max-w-md bg-card border-white/10 rounded-[2.5rem] p-10 text-center">
          <Lock className="h-16 w-16 text-primary mx-auto mb-6" />
          <div className="text-2xl font-black uppercase italic text-primary mb-6">Segurança Master</div>
          <p className="text-[10px] font-bold uppercase opacity-40 mb-6">Digite a senha parental global para desbloquear.</p>
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

      <Dialog open={gamesMenuOpen} onOpenChange={(val) => { if(!val) { closeRestrictedArea(); } }}>
        <DialogContent className="max-w-[95vw] w-full h-[90vh] bg-card border-white/10 rounded-[3rem] p-0 overflow-hidden outline-none flex flex-col">
          <div className="h-20 bg-emerald-600/20 border-b border-white/5 px-8 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Gamepad2 className="h-8 w-8 text-emerald-500" />
              <h2 className="text-2xl font-black uppercase italic text-emerald-500 tracking-tighter">Léo Arena Retro</h2>
            </div>
            <button onClick={closeRestrictedArea} className="h-10 w-10 rounded-full hover:bg-red-500/20 text-red-500 flex items-center justify-center">
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="flex-1 flex overflow-hidden bg-black/40">
            <div className={`w-80 border-r border-white/5 p-6 overflow-y-auto custom-scroll ${activeGame ? 'hidden lg:block' : 'block'}`}>
               <div className="space-y-8">
                  {consolesList.map(consoleName => (
                    <div key={consoleName} className="space-y-3">
                       <div className="flex items-center gap-2 text-[10px] font-black uppercase opacity-40">🎮 {consoleName}</div>
                       <div className="grid gap-2">
                          {games.filter(g => g.console === consoleName).map(game => (
                            <Button key={game.id} variant="outline" onClick={() => setActiveGame(game)} className="justify-start h-12 bg-white/5 border-white/5 hover:border-emerald-500 rounded-xl font-bold uppercase text-[9px] px-4">{game.title}</Button>
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
                       <div className="flex items-center gap-4"><span className="text-[10px] font-black uppercase text-emerald-500">{activeGame.title}</span></div>
                       <div className="flex gap-2">
                         <Button size="sm" onClick={() => setActiveGame(null)} className="bg-white/5 text-[8px] font-black h-8 uppercase">Trocar Jogo</Button>
                       </div>
                    </div>
                    {activeGame.type === 'embed' ? (
                      <iframe src={activeGame.url} className="flex-1 w-full border-0" allowFullScreen />
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center p-10 text-center bg-black/80">
                         <Download className="h-20 w-20 text-emerald-500 mb-6 animate-bounce" />
                         <h3 className="text-3xl font-black uppercase italic text-emerald-500">Sinal de Download Retro</h3>
                         <Button className="mt-8 bg-emerald-500 font-black uppercase" onClick={() => window.open(activeGame.url, '_blank')}>BAIXAR ROM AGORA</Button>
                      </div>
                    )}
                 </div>
               ) : (
                 <div className="flex-1 flex flex-col items-center justify-center p-10 text-center">
                    <div className="max-w-md space-y-8">
                      <Trophy className="h-24 w-24 text-yellow-500 mx-auto" />
                      <h3 className="text-4xl font-black uppercase italic tracking-tighter">Arena Retro Master</h3>
                      <p className="text-[10px] font-bold uppercase opacity-40">Escolha o console no menu lateral para começar a sintonização.</p>
                    </div>
                 </div>
               )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
