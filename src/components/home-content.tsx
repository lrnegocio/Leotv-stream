'use client';

import * as React from "react"
import { useRouter } from "next/navigation"
import { LogOut, Folder, Tv, Play, Lock, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getMockContent, getGlobalParentalPin, ContentItem } from "@/lib/store"
import { toast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { VideoPlayer } from "@/components/video-player"
import { VoiceSearch } from "@/components/voice-search"

export default function HomeContent() {
  const [searchTerm, setSearchTerm] = React.useState("")
  const [content, setContent] = React.useState<ContentItem[]>([])
  const [selectedFolder, setSelectedFolder] = React.useState<string | null>(null)
  const [activeVideo, setActiveVideo] = React.useState<ContentItem | null>(null)
  const router = useRouter()

  React.useEffect(() => {
    const session = localStorage.getItem("user_session")
    if (!session) {
      router.push("/login")
      return
    }
    setContent(getMockContent())
  }, [router])

  const handleLogout = () => {
    localStorage.removeItem("user_session")
    router.push("/login")
    toast({ title: "Sessão Encerrada", description: "Até a próxima!" })
  }

  const categories = Array.from(new Set(content.map(c => c.genre || "GERAL"))).sort()

  const filtered = content.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         (item.genre && item.genre.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesFolder = selectedFolder ? item.genre === selectedFolder : true
    return matchesSearch && matchesFolder
  })

  const openContent = (item: ContentItem) => {
    if (item.isRestricted) {
      const pin = getGlobalParentalPin()
      const userInput = prompt("Este conteúdo é restrito. Insira a Senha Parental:")
      if (userInput !== pin) {
        toast({ variant: "destructive", title: "Senha Incorreta", description: "Acesso negado." })
        return
      }
    }
    setActiveVideo(item)
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
        <section>
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">Pastas de Canais</h2>
          <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
            <Button 
              variant={selectedFolder === null ? "default" : "secondary"} 
              className="rounded-xl font-bold uppercase text-[10px] min-w-[120px]"
              onClick={() => setSelectedFolder(null)}
            >
              <Folder className="mr-2 h-4 w-4" /> Todos
            </Button>
            {categories.map(cat => (
              <Button 
                key={cat}
                variant={selectedFolder === cat ? "default" : "secondary"} 
                className="rounded-xl font-bold uppercase text-[10px] min-w-[120px]"
                onClick={() => setSelectedFolder(cat)}
              >
                <Folder className="mr-2 h-4 w-4" /> {cat}
              </Button>
            ))}
          </div>
        </section>

        <section className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {filtered.length === 0 ? (
            <div className="col-span-full py-20 text-center opacity-50">
              <p className="uppercase text-xs font-bold">Nenhum canal encontrado nesta pasta.</p>
            </div>
          ) : (
            filtered.map(item => (
              <div 
                key={item.id} 
                onClick={() => openContent(item)}
                className="bg-card border border-white/5 rounded-xl p-4 cursor-pointer hover:border-primary/50 transition-all group relative overflow-hidden active:scale-95"
              >
                <div className="flex flex-col gap-1">
                  <span className="text-[9px] font-bold text-primary uppercase tracking-widest">{item.genre}</span>
                  <h3 className="font-bold text-sm uppercase truncate group-hover:text-primary transition-colors">{item.title}</h3>
                </div>
                
                <div className="mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <Play className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[8px] font-bold text-muted-foreground uppercase">{item.type === 'channel' ? 'AO VIVO' : 'FILME'}</span>
                  </div>
                  {item.isRestricted && <Lock className="h-3 w-3 text-destructive" />}
                </div>

                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))
          )}
        </section>
      </main>

      {activeVideo && (
        <Dialog open={!!activeVideo} onOpenChange={() => setActiveVideo(null)}>
          <DialogContent className="max-w-5xl bg-black border-white/10 p-0 overflow-hidden rounded-2xl shadow-2xl">
            <DialogHeader className="sr-only">
              <DialogTitle>{activeVideo.title}</DialogTitle>
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
    </div>
  )
}
