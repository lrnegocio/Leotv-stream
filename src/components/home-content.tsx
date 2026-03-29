
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
  }, [router])

  React.useEffect(() => {
    const interval = setInterval(() => {
      const session = localStorage.getItem("user_session")
      if (!session) return;
      const u = JSON.parse(session);
      if (u.subscriptionTier === 'lifetime' || u.pin === 'adm77x2p') { setTimeLeft("ACESSO VITALÍCIO"); return; }
      const now = new Date();
      const expiry = new Date(u.expiryDate || "");
      const diff = expiry.getTime() - now.getTime();
      if (diff <= 0) { setTimeLeft("SINAL EXPIRADO"); handleLogout(); return; }
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      setTimeLeft(`${days}d ${hours}h ${mins}m`);
    }, 1000)
    return () => clearInterval(interval)
  }, [handleLogout])

  const isRestrictedCategory = (item: ContentItem) => {
    const genre = (item.genre || "").toUpperCase();
    // Terror agora é livre conforme sua ordem, Mestre.
    return item.isRestricted || genre.includes("ADULTO") || genre.includes("XXX");
  }

  const filteredContent = React.useMemo(() => {
    return content.filter(item => {
      const isAdultCat = isRestrictedCategory(item);
      // Se o botão Adulto no cadastro do cliente estiver desligado, oculta os canais.
      if (isAdultCat && user && !user.isAdultEnabled) return false;
      // Se o usuário ocultou no switch temporário, oculta também.
      if (isAdultCat && !showAdult) return false;
      
      const titleMatch = item.title.toLowerCase().includes(searchQuery);
      const genreMatch = item.genre && item.genre.toLowerCase().includes(searchQuery);
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

  const handleItemClick = (item: ContentItem) => {
    if (isRestrictedCategory(item)) {
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
      setPendingEpisodeData({ ep, series, eIdx: epIndex, sIdx: seasonIndex });
      setIsPinDialogOpen(true);
      return;
    }
    setActiveVideo({ url: ep.streamUrl || ep.directStreamUrl || "", title: `${series.title} - EP ${ep.number}`, itemId: series.id, episodeIndex: epIndex, seasonIndex: seasonIndex, type: series.type })
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
      toast({ variant: "destructive", title: "PIN INCORRETO" });
      setPinInput("");
    }
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>

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
        <div className="flex-1 max-w-xl mx-4"><VoiceSearch /></div>
        <div className="flex items-center gap-6">
          {user?.isAdultEnabled && (
            <div className="hidden sm:flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
               <Label htmlFor="adult-mode" className="text-[10px] font-black uppercase opacity-60 cursor-pointer flex items-center gap-2">
                  {showAdult ? <Eye className="h-4 w-4 text-primary" /> : <EyeOff className="h-4 w-4" />} ADULTO
               </Label>
               <Switch id="adult-mode" checked={showAdult} onCheckedChange={(v) => { if(v) { setPendingAdultToggle(true); setIsPinDialogOpen(true); } else { setShowAdult(false); } }} />
            </div>
          )}
          <Button variant="ghost" size="icon" onClick={handleLogout} className="text-destructive"><LogOut className="h-6 w-6" /></Button>
        </div>
      </header>

      <main className="p-4 sm:p-8 max-w-[1800px] mx-auto space-y-16">
        {categoriesWithCounts.map(([category, count]) => {
          const categoryItems = filteredContent.filter(item => (item.genre || "GERAL").toUpperCase() === category)
          return (
            <section key={category} className="space-y-6">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg"><Folder className="h-6 w-6 text-primary" /></div>
                  <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">{category}</h2>
                </div>
                <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-4 py-1.5 rounded-full font-black uppercase tracking-widest">{count} SINAIS</span>
              </div>
              <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8">
                {categoryItems.map(item => (
                  <div key={item.id} onClick={() => handleItemClick(item)} className="group relative aspect-[2/3] bg-card rounded-[2rem] overflow-hidden cursor-pointer border border-white/5 hover:border-primary transition-all hover:scale-[1.05] shadow-2xl">
                    {item.imageUrl ? <Image src={item.imageUrl} alt={item.title} fill className="object-cover opacity-80 group-hover:opacity-100 transition-opacity" unoptimized /> : <div className="absolute inset-0 bg-primary/10 flex items-center justify-center"><Tv className="h-12 w-12 text-primary opacity-20" /></div>}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent p-5 flex flex-col justify-end">
                      <div className="flex items-center justify-between mb-1">
                         <h3 className="font-black text-[12px] uppercase italic truncate tracking-tighter text-white group-hover:text-primary flex-1">{item.title}</h3>
                         {isRestrictedCategory(item) && <Lock className="h-4 w-4 text-primary ml-2" />}
                      </div>
                      <p className="text-[8px] font-black uppercase opacity-40 text-primary">{item.genre}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )
        })}
      </main>

      <Dialog open={!!selectedSeries} onOpenChange={(open) => { if(!open) setSelectedSeries(null); }}>
        <DialogContent className="max-w-3xl bg-card border-white/10 rounded-[3rem] p-0 overflow-hidden outline-none">
          {selectedSeries && (
            <div className="flex flex-col h-[85vh]">
              <div className="relative h-64 shrink-0">
                {selectedSeries.imageUrl && <Image src={selectedSeries.imageUrl} alt="Capa" fill className="object-cover" unoptimized />}
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent p-10 flex flex-col justify-end">
                  <div className="text-5xl font-black uppercase italic tracking-tighter text-white">{selectedSeries.title}</div>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scroll" style={{ display: 'block' }}>
                {selectedSeries.type === 'series' && selectedSeries.episodes?.map((ep, idx) => (
                  <Button key={ep.id} variant="outline" onClick={() => handleEpisodeClick(ep, selectedSeries, idx)} className="w-full h-20 justify-between bg-white/5 border-white/5 hover:border-primary rounded-3xl px-8 group">
                    <span className="font-black uppercase text-sm">{ep.title || `Episódio ${ep.number}`}</span>
                    <PlayCircle className="h-6 w-6 text-primary" />
                  </Button>
                ))}
                {selectedSeries.type === 'multi-season' && selectedSeries.seasons?.map((season) => (
                  <div key={season.id} className="space-y-4">
                    <h3 className="text-xl font-black uppercase italic text-primary border-l-4 border-primary pl-4">Temporada {season.number}</h3>
                    {season.episodes.map((ep, idx) => (
                      <Button key={ep.id} variant="outline" onClick={() => handleEpisodeClick(ep, selectedSeries, idx, season.number)} className="w-full h-16 justify-between bg-white/5 border-white/5 hover:border-primary rounded-2xl px-6 group">
                        <span className="font-bold uppercase text-xs">EP {ep.number} - {ep.title}</span>
                        <PlayCircle className="h-5 w-5 text-primary" />
                      </Button>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isPinDialogOpen} onOpenChange={(open) => { if(!open) { setPinInput(""); setIsPinDialogOpen(false); } }}>
        <DialogContent className="sm:max-w-md bg-card border-white/10 rounded-[2.5rem] p-10 text-center">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6"><Lock className="h-10 w-10 text-primary" /></div>
          <div className="text-2xl font-black uppercase italic text-primary mb-2">Trava Parental Léo Tv</div>
          <div className="py-6 flex justify-center">
             <input type="password" title="PIN" maxLength={4} className="h-20 w-56 bg-black/40 border-white/10 text-center text-4xl font-black tracking-[0.6em] rounded-3xl outline-none border-2 focus:border-primary" value={pinInput} onChange={e => setPinInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && verifyPin()} autoFocus />
          </div>
          <Button onClick={verifyPin} className="w-full h-16 bg-primary text-lg font-black uppercase rounded-3xl mt-4 shadow-xl">DESBLOQUEAR</Button>
        </DialogContent>
      </Dialog>

      {activeVideo && (
        <Dialog open={!!activeVideo} onOpenChange={() => setActiveVideo(null)}>
          <DialogContent className="max-w-6xl bg-black border-white/10 p-0 overflow-hidden rounded-[2.5rem]">
            <VideoPlayer url={activeVideo.url} title={activeVideo.title} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
