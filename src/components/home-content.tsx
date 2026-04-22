
"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { LogOut, Tv, Lock, Loader2, ChevronLeft, Film, Layers, Baby, Music, Heart, Radio, Sparkles, Gamepad2, X, Trophy, Play, Video, Smile, Zap, Trophy as TrophyIcon, Headphones, Info, Copy, PlayCircle, ExternalLink, Star, BellRing, ChevronDown, ChevronUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getRemoteContent, ContentItem, User, getGlobalSettings, getCategoryCount, getRemoteGames, GameItem, getContentById, formatMasterLink, validateDeviceLogin } from "@/lib/store"
import { toast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { VideoPlayer } from "@/components/video-player"
import { VoiceSearch } from "@/components/voice-search"
import Image from "next/image"

const CATEGORIES = [
  { id: 'LIVE', name: 'CANAIS AO VIVO', icon: Tv, color: 'bg-emerald-500', genre: 'LÉO TV AO VIVO' },
  { id: 'MOVIES', name: 'FILMES MASTER', icon: Film, color: 'bg-blue-500', genre: 'LÉO TV FILMES' },
  { id: 'SERIES', name: 'SÉRIES', icon: Layers, color: 'bg-purple-500', genre: 'LÉO TV SÉRIES' },
  { id: 'PPV', name: 'PAY PER VIEW', icon: Zap, color: 'bg-orange-500', genre: 'LÉO TV PAY PER VIEW', specialAccess: 'isPpvEnabled' },
  { id: 'ALACARTE', name: 'ALACARTES', icon: Star, color: 'bg-blue-600', genre: 'LÉO TV ALACARTES', specialAccess: 'isAlacarteEnabled' },
  { id: 'ESPORTES', name: 'LÉO TV ESPORTES', icon: TrophyIcon, color: 'bg-orange-600', genre: 'LÉO TV ESPORTES' },
  { id: 'MUSICAS', name: 'LÉO TV MÚSICAS', icon: Headphones, color: 'bg-indigo-500', genre: 'LÉO TV MUSICAS' },
  { id: 'CLIPES', name: 'LÉO TV VÍDEO CLIPES', icon: Music, color: 'bg-pink-500', genre: 'LÉO TV VÍDEO CLIPES' },
  { id: 'PIADAS', name: 'LÉO TV PIADAS', icon: Smile, color: 'bg-yellow-500', genre: 'LÉO TV PIADAS' },
  { id: 'REELS', name: 'LÉO TV REELS', icon: Video, color: 'bg-cyan-500', genre: 'LÉO TV REELS' },
  { id: 'NOVELAS', name: 'NOVELAS', icon: Heart, color: 'bg-red-500', genre: 'LÉO TV NOVELAS' },
  { id: 'DORAMAS', name: 'DORAMAS', icon: Sparkles, color: 'bg-indigo-400', genre: 'LÉO TV DORAMAS' },
  { id: 'KIDS', name: 'MUNDO INFANTIL', icon: Baby, color: 'bg-sky-500', genre: 'LÉO TV DESENHOS' },
  { id: 'RADIO', name: 'LÉO TV RÁDIOS', icon: Radio, color: 'bg-orange-400', genre: 'LÉO TV RÁDIOS' },
  { id: 'GAMES', name: 'ARENA GAMES', icon: Gamepad2, color: 'bg-emerald-600', special: 'games' },
  { id: 'ADULT', name: 'ADULTOS', icon: Lock, color: 'bg-zinc-800', genre: 'LÉO TV ADULTOS', restricted: true },
]

export default function HomeContent() {
  const [content, setContent] = React.useState<ContentItem[]>([])
  const [games, setGames] = React.useState<GameItem[]>([])
  const [user, setUser] = React.useState<User | null>(null)
  const [settings, setSettings] = React.useState<any>(null)
  const [activeVideo, setActiveVideo] = React.useState<{ items: any[], index: number } | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [selectedCat, setSelectedCat] = React.useState<string | null>(null)
  const [isPinOpen, setIsPinOpen] = React.useState(false)
  const [pinInput, setPinInput] = React.useState("")
  const [selectedSeries, setSelectedSeries] = React.useState<ContentItem | null>(null)
  const [catCounts, setCatCounts] = React.useState<Record<string, number>>({})
  const [unlockTarget, setUnlockTarget] = React.useState<'ADULT' | 'GAMES' | 'ITEM' | string | null>(null)
  const [unlockTargetItem, setUnlockTargetItem] = React.useState<ContentItem | null>(null)
  const [gamesMenuOpen, setGamesMenuOpen] = React.useState(false)
  const [activeGame, setActiveGame] = React.useState<GameItem | null>(null)
  const [showAcesso, setShowAcesso] = React.useState(false)
  const [isMounted, setIsMounted] = React.useState(false)
  const [expandedConsole, setExpandedConsole] = React.useState<string | null>(null)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const q = searchParams ? (searchParams.get('q') || "") : ""

  const syncUserPermissions = React.useCallback(async (currentUser: User) => {
    try {
      const res = await validateDeviceLogin(currentUser.pin, (currentUser as any).deviceId || "vps_device");
      if (res.user) {
        setUser(res.user);
        localStorage.setItem("user_session", JSON.stringify({ ...res.user, deviceId: (currentUser as any).deviceId || "vps_device" }));
      }
    } catch (e) {
      console.error("Erro ao sincronizar permissões");
    }
  }, []);

  const loadData = React.useCallback(async (queryStr = "", categoryId: string | null = null) => {
    try {
      const currentSettings = await getGlobalSettings();
      setSettings(currentSettings);
      
      const categoryObj = CATEGORIES.find(c => c.id === categoryId);
      const genreToFilter = categoryObj?.genre || "";
      const data = await getRemoteContent(false, queryStr, genreToFilter);
      setContent(data);

      if (!categoryId && !queryStr) {
        const counts: Record<string, number> = {};
        for (const cat of CATEGORIES) { 
          if (cat.genre) counts[cat.id] = await getCategoryCount(cat.genre); 
        }
        setCatCounts(counts);
      }
      
      const remoteGames = await getRemoteGames();
      setGames(remoteGames);
    } catch (err) { } finally { setLoading(false); }
  }, []);

  React.useEffect(() => {
    setIsMounted(true);
    if (typeof window !== 'undefined') {
      try {
        const session = localStorage.getItem("user_session");
        if (session) {
          const parsed = JSON.parse(session);
          setUser(parsed);
          syncUserPermissions(parsed);
        } else {
          router.push("/login");
        }
      } catch (e) { router.push("/login"); }
    }
  }, [router, syncUserPermissions]);

  React.useEffect(() => {
    if (!isMounted) return;
    const delayDebounceFn = setTimeout(() => loadData(q, selectedCat), 500);
    return () => clearTimeout(delayDebounceFn);
  }, [q, selectedCat, loadData, isMounted]);

  const verifyPassword = async () => {
    try {
      const globalSettings = await getGlobalSettings();
      if (pinInput === globalSettings.parentalPin) {
        if (unlockTarget === 'ITEM' && unlockTargetItem) {
          openItem(unlockTargetItem, true);
          setUnlockTargetItem(null);
        } else if (unlockTarget === 'GAMES') {
          setGamesMenuOpen(true);
        } else if (unlockTarget) {
          setSelectedCat(unlockTarget);
        }
        setIsPinOpen(false);
        setPinInput("");
        setUnlockTarget(null);
      } else {
        toast({ variant: "destructive", title: "SENHA INCORRETA" });
        setPinInput("");
      }
    } catch (e) { toast({ variant: "destructive", title: "ERRO DE SEGURANÇA" }); }
  };

  const openItem = async (item: ContentItem, bypassPin = false) => {
    if (!item) return;
    if (!bypassPin && item.isRestricted) {
      setUnlockTarget('ITEM');
      setUnlockTargetItem(item);
      setIsPinOpen(true);
      return;
    }
    if (item.type === 'multi-season' || item.type === 'series') {
      setLoading(true);
      try {
        const deepItem = await getContentById(item.id);
        setSelectedSeries(deepItem || item);
      } catch (e) { setSelectedSeries(item); } finally { setLoading(false); }
    } else {
      const idx = content.findIndex(i => i.id === item.id);
      const list = content.length > 0 ? content.map(i => ({ ...i, streamUrl: formatMasterLink(i.streamUrl) })) : [{ ...item, streamUrl: formatMasterLink(item.streamUrl) }];
      setActiveVideo({ items: list, index: idx !== -1 ? idx : 0 });
    }
  };

  const handleCategoryClick = (cat: any) => {
    if (!user) return;
    
    if (user.role === 'admin') {
      if (cat.special === 'games') setGamesMenuOpen(true);
      else setSelectedCat(cat.id);
      return;
    }

    if (cat.specialAccess) {
      if (!(user as any)[cat.specialAccess]) {
        return toast({ variant: "destructive", title: "ACESSO NÃO CONTRATADO", description: "Fale com seu revendedor para liberar este sinal." });
      }
      setSelectedCat(cat.id);
      return;
    }

    if (cat.special === 'games' || cat.restricted) {
      if (cat.special === 'games' && !user?.isGamesEnabled) return toast({ variant: "destructive", title: "ARENA BLOQUEADA" });
      if (cat.restricted && !user?.isAdultEnabled) return toast({ variant: "destructive", title: "CONTEÚDO BLOQUEADO" });
      setUnlockTarget(cat.id);
      setIsPinOpen(true);
    } else setSelectedCat(cat.id);
  };

  const gameConsoles = Array.from(new Set(games.map(g => g.console))).sort();

  if (!isMounted) return null;

  return (
    <div className="min-h-screen bg-background pb-20 select-none">
      {loading && (
        <div className="fixed inset-0 z-[200] bg-background flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-[10px] font-black uppercase text-primary animate-pulse tracking-widest">Sintonizando v335...</p>
        </div>
      )}

      <header className="h-20 border-border bg-card/60 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          {(selectedCat || q) && <button onClick={() => { setSelectedCat(null); router.replace('/user/home'); }} className="h-12 w-12 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-white transition-all"><ChevronLeft className="h-6 w-6" /></button>}
          <span className="text-xl font-black text-primary uppercase italic tracking-tighter">Léo TV Stream</span>
        </div>
        <div className="flex-1 max-w-xl mx-4"><VoiceSearch /></div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowAcesso(true)} className="h-12 w-12 rounded-2xl border border-primary/20 flex items-center justify-center text-primary hover:bg-primary/10 transition-all"><Info className="h-6 w-6" /></button>
          <button onClick={() => { localStorage.removeItem("user_session"); router.push("/login"); }} className="text-destructive h-12 w-12 rounded-2xl flex items-center justify-center bg-destructive/10 hover:bg-destructive hover:text-white transition-all"><LogOut className="h-6 w-6" /></button>
        </div>
      </header>

      <main className="p-8 max-w-[1600px] mx-auto space-y-8">
        {user?.individualMessage && !selectedCat && !q && (
          <div className="bg-primary/10 border-2 border-primary/20 p-6 rounded-[2rem] flex items-center gap-6 animate-in slide-in-from-top-4 duration-500 shadow-xl">
             <div className="bg-primary p-3 rounded-2xl shadow-lg"><BellRing className="h-6 w-6 text-white" /></div>
             <div className="flex-1">
                <p className="text-[10px] font-black uppercase text-primary tracking-widest mb-1">Recado do Mestre Léo</p>
                <p className="text-sm font-bold leading-relaxed">{user.individualMessage}</p>
             </div>
          </div>
        )}

        {!selectedCat && !q && settings?.bannerUrl && (
          <div className="w-full group relative cursor-pointer" onClick={() => settings.bannerLink && window.open(settings.bannerLink, '_blank')}>
             <div className="relative aspect-[4/1] w-full rounded-[2.5rem] overflow-hidden border-4 border-primary/10 shadow-2xl transition-transform hover:scale-[1.01]">
                <Image src={settings.bannerUrl} alt="Banner" fill className="object-cover" unoptimized />
                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/10 flex items-center gap-2"><Zap className="h-3 w-3 text-amber-400 animate-pulse" /><span className="text-[8px] font-black uppercase text-white tracking-widest">Publicidade Soberana</span></div>
             </div>
          </div>
        )}

        {!selectedCat && !q ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {CATEGORIES.map(c => {
              const isVisible = user?.role === 'admin' || !c.specialAccess || (user && (user as any)[c.specialAccess]);
              if (!isVisible) return null;

              return (
                <button key={c.id} onClick={() => handleCategoryClick(c)} className="group relative h-44 rounded-[2.5rem] overflow-hidden border border-border bg-card hover:border-primary transition-all shadow-xl">
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    <div className={`p-4 rounded-3xl ${c.color} text-white shadow-lg group-hover:scale-110 transition-transform`}><c.icon className="h-8 w-8" /></div>
                    <span className="text-sm font-black uppercase tracking-widest">{c.name}</span>
                    <span className="bg-muted px-4 py-1 rounded-full text-[9px] font-black opacity-40">{(catCounts[c.id] || 0).toLocaleString()} Sinais</span>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-3xl font-black uppercase italic text-primary">{q ? `Busca: ${q}` : CATEGORIES.find(c => c.id === selectedCat)?.name}</h2>
            <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {content.map((item) => (
                <div key={item.id} onClick={() => openItem(item)} className="group relative aspect-[2/3] bg-card rounded-[2rem] overflow-hidden cursor-pointer border border-border hover:border-primary transition-all shadow-2xl">
                  {item.imageUrl ? <Image src={item.imageUrl} alt={item.title} fill className="object-cover group-hover:scale-110 transition-transform duration-500" unoptimized /> : <div className="absolute inset-0 flex items-center justify-center opacity-20"><Tv className="h-12 w-12" /></div>}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent p-5 flex flex-col justify-end">
                    <h3 className="font-black text-xs uppercase truncate text-white leading-tight">{item.title}</h3>
                    <p className="text-[9px] font-bold text-primary uppercase mt-1 truncate">{item.genre}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* DIALOG DE EPISÓDIOS MASTER v335 */}
      <Dialog open={!!selectedSeries} onOpenChange={() => setSelectedSeries(null)}>
        <DialogContent className="max-w-xl bg-card border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
          <DialogHeader><DialogTitle className="text-xl font-black uppercase italic text-primary">Selecione o Episódio</DialogTitle></DialogHeader>
          <div className="mt-6 flex flex-col gap-2 max-h-[500px] overflow-y-auto custom-scroll pr-2 scrollbar-visible">
            {selectedSeries?.episodes?.sort((a,b) => a.number - b.number).map((ep) => (
              <button key={ep.id} onClick={() => setActiveVideo({ items: selectedSeries.episodes!.map(e => ({ ...e, streamUrl: formatMasterLink(e.streamUrl), title: `${selectedSeries.title} - EP ${e.number}` })), index: selectedSeries.episodes!.findIndex(i => i.id === ep.id) })} className="flex items-center justify-between p-4 bg-muted/50 rounded-xl hover:bg-primary hover:text-white transition-all group">
                <span className="font-black uppercase text-[10px] tracking-widest">EP {ep.number} - {ep.title || 'SINAL MASTER'}</span>
                <PlayCircle className="h-5 w-5 text-primary group-hover:text-white transition-colors" />
              </button>
            ))}
            {selectedSeries?.seasons?.sort((a,b) => a.number - b.number).map(season => (
              <div key={season.id} className="space-y-2 mb-4">
                <p className="text-[10px] font-black text-primary uppercase pl-4 border-l-4 border-primary ml-2 mb-3">Temporada {season.number}</p>
                {season.episodes.sort((a,b) => a.number - b.number).map(ep => {
                  // Mapeia todos os episódios de todas as temporadas para navegação no player
                  const allSeasonEps = selectedSeries.seasons!.flatMap(s => s.episodes.map(e => ({ ...e, streamUrl: formatMasterLink(e.streamUrl), title: `${selectedSeries.title} - T${s.number} EP ${e.number}` })));
                  const currentIdx = allSeasonEps.findIndex(i => i.id === ep.id);
                  
                  return (
                    <button key={ep.id} onClick={() => setActiveVideo({ items: allSeasonEps, index: currentIdx })} className="w-full flex items-center justify-between p-4 bg-muted/50 rounded-xl hover:bg-primary hover:text-white transition-all group ml-4">
                      <span className="font-bold uppercase text-[9px]">EPISÓDIO {ep.number} - {ep.title || 'SINAL'}</span>
                      <PlayCircle className="h-4 w-4 text-primary group-hover:text-white" />
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
          <Button onClick={() => setSelectedSeries(null)} className="mt-6 w-full h-14 bg-zinc-800 font-black uppercase rounded-2xl">FECHAR LISTA</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={isPinOpen} onOpenChange={setIsPinOpen}>
        <DialogContent className="sm:max-w-md bg-card rounded-[2.5rem] p-10 text-center shadow-2xl">
          <Lock className="h-16 w-16 text-primary mx-auto mb-6" />
          <div className="text-2xl font-black uppercase italic mb-4 text-primary">Sinal Restrito</div>
          <p className="text-[10px] font-black uppercase opacity-40 mb-6 tracking-widest">Digite a Senha Parental</p>
          <input type="password" title="Senha" maxLength={4} className="h-20 w-56 bg-muted border-border text-center text-4xl font-black tracking-[0.5em] rounded-3xl outline-none focus:border-primary mb-8" value={pinInput} onChange={e => setPinInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && verifyPassword()} />
          <Button onClick={verifyPassword} className="full h-16 bg-primary text-sm font-black uppercase rounded-2xl shadow-xl shadow-primary/20">LIBERAR AGORA</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={gamesMenuOpen} onOpenChange={setGamesMenuOpen}>
        <DialogContent className="max-w-4xl bg-card border-white/10 rounded-[3rem] p-8 shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
          <DialogHeader><DialogTitle className="text-2xl font-black uppercase italic text-emerald-500 flex items-center gap-3"><Gamepad2 className="h-8 w-8" /> Arena Games Master</DialogTitle></DialogHeader>
          <div className="mt-8 flex-1 overflow-y-auto custom-scroll pr-2 space-y-4">
            {gameConsoles.map(consoleName => (
              <div key={consoleName} className="space-y-2">
                <button 
                  onClick={() => setExpandedConsole(expandedConsole === consoleName ? null : consoleName)}
                  className="w-full flex items-center justify-between p-6 bg-white/5 rounded-[1.5rem] hover:bg-emerald-500/10 transition-all border border-white/5 group"
                >
                  <span className="text-sm font-black uppercase italic group-hover:text-emerald-500 tracking-widest">{consoleName}</span>
                  {expandedConsole === consoleName ? <ChevronUp className="h-5 w-5 text-emerald-500" /> : <ChevronDown className="h-5 w-5 opacity-40" />}
                </button>
                {expandedConsole === consoleName && (
                  <div className="grid gap-3 pl-4 animate-in slide-in-from-top-2 duration-300 grid-cols-1 sm:grid-cols-2">
                    {games.filter(g => g.console === consoleName).map(game => (
                      <button key={game.id} onClick={() => setActiveGame(game)} className="flex items-center justify-between p-4 bg-black/20 border border-white/5 hover:border-emerald-500 rounded-xl px-6 transition-all group">
                        <span className="text-[10px] font-black uppercase truncate tracking-tighter">{game.title}</span>
                        <Play className="h-4 w-4 text-emerald-500 opacity-0 group-hover:opacity-100 transition-all" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {games.length === 0 && <div className="p-20 text-center opacity-30 font-black uppercase text-xs italic">Nenhum combate registrado na arena.</div>}
          </div>
          <Button onClick={() => setGamesMenuOpen(false)} className="mt-6 w-full h-14 bg-zinc-800 font-black uppercase rounded-2xl">SAIR DA ARENA</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={!!activeGame} onOpenChange={() => setActiveGame(null)}>
        <DialogContent className="max-w-6xl h-[90vh] bg-black p-0 border-0 rounded-none md:rounded-[3rem] overflow-hidden shadow-2xl">
           {activeGame && (
             <div className="w-full h-full relative">
                <div className="absolute top-4 left-4 z-50 bg-black/60 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 flex items-center gap-3">
                   <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                   <span className="text-[10px] font-black uppercase text-emerald-500 tracking-widest">{activeGame.title} - {activeGame.console}</span>
                </div>
                <button onClick={() => setActiveGame(null)} className="absolute top-4 right-4 z-50 bg-red-500/80 p-2 rounded-full text-white hover:scale-110 transition-all"><X className="h-5 w-5" /></button>
                <iframe src={activeGame.url} className="w-full h-full border-0" allowFullScreen />
             </div>
           )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!activeVideo} onOpenChange={() => setActiveVideo(null)}>
        <DialogContent className="max-w-5xl bg-black p-0 border-0 rounded-none md:rounded-[3rem] overflow-hidden shadow-2xl">
          {activeVideo && activeVideo.items[activeVideo.index] && <VideoPlayer url={activeVideo.items[activeVideo.index].streamUrl} title={activeVideo.items[activeVideo.index].title} onNext={() => activeVideo.index < activeVideo.items.length - 1 && setActiveVideo({...activeVideo, index: activeVideo.index + 1})} onPrev={() => activeVideo.index > 0 && setActiveVideo({...activeVideo, index: activeVideo.index - 1})} />}
        </DialogContent>
      </Dialog>

      <Dialog open={showAcesso} onOpenChange={setShowAcesso}>
        <DialogContent className="max-w-md bg-card rounded-[2.5rem] p-8 shadow-2xl">
           <DialogHeader><DialogTitle className="text-xl font-black uppercase italic text-primary">Dados da Minha Conta</DialogTitle></DialogHeader>
           <div className="py-6 space-y-6">
              <div className="flex justify-between items-center p-4 bg-muted rounded-2xl">
                 <span className="text-[10px] font-black uppercase opacity-40">Seu PIN:</span>
                 <span className="font-mono font-black text-xl text-primary tracking-widest">{user?.pin}</span>
              </div>
              <div className="grid grid-cols-2 gap-4">
                 <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                    <p className="text-[8px] font-black uppercase opacity-40">Validade</p>
                    <p className="text-xs font-black uppercase text-primary">{user?.expiryDate ? new Date(user.expiryDate).toLocaleDateString() : 'Livre'}</p>
                 </div>
                 <div className="p-4 bg-primary/5 rounded-2xl border border-primary/10">
                    <p className="text-[8px] font-black uppercase opacity-40">Telas</p>
                    <p className="text-xs font-black uppercase text-primary">{user?.maxScreens} Unidades</p>
                 </div>
              </div>
              <div className="space-y-3">
                 <p className="text-[10px] font-black uppercase opacity-40 text-center">Protocolo de Segurança</p>
                 <div className="flex flex-wrap justify-center gap-2">
                    <Badge className={user?.isAdultEnabled ? 'bg-red-500' : 'bg-muted opacity-30'}>ADULTO</Badge>
                    <Badge className={user?.isGamesEnabled ? 'bg-emerald-500' : 'bg-muted opacity-30'}>GAMES</Badge>
                    <Badge className={user?.isPpvEnabled ? 'bg-orange-500' : 'bg-muted opacity-30'}>PPV</Badge>
                    <Badge className={user?.isAlacarteEnabled ? 'bg-blue-500' : 'bg-muted opacity-30'}>ALACARTE</Badge>
                 </div>
              </div>
           </div>
           <Button onClick={() => setShowAcesso(false)} className="w-full h-14 bg-primary font-black uppercase rounded-2xl">FECHAR PAINEL</Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
  return <span className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest text-white shadow-md ${className}`}>{children}</span>
}
