
"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { LogOut, Tv, Play, Lock, Loader2, Search, Folder, EyeOff, Eye, Timer, Key, ListOrdered, ChevronRight, PlayCircle } from "lucide-react"
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
  const [isPinVerified, setIsPinVerified] = React.useState(false)
  
  const [selectedSeries, setSelectedSeries] = React.useState<ContentItem | null>(null)
  const [pendingItem, setPendingItem] = React.useState<ContentItem | null>(null)
  const [pendingEpisodeData, setPendingEpisodeData] = React.useState<{ep: Episode, series: ContentItem, eIdx: number, sIdx?: number} | null>(null)
  const [timeLeft, setTimeLeft] = React.useState("SINTONIZANDO...")
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const searchQuery = searchParams.get('q')?.toLowerCase() || ""

  const handleLogout = React.useCallback(async () => {
    localStorage.removeItem("user_session")
    router.push("/login")
  }, [router])

  React.useEffect(() => {
    const session = localStorage.getItem("user_session")
    if (!session) { router.push("/login"); return; }
    const userData = JSON.parse(session)
    setUser(userData)

    const load = async () => {
      const data = await getRemoteContent()
      const settings = await getGlobalSettings()
      setParentalPin(settings.parentalPin || "1234")
      setContent(data)
      setLoading(false)

      // v117.0: Tenta abrir conteúdo direto se houver ID na URL ao carregar
      const contentId = searchParams.get('v');
      if (contentId) {
        const item = data.find(i => i.id === contentId);
        if (item) {
          if (item.type === 'channel' || item.type === 'movie') {
            setActiveVideo({ url: item.streamUrl || "", title: item.title, itemId: item.id, type: item.type });
          } else {
            setSelectedSeries(item);
          }
        }
      }
    }
    load()
  }, [router, searchParams])

  React.useEffect(() => {
    const interval = setInterval(() => {
      const session = localStorage.getItem("user_session")
      if (!session) return;
      const u = JSON.parse(session);

      if (u.subscriptionTier === 'lifetime') {
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
        setTimeLeft("ACESSO EXPIRADO");
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

  const filteredContent = React.useMemo(() => {
    return content.filter(item => {
      const titleMatch = item.title.toLowerCase().includes(searchQuery);
      const genreMatch = item.genre && item.genre.toLowerCase().includes(searchQuery);
      const matchesSearch = titleMatch || genreMatch;
      
      if (item.isRestricted && !showAdult) return false;
      return matchesSearch;
    })
  }, [content, searchQuery, showAdult])

  const categoriesWithCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    filteredContent.forEach(item => {
      const cat = (item.genre || "GERAL").toUpperCase();
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return Object.entries(counts).sort((a,b) => a[0].localeCompare(b[0]));
  }, [filteredContent])

  // v117.0: Atualiza a URL sem recarregar a página ao abrir um canal para ser seu "Controle Remoto"
  const updateURL = (contentId: string | null) => {
    const params = new URLSearchParams(window.location.search);
    if (contentId) params.set('v', contentId);
    else params.delete('v');
    const newURL = `${window.location.pathname}?${params.toString()}`;
    window.history.pushState({ path: newURL }, '', newURL);
  }

  const handleItemClick = (item: ContentItem) => {
    if (item.isRestricted && !isPinVerified) {
      setPendingItem(item)
      setIsPinDialogOpen(true)
      return
    }

    updateURL(item.id);

    if (item.type === 'series' || item.type === 'multi-season') {
      setSelectedSeries(item)
    } else {
      setActiveVideo({ 
        url: item.streamUrl || "", 
        title: item.title, 
        itemId: item.id,
        type: item.type
      })
    }
  }

  const handleEpisodeClick = (ep: Episode, series: ContentItem, epIndex: number, seasonIndex?: number) => {
    if (series.isRestricted && !isPinVerified) {
      setPendingEpisodeData({ ep, series, eIdx: epIndex, sIdx: seasonIndex })
      setIsPinDialogOpen(true)
      return
    }

    setActiveVideo({ 
      url: ep.streamUrl, 
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
      setIsPinVerified(true)
      
      if (pendingEpisodeData) {
        const { ep, series, eIdx, sIdx } = pendingEpisodeData;
        setActiveVideo({ 
          url: ep.streamUrl, 
          title: `${series.title} - EP ${ep.number}`, 
          itemId: series.id,
          episodeIndex: eIdx,
          seasonIndex: sIdx,
          type: series.type
        })
        setPendingEpisodeData(null)
      } else if (pendingItem) {
        const item = pendingItem;
        updateURL(item.id);
        if (item.type === 'series' || item.type === 'multi-season') setSelectedSeries(item)
        else setActiveVideo({ url: item.streamUrl || "", title: item.title, itemId: item.id, type: item.type })
      }
      
      setIsPinDialogOpen(false)
      setPinInput("")
      setPendingItem(null)
    } else {
      toast({ variant: "destructive", title: "PIN INCORRETO" })
      setPinInput("")
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <header className="h-24 border-b border-white/5 bg-card/30 backdrop-blur-3xl flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="bg-primary p-2.5 rounded-xl shadow-lg shadow-primary/30"><Tv className="h-6 w-6 text-white" /></div>
          <div className="hidden lg:block">
            <span className="text-xl font-black text-primary font-headline uppercase italic tracking-tighter block">Léo Stream</span>
            <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-black/40 border border-primary/20 text-primary">
               <Timer className="h-4 w-4 animate-pulse" />
               <span className="text-[10px] font-black uppercase tracking-widest">{timeLeft}</span>
            </div>
          </div>
        </div>
        
        <div className="flex-1 max-w-xl mx-4">
          <VoiceSearch />
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden sm:flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
             <Label htmlFor="adult-mode" className="text-[9px] font-black uppercase opacity-60 cursor-pointer flex items-center gap-2">
                {showAdult ? <Eye className="h-3 w-3 text-primary" /> : <EyeOff className="h-3 w-3" />}
                ADULTO: {showAdult ? "ON" : "OFF"}
             </Label>
             <Switch id="adult-mode" checked={showAdult} onCheckedChange={setShowAdult} />
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="text-destructive h-12 w-12 rounded-xl hover:bg-destructive/10"><LogOut className="h-6 w-6" /></Button>
        </div>
      </header>

      <main className="p-4 sm:p-8 max-w-[1600px] mx-auto space-y-16">
        {categoriesWithCounts.length === 0 ? (
          <div className="py-40 text-center opacity-20 uppercase font-black text-xl tracking-widest italic">Nenhum canal localizado...</div>
        ) : (
          categoriesWithCounts.map(([category, count]) => {
            const categoryItems = filteredContent.filter(item => (item.genre || "GERAL").toUpperCase() === category)
            return (
              <section key={category} className="space-y-6">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div className="flex items-center gap-3">
                    <Folder className="h-6 w-6 text-primary" />
                    <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">{category}</h2>
                  </div>
                  <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full font-black uppercase tracking-widest">
                    {count} CANAIS
                  </span>
                </div>
                
                <div className="grid gap-6 grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8">
                  {categoryItems.map(item => (
                    <div 
                      key={item.id} 
                      onClick={() => handleItemClick(item)} 
                      className="group relative aspect-[2/3] bg-card rounded-2xl overflow-hidden cursor-pointer border border-white/5 hover:border-primary transition-all hover:scale-[1.05] shadow-2xl"
                    >
                      {item.imageUrl ? (
                        <Image src={item.imageUrl} alt={item.title} fill className="object-cover opacity-80 group-hover:opacity-100 transition-opacity" unoptimized />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center p-4">
                          <Tv className="h-10 w-10 text-primary opacity-20" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent p-4 flex flex-col justify-end">
                        <div className="flex items-center justify-between mb-1">
                           <h3 className="font-black text-[11px] uppercase italic truncate tracking-tighter text-white group-hover:text-primary transition-colors flex-1">{item.title}</h3>
                           {item.isRestricted && <Lock className="h-3 w-3 text-primary ml-2" />}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )
          })
        )}
      </main>

      <Dialog open={!!selectedSeries} onOpenChange={(open) => { if(!open) { setSelectedSeries(null); updateURL(null); } }}>
        <DialogContent className="max-w-3xl bg-card border-white/10 rounded-3xl p-0 overflow-hidden">
          <DialogHeader className="sr-only">
             <DialogTitle>{selectedSeries?.title}</DialogTitle>
             <DialogDescription>Selecione um episódio.</DialogDescription>
          </DialogHeader>
          {selectedSeries && (
            <div className="flex flex-col h-[80vh]">
              <div className="p-8 pb-0">
                <div className="text-4xl font-black uppercase italic tracking-tighter text-primary">{selectedSeries.title}</div>
              </div>
              <div className="flex-1 overflow-y-auto p-8 space-y-6">
                {selectedSeries.type === 'series' && selectedSeries.episodes?.map((ep, idx) => (
                  <Button key={ep.id} variant="outline" onClick={() => handleEpisodeClick(ep, selectedSeries, idx)} className="w-full h-16 justify-between bg-black/20 border-white/5 hover:border-primary rounded-2xl">
                    <span className="font-bold uppercase text-xs">Episódio {ep.number}</span>
                    <PlayCircle className="h-5 w-5 text-primary" />
                  </Button>
                ))}
                {selectedSeries.type === 'multi-season' && selectedSeries.seasons?.map((s, sIdx) => (
                  <div key={s.id} className="space-y-4">
                    <h4 className="text-lg font-black uppercase text-primary">Temporada {s.number}</h4>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {s.episodes.map((ep, eIdx) => (
                        <Button key={ep.id} variant="outline" onClick={() => handleEpisodeClick(ep, selectedSeries, eIdx, sIdx)} className="h-16 justify-between bg-black/20 border-white/5 hover:border-primary rounded-2xl">
                          <span className="font-bold uppercase text-xs">Ep {ep.number}</span>
                          <PlayCircle className="h-5 w-5 text-primary" />
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

      <Dialog open={isPinDialogOpen} onOpenChange={setIsPinDialogOpen}>
        <DialogContent className="sm:max-w-md bg-card border-white/10 rounded-3xl">
          <DialogHeader className="sr-only">
             <DialogTitle>PIN Parental</DialogTitle>
             <DialogDescription>Insira sua senha.</DialogDescription>
          </DialogHeader>
          <div className="text-xl font-black uppercase italic text-primary text-center">Senha Parental</div>
          <div className="py-6 flex justify-center">
             <input type="password" maxLength={4} className="h-16 w-48 bg-black/40 border-white/5 text-center text-3xl font-black tracking-[0.5em] rounded-2xl outline-none border focus:border-primary" value={pinInput} onChange={e => setPinInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && verifyPin()} autoFocus />
          </div>
          <Button onClick={verifyPin} className="w-full h-14 bg-primary text-lg font-black uppercase rounded-2xl">DESBLOQUEAR</Button>
        </DialogContent>
      </Dialog>

      {activeVideo && (
        <Dialog open={!!activeVideo} onOpenChange={(open) => { if(!open) { setActiveVideo(null); updateURL(null); } }}>
          <DialogContent className="max-w-6xl bg-black border-white/10 p-0 overflow-hidden rounded-3xl">
            <DialogHeader className="sr-only">
               <DialogTitle>{activeVideo.title}</DialogTitle>
               <DialogDescription>Sintonizando...</DialogDescription>
            </DialogHeader>
            <VideoPlayer url={activeVideo.url} title={activeVideo.title} onNext={() => navigateContent('next')} onPrev={() => navigateContent('prev')} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
