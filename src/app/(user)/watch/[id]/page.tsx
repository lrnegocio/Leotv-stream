
"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { ChevronLeft, Lock, Play, ListOrdered, Layers, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { VideoPlayer } from "@/components/video-player"
import { getMockContent, Episode, ContentItem, getGlobalParentalPin } from "@/lib/store"
import { toast } from "@/hooks/use-toast"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"

export default function WatchPage() {
  const { id } = useParams()
  const router = useRouter()
  const [locked, setLocked] = React.useState(false)
  const [pin, setPin] = React.useState("")
  const [currentUrl, setCurrentUrl] = React.useState("")
  const [currentEpTitle, setCurrentEpTitle] = React.useState("")
  const [contentList, setContentList] = React.useState<ContentItem[]>([])
  const [content, setContent] = React.useState<ContentItem | null>(null)

  React.useEffect(() => {
    const list = getMockContent()
    setContentList(list)
    const item = list.find(c => c.id === id) || list[0]
    if (item) {
      setContent(item)
      if (item.isRestricted) {
        setLocked(true)
      }
      
      if (item.type === 'channel' || item.type === 'movie') {
        setCurrentUrl(item.streamUrl || "")
        setCurrentEpTitle(item.title)
      } else if (item.type === 'series' && item.episodes?.length) {
        setCurrentUrl(item.episodes[0].streamUrl)
        setCurrentEpTitle(`Episódio ${item.episodes[0].number}`)
      } else if (item.type === 'multi-season' && item.seasons?.length && item.seasons[0].episodes.length) {
        setCurrentUrl(item.seasons[0].episodes[0].streamUrl)
        setCurrentEpTitle(`T1: Ep ${item.seasons[0].episodes[0].number}`)
      }
    }
  }, [id])

  const handleNext = () => {
    const currentIndex = contentList.findIndex(c => c.id === content?.id)
    if (currentIndex < contentList.length - 1) {
      router.push(`/watch/${contentList[currentIndex + 1].id}`)
    }
  }

  const handlePrev = () => {
    const currentIndex = contentList.findIndex(c => c.id === content?.id)
    if (currentIndex > 0) {
      router.push(`/watch/${contentList[currentIndex - 1].id}`)
    }
  }

  const handleUnlock = () => {
    const globalPin = getGlobalParentalPin()
    if (pin === globalPin) {
      setLocked(false)
      toast({ title: "Desbloqueado", description: "Acesso concedido." })
    } else {
      toast({ variant: "destructive", title: "PIN Incorreto", description: "Verifique a senha parental global." })
    }
  }

  const handleEpChange = (ep: Episode, prefix: string = "Episódio") => {
    setCurrentUrl(ep.streamUrl)
    setCurrentEpTitle(`${prefix} ${ep.number}`)
    toast({ title: "Carregando", description: `${prefix} ${ep.number}` })
  }

  if (!content) return null

  if (locked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md w-full text-center space-y-6 animate-in fade-in zoom-in duration-300">
          <div className="mx-auto w-20 h-20 bg-secondary/10 flex items-center justify-center rounded-full mb-4">
            <Lock className="h-10 w-10 text-secondary" />
          </div>
          <h1 className="text-3xl font-bold font-headline uppercase tracking-tighter">Conteúdo Restrito</h1>
          <p className="text-muted-foreground uppercase text-[10px] tracking-widest">Digite a senha parental para continuar.</p>
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
            <Button onClick={handleUnlock} className="bg-secondary hover:bg-secondary/90 font-bold uppercase">ENTRAR</Button>
          </div>
          <Button variant="ghost" onClick={() => router.push('/home')} className="uppercase text-[10px]">Voltar para Home</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="fixed top-0 inset-x-0 h-16 flex items-center px-6 z-50 bg-gradient-to-b from-background to-transparent pointer-events-none">
        <Button variant="ghost" size="icon" onClick={() => router.push('/home')} className="pointer-events-auto rounded-xl bg-black/60 text-white hover:bg-black/80">
          <ChevronLeft className="h-6 w-6" />
        </Button>
      </header>

      <div className="max-w-6xl mx-auto pt-20 px-6 space-y-8 pb-20">
        <VideoPlayer 
          url={currentUrl || ""} 
          title={`${content.title} - ${currentEpTitle}`}
          onNext={handleNext}
          onPrev={handlePrev}
        />

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2">
              <Badge className="bg-primary uppercase text-[9px] font-bold">{content.genre}</Badge>
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">{content.type}</span>
            </div>
            <h1 className="text-4xl font-extrabold font-headline uppercase tracking-tighter">{content.title}</h1>
            <p className="text-muted-foreground leading-relaxed text-sm">{content.description}</p>
          </div>

          <div className="space-y-6">
            <div className="p-6 bg-card rounded-xl border border-white/5 shadow-lg space-y-4">
              <h3 className="font-bold text-lg flex items-center gap-2 uppercase tracking-tight">
                <ListOrdered className="h-5 w-5 text-primary" /> Episódios / Canais
              </h3>
              
              {content.type === 'series' && (
                <div className="grid grid-cols-2 gap-2 max-h-[400px] overflow-y-auto pr-2">
                  {content.episodes?.map(ep => (
                    <Button 
                      key={ep.id} 
                      variant={currentUrl === ep.streamUrl ? "default" : "secondary"}
                      className="text-[10px] font-bold uppercase"
                      onClick={() => handleEpChange(ep)}
                    >
                      EPISÓDIO {ep.number}
                    </Button>
                  ))}
                </div>
              )}

              {content.type === 'multi-season' && (
                <Tabs defaultValue="s1">
                  <TabsList className="w-full bg-black/40">
                    {content.seasons?.map(s => (
                      <TabsTrigger key={s.id} value={`s${s.number}`} className="flex-1 uppercase font-bold text-[10px]">T {s.number}</TabsTrigger>
                    ))}
                  </TabsList>
                  {content.seasons?.map(s => (
                    <TabsContent key={s.id} value={`s${s.number}`} className="grid grid-cols-2 gap-2 mt-4">
                      {s.episodes.map(ep => (
                        <Button 
                          key={ep.id} 
                          variant={currentUrl === ep.streamUrl ? "default" : "secondary"}
                          className="text-[10px] font-bold uppercase"
                          onClick={() => handleEpChange(ep, `T${s.number} Ep`)}
                        >
                          EP {ep.number}
                        </Button>
                      ))}
                    </TabsContent>
                  ))}
                </Tabs>
              )}

              {content.type === 'channel' && (
                <div className="p-4 bg-primary/10 rounded-lg border border-primary/20 text-center space-y-2">
                  <p className="text-[10px] font-bold text-primary uppercase">SINAL P2P MASTER ATIVO</p>
                  <p className="text-[9px] text-muted-foreground uppercase tracking-widest">Transmissão Direta Sem Delay</p>
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" onClick={handlePrev} className="flex-1 text-[10px] uppercase font-bold">Anterior</Button>
                    <Button variant="secondary" size="sm" onClick={handleNext} className="flex-1 text-[10px] uppercase font-bold">Próximo</Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
