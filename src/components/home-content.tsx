
'use client';

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { LogOut, Tv, Play, Lock, Loader2 } from "lucide-react"
import { getRemoteContent, getGlobalSettings, ContentItem, getRemoteUsers } from "@/lib/store"
import { toast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { VideoPlayer } from "@/components/video-player"
import { VoiceSearch } from "@/components/voice-search"
import { AiAssistant } from "@/components/ai-assistant"

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
        
        if (!currentUser) return;

        // VITALÍCIO E ADMIN SÃO IMORTAIS
        const isImmortal = currentUser.subscriptionTier === 'lifetime' || currentUser.role === 'admin';
        if (isImmortal) return;

        // VERIFICA SE O PIN FOI BLOQUEADO POR LOGIN DUPLO REAL
        const isAuthorized = !currentUser.isBlocked && 
                            (currentUser.activeDevices && currentUser.activeDevices.includes(session.deviceId));

        if (!isAuthorized) {
          localStorage.removeItem("user_session");
          router.push("/login");
          toast({ 
            variant: "destructive", 
            title: "ACESSO BLOQUEADO", 
            description: currentUser.isBlocked ? "Login duplo detectado. PIN suspenso." : "Sessão expirada."
          });
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

  const categories = Array.from(new Set(content.map(c => c.genre || "GERAL"))).sort()

  const filtered = content.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(urlQuery.toLowerCase()) || 
                         (item.genre && item.genre.toLowerCase().includes(urlQuery.toLowerCase()))
    const matchesFolder = selectedFolder ? item.genre === selectedFolder : true
    return matchesSearch && matchesFolder
  })

  if (!isMounted || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <header className="h-16 border-b border-white/5 bg-card/50 backdrop-blur-xl flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="bg-primary p-2 rounded-lg"><Tv className="h-6 w-6 text-white" /></div>
          <span className="text-xl font-bold text-primary font-headline uppercase tracking-tighter italic hidden sm:block">Léo Stream</span>
        </div>
        
        <div className="flex-1 max-w-md mx-4">
          <React.Suspense fallback={<div className="h-10 w-full bg-white/5 animate-pulse rounded-xl" />}>
            <VoiceSearch />
          </React.Suspense>
        </div>

        <Button variant="ghost" size="icon" onClick={() => router.push("/login")} className="text-destructive">
          <LogOut className="h-5 w-5" />
        </Button>
      </header>

      <main className="p-6 space-y-8 max-w-7xl mx-auto">
        <section>
          <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
            <button 
              className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${selectedFolder === null ? 'bg-primary text-white' : 'bg-white/5 text-muted-foreground'}`}
              onClick={() => setSelectedFolder(null)}
            >
              Todos
            </button>
            {categories.map(cat => (
              <button 
                key={cat} 
                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all ${selectedFolder === cat ? 'bg-primary text-white' : 'bg-white/5 text-muted-foreground'}`}
                onClick={() => setSelectedFolder(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>

        <section className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.map(item => (
            <div key={item.id} onClick={async () => {
              if (item.isRestricted) {
                const settings = await getGlobalSettings()
                const pin = prompt("Digite o PIN Parental:")
                if (pin !== settings.parentalPin) return
              }
              setActiveVideo(item)
            }} className="bg-card border border-white/5 rounded-2xl p-5 cursor-pointer hover:border-primary/50 transition-all shadow-xl group">
              <span className="text-[9px] font-bold text-primary uppercase tracking-widest">{item.genre}</span>
              <h3 className="font-bold text-sm uppercase truncate font-headline group-hover:text-primary transition-colors">{item.title}</h3>
              <div className="mt-6 flex justify-between items-center">
                <div className="flex items-center gap-1 bg-black/40 px-2 py-1 rounded-full border border-white/5">
                  <Play className="h-2.5 w-2.5 text-muted-foreground fill-current" />
                  <span className="text-[7px] font-black text-muted-foreground uppercase">{item.type}</span>
                </div>
                {item.isRestricted && <Lock className="h-3 w-3 text-destructive" />}
              </div>
            </div>
          ))}
        </section>
      </main>

      {activeVideo && (
        <Dialog open={!!activeVideo} onOpenChange={() => setActiveVideo(null)}>
          <DialogContent className="max-w-5xl bg-black border-white/10 p-0 overflow-hidden rounded-3xl shadow-2xl">
            <DialogHeader className="sr-only"><DialogTitle>{activeVideo.title}</DialogTitle></DialogHeader>
            <VideoPlayer url={activeVideo.streamUrl || ""} title={activeVideo.title} />
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
