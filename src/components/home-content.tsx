
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { LogOut, Tv, Play, Lock, Loader2, Timer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getRemoteContent, getGlobalSettings, ContentItem, User } from "@/lib/store"
import { toast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { VideoPlayer } from "@/components/video-player"
import { VoiceSearch } from "@/components/voice-search"
import Image from "next/image"

function ExpiryCountdown({ expiryDate }: { expiryDate?: string }) {
  const [timeLeft, setTimeLeft] = React.useState("")

  React.useEffect(() => {
    if (!expiryDate) return
    const timer = setInterval(() => {
      const now = new Date().getTime()
      const end = new Date(expiryDate).getTime()
      const diff = end - now

      if (diff <= 0) { setTimeLeft("SINAL EXPIRADO"); clearInterval(timer); return; }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24))
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      const seconds = Math.floor((diff % (1000 * 60)) / 1000)

      setTimeLeft(`${days > 0 ? days + 'd ' : ''}${hours}h ${minutes}m ${seconds}s`)
    }, 1000)
    return () => clearInterval(timer)
  }, [expiryDate])

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

  React.useEffect(() => {
    const session = localStorage.getItem("user_session")
    if (!session) { router.push("/login"); return; }
    setUser(JSON.parse(session))

    const load = async () => {
      const data = await getRemoteContent()
      setContent(data)
      setLoading(false)
    }
    load()
  }, [router])

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>

  return (
    <div className="min-h-screen bg-background text-foreground pb-20 overflow-x-hidden">
      <header className="h-20 border-b border-white/5 bg-card/30 backdrop-blur-3xl flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="bg-primary p-2.5 rounded-xl"><Tv className="h-6 w-6 text-white" /></div>
          <span className="text-xl font-black text-primary font-headline uppercase italic tracking-tighter hidden sm:block">Léo Stream</span>
        </div>
        <div className="flex-1 max-w-lg mx-8"><VoiceSearch /></div>
        <div className="flex items-center gap-4">
          {user && <ExpiryCountdown expiryDate={user.expiryDate} />}
          <Button variant="ghost" size="icon" onClick={() => { localStorage.removeItem("user_session"); router.push("/login"); }} className="text-destructive h-12 w-12 rounded-xl hover:bg-destructive/10"><LogOut className="h-6 w-6" /></Button>
        </div>
      </header>

      <main className="p-8 max-w-7xl mx-auto space-y-12">
        <section className="grid gap-6 grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {content.map(item => (
            <div key={item.id} onClick={() => setActiveVideo(item)} className="group relative aspect-[2/3] bg-card rounded-[2rem] overflow-hidden cursor-pointer border border-white/5 hover:border-primary/50 transition-all hover:scale-[1.03] active:scale-95 shadow-2xl">
              {item.imageUrl ? (
                <Image src={item.imageUrl} alt={item.title} fill className="object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-secondary/20 flex flex-col items-center justify-center p-6 text-center">
                  <Tv className="h-10 w-10 text-primary mb-4 opacity-20" />
                  <span className="text-[10px] font-black uppercase text-primary/40 leading-tight">{item.title}</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent p-6 flex flex-col justify-end">
                <span className="text-[7px] font-black uppercase text-primary tracking-[0.2em] mb-1">{item.genre}</span>
                <h3 className="font-black text-xs uppercase italic truncate tracking-tighter leading-none">{item.title}</h3>
                <div className="mt-3 flex items-center gap-2">
                   <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                   <span className="text-[6px] font-bold uppercase opacity-40">Live 4K</span>
                </div>
              </div>
            </div>
          ))}
        </section>
      </main>

      {activeVideo && (
        <Dialog open={!!activeVideo} onOpenChange={() => setActiveVideo(null)}>
          <DialogContent className="max-w-5xl bg-black border-white/10 p-0 overflow-hidden rounded-[2.5rem] shadow-3xl">
            <DialogHeader className="sr-only">
              <DialogTitle>{activeVideo.title}</DialogTitle>
              <DialogDescription>Player de conteúdo em alta performance</DialogDescription>
            </DialogHeader>
            <VideoPlayer url={activeVideo.streamUrl || ""} title={activeVideo.title} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
