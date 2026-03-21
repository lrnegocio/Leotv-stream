
"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { LogOut, Tv, Play, Lock, Loader2, Search, Folder, EyeOff, Eye, Timer, Key, ListOrdered, ChevronRight, PlayCircle } from "lucide-react"
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

export default function HomeContent() {
  const [content, setContent] = React.useState<ContentItem[]>([])
  const [user, setUser] = React.useState<User | null>(null)
  const [activeVideo, setActiveVideo] = React.useState<{url: string, title: string} | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [showAdult, setShowAdult] = React.useState(false)
  const [parentalPin, setParentalPin] = React.useState("")
  const [pinInput, setPinInput] = React.useState("")
  const [isPinDialogOpen, setIsPinDialogOpen] = React.useState(false)
  
  // SELETOR DE EPISÓDIOS MASTER
  const [selectedSeries, setSelectedSeries] = React.useState<ContentItem | null>(null)
  const [pendingVideo, setPendingVideo] = React.useState<ContentItem | null>(null)
  const [timeLeft, setTimeLeft] = React.useState("")
  
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
    }
    load()
  }, [router])

  React.useEffect(() => {
    const interval = setInterval(() => {
      if (!user?.expiryDate) return;
      
      const now = new Date();
      const expiry = new Date(user.expiryDate);
      const diff = expiry.getTime() - now.getTime();

      if (diff <= 0 && user.subscriptionTier !== 'lifetime') {
        handleLogout();
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (user.subscriptionTier === 'lifetime') {
        setTimeLeft("SINAL VITALÍCIO");
      } else {
        setTimeLeft(`${days}d ${hours}h ${minutes}m`);
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [user, handleLogout])

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

  const handleItemClick = (item: ContentItem) => {
    if (item.isRestricted && !showAdult) {
      setPendingVideo(item)
      setIsPinDialogOpen(true)
      return
    }

    if (item.type === 'series' || item.type === 'multi-season') {
      setSelectedSeries(item)
    } else {
      setActiveVideo({ url: item.streamUrl || "", title: item.title })
    }
  }

  const handleEpisodeClick = (ep: Episode, seriesTitle: string) => {
    setActiveVideo({ url: ep.streamUrl, title: `${seriesTitle} - EP ${ep.number}` })
  }

  const verifyPin = () => {
    if (pinInput === parentalPin) {
      if (pendingVideo) {
        if (pendingVideo.type === 'series' || pendingVideo.type === 'multi-season') {
          setSelectedSeries(pendingVideo)
        } else {
          setActiveVideo({ url: pendingVideo.streamUrl || "", title: pendingVideo.title })
        }
      }
      setIsPinDialogOpen(false)
      setPinInput("")
      setPendingVideo(null)
    } else {
      toast({ variant: "destructive", title: "SENHA INCORRETA" })
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
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 border border-primary/20 text-primary">
               <Timer className="h-3 w-3" />
               <span className="text-[9px] font-black uppercase tracking-widest">{timeLeft}</span>
            </div>
          </div>
        </div>
        
        <div className="flex-1 max-w-xl mx-4">
          <VoiceSearch />
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
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
          <div className="py-40 text-center opacity-20 uppercase font-black text-xl tracking-widest italic">Nenhum conteúdo sintonizado...</div>
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
                    {count} TÍTULOS
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
                        <Image 
                          src={item.imageUrl} 
                          alt={item.title} 
                          fill 
                          className="object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                          unoptimized 
                        />
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
                        <div className="flex items-center gap-2">
                           <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                           <span className="text-[7px] font-bold uppercase opacity-50 tracking-widest text-white">SINAL BLINDADO</span>
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

      {/* SELETOR DE EPISÓDIOS MASTER */}
      <Dialog open={!!selectedSeries} onOpenChange={() => setSelectedSeries(null)}>
        <DialogContent className="max-w-3xl bg-card border-white/10 rounded-3xl p-0 overflow-hidden">
          {selectedSeries && (
            <div className="flex flex-col h-[80vh]">
              <div className="h-48 relative">
                 {selectedSeries.imageUrl ? (
                   <Image src={selectedSeries.imageUrl} alt={selectedSeries.title} fill className="object-cover opacity-40" unoptimized />
                 ) : (
                   <div className="absolute inset-0 bg-primary/10" />
                 )}
                 <div className="absolute inset-0 bg-gradient-to-t from-card via-card/60 to-transparent p-8 flex flex-col justify-end">
                    <h2 className="text-4xl font-black uppercase italic tracking-tighter text-primary">{selectedSeries.title}</h2>
                    <p className="text-[10px] font-bold opacity-60 uppercase tracking-widest mt-2">{selectedSeries.genre} • {selectedSeries.type === 'multi-season' ? 'Temporadas' : 'Série'}</p>
                 </div>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-card">
                {selectedSeries.type === 'series' && selectedSeries.episodes && (
                  <div className="grid gap-3">
                    <h4 className="text-[10px] font-black uppercase opacity-40 flex items-center gap-2"><ListOrdered className="h-3 w-3" /> Selecione o Episódio</h4>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {selectedSeries.episodes.map((ep, idx) => (
                        <Button 
                          key={ep.id} 
                          variant="outline" 
                          onClick={() => handleEpisodeClick(ep, selectedSeries.title)}
                          className="h-16 justify-between bg-black/20 border-white/5 hover:border-primary hover:bg-primary/5 rounded-2xl group transition-all"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center font-black text-primary text-sm group-hover:scale-110 transition-transform">{idx + 1}</div>
                            <span className="font-bold uppercase text-xs">Episódio {ep.number}</span>
                          </div>
                          <PlayCircle className="h-5 w-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {selectedSeries.type === 'multi-season' && selectedSeries.seasons && (
                  <div className="space-y-8">
                    {selectedSeries.seasons.map((season) => (
                      <div key={season.id} className="space-y-4">
                        <h4 className="text-lg font-black uppercase italic text-primary border-l-4 border-primary pl-3">Temporada {season.number}</h4>
                        <div className="grid sm:grid-cols-2 gap-3">
                          {season.episodes.map((ep, idx) => (
                            <Button 
                              key={ep.id} 
                              variant="outline" 
                              onClick={() => handleEpisodeClick(ep, `${selectedSeries.title} T${season.number}`)}
                              className="h-16 justify-between bg-black/20 border-white/5 hover:border-primary hover:bg-primary/5 rounded-2xl group transition-all"
                            >
                              <div className="flex items-center gap-4">
                                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center font-black text-primary text-sm">EP {ep.number}</div>
                                <span className="font-bold uppercase text-xs">Episódio {ep.number}</span>
                              </div>
                              <PlayCircle className="h-5 w-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                            </Button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {(!selectedSeries.episodes || selectedSeries.episodes.length === 0) && (!selectedSeries.seasons || selectedSeries.seasons.length === 0) && (
                   <div className="flex flex-col items-center justify-center py-20 opacity-20 space-y-4">
                      <Tv className="h-16 w-16" />
                      <p className="font-black uppercase text-xs italic tracking-widest">NENHUM EPISÓDIO SINALIZADO</p>
                   </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={isPinDialogOpen} onOpenChange={setIsPinDialogOpen}>
        <DialogContent className="sm:max-w-md bg-card border-white/10 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase italic text-primary text-center">Senha Parental</DialogTitle>
            <DialogDescription className="text-center text-[10px] uppercase font-bold opacity-60">Conteúdo Protegido por PIN</DialogDescription>
          </DialogHeader>
          <div className="py-6 flex justify-center">
             <Input 
                type="password" 
                maxLength={4} 
                className="h-16 w-48 bg-black/40 border-white/5 text-center text-3xl font-black tracking-[0.5em] rounded-2xl" 
                value={pinInput}
                onChange={e => setPinInput(e.target.value)}
                autoFocus
             />
          </div>
          <DialogFooter>
             <Button onClick={verifyPin} className="w-full h-14 bg-primary text-lg font-black uppercase rounded-2xl">DESBLOQUEAR SINAL</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {activeVideo && (
        <Dialog open={!!activeVideo} onOpenChange={() => setActiveVideo(null)}>
          <DialogContent className="max-w-[95vw] sm:max-w-6xl bg-black border-white/10 p-0 overflow-hidden rounded-3xl">
            <DialogHeader className="sr-only">
              <DialogTitle>{activeVideo.title}</DialogTitle>
            </DialogHeader>
            <VideoPlayer url={activeVideo.url} title={activeVideo.title} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
