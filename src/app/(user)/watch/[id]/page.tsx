
"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { ChevronLeft, Info, Share2, Heart, Lock, Unlock } from "lucide-react"
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
  const content = mockContent.find(c => c.id === id) || mockContent[0]

  React.useEffect(() => {
    if (content.isRestricted) {
      setLocked(true)
    }
  }, [content])

  const handleUnlock = () => {
    if (pin === "1234") {
      setLocked(false)
      toast({ title: "Unlocked", description: "Access granted." })
    } else {
      toast({ variant: "destructive", title: "Wrong PIN", description: "Please enter the correct master password." })
    }
  }

  if (locked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <div className="max-w-md w-full text-center space-y-6 animate-in fade-in zoom-in duration-300">
          <div className="mx-auto w-20 h-20 bg-secondary/10 flex items-center justify-center rounded-full mb-4">
            <Lock className="h-10 w-10 text-secondary" />
          </div>
          <h1 className="text-3xl font-bold">Content Protected</h1>
          <p className="text-muted-foreground">This content is restricted. Enter the parental lock master password to continue.</p>
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
            <Button onClick={handleUnlock} className="bg-secondary hover:bg-secondary/90">Unlock</Button>
          </div>
          <Button variant="ghost" onClick={() => router.back()}>Go Back</Button>
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
        />

        <div className="grid md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-4">
            <div className="flex flex-wrap gap-2">
              <span className="text-primary font-bold">{content.genre}</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">2024</span>
              <span className="text-muted-foreground">•</span>
              <span className="text-muted-foreground">HD / 4K</span>
            </div>
            <h1 className="text-4xl font-extrabold font-headline">{content.title}</h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {content.description}
            </p>
            <div className="flex gap-4 pt-4">
              <Button variant="outline" className="border-white/10 bg-white/5"><Heart className="mr-2 h-4 w-4" /> Add to List</Button>
              <Button variant="outline" className="border-white/10 bg-white/5"><Share2 className="mr-2 h-4 w-4" /> Share</Button>
            </div>
          </div>

          <div className="space-y-6">
            <div className="p-6 bg-card rounded-xl border border-white/5 shadow-lg space-y-4">
              <h3 className="font-bold text-lg border-b border-white/5 pb-2">More Like This</h3>
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-4 group cursor-pointer">
                  <div className="w-24 aspect-video bg-muted rounded overflow-hidden flex-shrink-0">
                     <img src={`https://picsum.photos/seed/rec${i}/200/120`} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                  </div>
                  <div>
                    <p className="font-medium text-sm line-clamp-2">Recommended Movie Title {i}</p>
                    <p className="text-xs text-muted-foreground">98% Match</p>
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
