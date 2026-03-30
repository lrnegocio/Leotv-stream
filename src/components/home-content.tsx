
"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { LogOut, Tv, Lock, Loader2, ChevronLeft, Film, Layers, Baby, Music, Heart, Timer, PlayCircle, Search, Zap, AlertTriangle, Radio, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getRemoteContent, ContentItem, User, getGlobalSettings } from "@/lib/store"
import { toast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { VideoPlayer } from "@/components/video-player"
import { VoiceSearch } from "@/components/voice-search"
import Image from "next/image"

interface ActiveVideo {
  url: string;
  title: string;
  itemId: string;
  index: number;
}

const MASTER_CATEGORIES = [
  { id: 'LIVE', name: 'LÉO TV AO VIVO', icon: Tv, color: 'bg-emerald-500', genre: 'LÉO TV CANAIS AO VIVO' },
  { id: 'MOVIES', name: 'LÉO TV FILMES', icon: Film, color: 'bg-blue-500', genre: 'LÉO TV FILMES' },
  { id: 'SERIES', name: 'LÉO TV SERIES', icon: Layers, color: 'bg-purple-500', genre: 'LÉO TV SERIES' },
  { id: 'DORAMAS', name: 'LÉO TV DORAMAS', icon: Sparkles, color: 'bg-pink-400', genre: 'LÉO TV DORAMAS' },
  { id: 'KIDS', name: 'LÉO TV DESENHOS', icon: Baby, color: 'bg-yellow-500', genre: 'LÉO TV DESENHOS' },
  { id: 'MUSIC_CLIPS', name: 'LÉO TV VÍDEO CLIPES', icon: Music, color: 'bg-pink-500', genre: 'LÉO TV VÍDEO CLIPES' },
  { id: 'MUSICAS', name: 'LÉO TV MUSICAS', icon: Music, color: 'bg-indigo-500', genre: 'LÉO TV MUSICAS' },
  { id: 'RADIOS', name: 'LÉO TV RÁDIOS', icon: Radio, color: 'bg-orange-400', genre: 'LÉO TV RÁDIOS' },
  { id: 'NOVELAS', name: 'LÉO TV NOVELAS', icon: Heart, color: 'bg-orange-500', genre: 'LÉO TV NOVELAS' },
  { id: 'ADULT', name: 'LÉO TV ADULTOS', icon: Lock, color: 'bg-red-600', genre: 'LÉO TV ADULTOS' },
]

export default function HomeContent() {
  const [content, setContent] = React.useState<ContentItem[]>([])
  const [user, setUser] = React.useState<User | null>(null)
  const [activeVideo, setActiveVideo] = React.useState<ActiveVideo | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(false)
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null)
  const [parentalPin, setParentalPin] = React.useState("")
  const [pinInput, setPinInput] = React.useState("")
  const [isPinDialogOpen, setIsPinDialogOpen] = React.useState(false)
  const [selectedSeries, setSelectedSeries] = React.useState<ContentItem | null>(null)
  const [pendingCategory, setPendingCategory] = React.useState<string | null>(null)
  const [timeLeft, setTimeLeft] = React.useState("SINTONIZANDO...")
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const searchQuery = searchParams.get('q') || ""

  const handleLogout = React.useCallback(async () => {
    localStorage.removeItem("user_session")
    router.push("/login")
  }, [router])

  React.useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(false)
      try {
        const session = localStorage.getItem("user_session")
        if (!session) { router.push("/login"); return; }
        const parsedUser = JSON.parse(session);
        setUser(parsedUser)

        const settings = await getGlobalSettings()
        setParentalPin(settings.parentalPin || "1234")

        // BUSCA BLINDADA COM FORCE REFRESH SE ESTIVER ZERADO
        const data = await getRemoteContent(false, searchQuery)
        if (data.length === 0 && !searchQuery) {
           const retryData = await getRemoteContent(true, ""); 
           setContent(retryData)
        } else {
           setContent(data)
        }
      } catch (err) {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [searchQuery, router])

  React.useEffect(() => {
    const interval = setInterval(() => {
      const session = localStorage.getItem("user_session")
      if (!session) return;
      const u = JSON.parse(session);
      if (u.subscriptionTier === 'lifetime' || u.pin === 'adm77x2p') { setTimeLeft("SINAL VITALÍCIO"); return; }
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

  const categoryCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    MASTER_CATEGORIES.forEach(cat => {
      const items = content.filter(i => (i.genre || "").toUpperCase() === cat.genre);
      let total = 0;
      items.forEach(item => {
        if ((item.type === 'series' || item.type === 'multi-season')) {
          if (item.episodes) total += item.episodes.length;
          if (item.seasons) item.seasons.forEach(s => total += s.episodes.length);
          if (!item.episodes && !item.seasons) total += 1;
        } else {
          total += 1;
        }
      });
      counts[cat.id] = total;
    });
    return counts;
  }, [content]);

  const filteredContent = React.useMemo(() => {
    let list = content;
    if (selectedCategory) {
      const cat = MASTER_CATEGORIES.find(c => c.id === selectedCategory);
      if (cat) list = list.filter(i => (i.genre || "").toUpperCase() === cat.genre);
    }
    
    return list.filter(item => {
      const genre = (item.genre || "").toUpperCase();
      const isAdult = genre.includes("ADULTO") || genre.includes("XXX") || genre.includes("HOT");
      if (isAdult && (!user || !user.isAdultEnabled)) return false;
      return true;
    })
  }, [content, selectedCategory, user])

  const handleCategoryClick = (catId: string) => {
    if (catId === 'ADULT') {
      setPendingCategory(catId);
      setIsPinDialogOpen(true);
      return;
    }
    setSelectedCategory(catId);
  }

  const handleItemClick = (item: ContentItem, index: number) => {
    if (item.type === 'series' || item.type === 'multi-season') {
      setSelectedSeries(item);
    } else {
      setActiveVideo({ url: item.streamUrl || item.directStreamUrl || "", title: item.title, itemId: item.id, index });
    }
  }

  const verifyPin = () => {
    if (pinInput === parentalPin) {
      if (pendingCategory) {
        setSelectedCategory(pendingCategory);
        setPendingCategory(null);
      }
      setIsPinDialogOpen(false);
      setPinInput("");
    } else {
      toast({ variant: "destructive", title: "PIN INCORRETO" });
      setPinInput("");
    }
  }

  const handleNext = () => {
    if (!activeVideo) return;
    const nextIdx = (activeVideo.index + 1) % filteredContent.length;
    const nextItem = filteredContent[nextIdx];
    handleItemClick(nextItem, nextIdx);
  }

  const handlePrev = () => {
    if (!activeVideo) return;
    const prevIdx = (activeVideo.index - 1 + filteredContent.length) % filteredContent.length;
    const prevItem = filteredContent[prevIdx];
    handleItemClick(prevItem, prevIdx);
  }

  return (
    <div className="min-h-screen bg-cinematic text-foreground pb-20 select-none">
      <header className="h-24 border-b border-white/5 bg-card/30 backdrop-blur-3xl flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          {selectedCategory || searchQuery ? (
            <Button variant="ghost" onClick={() => { setSelectedCategory(null); router.replace(window.location.pathname); }} className="group h-14 w-14 rounded-full bg-white/5 hover:bg-primary transition-all">
              <ChevronLeft className="h-8 w-8 text-white group-hover:scale-110" />
            </Button>
          ) : (
            <div className="bg-primary p-2.5 rounded-2xl shadow-xl shadow-primary/30 rotate-2"><Tv className="h-7 w-7 text-white" /></div>
          )}
          <div className="hidden lg:block">
            <span className="text-2xl font-black text-primary font-headline uppercase italic tracking-tighter block leading-none">Léo Tv Stream</span>
            <div className="flex items-center gap-2 mt-1 px-3 py-1 rounded-full bg-black/40 border border-primary/20 text-primary">
               <Timer className="h-3 w-3 animate-pulse" />
               <span className="text-[9px] font-black uppercase tracking-widest">{timeLeft}</span>
            </div>
          </div>
        </div>
        <div className="flex-1 max-w-xl mx-4"><VoiceSearch /></div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={handleLogout} className="text-destructive h-12 w-12 hover:bg-destructive/10 rounded-full"><LogOut className="h-6 w-6" /></Button>
        </div>
      </header>

      <main className="p-4 sm:p-8 max-w-[1800px] mx-auto">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-40 gap-4">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
            <p className="text-[10px] font-black uppercase text-primary animate-pulse tracking-[0.3em]">Sintonizando Império Léo Tv...</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-40 gap-6 text-center">
            <div className="p-6 bg-destructive/10 rounded-full"><AlertTriangle className="h-16 w-16 text-destructive animate-pulse" /></div>
            <div className="space-y-2">
              <h3 className="text-2xl font-black uppercase italic text-destructive">ERRO NO SINAL MASTER</h3>
              <p className="text-[11px] font-bold text-muted-foreground uppercase max-w-sm mx-auto leading-relaxed">
                Tente recarregar ou verifique sua conexão.
              </p>
            </div>
            <Button onClick={() => window.location.reload()} className="bg-primary uppercase font-black px-10 h-14 rounded-2xl">RECARREGAR SINAL</Button>
          </div>
        ) : !selectedCategory && !searchQuery ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 animate-in fade-in zoom-in-95 duration-500">
            {MASTER_CATEGORIES.map((cat) => {
              if (cat.id === 'ADULT' && (!user || !user.isAdultEnabled)) return null;
              const count = categoryCounts[cat.id] || 0;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleCategoryClick(cat.id)}
                  className={`group relative h-56 rounded-[2.5rem] overflow-hidden border-2 border-white/5 hover:border-primary transition-all hover:scale-[1.03] shadow-2xl ${cat.color} bg-opacity-20`}
                >
                  <div className={`absolute inset-0 bg-gradient-to-br from-white/10 to-transparent group-hover:scale-110 transition-transform duration-500`} />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
                    <div className={`p-4 rounded-3xl ${cat.color} text-white shadow-xl group-hover:rotate-12 transition-transform`}>
                      <cat.icon className="h-10 w-10" />
                    </div>
                    <div className="space-y-1">
                      <span className="text-xl font-black uppercase italic tracking-tighter text-white group-hover:text-primary transition-colors block">{cat.name}</span>
                      <span className="bg-black/40 px-3 py-1 rounded-full text-[9px] font-black text-primary border border-primary/20 uppercase tracking-widest">
                        {count.toLocaleString()} SINAIS ATIVOS
                      </span>
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="space-y-10 animate-in slide-in-from-bottom-10 duration-500">
            <div className="flex items-center justify-between border-b border-white/5 pb-6">
              <h2 className="text-4xl font-black uppercase italic tracking-tighter text-white">
                {searchQuery ? `BUSCANDO: ${searchQuery}` : MASTER_CATEGORIES.find(c => c.id === selectedCategory)?.name}
              </h2>
              <span className="text-xs bg-primary/10 text-primary border border-primary/20 px-6 py-2 rounded-full font-black uppercase tracking-widest">
                {filteredContent.length} ITENS LOCALIZADOS
              </span>
            </div>

            {filteredContent.length === 0 ? (
              <div className="text-center py-40 opacity-30 font-black uppercase tracking-widest text-xl">Nenhum canal localizado nesta faixa.</div>
            ) : (
              <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8">
                {filteredContent.map((item, idx) => (
                  <div key={item.id} onClick={() => handleItemClick(item, idx)} className="group relative aspect-[2/3] bg-card rounded-[2rem] overflow-hidden cursor-pointer border border-white/5 hover:border-primary transition-all hover:scale-[1.05] shadow-2xl">
                    {item.imageUrl ? <Image src={item.imageUrl} alt={item.title} fill className="object-cover opacity-80 group-hover:opacity-100 transition-opacity" unoptimized /> : <div className="absolute inset-0 bg-primary/10 flex items-center justify-center"><Tv className="h-12 w-12 text-primary opacity-20" /></div>}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent p-5 flex flex-col justify-end">
                      <div className="flex items-center justify-between mb-1">
                         <h3 className="font-black text-[12px] uppercase italic truncate tracking-tighter text-white group-hover:text-primary flex-1">{item.title}</h3>
                         {(item.isRestricted || (item.genre || "").includes("ADULTO")) && <Lock className="h-4 w-4 text-primary ml-2" />}
                      </div>
                      <p className="text-[8px] font-black uppercase opacity-40 text-primary">{item.genre}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* SELETOR DE EPISÓDIOS - LISTA VERTICAL PURA */}
      <Dialog open={!!selectedSeries} onOpenChange={(open) => { if(!open) setSelectedSeries(null); }}>
        <DialogContent className="max-w-3xl bg-card border-white/10 rounded-[3rem] p-0 overflow-hidden outline-none">
          {selectedSeries && (
            <div className="flex flex-col h-[85vh]">
              <div className="relative h-64 shrink-0">
                {selectedSeries.imageUrl && <Image src={selectedSeries.imageUrl} alt="Capa" fill className="object-cover" unoptimized />}
                <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent p-10 flex flex-col justify-end">
                  <div className="text-5xl font-black uppercase italic tracking-tighter text-white leading-none">{selectedSeries.title}</div>
                  <p className="text-xs font-black uppercase text-primary/60 tracking-widest mt-2">{selectedSeries.genre}</p>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-8 space-y-4 custom-scroll scrollbar-visible">
                {selectedSeries.type === 'series' && selectedSeries.episodes?.sort((a,b) => a.number - b.number).map((ep) => (
                  <Button key={ep.id} variant="outline" onClick={() => setActiveVideo({ url: ep.streamUrl || ep.directStreamUrl || "", title: `${selectedSeries.title} - EP ${ep.number}`, itemId: selectedSeries.id, index: 0 })} className="w-full h-16 justify-between bg-white/5 border-white/5 hover:border-primary rounded-2xl px-8 group transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-black text-[10px] text-primary">{ep.number}</div>
                      <span className="font-black uppercase text-xs">EP {ep.number} - {ep.title || `Episódio ${ep.number}`}</span>
                    </div>
                    <PlayCircle className="h-6 w-6 text-primary group-hover:scale-110 transition-transform" />
                  </Button>
                ))}
                {selectedSeries.type === 'multi-season' && selectedSeries.seasons?.sort((a,b) => a.number - b.number).map((season) => (
                  <div key={season.id} className="space-y-3 mb-8 last:mb-0">
                    <h3 className="text-xl font-black uppercase italic text-primary border-l-4 border-primary pl-4 tracking-tighter">Temporada {season.number}</h3>
                    {season.episodes.sort((a,b) => a.number - b.number).map((ep) => (
                      <Button key={ep.id} variant="outline" onClick={() => setActiveVideo({ url: ep.streamUrl || ep.directStreamUrl || "", title: `${selectedSeries.title} - T${season.number} EP ${ep.number}`, itemId: selectedSeries.id, index: 0 })} className="w-full h-14 justify-between bg-white/5 border-white/5 hover:border-primary rounded-xl px-6 group">
                        <span className="font-bold uppercase text-[10px]">T{season.number} - EP {ep.number} - {ep.title || `Episódio ${ep.number}`}</span>
                        <PlayCircle className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
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
            <VideoPlayer url={activeVideo.url} title={activeVideo.title} onNext={handleNext} onPrev={handlePrev} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
