
"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { LogOut, Tv, Play, Lock, Loader2, Folder, EyeOff, Eye, Timer, PlayCircle, Smartphone, Monitor, Globe, Download, Zap, ArrowDownToLine, Ghost } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { getRemoteContent, ContentItem, User, getGlobalSettings, Episode } from "@/lib/store"
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

  const handleLogout = React.useCallback(async () => {
    localStorage.removeItem("user_session")
    router.push("/login")
  }, [router])

  React.useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) || (e.ctrlKey && e.key === 'u')) {
        e.preventDefault();
        toast({ variant: "destructive", title: "ACESSO NEGADO", description: "Protocolo de segurança Léo Tv ativo." });
      }
    };
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('keydown', handleKeyDown);
    };
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
      } catch (err) {
        setLoading(false)
        toast({ variant: "destructive", title: "Erro de Sintonização" })
      }
    }
    load()
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
  }, [router])

  React.useEffect(() => {
    const interval = setInterval(() => {
      const session = localStorage.getItem("user_session")
      if (!session) return;
      const u = JSON.parse(session);
      if (u.subscriptionTier === 'lifetime' || u.pin === 'adm77x2p') { setTimeLeft("ACESSO VITALÍCIO"); return; }
      if (!u.expiryDate) { setTimeLeft("ESTOQUE"); return; }
      const now = new Date();
      const expiry = new Date(u.expiryDate);
      const diff = expiry.getTime() - now.getTime();
      if (diff <= 0) { setTimeLeft("SINAL EXPIRADO"); handleLogout(); return; }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    }, 1000)
    return () => clearInterval(interval)
  }, [handleLogout])

  const filteredContent = React.useMemo(() => {
    return content.filter(item => {
      if (item.isRestricted && user && !user.isAdultEnabled) return false;
      const titleMatch = item.title.toLowerCase().includes(searchQuery);
      const genreMatch = item.genre && item.genre.toLowerCase().includes(searchQuery);
      if (item.isRestricted && !showAdult) return false;
      return titleMatch || genreMatch;
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

  const isRestrictedCategory = (item: ContentItem) => {
    const genre = (item.genre || "").toUpperCase();
    const title = (item.title || "").toUpperCase();
    return item.isRestricted || 
           genre.includes("TERROR") || 
           genre.includes("HORROR") || 
           title.includes("TERROR") || 
           title.includes("HORROR");
  }

  const handleItemClick = (item: ContentItem) => {
    if (isRestrictedCategory(item)) {
      setActiveVideo(null); 
      setPendingItem(item);
      setIsPinDialogOpen(true);
      return;
    }
    if (item.type === 'series' || item.type === 'multi-season') {
      setSelectedSeries(item);
    } else {
      setActiveVideo({ url: item.streamUrl || item.directStreamUrl || "", title: item.title, itemId: item.id, type: item.type });
    }
  }

  const handleEpisodeClick = (ep: Episode, series: ContentItem, epIndex: number, seasonIndex?: number) => {
    if (isRestrictedCategory(series)) {
      setActiveVideo(null);
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
        if (item.type === 'series' || item.type === 'multi-season') setSelectedSeries(item);
        else setActiveVideo({ url: item.streamUrl || item.directStreamUrl || "", title: item.title, itemId: item.id, type: item.type });
        setPendingItem(null);
      }
      setIsPinDialogOpen(false);
      setPinInput("");
    } else {
      toast({ variant: "destructive", title: "CÓDIGO INCORRETO", description: "Verifique sua senha parental." });
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
  const displayPinForUrl = isMaster ? 'SEU_PIN' : (user?.pin || 'PIN');
  const userPlaylistUrl = `${window.location.origin}/api/playlist?pin=${displayPinForUrl}`;

  return (
    <div className="min-h-screen bg-cinematic text-foreground pb-20 select-none">
      <header className="h-24 border-b border-white/5 bg-card/30 backdrop-blur-3xl flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="bg-primary p-2.5 rounded-2xl shadow-xl shadow-primary/30 rotate-2"><Tv className="h-7 w-7 text-white" /></div>
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
        {categoriesWithCounts.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center py-40 opacity-20">
            <Tv className="h-20 w-20 mb-4" />
            <p className="font-black uppercase tracking-widest text-sm">Nenhum sinal localizado</p>
          </div>
        )}
        {categoriesWithCounts.map(([category, count]) => {
          const categoryItems = filteredContent.filter(item => (item.genre || "GERAL").toUpperCase() === category)
          const isTerrorCat = category.includes('TERROR') || category.includes('HORROR');
          return (
            <section key={category} className="space-y-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    {isTerrorCat ? <Ghost className="h-6 w-6 text-primary" /> : <Folder className="h-6 w-6 text-primary" />}
                  </div>
                  <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">
                    {category} {isTerrorCat && <span className="text-[8px] text-primary border border-primary/20 px-2 rounded-md ml-2">RESTRITO</span>}
                  </h2>
                </div>
                <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-4 py-1.5 rounded-full font-black uppercase tracking-widest">
                  {count} SINAIS ATIVOS
                </span>
              </div>
              
              <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8">
                {categoryItems.map(item => (
                  <div key={item.id} onClick={() => handleItemClick(item)} className="group relative aspect-[2/3] bg-card rounded-[2rem] overflow-hidden cursor-pointer border border-white/5 hover:border-primary transition-all hover:scale-[1.05] shadow-2xl">
                    {item.imageUrl ? (
                      <Image src={item.imageUrl} alt={item.title} fill className="object-cover opacity-80 group-hover:opacity-100 transition-opacity" unoptimized />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center"><Tv className="h-12 w-12 text-primary opacity-20" /></div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent p-5 flex flex-col justify-end">
                      <div className="flex items-center justify-between mb-1">
                         <h3 className="font-black text-[12px] uppercase italic truncate tracking-tighter text-white group-hover:text-primary transition-colors flex-1">{item.title}</h3>
                         {isRestrictedCategory(item) && <Lock className="h-4 w-4 text-primary ml-2 drop-shadow-[0_0_8px_rgba(223,76,217,0.8)]" />}
                      </div>
                      <p className="text-[8px] font-black uppercase opacity-40 text-primary">{item.genre}</p>
                    </div>
                    <div className="absolute top-4 left-4 opacity-0 group-hover:opacity-100 transition-opacity">
                       <div className="bg-primary p-2 rounded-full shadow-2xl"><Play className="h-4 w-4 text-white fill-white" /></div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )
        })}
      </main>

      <Dialog open={!!selectedSeries} onOpenChange={(open) => { if(!open) { setSelectedSeries(null); } }}>
        <DialogContent className="max-w-3xl bg-card border-white/10 rounded-[3rem] p-0 overflow-hidden outline-none">
          {selectedSeries && (
            <div className="flex flex-col h-[85vh]">
              <div className="relative h-64 w-full shrink-0">
                {selectedSeries.imageUrl && <Image src={selectedSeries.imageUrl} alt={selectedSeries.title} fill className="object-cover" unoptimized />}
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent p-10 flex flex-col justify-end">
                  <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-2">Sintonizando Temporadas</span>
                  <div className="text-5xl font-black uppercase italic tracking-tighter text-white leading-tight">{selectedSeries.title}</div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-4 sm:space-y-6 custom-scroll block" style={{ scrollbarWidth: 'thin' }}>
                {selectedSeries.type === 'series' && (
                  <div className="grid gap-4">
                    {selectedSeries.episodes?.map((ep, idx) => (
                      <Button key={ep.id} variant="outline" onClick={() => handleEpisodeClick(ep, selectedSeries, idx)} className="w-full h-20 justify-between bg-white/5 border-white/5 hover:border-primary rounded-[1.5rem] px-8 group">
                        <span className="font-black uppercase text-sm tracking-widest">{ep.title || `Episódio ${ep.number}`}</span>
                        <PlayCircle className="h-6 w-6 text-primary group-hover:text-white" />
                      </Button>
                    ))}
                  </div>
                )}
                {selectedSeries.type === 'multi-season' && (
                  <div className="space-y-10">
                    {selectedSeries.seasons?.map((season) => (
                      <div key={season.id} className="space-y-4">
                        <h3 className="text-xl font-black uppercase italic text-primary border-l-4 border-primary pl-4">Temporada {season.number}</h3>
                        <div className="grid gap-3">
                          {season.episodes.map((ep, idx) => (
                            <Button key={ep.id} variant="outline" onClick={() => handleEpisodeClick(ep, selectedSeries, idx, season.number)} className="w-full h-16 justify-between bg-white/5 border-white/5 hover:border-primary rounded-2xl px-6 group">
                              <span className="font-bold uppercase text-xs">EP {ep.number} - {ep.title}</span>
                              <PlayCircle className="h-5 w-5 text-primary group-hover:text-white" />
                            </Button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isPinDialogOpen} onOpenChange={(open) => { if(!open) { setPendingItem(null); setPendingEpisodeData(null); setPendingAdultToggle(false); setPinInput(""); setIsPinDialogOpen(false); } }}>
        <DialogContent className="sm:max-w-md bg-card border-white/10 rounded-[2.5rem] p-10 text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6"><Lock className="h-10 w-10 text-primary" /></div>
          <div className="text-2xl font-black uppercase italic text-primary mb-2">Trava Parental Léo Tv Stream</div>
          <p className="text-[10px] uppercase font-bold opacity-40 mb-8">Digite o código secreto para liberar este sinal.</p>
          <div className="py-6 flex justify-center">
             <input type="password" maxLength={4} className="h-20 w-56 bg-black/40 border-white/10 text-center text-4xl font-black tracking-[0.6em] rounded-3xl outline-none border-2 focus:border-primary transition-all" value={pinInput} onChange={e => setPinInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && verifyPin()} autoFocus />
          </div>
          <Button onClick={verifyPin} className="w-full h-16 bg-primary text-lg font-black uppercase rounded-3xl mt-4 shadow-xl">DESBLOQUEAR AGORA</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={isInstallDialogOpen} onOpenChange={setIsInstallDialogOpen}>
        <DialogContent className="max-w-xl bg-card border-white/10 rounded-[3rem] overflow-hidden p-0">
          <div className="bg-primary/10 p-10 border-b border-white/5 text-center">
            <div className="w-20 h-20 bg-primary rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-primary/30"><Download className="h-10 w-10 text-white animate-bounce" /></div>
            <DialogTitle className="text-3xl font-black uppercase italic text-primary tracking-tighter">Léo Tv Stream PWA</DialogTitle>
            <DialogDescription className="text-[11px] uppercase font-bold opacity-60 mt-2">Transforme seu streaming em um programa nativo.</DialogDescription>
          </div>
          <div className="p-8 space-y-6">
            <Button onClick={() => deferredPrompt?.prompt()} className="w-full h-20 bg-primary font-black uppercase rounded-3xl text-lg shadow-2xl shadow-primary/20 flex items-center justify-center gap-4 transition-transform active:scale-95">
               <Zap className="h-8 w-8 text-white animate-pulse" /> ATIVAR PROGRAMA AGORA
            </Button>
            <div className="p-6 bg-black/40 border border-primary/20 rounded-3xl space-y-4">
               <div className="flex items-center gap-2"><Globe className="h-5 w-5 text-primary" /><span className="text-[11px] font-black uppercase text-primary tracking-widest">Link para Apps de Terceiros</span></div>
               <div className="relative">
                 <Input readOnly value={userPlaylistUrl} className="bg-black/60 border-white/10 font-mono text-[10px] h-14 pr-12 rounded-2xl text-primary" />
                 <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2" onClick={() => { navigator.clipboard.writeText(userPlaylistUrl); toast({ title: "Link Copiado!" }); }}><ArrowDownToLine className="h-4 w-4 text-primary" /></Button>
               </div>
            </div>
          </div>
          <DialogFooter className="p-8 bg-black/20"><Button onClick={() => setIsInstallDialogOpen(false)} className="w-full h-14 bg-white/5 border border-white/10 font-black uppercase rounded-2xl text-xs">VOLTAR AO STREAMING</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {activeVideo && (
        <Dialog open={!!activeVideo} onOpenChange={(open) => { if(!open) { setActiveVideo(null); } }}>
          <DialogContent className="max-w-6xl bg-black border-white/10 p-0 overflow-hidden rounded-[2.5rem]">
            <VideoPlayer url={activeVideo.url} title={activeVideo.title} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
