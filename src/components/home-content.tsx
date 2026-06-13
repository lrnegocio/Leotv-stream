
"use client"

import * as React from "react"
import { Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { LogOut, Tv, Lock, Loader2, ChevronLeft, Film, Layers, Baby, Music, Heart, Radio, Sparkles, Gamepad2, X, Trophy, Play, Video, Smile, Zap, Headphones, Info, PlayCircle, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getRemoteContent, ContentItem, User, getGlobalSettings, getCategoryCount, getContentById, formatMasterLink, Episode } from "@/lib/store"
import { toast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { VideoPlayer } from "@/components/video-player"
import { VoiceSearch } from "@/components/voice-search"
import Image from "next/image"
import { ScrollArea } from "@/components/ui/scroll-area"

const CATEGORIES = [
  { id: 'LIVE', name: 'CANAIS AO VIVO', icon: Tv, color: 'bg-emerald-500', genre: 'LÉO TV AO VIVO' },
  { id: 'MOVIES', name: 'FILMES MASTER', icon: Film, color: 'bg-blue-500', genre: 'LÉO TV FILMES' },
  { id: 'SERIES', name: 'SÉRIES', icon: Layers, color: 'bg-purple-500', genre: 'LÉO TV SÉRIES' },
  { id: 'GAMES', name: 'ARENA GAMES', icon: Gamepad2, color: 'bg-orange-500', genre: 'LÉO TV PAY PER VIEW' },
  { id: 'ALACARTE', name: 'ALACARTES', icon: Star, color: 'bg-blue-600', genre: 'LÉO TV ALACARTES', specialAccess: 'isAlacarteEnabled' },
  { id: 'ESPORTES', name: 'LÉO TV ESPORTES', icon: Trophy, color: 'bg-orange-600', genre: 'LÉO TV ESPORTES' },
  { id: 'MUSICAS', name: 'LÉO TV MÚSICAS', icon: Headphones, color: 'bg-indigo-500', genre: 'LÉO TV MUSICAS' },
  { id: 'CLIPES', name: 'LÉO TV VÍDEO CLIPES', icon: Music, color: 'bg-pink-500', genre: 'LÉO TV VÍDEO CLIPES' },
  { id: 'PIADAS', name: 'LÉO TV PIADAS', icon: Smile, color: 'bg-yellow-500', genre: 'LÉO TV PIADAS' },
  { id: 'REELS', name: 'LÉO TV REELS', icon: Video, color: 'bg-cyan-500', genre: 'LÉO TV REELS' },
  { id: 'NOVELAS', name: 'NOVELAS', icon: Heart, color: 'bg-red-500', genre: 'LÉO TV NOVELAS' },
  { id: 'DORAMAS', name: 'DORAMAS', icon: Sparkles, color: 'bg-indigo-400', genre: 'LÉO TV DORAMAS' },
  { id: 'KIDS', name: 'MUNDO INFANTIL', icon: Baby, color: 'bg-sky-500', genre: 'LÉO TV DESENHOS' },
  { id: 'RADIO', name: 'LÉO TV RÁDIOS', icon: Radio, color: 'bg-orange-400', genre: 'LÉO TV RÁDIOS' },
  { id: 'ADULT', name: 'ADULTOS', icon: Lock, color: 'bg-zinc-800', genre: 'LÉO TV ADULTOS', restricted: true },
]

function HomeContentInner() {
  const [content, setContent] = React.useState<ContentItem[]>([])
  const [user, setUser] = React.useState<User | null>(null)
  const [settings, setSettings] = React.useState<any>(null)
  const [activeVideo, setActiveVideo] = React.useState<{ items: any[], index: number } | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [selectedCat, setSelectedCat] = React.useState<string | null>(null)
  const [isPinOpen, setIsPinOpen] = React.useState(false)
  const [pinInput, setPinInput] = React.useState("")
  const [selectedSeries, setSelectedSeries] = React.useState<ContentItem | null>(null)
  const [catCounts, setCatCounts] = React.useState<Record<string, number>>({})
  const [unlockTarget, setUnlockTarget] = React.useState<string | null>(null)
  const [unlockTargetItem, setUnlockTargetItem] = React.useState<ContentItem | null>(null)
  const [showAcesso, setShowAcesso] = React.useState(false)
  const [isMounted, setIsMounted] = React.useState(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const q = searchParams ? (searchParams.get('q') || "") : ""

  const loadData = React.useCallback(async (queryStr = "", categoryId: string | null = null) => {
    setLoading(true);
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
    } catch (err) { } finally { setLoading(false); }
  }, []);

  React.useEffect(() => {
    setIsMounted(true);
    const session = localStorage.getItem("user_session");
    if (session) {
      setUser(JSON.parse(session));
    } else {
      router.push("/login");
    }
  }, [router]);

  React.useEffect(() => {
    if (!isMounted) return;
    const delayDebounceFn = setTimeout(() => loadData(q, selectedCat), 500);
    return () => clearTimeout(delayDebounceFn);
  }, [q, selectedCat, loadData, isMounted]);

  const verifyPassword = async () => {
    if (pinInput === settings?.parentalPin) {
      if (unlockTarget === 'ITEM' && unlockTargetItem) {
        openItem(unlockTargetItem, true);
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
      const currentList = content.map(i => ({ 
        id: i.id,
        title: i.title, 
        streamUrl: formatMasterLink(i.streamUrl) 
      }));
      const idx = content.findIndex(i => i.id === item.id);
      setActiveVideo({ items: currentList, index: idx !== -1 ? idx : 0 });
    }
  };

  const playEpisode = (ep: Episode) => {
    if (!selectedSeries) return;
    
    let allEps: any[] = [];
    if (selectedSeries.type === 'series') {
      allEps = (selectedSeries.episodes || []).map(e => ({
        id: e.id,
        title: `${selectedSeries.title} - ${e.title || `Episódio ${e.number}`}`,
        streamUrl: formatMasterLink(e.streamUrl)
      }));
    } else {
      (selectedSeries.seasons || []).forEach(s => {
        (s.episodes || []).forEach(e => {
          allEps.push({
            id: e.id,
            title: `${selectedSeries.title} - T${s.number} E${e.number} ${e.title || ''}`,
            streamUrl: formatMasterLink(e.streamUrl)
          });
        });
      });
    }
    
    const idx = allEps.findIndex(e => e.id === ep.id);
    setActiveVideo({ items: allEps, index: idx !== -1 ? idx : 0 });
  };

  const handleCategoryClick = (cat: any) => {
    if (!user) return;
    if (cat.specialAccess && !(user as any)[cat.specialAccess] && user.role !== 'admin') {
      return toast({ variant: "destructive", title: "ACESSO NÃO CONTRATADO" });
    }
    if (cat.restricted) {
      if (!user?.isAdultEnabled && user.role !== 'admin') return toast({ variant: "destructive", title: "CONTEÚDO BLOQUEADO" });
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
          <p className="text-[10px] font-black uppercase text-primary animate-pulse tracking-widest">Sintonizando v385-S...</p>
        </div>
      )}

      <header className="h-20 border-b border-border bg-card/60 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-50">
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
              {content.length === 0 && <div className="col-span-full py-40 text-center opacity-40 font-black uppercase text-xs">Nenhum sinal localizado v385.</div>}
            </div>
          </div>
        )}
      </main>

      <Dialog open={!!selectedSeries} onOpenChange={() => setSelectedSeries(null)}>
        <DialogContent className="max-w-4xl bg-card border-white/10 rounded-[3rem] p-0 overflow-hidden shadow-2xl">
          {selectedSeries && (
            <div className="flex flex-col md:flex-row h-[80vh]">
              <div className="md:w-1/3 relative bg-black/40">
                {selectedSeries.imageUrl ? <Image src={selectedSeries.imageUrl} alt={selectedSeries.title} fill className="object-cover opacity-60" unoptimized /> : <div className="flex items-center justify-center h-full"><Layers className="h-20 w-20 opacity-20" /></div>}
                <div className="absolute inset-0 bg-gradient-to-t from-card via-transparent p-8 flex flex-col justify-end">
                  <h2 className="text-2xl font-black uppercase italic text-primary leading-tight">{selectedSeries.title}</h2>
                  <p className="text-[10px] font-bold opacity-60 uppercase mt-2">{selectedSeries.genre}</p>
                </div>
              </div>
              <div className="flex-1 p-8 flex flex-col overflow-hidden">
                <div className="flex items-center justify-between mb-6">
                   <h3 className="text-sm font-black uppercase italic tracking-widest flex items-center gap-2"><PlayCircle className="h-5 w-5 text-primary" /> Lista de Episódios</h3>
                   <Button variant="ghost" size="icon" onClick={() => setSelectedSeries(null)} className="rounded-full"><X className="h-5 w-5" /></Button>
                </div>
                <ScrollArea className="flex-1 pr-4">
                  {selectedSeries.type === 'series' ? (
                    <div className="grid gap-3">
                      {selectedSeries.episodes?.map((ep) => (
                        <button key={ep.id} onClick={() => playEpisode(ep)} className="flex items-center gap-4 p-4 bg-muted/40 rounded-2xl border border-white/5 hover:bg-primary/10 hover:border-primary/30 transition-all text-left group">
                          <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center font-black text-sm text-white group-hover:scale-110 transition-transform">{ep.number}</div>
                          <div className="flex-1">
                            <p className="text-xs font-black uppercase">{ep.title || `Episódio ${ep.number}`}</p>
                            <p className="text-[8px] font-bold opacity-40 uppercase">Assistir agora</p>
                          </div>
                          <PlayCircle className="h-5 w-5 text-primary opacity-40 group-hover:opacity-100" />
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="space-y-8">
                      {selectedSeries.seasons?.map((season) => (
                        <div key={season.id} className="space-y-4">
                          <h4 className="text-xs font-black uppercase text-primary italic bg-primary/10 w-fit px-4 py-1 rounded-full">Temporada {season.number}</h4>
                          <div className="grid gap-3">
                            {season.episodes?.map((ep) => (
                              <button key={ep.id} onClick={() => playEpisode(ep)} className="flex items-center gap-4 p-4 bg-muted/40 rounded-2xl border border-white/5 hover:bg-primary/10 hover:border-primary/30 transition-all text-left group">
                                <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center font-black text-sm text-white group-hover:scale-110 transition-transform">{ep.number}</div>
                                <div className="flex-1">
                                  <p className="text-xs font-black uppercase">{ep.title || `Episódio ${ep.number}`}</p>
                                  <p className="text-[8px] font-bold opacity-40 uppercase">Assistir agora</p>
                                </div>
                                <PlayCircle className="h-5 w-5 text-primary opacity-40 group-hover:opacity-100" />
                              </button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isPinOpen} onOpenChange={setIsPinOpen}>
        <DialogContent className="sm:max-w-md bg-card rounded-[2.5rem] p-10 text-center shadow-2xl">
          <Lock className="h-16 w-16 text-primary mx-auto mb-6" />
          <div className="text-2xl font-black uppercase italic mb-4 text-primary">Acesso Restrito v385</div>
          <input type="password" title="Senha" maxLength={4} className="h-20 w-56 bg-muted border-border text-center text-4xl font-black tracking-[0.5em] rounded-3xl outline-none focus:border-primary mb-8" value={pinInput} onChange={e => setPinInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && verifyPassword()} />
          <Button onClick={verifyPassword} className="w-full h-16 bg-primary text-sm font-black uppercase rounded-2xl shadow-xl">DESBLOQUEAR v385</Button>
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
           <DialogHeader><DialogTitle className="text-xl font-black uppercase italic text-primary">Minha Conta v385</DialogTitle></DialogHeader>
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
