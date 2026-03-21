
"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { LogOut, Tv, Play, Lock, Loader2, Timer, Search, ChevronRight, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getRemoteContent, ContentItem, User } from "@/lib/store"
import { toast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { VideoPlayer } from "@/components/video-player"
import { VoiceSearch } from "@/components/voice-search"
import Image from "next/image"

function ExpiryCountdown({ expiryDate, onExpire }: { expiryDate?: string; onExpire: () => void }) {
  const [timeLeft, setTimeLeft] = React.useState("")

  React.useEffect(() => {
    if (!expiryDate) return
    const timer = setInterval(() => {
      const now = new Date().getTime()
      const end = new Date(expiryDate).getTime()
      const diff = end - now

      if (diff <= 0) {
        setTimeLeft("SINAL EXPIRADO")
        clearInterval(timer)
        onExpire()
        return
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setTimeLeft(`${days > 0 ? days + 'd ' : ''}${hours}h ${minutes}m ${seconds}s`)
    }, 1000)
    return () => clearInterval(timer)
  }, [expiryDate, onExpire])

  return (
    <div className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full border border-primary/20">
      <Timer className="h-3 w-3 text-primary animate-pulse" />
      <span className="text-[9px] font-black uppercase tracking-widest text-primary">{timeLeft}</span>
    </div>
  )
}

export default function HomeContent() {
  const [content, setContent] = React.useState<ContentItem[]>([])
  const [user, setUser] = React.useState<User | null>(null)
  const [activeVideo, setActiveVideo] = React.useState<ContentItem | null>(null)
  const [loading, setLoading] = React.useState(true)
  const router = useRouter()
  const searchParams = useSearchParams()
  const searchQuery = searchParams.get('q')?.toLowerCase() || ""

  const handleLogout = React.useCallback(() => {
    localStorage.removeItem("user_session")
    router.push("/login")
    toast({ variant: "destructive", title: "SINAL ENCERRADO", description: "Seu acesso expirou ou foi desconectado pelo sistema." })
  }, [router])

  React.useEffect(() => {
    const session = localStorage.getItem("user_session")
    if (!session) { router.push("/login"); return; }
    const userData = JSON.parse(session)
    setUser(userData)

    // Verificação inicial de expiração
    if (userData.expiryDate && new Date(userData.expiryDate) < new Date()) {
      handleLogout()
      return
    }

    const load = async () => {
      const data = await getRemoteContent()
      // Garante ordem alfabética
      setContent(data.sort((a, b) => a.title.localeCompare(b.title)))
      setLoading(false)
    }
    load()
  }, [router, handleLogout])

  // Trava de Expiração Real-Time (Corta o sinal se o tempo acabar enquanto assiste)
  React.useEffect(() => {
    const interval = setInterval(() => {
      const session = localStorage.getItem("user_session")
      if (session) {
        const u = JSON.parse(session)
        if (u.expiryDate && new Date(u.expiryDate) < new Date()) {
          handleLogout()
        }
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [handleLogout])

  // Filtra o conteúdo com base na busca do Mestre Léo
  const filteredContent = content.filter(item => 
    item.title.toLowerCase().includes(searchQuery) || 
    item.genre.toLowerCase().includes(searchQuery)
  )

  // Agrupa por Categorias Únicas (Pastas)
  const categories = Array.from(new Set(filteredContent.map(item => item.genre))).sort()

  const handleNavigate = (direction: 'next' | 'prev') => {
    if (!activeVideo) return
    const currentCategoryItems = filteredContent.filter(i => i.genre === activeVideo.genre)
    const currentIndex = currentCategoryItems.findIndex(i => i.id === activeVideo.id)
    let nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1
    
    if (nextIndex >= currentCategoryItems.length) nextIndex = 0
    if (nextIndex < 0) nextIndex = currentCategoryItems.length - 1
    
    setActiveVideo(currentCategoryItems[nextIndex])
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>

  return (
    <div className="min-h-screen bg-background text-foreground pb-20 overflow-x-hidden">
      <header className="h-20 border-b border-white/5 bg-card/30 backdrop-blur-3xl flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="bg-primary p-2.5 rounded-xl shadow-lg shadow-primary/30"><Tv className="h-6 w-6 text-white" /></div>
          <span className="text-xl font-black text-primary font-headline uppercase italic tracking-tighter hidden lg:block">Léo Stream Master</span>
        </div>
        <div className="flex-1 max-w-xl mx-4">
          <VoiceSearch />
        </div>
        <div className="flex items-center gap-4">
          {user && <ExpiryCountdown expiryDate={user.expiryDate} onExpire={handleLogout} />}
          <Button variant="ghost" size="icon" onClick={handleLogout} className="text-destructive h-12 w-12 rounded-xl hover:bg-destructive/10"><LogOut className="h-6 w-6" /></Button>
        </div>
      </header>

      <main className="p-4 sm:p-8 max-w-[1600px] mx-auto space-y-12">
        {categories.length === 0 ? (
          <div className="py-40 text-center opacity-20 uppercase font-black text-xl tracking-widest italic">Nenhum sinal localizado na rede...</div>
        ) : (
          categories.map(category => (
            <section key={category} className="space-y-6">
              <div className="flex items-center gap-3 border-l-4 border-primary pl-4">
                <h2 className="text-xl font-black uppercase italic tracking-tighter text-white">{category}</h2>
                <span className="text-[10px] bg-white/5 px-2 py-1 rounded-md font-bold opacity-40 uppercase tracking-widest">{filteredContent.filter(i => i.genre === category).length} CANAIS</span>
              </div>
              
              <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8">
                {filteredContent.filter(item => item.genre === category).map(item => (
                  <div 
                    key={item.id} 
                    onClick={() => {
                      // Verifica expiração antes de abrir o player
                      const session = localStorage.getItem("user_session")
                      if (session) {
                        const u = JSON.parse(session)
                        if (u.expiryDate && new Date(u.expiryDate) < new Date()) {
                          handleLogout()
                          return
                        }
                      }
                      setActiveVideo(item)
                    }} 
                    className="group relative aspect-[2/3] bg-card rounded-2xl overflow-hidden cursor-pointer border border-white/5 hover:border-primary/50 transition-all hover:scale-[1.03] active:scale-95 shadow-2xl"
                  >
                    {item.imageUrl ? (
                      <Image 
                        src={item.imageUrl} 
                        alt={item.title} 
                        fill 
                        className="object-cover opacity-70 group-hover:opacity-100 transition-opacity" 
                        sizes="(max-width: 768px) 50vw, 200px"
                      />
                    ) : (
                      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 flex flex-col items-center justify-center p-6 text-center">
                        <Tv className="h-10 w-10 text-primary mb-4 opacity-20" />
                        <span className="text-[10px] font-black uppercase text-primary/40 leading-tight">{item.title}</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent p-4 flex flex-col justify-end">
                      <h3 className="font-black text-[11px] uppercase italic truncate tracking-tighter leading-none text-white group-hover:text-primary transition-colors">{item.title}</h3>
                      <div className="mt-2 flex items-center gap-2">
                         <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                         <span className="text-[7px] font-bold uppercase opacity-40 tracking-widest text-white">Sinal Ativo</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </main>

      {activeVideo && (
        <Dialog open={!!activeVideo} onOpenChange={() => setActiveVideo(null)}>
          <DialogContent className="max-w-[95vw] sm:max-w-6xl bg-black border-white/10 p-0 overflow-hidden rounded-[2rem] shadow-[0_0_100px_rgba(var(--primary),0.3)]">
            <DialogHeader className="sr-only">
              <DialogTitle>{activeVideo.title}</DialogTitle>
              <DialogDescription>Sinal Master de alta performance</DialogDescription>
            </DialogHeader>
            <VideoPlayer 
              url={activeVideo.streamUrl || ""} 
              title={activeVideo.title} 
              onNext={() => handleNavigate('next')}
              onPrev={() => handleNavigate('prev')}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
