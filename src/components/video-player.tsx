
"use client"

import * as React from "react"
import { Maximize, ExternalLink, ChevronLeft, ChevronRight, Play, X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface VideoPlayerProps {
  url: string
  title: string
  onNext?: () => void
  onPrev?: () => void
}

export function VideoPlayer({ url, title, onNext, onPrev }: VideoPlayerProps) {
  const [isBlocked, setIsBlocked] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)

  const toggleFullScreen = () => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  const openExternal = () => {
    window.open(url, '_blank')
  }

  return (
    <div ref={containerRef} className="group relative aspect-video w-full overflow-hidden bg-black rounded-xl shadow-2xl">
      <iframe
        src={url}
        className="h-full w-full border-0"
        allowFullScreen
        onLoad={() => {
          // Some sites block iframe embedding via X-Frame-Options
          // We can't detect it reliably purely client side but we can provide the fallback
        }}
      />
      
      {/* Player Overlay Controls */}
      <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/80 to-transparent p-4 opacity-0 transition-opacity group-hover:opacity-100">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
      </div>

      <div className="absolute inset-y-0 left-0 flex items-center p-2 opacity-0 transition-opacity group-hover:opacity-100">
        <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full bg-black/40 text-white hover:bg-black/60" onClick={onPrev}>
          <ChevronLeft className="h-8 w-8" />
        </Button>
      </div>

      <div className="absolute inset-y-0 right-0 flex items-center p-2 opacity-0 transition-opacity group-hover:opacity-100">
        <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full bg-black/40 text-white hover:bg-black/60" onClick={onNext}>
          <ChevronRight className="h-8 w-8" />
        </Button>
      </div>

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 opacity-0 transition-opacity group-hover:opacity-100">
        <div className="flex justify-between items-center">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="bg-black/40 border-white/20 text-white" onClick={openExternal}>
              <ExternalLink className="mr-2 h-4 w-4" />
              External Player
            </Button>
          </div>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={toggleFullScreen}>
            <Maximize className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {isBlocked && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 p-8 text-center">
          <Play className="mb-4 h-12 w-12 text-primary" />
          <h2 className="mb-2 text-xl font-bold">Playback Restricted</h2>
          <p className="mb-6 text-muted-foreground">This content cannot be embedded directly. Please open it in an external player.</p>
          <Button onClick={openExternal} size="lg" className="bg-primary hover:bg-primary/90">
            <ExternalLink className="mr-2 h-5 w-5" />
            Open in New Window
          </Button>
        </div>
      )}
    </div>
  )
}
