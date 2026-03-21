
"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { LogOut, Tv, Play, Lock, Loader2, Search, Folder, ShieldAlert, EyeOff, Eye, Key } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { getRemoteContent, ContentItem, User, getGlobalSettings } from "@/lib/store"
import { toast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { VideoPlayer } from "@/components/video-player"
import { VoiceSearch } from "@/components/voice-search"
import Image from "next/image"

export default function HomeContent() {
  const [content, setContent] = React.useState<ContentItem[]>([])
  const [user, setUser] = React.useState<User | null>(null)
  const [activeVideo, setActiveVideo] = React.useState<ContentItem | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [showAdult, setShowAdult] = React.useState(false)
  const [parentalPin, setParentalPin] = React.useState("")
  const [pinInput, setPinInput] = React.useState("")
  const [isPinDialogOpen, setIsPinDialogOpen] = React.useState(false)
  const [pendingVideo, setPendingVideo] = React.useState<ContentItem | null>(null)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const searchQuery = searchParams.get('q')?.toLowerCase() || ""

  const handleLogout = React.useCallback(() => {
    localStorage.removeItem("user_session")
    router.push("/login")
    toast({ variant: "destructive", title: "SINAL EXPIRADO", description: "Acesso desconectado." })
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

  // Varredura de Expiração em Tempo Real (5s)
  React.useEffect(() => {
    const interval = setInterval(() => {
      const session = localStorage.getItem("user_session")
      if (session) {
        const u = JSON.parse(session)
        if (u.expiryDate && new Date(u.expiryDate) < new Date() && u.subscriptionTier !== 'lifetime') {
          handleLogout()
        }
      }
    }, 5000)
    return () => clearInterval(interval)
  }, [handleLogout])

  // Filtro Instantâneo Master
  const filteredContent = React.useMemo(() => {
    return content.filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchQuery) || (item.genre && item.genre.toLowerCase().includes(searchQuery));
      if (item.isRestricted && !showAdult) return false;
      return matchesSearch;
    })
  }, [content, searchQuery, showAdult])

  // Agrupamento de Pastas Únicas
  const categories = React.useMemo(() => {
    const cats = Array.from(new Set(filteredContent.map(item => (item.genre || "GERAL").toUpperCase()))).sort()
    return cats
  }, [filteredContent])

  const handleVideoClick = (item: ContentItem) => {
    if (item.isRestricted) {
      setPendingVideo(item)
      setIsPinDialogOpen(true)
    } else {
      setActiveVideo(item)
    }
  }

  const verifyPin = () => {
    if (pinInput === parentalPin) {
      setActiveVideo(pendingVideo)
      setIsPinDialogOpen(false)
      setPinInput("")
      setPendingVideo(null)
    } else {
      toast({ variant: "destructive", title: "SENHA INCORRETA" })
    }
  }

  const handleNavigate = (direction: 'next' | 'prev') => {
    if (!activeVideo) return
    const currentCategoryItems = filteredContent.filter(i => (i.genre || "GERAL").toUpperCase() === (activeVideo.genre || "GERAL").toUpperCase())
    const currentIndex = currentCategoryItems.findIndex(i => i.id === activeVideo.id)
    let nextIndex = direction === 'next' ? currentIndex + 1 : currentIndex - 1
    
    if (nextIndex >= currentCategoryItems.length) nextIndex = 0
    if (nextIndex < 0) nextIndex = currentCategoryItems.length - 1
    
    setActiveVideo(currentCategoryItems[nextIndex])
  }

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <header className="h-20 border-b border-white/5 bg-card/30 backdrop-blur-3xl flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="bg-primary p-2.5 rounded-xl shadow-lg shadow-primary/30"><Tv className="h-6 w-6 text-white" /></div>
          <div className="hidden lg:block">
            <span className="text-xl font-black text-primary font-headline uppercase italic tracking-tighter block">Léo Master Elite</span>
            <span className="text-[8px] font-bold uppercase opacity-40">{content.length} CANAIS NO AR</span>
          </div>
        </div>
        
        <div className="flex-1 max-w-xl mx-4">
          <VoiceSearch />
        </div>

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
             <Label htmlFor="adult-mode" className="text-[9px] font-black uppercase opacity-60 cursor-pointer flex items-center gap-2">
                {showAdult ? <Eye className="h-3 w-3 text-primary" /> : <EyeOff className="h-3 w-3" />}
                {showAdult ? "Adulto: ON" : "Adulto: OFF"}
             </Label>
             <Switch id="adult-mode" checked={showAdult} onCheckedChange={setShowAdult} />
          </div>
          <Button variant="ghost" size="icon" onClick={handleLogout} className="text-destructive h-12 w-12 rounded-xl hover:bg-destructive/10"><LogOut className="h-6 w-6" /></Button>
        </div>
      </header>

      <main className="p-4 sm:p-8 max-w-[1600px] mx-auto space-y-16">
        {categories.length === 0 ? (
          <div className="py-40 text-center opacity-20 uppercase font-black text-xl tracking-widest italic">Nenhum sinal localizado...</div>
        ) : (
          categories.map(category => {
            const categoryItems = filteredContent.filter(item => (item.genre || "GERAL").toUpperCase() === category)
            return (
              <section key={category} className="space-y-6">
                <div className="flex items-center justify-between border-b border-white/5 pb-4">
                  <div className="flex items-center gap-3">
                    <Folder className="h-6 w-6 text-primary" />
                    <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white">{category}</h2>
                  </div>
                  <span className="text-[10px] bg-primary/10 text-primary border border-primary/20 px-3 py-1 rounded-full font-black uppercase tracking-widest">
                    {categoryItems.length} CANAIS
                  </span>
                </div>
                
                <div className="grid gap-6 grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8">
                  {categoryItems.map(item => (
                    <div 
                      key={item.id} 
                      onClick={() => handleVideoClick(item)} 
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
                           <h3 className="font-black text-[12px] uppercase italic truncate tracking-tighter text-white group-hover:text-primary transition-colors flex-1">{item.title}</h3>
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

      <Dialog open={isPinDialogOpen} onOpenChange={setIsPinDialogOpen}>
        <DialogContent className="sm:max-w-md bg-card border-white/10 rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-black uppercase italic text-primary text-center">Conteúdo Restrito</DialogTitle>
            <DialogDescription className="text-center text-[10px] uppercase font-bold opacity-60">Senha Parental de 4 dígitos necessária.</DialogDescription>
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
             <Button onClick={verifyPin} className="w-full h-14 bg-primary text-lg font-black uppercase rounded-2xl">DESBLOQUEAR</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {activeVideo && (
        <Dialog open={!!activeVideo} onOpenChange={() => setActiveVideo(null)}>
          <DialogContent className="max-w-[95vw] sm:max-w-6xl bg-black border-white/10 p-0 overflow-hidden rounded-3xl">
            <DialogHeader className="sr-only">
              <DialogTitle>{activeVideo.title}</DialogTitle>
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
