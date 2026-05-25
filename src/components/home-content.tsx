"use client"

import * as React from "react"
import { Suspense } from "react"
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

function HomeContentInner() {
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
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const q = searchParams ? (searchParams.get('q') || "") : ""

  const flattenedPlaylist = React.useMemo(() => {
    if (!selectedSeries) return [];
    if (selectedSeries.type === 'series') {
      return (selectedSeries.episodes || [])
        .sort((a, b) => a.number - b.number)
        .map(e => ({
          ...e,
          streamUrl: formatMasterLink(e.streamUrl),
          title: `${selectedSeries.title} - EP ${e.number} ${e.title || ''}`
        }));
    }
    if (selectedSeries.type === 'multi-season') {
      const all: any[] = [];
      const sortedSeasons = [...(selectedSeries.seasons || [])].sort((a, b) => a.number - b.number);
      sortedSeasons.forEach(s => {
        const sortedEps = [...(s.episodes || [])].sort((a, b) => a.number - b.number);
        sortedEps.forEach(e => {
          all.push({
            ...e,
            seasonNum: s.number,
            streamUrl: formatMasterLink(e.streamUrl),
            title: `${selectedSeries.title} - T${s.number} EP ${e.number} ${e.title || ''}`
          });
        });
      });
      return all;
    }
    return [];
  }, [selectedSeries]);

  const syncUserPermissions = React.useCallback(async (currentUser: User) => {
    try {
      const res = await validateDeviceLogin(currentUser.pin, (currentUser as any).deviceId || "vps_device");
      if (res.user) setUser(res.user);
    } catch (e) { }
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
    const session = localStorage.getItem("user_session");
    if (session) {
      const parsed = JSON.parse(session);
      setUser(parsed);
      syncUserPermissions(parsed);
    } else {
      router.push("/login");
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
      const currentList = content.map(i => ({ ...i, streamUrl: formatMasterLink(i.streamUrl) }));
      const idx = content.findIndex(i => i.id === item.id);
      setActiveVideo({ items: currentList, index: idx !== -1 ? idx : 0 });
    }
  };

  const handleCategoryClick = (cat: any) => {
    if (!user) return;
    if (cat.specialAccess && !(user as any)[cat.specialAccess] && user.role !== 'admin') {
      return toast({ variant: "destructive", title: "ACESSO NÃO CONTRATADO" });
    }
    if (cat.special === 'games' || cat.restricted) {
      if (cat.special === 'games' && !user?.isGamesEnabled && user.role !== 'admin') return toast({ variant: "destructive", title: "ARENA BLOQUEADA" });
      if (cat.restricted && !user?.isAdultEnabled && user.role !== 'admin') return toast({ variant: "destructive", title: "CONTEÚDO BLOQUEADO" });
      setUnlockTarget(cat.id);
      setIsPinOpen(true);
    } else {
      setSelectedCat(cat.id);
    }
  };

  if (!isMounted) return null;
  const isGamesOnly = user?.isGamesOnly === true;
  const visibleCategories = CATEGORIES.filter(c => {
    if (isGamesOnly) return c.id === 'GAMES';
    return user?.role === 'admin' || !c.specialAccess || (user && (user as any)[c.specialAccess]);
  });

  return (
    <div className="min-h-screen bg-background pb-20 select-none">
      {loading && (
        <div className="fixed inset-0 z-[200] bg-background flex flex-col items-center justify-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-[10px] font-black uppercase text-primary animate-pulse tracking-widest">Sintonizando v370 Suprema...</p>
        </div>
      )}

      <header className="h-20 border-border bg-card/60 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          {(selectedCat || q) && <button onClick={() => { setSelectedCat(null); router.replace('/user/home'); }} className="h-12 w-12 rounded-full bg-muted flex items-center justify-center hover:bg-primary hover:text-white transition-all"><ChevronLeft className="h-6 w-6" /></button>}
          <span className="text-xl font-black text-primary uppercase italic tracking-tighter">Léo TV Stream</span>
        </div>
        <div className="flex-1 max-w-xl mx-4">
          <Suspense fallback={<div className="h-14 bg-muted animate-pulse rounded-2xl" />}>
            {!isGamesOnly && <VoiceSearch />}
          </Suspense>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowAcesso(true)} className="h-12 w-12 rounded-2xl border border-primary/20 flex items-center justify-center text-primary hover:bg-primary/10 transition-all"><Info className="h-6 w-6" /></button>
          <button onClick={() => { localStorage.removeItem("user_session"); router.push("/login"); }} className="text-destructive h-12 w-12 rounded-2xl flex items-center justify-center bg-destructive/10 hover:bg-destructive hover:text-white transition-all"><LogOut className="h-6 w-6" /></button>
        </div>
      </header>

      <main className="p-8 max-w-[1600px] mx-auto space-y-8">
        {!isGamesOnly && user?.individualMessage && !selectedCat && !q && (
          <div className="bg-primary/10 border-2 border-primary/20 p-6 rounded-[2rem] flex items-center gap-6 animate-in slide-in-from-top-4 shadow-xl">
             <div className="bg-primary p-3 rounded-2xl shadow-lg"><BellRing className="h-6 w-6 text-white" /></div>
             <div className="flex-1">
                <p className="text-[10px] font-black uppercase text-primary tracking-widest mb-1">Recado do Mestre Léo</p>
                <p className="text-sm font-bold leading-relaxed">{user.individualMessage}</p>
             </div>
          </div>
        )}

        {!selectedCat && !q ? (
          <div className={`grid gap-6 ${isGamesOnly ? 'grid-cols-1 max-w-lg mx-auto py-20' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'}`}>
            {visibleCategories.map(c => (
              <button key={c.id} onClick={() => handleCategoryClick(c)} className={`group relative ${isGamesOnly ? 'h-80' : 'h-44'} rounded-[2.5rem] overflow-hidden border border-border bg-card hover:border-primary transition-all shadow-xl`}>
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                  <div className={`p-4 rounded-3xl ${c.color} text-white shadow-lg group-hover:scale-110 transition-transform`}><c.icon className={`${isGamesOnly ? 'h-24 w-16' : 'h-8 w-8'}`} /></div>
                  <span className={`${isGamesOnly ? 'text-3xl' : 'text-sm'} font-black uppercase tracking-widest`}>{c.name}</span>
                  {!isGamesOnly && <span className="bg-muted px-4 py-1 rounded-full text-[9px] font-black opacity-40">{(catCounts[c.id] || 0).toLocaleString()} Sinais</span>}
                </div>
              </button>
            ))}
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

      <Dialog open={!!selectedSeries} onOpenChange={() => setSelectedSeries(null)}>
        <DialogContent className="max-w-xl bg-card border-white/10 rounded-[2.5rem] p-8 shadow-2xl flex flex-col max-h-[85vh]">
          <DialogHeader><DialogTitle className="text-xl font-black uppercase italic text-primary">Episódios da Série v370</DialogTitle></DialogHeader>
          <div className="mt-6 flex-1 overflow-y-auto pr-2 custom-scroll scrollbar-visible space-y-3">
             {selectedSeries?.type === 'series' && (selectedSeries.episodes || []).sort((a,b) => a.number - b.number).map((ep, idx) => (
                <button key={ep.id} onClick={() => setActiveVideo({ items: flattenedPlaylist, index: idx })} className="w-full flex items-center justify-between p-5 bg-muted/40 rounded-2xl hover:bg-primary hover:text-white transition-all group border border-border/50">
                  <span className="font-black uppercase text-[11px] tracking-widest text-left">EPISÓDIO {ep.number} - {ep.title || 'SINAL MASTER'}</span>
                  <PlayCircle className="h-6 w-6 text-primary group-hover:text-white transition-colors" />
                </button>
              ))}

             {selectedSeries?.type === 'multi-season' && (selectedSeries.seasons || []).sort((a,b) => a.number - b.number).map(season => (
                <div key={season.id} className="space-y-2 mb-6">
                  <p className="text-[11px] font-black text-primary uppercase pl-3 border-l-4 border-primary ml-1 italic tracking-widest">Temporada {season.number}</p>
                  <div className="grid gap-2">
                    {(season.episodes || []).sort((a,b) => a.number - b.number).map(ep => {
                       const globalIdx = flattenedPlaylist.findIndex(item => item.id === ep.id);
                       return (
                        <button key={ep.id} onClick={() => setActiveVideo({ items: flattenedPlaylist, index: globalIdx })} className="w-full flex items-center justify-between p-4 bg-muted/40 rounded-xl hover:bg-primary hover:text-white transition-all group border border-border/30">
                          <span className="font-bold uppercase text-[10px] tracking-tighter text-left">EP {ep.number} - {ep.title || 'SINAL MASTER'}</span>
                          <PlayCircle className="h-5 w-5 text-primary group-hover:text-white transition-colors" />
                        </button>
                       )
                    })}
                  </div>
                </div>
              ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isPinOpen} onOpenChange={setIsPinOpen}>
        <DialogContent className="sm:max-w-md bg-card rounded-[2.5rem] p-10 text-center shadow-2xl">
          <Lock className="h-16 w-16 text-primary mx-auto mb-6" />
          <div className="text-2xl font-black uppercase italic mb-4 text-primary">Acesso Restrito v370</div>
          <input type="password" title="Senha" maxLength={4} className="h-20 w-56 bg-muted border-border text-center text-4xl font-black tracking-[0.5em] rounded-3xl outline-none focus:border-primary mb-8" value={pinInput} onChange={e => setPinInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && verifyPassword()} />
          <Button onClick={verifyPassword} className="full h-16 bg-primary text-sm font-black uppercase rounded-2xl shadow-xl">DESBLOQUEAR v370</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={!!activeVideo} onOpenChange={() => setActiveVideo(null)}>
        <DialogContent className="max-w-5xl bg-black p-0 border-0 rounded-none md:rounded-[3rem] overflow-hidden shadow-2xl">
          {activeVideo && activeVideo.items[activeVideo.index] && (
            <VideoPlayer 
              url={activeVideo.items[activeVideo.index].streamUrl} 
              title={activeVideo.items[activeVideo.index].title} 
              onNext={activeVideo.index < activeVideo.items.length - 1 ? () => setActiveVideo({...activeVideo, index: activeVideo.index + 1}) : undefined} 
              onPrev={activeVideo.index > 0 ? () => setActiveVideo({...activeVideo, index: activeVideo.index - 1}) : undefined} 
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showAcesso} onOpenChange={setShowAcesso}>
        <DialogContent className="max-w-md bg-card rounded-[2.5rem] p-8 shadow-2xl">
           <DialogHeader><DialogTitle className="text-xl font-black uppercase italic text-primary">Minha Conta v370</DialogTitle></DialogHeader>
           <div className="py-6 space-y-6">
              <div className="flex justify-between items-center p-4 bg-muted rounded-2xl">
                 <span className="text-[10px] font-black uppercase opacity-40">Seu PIN:</span>
                 <span className="font-mono font-black text-xl text-primary tracking-widest">{user?.pin}</span>
              </div>
           </div>
           <Button onClick={() => setShowAcesso(false)} className="w-full h-14 bg-primary font-black uppercase rounded-2xl">FECHAR PAINEL</Button>
        </DialogContent>
      </Dialog>
    </div>
  )
}

export default function HomeContent() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}>
      <HomeContentInner />
    </Suspense>
  );
}
