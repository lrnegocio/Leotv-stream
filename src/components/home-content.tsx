
"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { LogOut, Tv, Play, Lock, Loader2, Search, Folder, EyeOff, Eye, Timer, Key, ListOrdered, ChevronRight, PlayCircle, ShieldAlert, Smartphone, Monitor, Globe, Download, Info, Zap, Share, ArrowDownToLine, X, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { getRemoteContent, ContentItem, User, getGlobalSettings, Episode, Season } from "@/lib/store"
import { toast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { VideoPlayer } from "@/components/video-player"
import { VoiceSearch } from "@/components/voice-search"
import Image from "next/image"

interface ActiveVideo {
  url: string;
  title: string;
  itemId: string;
  episodeIndex?: number;
  seasonIndex?: number;
  type: string;
}

export default function HomeContent() {
  const [content, setContent] = React.useState<ContentItem[]>([])
  const [user, setUser] = React.useState<User | null>(null)
  const [activeVideo, setActiveVideo] = React.useState<ActiveVideo | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [showAdult, setShowAdult] = React.useState(false)
  const [parentalPin, setParentalPin] = React.useState("")
  const [pinInput, setPinInput] = React.useState("")
  const [isPinDialogOpen, setIsPinDialogOpen] = React.useState(false)
  const [isInstallDialogOpen, setIsInstallDialogOpen] = React.useState(false)
  
  const [deferredPrompt, setDeferredPrompt] = React.useState<any>(null);
  
  const [selectedSeries, setSelectedSeries] = React.useState<ContentItem | null>(null)
  const [pendingItem, setPendingItem] = React.useState<ContentItem | null>(null)
  const [pendingEpisodeData, setPendingEpisodeData] = React.useState<{ep: Episode, series: ContentItem, eIdx: number, sIdx?: number} | null>(null)
  const [pendingAdultToggle, setPendingAdultToggle] = React.useState(false)
  const [timeLeft, setTimeLeft] = React.useState("SINTONIZANDO...")
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const searchQuery = searchParams.get('q')?.toLowerCase() || ""

  React.useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) || (e.ctrlKey && e.key === 'u')) {
        e.preventDefault();
        toast({ variant: "destructive", title: "ACESSO NEGADO", description: "O console foi bloqueado por segurança." });
      }
    };

    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleLogout = React.useCallback(async () => {
    localStorage.removeItem("user_session")
    router.push("/login")
  }, [router])

  const updateURL = React.useCallback((contentId: string | null) => {
    const params = new URLSearchParams(window.location.search);
    if (contentId) params.set('v', contentId);
    else params.delete('v');
    const newURL = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState({ path: newURL }, '', newURL);
  }, []);

  React.useEffect(() => {
    const handleBeforeInstall = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    const session = localStorage.getItem("user_session")
    if (!session) { router.push("/login"); return; }
    const userData = JSON.parse(session)
    setUser(userData)

    const load = async () => {
      try {
        const data = await getRemoteContent()
        const settings = await getGlobalSettings()
        setParentalPin(settings.parentalPin || "1234")
        setContent(data)
        setLoading(false)

        const contentId = searchParams.get('v');
        if (contentId) {
          const item = data.find(i => i.id === contentId);
          if (item) {
            if (item.type === 'channel' || item.type === 'movie') {
              if (item.isRestricted) {
                setPendingItem(item);
                setIsPinDialogOpen(true);
              } else {
                setActiveVideo({ url: item.streamUrl || item.directStreamUrl || "", title: item.title, itemId: item.id, type: item.type });
              }
            } else {
              setSelectedSeries(item);
            }
          }
        }
      } catch (err) {
        setLoading(false)
        toast({ variant: "destructive", title: "Erro de Sintonização" })
      }
    }
    load()

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, [router, searchParams])

  React.useEffect(() => {
    const interval = setInterval(() => {
      const session = localStorage.getItem("user_session")
      if (!session) return;
      const u = JSON.parse(session);

      if (u.subscriptionTier === 'lifetime' || u.pin === 'adm77x2p') {
        setTimeLeft("ACESSO VITALÍCIO");
        return;
      }
      
      if (!u.expiryDate) {
        setTimeLeft("ESTOQUE");
        return;
      }
      
      const now = new Date();
      const expiry = new Date(u.expiryDate);
      const diff = expiry.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft("SINAL EXPIRADO");
        handleLogout();
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    }, 1000)
    return () => clearInterval(interval)
  }, [handleLogout])

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setDeferredPrompt(null);
        setIsInstallDialogOpen(false);
        toast({ title: "INSTALAÇÃO INICIADA!", description: "O Léo TV está sendo adicionado como um programa ao seu sistema." });
      }
    } else {
      toast({ 
        title: "USE O MENU DO NAVEGADOR", 
        description: "Vá em Opções e clique em 'Instalar App' ou 'Adicionar à Tela de Início' para abrir como programa.",
        variant: "default"
      });
    }
  };

  const filteredContent = React.useMemo(() => {
    return content.filter(item => {
      if (item.isRestricted && user && !user.isAdultEnabled) return false;
      const titleMatch = item.title.toLowerCase().includes(searchQuery);
      const genreMatch = item.genre && item.genre.toLowerCase().includes(searchQuery);
      const matchesSearch = titleMatch || genreMatch;
      if (item.isRestricted && !showAdult) return false;
      return matchesSearch;
    })
  }, [content, searchQuery, showAdult, user])

  const categoriesWithCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    filteredContent.forEach(item => {
      const cat = (item.genre || "GERAL").toUpperCase();
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts).sort((a,b) => a[0].localeCompare(b[0]));
  }, [filteredContent])

  const handleItemClick = (item: ContentItem) => {
    if (item.isRestricted) {
      setActiveVideo(null); // Fecha o player atual obrigatoriamente
      setPendingItem(item);
      setIsPinDialogOpen(true);
      return;
    }
    updateURL(item.id);
    if (item.type === 'series' || item.type === 'multi-season') {
      setSelectedSeries(item);
    } else {
      setActiveVideo({ url: item.streamUrl || item.directStreamUrl || "", title: item.title, itemId: item.id, type: item.type });
    }
  }

  const handleEpisodeClick = (ep: Episode, series: ContentItem, epIndex: number, seasonIndex?: number) => {
    if (series.isRestricted) {
      setActiveVideo(null); // Fecha o player
      setPendingEpisodeData({ ep, series, eIdx: epIndex, sIdx: seasonIndex });
      setIsPinDialogOpen(true);
      return;
    }
    setActiveVideo({ 
      url: ep.streamUrl || ep.directStreamUrl || "", 
      title: `${series.title} - EP ${ep.number}`, 
      itemId: series.id,
      episodeIndex: epIndex,
      seasonIndex: seasonIndex,
      type: series.type
    })
  }

  const navigateContent = (direction: 'next' | 'prev') => {
    if (!activeVideo) return
    const currentItem = content.find(i => i.id === activeVideo.itemId);
    if (!currentItem) return;

    if ((activeVideo.type === 'series' || activeVideo.type === 'multi-season') && activeVideo.episodeIndex !== undefined) {
      if (activeVideo.type === 'series' && currentItem.episodes) {
        const nextIdx = direction === 'next' ? activeVideo.episodeIndex + 1 : activeVideo.episodeIndex - 1;
        if (nextIdx >= 0 && nextIdx < currentItem.episodes.length) {
          handleEpisodeClick(currentItem.episodes[nextIdx], currentItem, nextIdx);
          return;
        }
      } else if (activeVideo.type === 'multi-season' && currentItem.seasons) {
        const sIdx = activeVideo.seasonIndex || 0;
        const eIdx = activeVideo.episodeIndex;
        const season = currentItem.seasons[sIdx];
        if (season) {
          const nextEIdx = direction === 'next' ? eIdx + 1 : eIdx - 1;
          if (nextEIdx >= 0 && nextEIdx < season.episodes.length) {
            handleEpisodeClick(season.episodes[nextEIdx], currentItem, nextEIdx, sIdx);
            return;
          }
        }
      }
    }

    const currentIndex = filteredContent.findIndex(i => i.id === activeVideo.itemId)
    let nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1
    if (nextIndex >= filteredContent.length) nextIndex = 0
    if (nextIndex < 0) nextIndex = filteredContent.length - 1
    const nextItem = filteredContent[nextIndex]
    if (nextItem) handleItemClick(nextItem)
  }

  const verifyPin = () => {
    if (pinInput === parentalPin) {
      if (pendingAdultToggle) {
        setShowAdult(true);
        setPendingAdultToggle(false);
      } else if (pendingEpisodeData) {
        const { ep, series, eIdx, sIdx } = pendingEpisodeData;
        setActiveVideo({ url: ep.streamUrl || ep.directStreamUrl || "", title: `${series.title} - EP ${ep.number}`, itemId: series.id, episodeIndex: eIdx, seasonIndex: sIdx, type: series.type });
        setPendingEpisodeData(null);
      } else if (pendingItem) {
        const item = pendingItem;
        updateURL(item.id);
        if (item.type === 'series' || item.type === 'multi-season') setSelectedSeries(item);
        else setActiveVideo({ url: item.streamUrl || item.directStreamUrl || "", title: item.title, itemId: item.id, type: item.type });
        setPendingItem(null);
      }
      setIsPinDialogOpen(false);
      setPinInput("");
    } else {
      toast({ variant: "destructive", title: "PIN INCORRETO" });
      setPinInput("");
    }
  }

  const handleAdultToggleRequest = (checked: boolean) => {
    if (checked) {
      setPendingAdultToggle(true);
      setIsPinDialogOpen(true);
    } else {
      setShowAdult(false);
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#1E161D]"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>

  const isMaster = user?.pin === 'adm77x2p';
  const displayPinForUrl = isMaster ? 'COLOQUE_O_PIN_AQUI' : (user?.pin || 'PIN_DO_CLIENTE');
  const userPlaylistUrl = `${window.location.origin}/api/playlist?pin=${displayPinForUrl}`;

  return (
    <div className="min-h-screen bg-cinematic text-foreground pb-20 select-none">
      <header className="h-24 border-b border-white/5 bg-card/30 backdrop-blur-3xl flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="bg-primary p-2.5 rounded-2xl shadow-xl shadow-primary/30 rotate-2 hover:rotate-0 transition-transform"><Tv className="h-7 w-7 text-white" /></div>
          <div className="hidden lg:block">
            <span className="text-2xl font-black text-primary font-headline uppercase italic tracking-tighter block leading-none">Léo Tv Stream</span>
            <div className="flex items-center gap-2 mt-1 px-3 py-1 rounded-full bg-black/40 border border-primary/20 text-primary">
               <Timer className="h-3 w-3 animate-pulse" />
               <span className="text-[9px] font-black uppercase tracking-widest">{timeLeft}</span>
            </div>
          </div>
        </div>
        
        <div className="flex-1 max-w-xl mx-4">
          <VoiceSearch />
        </div>

        <div className="flex items-center gap-6">
          <Button variant="outline" size="sm" onClick={() => setIsInstallDialogOpen(true)} className="hidden md:flex h-11 border-primary/20 text-primary uppercase text-[10px] font-black rounded-2xl hover:bg-primary/10">
             <Smartphone className="h-4 w-4 mr-2" /> Instalar App
          </Button>
          
          {user?.isAdultEnabled && (
            <div className="hidden sm:flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
               <Label htmlFor="adult-mode" className="text-[10px] font-black uppercase opacity-60 cursor-pointer flex items-center gap-2">
                  {showAdult ? <Eye className="h-4 w-4 text-primary" /> : <EyeOff className="h-4 w-4" />}
                  ADULTO: {showAdult ? "ON" : "OFF"}
               </Label>
               <Switch id="adult-mode" checked={showAdult} onCheckedChange={handleAdultToggleRequest} />
            </div>
          )}
          <Button variant="ghost" size="icon" onClick={handleLogout} className="text-destructive h-12 w-12 rounded-2xl hover:bg-destructive/10"><LogOut className="h-6 w-6" /></Button>
        </div>
      </header>

      <main className="p-4 sm:p-8 max-w-[1800px] mx-auto space-y-16">
        {categoriesWithCounts.length === 0 ? (
          <div className="py-40 text-center opacity-20 uppercase font-black text-2xl tracking-widest italic">Nenhum sinal localizado no momento...</div>
        ) : (
          categoriesWithCounts.map(([category, count]) => {
            const categoryItems = filteredContent.filter(item => (item.genre || "GERAL").toUpperCase() === category)
            return (
              <section key={category} className="space-y-6">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg"><Folder className="h-6 w-6 text-primary" /></div>
                    <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">{category}</h2>
                  </div>
                  <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-4 py-1.5 rounded-full font-black uppercase tracking-widest shadow-lg shadow-primary/5">
                    {count} SINAIS ATIVOS
                  </span>
                </div>
                
                <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8">
                  {categoryItems.map(item => (
                    <div 
                      key={item.id} 
                      onClick={() => handleItemClick(item)} 
                      className="group relative aspect-[2/3] bg-card rounded-[2rem] overflow-hidden cursor-pointer border border-white/5 hover:border-primary transition-all hover:scale-[1.05] shadow-2xl"
                    >
                      {item.imageUrl ? (
                        <Image src={item.imageUrl} alt={item.title} fill className="object-cover opacity-80 group-hover:opacity-100 transition-opacity" unoptimized />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center p-4">
                          <Tv className="h-12 w-12 text-primary opacity-20" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent p-5 flex flex-col justify-end">
                        <div className="flex items-center justify-between mb-1">
                           <h3 className="font-black text-[12px] uppercase italic truncate tracking-tighter text-white group-hover:text-primary transition-colors flex-1">{item.title}</h3>
                           {item.isRestricted && <Lock className="h-4 w-4 text-primary ml-2 drop-shadow-[0_0_8px_rgba(223,76,217,0.8)]" />}
                        </div>
                        <p className="text-[8px] font-black uppercase opacity-40 group-hover:opacity-100 transition-opacity text-primary">{item.genre}</p>
                      </div>
                      <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity">
                         <div className="bg-primary p-2 rounded-full shadow-2xl"><Play className="h-4 w-4 text-white fill-white" /></div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )
          })
        )}
      </main>

      <Dialog open={isInstallDialogOpen} onOpenChange={setIsInstallDialogOpen}>
        <DialogContent className="max-w-xl bg-card border-white/10 rounded-[3rem] overflow-hidden p-0">
          <div className="bg-primary/10 p-10 border-b border-white/5 text-center">
            <div className="w-20 h-20 bg-primary rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-primary/30">
              <Download className="h-10 w-10 text-white animate-bounce" />
            </div>
            <DialogTitle className="text-3xl font-black uppercase italic text-primary tracking-tighter">Instalação Nativa</DialogTitle>
            <DialogDescription className="text-[11px] uppercase font-bold opacity-60 mt-2">Transforme o Léo TV em um Programa Nativo (Sem Navegador).</DialogDescription>
          </div>
          <div className="p-8 space-y-6">
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
               <p className="text-[10px] font-black uppercase text-emerald-500 text-center">TECNOLOGIA PWA: Funciona como um programa real na Smart TV e Android.</p>
            </div>

            <div className="grid gap-4">
              <Button onClick={handleInstallClick} className="w-full h-20 bg-primary hover:bg-primary/90 font-black uppercase rounded-3xl text-lg shadow-2xl shadow-primary/20 flex items-center justify-center gap-4 transition-transform active:scale-95">
                 <Zap className="h-8 w-8 text-white animate-pulse" />
                 ATIVAR PROGRAMA AGORA
              </Button>
            </div>

            <div className="p-6 bg-black/40 border border-primary/20 rounded-3xl space-y-4">
               <div className="flex items-center gap-2">
                 <Globe className="h-5 w-5 text-primary" />
                 <span className="text-[11px] font-black uppercase text-primary tracking-widest">Link para Apps de Terceiros</span>
               </div>
               
               {isMaster ? (
                 <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl flex flex-col gap-2">
                   <div className="flex items-center gap-3">
                     <ShieldAlert className="h-5 w-5 text-destructive" />
                     <p className="text-[10px] font-black uppercase text-destructive">SIGILO MASTER ATIVO</p>
                   </div>
                   <p className="text-[9px] opacity-60 leading-relaxed uppercase">Seu PIN master foi ocultado. Use o PIN do cliente na TV dele.</p>
                 </div>
               ) : (
                 <p className="text-[9px] font-bold uppercase opacity-40">Use o servidor: {window.location.origin}</p>
               )}

               <div className="relative">
                 <Input readOnly value={userPlaylistUrl} className="bg-black/60 border-white/10 font-mono text-[10px] h-14 pr-12 rounded-2xl text-primary" />
                 <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 hover:bg-primary/20" onClick={() => { navigator.clipboard.writeText(userPlaylistUrl); toast({ title: "Link Copiado!" }); }}>
                   <ArrowDownToLine className="h-4 w-4 text-primary" />
                 </Button>
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-white/5 border border-white/5 rounded-2xl text-center">
                <Monitor className="h-6 w-6 text-secondary mx-auto mb-2" />
                <h4 className="font-black uppercase text-[10px]">Smart TV</h4>
                <p className="text-[8px] opacity-40 mt-1">Menu &gt; Instalar</p>
              </div>
              <div className="p-4 bg-white/5 border border-white/5 rounded-2xl text-center">
                <Smartphone className="h-6 w-6 text-primary mx-auto mb-2" />
                <h4 className="font-black uppercase text-[10px]">Android/iOS</h4>
                <p className="text-[8px] opacity-40 mt-1">Add Tela Inicial</p>
              </div>
            </div>
          </div>
          <DialogFooter className="p-8 bg-black/20">
             <Button onClick={() => setIsInstallDialogOpen(false)} className="w-full h-14 bg-white/5 border border-white/10 font-black uppercase rounded-2xl text-xs hover:bg-white/10 transition-all">VOLTAR AO STREAMING</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!selectedSeries} onOpenChange={(open) => { if(!open) { setSelectedSeries(null); updateURL(null); } }}>
        <DialogContent className="max-w-3xl bg-card border-white/10 rounded-[3rem] p-0 overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.8)]">
          <DialogHeader className="sr-only">
             <DialogTitle>{selectedSeries?.title}</DialogTitle>
          </DialogHeader>
          {selectedSeries && (
            <div className="flex flex-col h-[85vh]">
              <div className="relative h-64 w-full">
                {selectedSeries.imageUrl && <Image src={selectedSeries.imageUrl} alt={selectedSeries.title} fill className="object-cover" unoptimized />}
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent p-10 flex flex-col justify-end">
                  <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-2">Temporadas Master</span>
                  <div className="text-5xl font-black uppercase italic tracking-tighter text-white drop-shadow-2xl">{selectedSeries.title}</div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-10 space-y-10 no-scrollbar">
                {selectedSeries.type === 'series' && (
                  <div className="grid gap-4">
                    {selectedSeries.episodes?.map((ep, idx) => (
                      <Button key={ep.id} variant="outline" onClick={() => handleEpisodeClick(ep, selectedSeries, idx)} className="w-full h-20 justify-between bg-white/5 border-white/5 hover:border-primary rounded-[1.5rem] px-8 group transition-all">
                        <div className="flex items-center gap-4">
                          <span className="text-lg font-black opacity-20 group-hover:text-primary group-hover:opacity-100 transition-all">{idx + 1}</span>
                          <span className="font-black uppercase text-sm tracking-widest">{ep.title || `Episódio ${ep.number}`}</span>
                        </div>
                        <div className="p-3 bg-primary/10 rounded-full group-hover:bg-primary group-hover:scale-110 transition-all">
                          <PlayCircle className="h-6 w-6 text-primary group-hover:text-white" />
                        </div>
                      </Button>
                    ))}
                  </div>
                )}
                {selectedSeries.type === 'multi-season' && selectedSeries.seasons?.map((s, sIdx) => (
                  <div key={s.id} className="space-y-6">
                    <div className="flex items-center gap-4 border-l-4 border-primary pl-4">
                      <h4 className="text-2xl font-black uppercase text-white tracking-tighter">Temporada {s.number}</h4>
                      <span className="text-[10px] font-bold opacity-40 uppercase">{s.episodes.length} Episódios</span>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4">
                      {s.episodes.map((ep, eIdx) => (
                        <Button key={ep.id} variant="outline" onClick={() => handleEpisodeClick(ep, selectedSeries, eIdx, sIdx)} className="h-20 justify-between bg-white/5 border-white/5 hover:border-primary rounded-[1.5rem] px-6 group transition-all">
                          <span className="font-black uppercase text-[11px] tracking-widest text-left">Ep {ep.number} • {ep.title || 'Sem Nome'}</span>
                          <div className="p-2 bg-primary/10 rounded-full group-hover:bg-primary transition-all">
                            <Play className="h-4 w-4 text-primary group-hover:text-white fill-current" />
                          </div>
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isPinDialogOpen} onOpenChange={(open) => {
        setIsPinDialogOpen(open);
        if (!open) {
          setPendingItem(null);
          setPendingEpisodeData(null);
          setPendingAdultToggle(false);
          setPinInput("");
        }
      }}>
        <DialogContent className="sm:max-w-md bg-card border-white/10 rounded-[2.5rem] p-10 text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <Lock className="h-10 w-10 text-primary" />
          </div>
          <div className="text-2xl font-black uppercase italic text-primary mb-2">Trava Parental Master</div>
          <p className="text-[10px] uppercase font-bold opacity-40 mb-8">Digite o código secreto para liberar este sinal.</p>
          <div className="py-6 flex justify-center">
             <input type="password" maxLength={4} className="h-20 w-56 bg-black/40 border-white/10 text-center text-4xl font-black tracking-[0.6em] rounded-3xl outline-none border-2 focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all" value={pinInput} onChange={e => setPinInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && verifyPin()} autoFocus />
          </div>
          <Button onClick={verifyPin} className="w-full h-16 bg-primary hover:bg-primary/90 text-lg font-black uppercase rounded-3xl shadow-xl shadow-primary/20 mt-4 transition-transform active:scale-95">DESBLOQUEAR AGORA</Button>
        </DialogContent>
      </Dialog>

      {activeVideo && (
        <Dialog open={!!activeVideo} onOpenChange={(open) => { if(!open) { setActiveVideo(null); updateURL(null); } }}>
          <DialogContent className="max-w-6xl bg-black border-white/10 p-0 overflow-hidden rounded-[2.5rem] shadow-[0_0_150px_rgba(223,76,217,0.3)]">
            <VideoPlayer url={activeVideo.url} title={activeVideo.title} onNext={() => navigateContent('next')} onPrev={() => navigateContent('prev')} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
