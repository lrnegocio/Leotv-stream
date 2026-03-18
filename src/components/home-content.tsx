
'use client';

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { LogOut, Tv, Play, Lock, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getRemoteContent, getGlobalSettings, ContentItem, getRemoteUsers } from "@/lib/store"
import { toast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { VideoPlayer } from "@/components/video-player"
import { VoiceSearch } from "@/components/voice-search"
import { AiAssistant } from "@/components/ai-assistant"
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from "@/components/ui/carousel"

function HomeContentInner() {
  const searchParams = useSearchParams()
  const urlQuery = searchParams.get('q') || ""
  const [content, setContent] = React.useState<ContentItem[]>([])
  const [selectedFolder, setSelectedFolder] = React.useState<string | null>(null)
  const [activeVideo, setActiveVideo] = React.useState<ContentItem | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [isMounted, setIsMounted] = React.useState(false)
  const router = useRouter()

  React.useEffect(() => {
    setIsMounted(true)
    const sessionStr = localStorage.getItem("user_session")
    if (!sessionStr) {
      router.push("/login")
      return
    }
    const session = JSON.parse(sessionStr);
    
    const checkSecurity = async () => {
      try {
        const users = await getRemoteUsers();
        const currentUser = users.find(u => u.id === session.id);
        if (currentUser?.isBlocked) {
          localStorage.removeItem("user_session");
          router.push("/login");
          toast({ variant: "destructive", title: "ACESSO SUSPENSO", description: "Sua conta foi bloqueada por login simultâneo." });
        }
      } catch (err) {}
    };

    const interval = setInterval(checkSecurity, 15000); 

    const load = async () => {
      try {
        const data = await getRemoteContent()
        if (data) setContent(data)
      } catch (err) {} finally {
        setLoading(false)
      }
    }
    load()
    return () => clearInterval(interval);
  }, [router])

  const categories = React.useMemo(() => 
    Array.from(new Set(content.map(c => c.genre || "GERAL"))).sort(),
  [content]);

  // Busca Live Master: Filtra instantaneamente conforme o urlQuery muda
  const filtered = React.useMemo(() => {
    const query = urlQuery.toLowerCase().trim()
    return content.filter(item => {
      const matchesSearch = !query || 
                           item.title.toLowerCase().includes(query) || 
                           (item.genre && item.genre.toLowerCase().includes(query))
      const matchesFolder = selectedFolder ? item.genre === selectedFolder : true
      return matchesSearch && matchesFolder
    })
  }, [content, urlQuery, selectedFolder]);

  const handleNextChannel = React.useCallback(() => {
    if (!activeVideo || filtered.length <= 1) return;
    const currentIndex = filtered.findIndex(i => i.id === activeVideo.id);
    const nextIndex = (currentIndex + 1) % filtered.length;
    setActiveVideo(filtered[nextIndex]);
  }, [activeVideo, filtered]);

  const handlePrevChannel = React.useCallback(() => {
    if (!activeVideo || filtered.length <= 1) return;
    const currentIndex = filtered.findIndex(i => i.id === activeVideo.id);
    const prevIndex = (currentIndex - 1 + filtered.length) % filtered.length;
    setActiveVideo(filtered[prevIndex]);
  }, [activeVideo, filtered]);

  if (!isMounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <header className="h-20 border-b border-white/5 bg-card/50 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="bg-primary p-2.5 rounded-xl shadow-lg shadow-primary/20"><Tv className="h-6 w-6 text-white" /></div>
          <span className="text-2xl font-black text-primary font-headline uppercase tracking-tighter italic hidden sm:block">Léo Stream</span>
        </div>
        
        <div className="flex-1 max-w-lg mx-8">
          <VoiceSearch />
        </div>

        <Button variant="ghost" size="icon" onClick={() => {
          localStorage.removeItem("user_session");
          router.push("/login");
        }} className="text-destructive hover:bg-destructive/10 h-12 w-12 rounded-xl">
          <LogOut className="h-6 w-6" />
        </Button>
      </header>

      <main className="p-8 space-y-10 max-w-7xl mx-auto">
        <section className="relative px-16">
          <Carousel opts={{ align: "start", dragFree: true }} className="w-full">
            <CarouselContent className="-ml-2">
              <CarouselItem className="pl-2 basis-auto">
                <button 
                  className={`px-8 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${selectedFolder === null ? 'bg-primary text-white scale-105 shadow-2xl border border-white/10' : 'bg-white/5 text-muted-foreground hover:bg-white/10 border border-white/5'}`}
                  onClick={() => setSelectedFolder(null)}
                >
                  TODOS OS CANAIS
                </button>
              </CarouselItem>
              {categories.map(cat => (
                <CarouselItem key={cat} className="pl-2 basis-auto">
                  <button 
                    className={`px-8 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${selectedFolder === cat ? 'bg-primary text-white scale-105 shadow-2xl border border-white/10' : 'bg-white/5 text-muted-foreground hover:bg-white/10 border border-white/5'}`}
                    onClick={() => setSelectedFolder(cat)}
                  >
                    {cat}
                  </button>
                </CarouselItem>
              ))}
            </CarouselContent>
            {/* SETAS DE CATEGORIA ROBUSTAS - SEMPRE VISÍVEIS */}
            <CarouselPrevious className="absolute -left-4 bg-primary text-white border-none h-14 w-14 shadow-2xl hover:scale-110 transition-transform flex items-center justify-center opacity-100 disabled:opacity-30 z-20 rounded-full" />
            <CarouselNext className="absolute -right-4 bg-primary text-white border-none h-14 w-14 shadow-2xl hover:scale-110 transition-transform flex items-center justify-center opacity-100 disabled:opacity-30 z-20 rounded-full" />
          </Carousel>
        </section>

        <section className="grid gap-6 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 animate-in fade-in duration-700">
          {filtered.length === 0 ? (
            <div className="col-span-full py-20 text-center opacity-30 border border-dashed border-white/10 rounded-3xl">
              <p className="font-black uppercase tracking-[0.3em] text-xs">Nenhum sinal localizado</p>
            </div>
          ) : (
            filtered.map(item => (
              <div key={item.id} onClick={async () => {
                if (item.isRestricted) {
                  const settings = await getGlobalSettings()
                  const pin = prompt("SENHA PARENTAL (4 DÍGITOS):")
                  if (pin !== settings.parentalPin) {
                    toast({ variant: "destructive", title: "SENHA INCORRETA" });
                    return
                  }
                }
                setActiveVideo(item)
              }} className="bg-card/40 backdrop-blur-sm border border-white/5 rounded-3xl p-6 cursor-pointer hover:border-primary/50 transition-all shadow-2xl group hover:scale-[1.03] active:scale-95 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-100 transition-opacity">
                  <Play className="h-4 w-4 text-primary fill-current" />
                </div>
                <span className="text-[10px] font-black text-primary uppercase tracking-widest">{item.genre}</span>
                <h3 className="font-black text-sm uppercase truncate font-headline group-hover:text-primary transition-colors mt-2 tracking-tight italic">{item.title}</h3>
                <div className="mt-8 flex justify-between items-center">
                  <div className="flex items-center gap-1.5 bg-black/40 px-3 py-1.5 rounded-full border border-white/5">
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[8px] font-black text-muted-foreground uppercase tracking-tighter">{item.type}</span>
                  </div>
                  {item.isRestricted && <Lock className="h-3.5 w-3.5 text-destructive" />}
                </div>
              </div>
            ))
          )}
        </section>
      </main>

      {activeVideo && (
        <Dialog open={!!activeVideo} onOpenChange={() => setActiveVideo(null)}>
          <DialogContent className="max-w-5xl bg-black border-white/10 p-0 overflow-hidden rounded-[2.5rem] shadow-3xl">
            <DialogHeader className="sr-only"><DialogTitle>{activeVideo.title}</DialogTitle></DialogHeader>
            <VideoPlayer 
              url={activeVideo.streamUrl || ""} 
              title={activeVideo.title} 
              onNext={handleNextChannel}
              onPrev={handlePrevChannel}
            />
          </DialogContent>
        </Dialog>
      )}
      <AiAssistant />
    </div>
  )
}

export default function HomeContent() {
  return (
    <React.Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}>
      <HomeContentInner />
    </React.Suspense>
  )
}
