
'use client';

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { LogOut, Tv, Play, Lock, Loader2, WifiOff } from "lucide-react"
import { getRemoteContent, getGlobalSettings, ContentItem, removeActiveDevice, getRemoteUsers } from "@/lib/store"
import { toast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { VideoPlayer } from "@/components/video-player"
import { VoiceSearch } from "@/components/voice-search"
import { AiAssistant } from "@/components/ai-assistant"

export default function HomeContent() {
  const searchParams = useSearchParams()
  const urlQuery = searchParams.get('q') || ""
  const [content, setContent] = React.useState<ContentItem[]>([])
  const [selectedFolder, setSelectedFolder] = React.useState<string | null>(null)
  const [activeVideo, setActiveVideo] = React.useState<ContentItem | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [isMounted, setIsMounted] = React.useState(false)
  const [isOnline, setIsOnline] = React.useState(true)
  const router = useRouter()

  React.useEffect(() => {
    setIsMounted(true)
    setIsOnline(navigator.onLine)

    const sessionStr = localStorage.getItem("user_session")
    if (!sessionStr) {
      router.push("/login")
      return
    }
    const session = JSON.parse(sessionStr);
    
    // HEARTBEAT DE SEGURANÇA MESTRE (TRAVA DE TELAS)
    const checkSecurity = async () => {
      try {
        const users = await getRemoteUsers();
        const currentUser = users.find(u => u.id === session.id);
        
        if (!currentUser) return;

        // SE BLOQUEADO OU SE ESTE APARELHO FOI REMOVIDO DA LISTA
        // Mestre e Vitalício têm prioridade de conexão
        const isAdmin = currentUser.pin.toLowerCase() === 'adm77x2p';
        const isLifetime = currentUser.subscriptionTier === 'lifetime';
        const isStillAuthorized = !currentUser.isBlocked && 
                                 (isAdmin || isLifetime || 
                                  (currentUser.activeDevices && currentUser.activeDevices.includes(session.deviceId)));

        if (!isStillAuthorized) {
          localStorage.removeItem("user_session");
          router.push("/login");
          toast({ 
            variant: "destructive", 
            title: "SESSÃO ENCERRADA", 
            description: currentUser.isBlocked ? "Bloqueado por uso simultâneo além do limite." : "Acesso expirado."
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

    const handleStatus = () => setIsOnline(navigator.onLine)
    window.addEventListener('online', handleStatus)
    window.addEventListener('offline', handleStatus)
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('online', handleStatus)
      window.removeEventListener('offline', handleStatus)
    }
  }, [router])

  const handleLogout = async () => {
    const sessionStr = localStorage.getItem("user_session")
    if (sessionStr) {
      const session = JSON.parse(sessionStr);
      await removeActiveDevice(session.id, session.deviceId);
    }
    localStorage.removeItem("user_session")
    router.push("/login")
  }

  const categories = Array.from(new Set(content.map(c => c.genre || "GERAL"))).sort()

  const filtered = content.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(urlQuery.toLowerCase()) || 
                         (item.genre && item.genre.toLowerCase().includes(urlQuery.toLowerCase()))
    const matchesFolder = selectedFolder ? item.genre === selectedFolder : true
    return matchesSearch && matchesFolder
  })

  const openContent = async (item: ContentItem) => {
    if (!navigator.onLine) {
      toast({ variant: "destructive", title: "Sem Internet", description: "Conecte-se para assistir." })
      return
    }

    if (item.isRestricted) {
      const settings = await getGlobalSettings()
      const userInput = prompt("Conteúdo Restrito. Senha Parental:")
      if (userInput !== settings.parentalPin) {
        toast({ variant: "destructive", title: "Senha Incorreta", description: "Acesso negado." })
        return
      }
    }
    setActiveVideo(item)
  }

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
          <div className="bg-primary p-2 rounded-lg">
            <Tv className="h-6 w-6 text-white" />
          </div>
          <span className="text-xl font-bold text-primary font-headline uppercase tracking-tighter italic hidden sm:block">Léo Tv</span>
        </div>
        
        <div className="flex-1 max-w-md mx-4">
          <VoiceSearch />
        </div>

        <Button variant="ghost" size="icon" onClick={handleLogout} className="text-destructive hover:bg-destructive/10">
          <LogOut className="h-5 w-5" />
        </Button>
      </header>

      <main className="p-6 space-y-8 max-w-7xl mx-auto">
        {!isOnline && (
          <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-2xl flex items-center gap-4 text-destructive">
            <WifiOff className="h-6 w-6" />
            <p className="text-xs font-bold uppercase">Modo Offline Ativo.</p>
          </div>
        )}

        <section>
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4 font-headline italic">Pastas de Canais</h2>
          <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
            <Button 
              variant={selectedFolder === null ? "default" : "secondary"} 
              className="rounded-xl font-bold uppercase text-[10px] min-w-[120px] h-10 shadow-lg"
              onClick={() => setSelectedFolder(null)}
            >
              Todos
            </Button>
            {categories.map(cat => (
              <Button 
                key={cat}
                variant={selectedFolder === cat ? "default" : "secondary"} 
                className="rounded-xl font-bold uppercase text-[10px] min-w-[120px] h-10 shadow-lg"
                onClick={() => setSelectedFolder(cat)}
              >
                {cat}
              </Button>
            ))}
          </div>
        </section>

        <section className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.length === 0 ? (
            <div className="col-span-full py-20 text-center opacity-50 border border-dashed border-white/10 rounded-3xl">
              <p className="uppercase text-xs font-bold font-headline">Nenhum resultado encontrado.</p>
            </div>
          ) : (
            filtered.map(item => (
              <div 
                key={item.id} 
                onClick={() => openContent(item)}
                className="bg-card border border-white/5 rounded-2xl p-5 cursor-pointer hover:border-primary/50 transition-all group relative overflow-hidden active:scale-95 shadow-xl"
              >
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-primary uppercase tracking-widest">{item.genre}</span>
                  <h3 className="font-bold text-sm uppercase truncate group-hover:text-primary transition-colors font-headline">{item.title}</h3>
                </div>
                
                <div className="mt-6 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded-full">
                    <Play className="h-2.5 w-2.5 text-muted-foreground fill-current" />
                    <span className="text-[7px] font-black text-muted-foreground uppercase tracking-widest">{item.type === 'channel' ? 'AO VIVO' : 'P2P'}</span>
                  </div>
                  {item.isRestricted && <Lock className="h-3 w-3 text-destructive" />}
                </div>
              </div>
            ))
          )}
        </section>
      </main>

      {activeVideo && (
        <Dialog open={!!activeVideo} onOpenChange={() => setActiveVideo(null)}>
          <DialogContent className="max-w-5xl bg-black border-white/10 p-0 overflow-hidden rounded-3xl shadow-2xl">
            <DialogHeader className="sr-only">
              <DialogTitle>{activeVideo.title}</DialogTitle>
              <DialogDescription>Player Léo Stream</DialogDescription>
            </DialogHeader>
            <VideoPlayer 
              url={activeVideo.streamUrl || ""} 
              title={activeVideo.title} 
              onNext={() => {
                const idx = filtered.findIndex(i => i.id === activeVideo.id)
                if (idx < filtered.length - 1) setActiveVideo(filtered[idx + 1])
              }}
              onPrev={() => {
                const idx = filtered.findIndex(i => i.id === activeVideo.id)
                if (idx > 0) setActiveVideo(filtered[idx - 1])
              }}
            />
          </DialogContent>
        </Dialog>
      )}
      <AiAssistant />
    </div>
  )
}
