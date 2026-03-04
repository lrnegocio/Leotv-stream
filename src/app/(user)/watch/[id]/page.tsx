
"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { ChevronLeft, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { VideoPlayer } from "@/components/video-player"
import { mockContent } from "@/lib/store"
import { toast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"

export default function WatchPage() {
  const { id } = useParams()
  const router = useRouter()
  const [locked, setLocked] = React.useState(false)
  const [pin, setPin] = React.useState("")
  
  const contentIndex = mockContent.findIndex(c => c.id === id)
  const content = contentIndex !== -1 ? mockContent[contentIndex] : mockContent[0]

  React.useEffect(() => {
    if (content.isRestricted) {
      setLocked(true)
    }
  }, [content])

  const handleUnlock = () => {
    if (pin === "1234") {
      setLocked(false)
      toast({ title: "Desbloqueado", description: "Acesso concedido." })
    } else {
      toast({ variant: "destructive", title: "PIN Incorreto", description: "Verifique a senha parental." })
    }
  }

  const handleNext = () => {
    const nextIdx = (contentIndex + 1) % mockContent.length
    router.push(`/watch/${mockContent[nextIdx].id}`)
  }

  const handlePrev = () => {
    const prevIdx = (contentIndex - 1 + mockContent.length) % mockContent.length
    router.push(`/watch/${mockContent[prevIdx].id}`)
  }

  if (locked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md w-full text-center space-y-6 animate-in fade-in zoom-in duration-300">
          <div className="mx-auto w-20 h-20 bg-secondary/10 flex items-center justify-center rounded-full mb-4">
            <Lock className="h-10 w-10 text-secondary" />
          </div>
          <h1 className="text-3xl font-bold">Conteúdo Protegido</h1>
          <p className="text-muted-foreground">Este canal ou filme é restrito. Digite a senha parental para continuar.</p>
          <div className="flex gap-2 justify-center">
            <Input 
              type="password" 
              maxLength={4} 
              className="w-32 text-center text-2xl tracking-widest bg-card border-white/10" 
              placeholder="••••"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
            />
            <Button onClick={handleUnlock} className="bg-secondary hover:bg-secondary/90">Desbloquear</Button>
          </div>
          <Button variant="ghost" onClick={() => router.back()}>Voltar</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 inset-x-0 h-16 flex items-center px-6 z-50 bg-gradient-to-b from-background to-transparent pointer-events-none">
        <Button variant="ghost" size="icon" onClick={() => router.back()} className="pointer-events-auto rounded-full bg-black/40 text-white hover:bg-black/60">
          <ChevronLeft className="h-6 w-6" />
        </Button>
      </header>

      <div className="max-w-6xl mx-auto pt-20 px-6 space-y-8 pb-20">
        <VideoPlayer 
          url={content.streamUrl || "https://www.youtube.com/embed/dQw4w9WgXcQ"} 
          title={content.title}
          onNext={handleNext}
          onPrev={handlePrev}
        />

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-4">
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="text-primary font-bold">{content.genre}</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">Transmissão P2P</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">Full HD / 4K</span>
            </div>
            <h1 className="text-4xl font-extrabold font-headline">{content.title}</h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {content.description}
            </p>
          </div>

          <div className="space-y-6">
            <div className="p-6 bg-card rounded-xl border border-white/5 shadow-lg space-y-4">
              <h3 className="font-bold text-lg border-b border-white/5 pb-2">Recomendados</h3>
              {mockContent.filter(c => c.id !== content.id).slice(0, 3).map(item => (
                <div key={item.id} className="flex gap-4 group cursor-pointer" onClick={() => router.push(`/watch/${item.id}`)}>
                  <div className="w-24 aspect-video bg-muted rounded overflow-hidden flex-shrink-0">
                     <img src={item.thumbnail} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                  </div>
                  <div>
                    <p className="font-medium text-sm line-clamp-2">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.genre}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
