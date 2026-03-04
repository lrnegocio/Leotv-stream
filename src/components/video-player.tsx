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
  const containerRef = React.useRef<HTMLDivElement>(null)

  // Função para converter links normais em links de incorporação (embed)
  const getEmbedUrl = (rawUrl: string) => {
    if (!rawUrl) return ""
    
    // YouTube
    if (rawUrl.includes("youtube.com/watch?v=")) {
      const id = rawUrl.split("v=")[1]?.split("&")[0]
      return `https://www.youtube.com/embed/${id}?autoplay=1`
    }
    if (rawUrl.includes("youtu.be/")) {
      const id = rawUrl.split("youtu.be/")[1]?.split("?")[0]
      return `https://www.youtube.com/embed/${id}?autoplay=1`
    }
    
    // Dailymotion
    if (rawUrl.includes("dailymotion.com/video/")) {
      const id = rawUrl.split("/video/")[1]?.split("?")[0]
      return `https://www.dailymotion.com/embed/video/${id}`
    }

    return rawUrl
  }

  const embedUrl = getEmbedUrl(url)

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
    <div ref={containerRef} className="group relative aspect-video w-full overflow-hidden bg-black rounded-xl shadow-2xl border border-white/5">
      <iframe
        src={embedUrl}
        className="h-full w-full border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
      
      {/* Controles do Player */}
      <div className="absolute inset-x-0 top-0 bg-gradient-to-b from-black/90 to-transparent p-6 opacity-0 transition-opacity group-hover:opacity-100 flex justify-between items-start pointer-events-none">
        <h3 className="text-lg font-bold text-white uppercase tracking-tight pointer-events-auto">{title}</h3>
      </div>

      <div className="absolute inset-y-0 left-0 flex items-center p-4 opacity-0 transition-opacity group-hover:opacity-100">
        <Button variant="ghost" size="icon" className="h-14 w-14 rounded-full bg-black/60 text-white hover:bg-primary hover:text-white border border-white/10" onClick={onPrev}>
          <ChevronLeft className="h-10 w-10" />
        </Button>
      </div>

      <div className="absolute inset-y-0 right-0 flex items-center p-4 opacity-0 transition-opacity group-hover:opacity-100">
        <Button variant="ghost" size="icon" className="h-14 w-14 rounded-full bg-black/60 text-white hover:bg-primary hover:text-white border border-white/10" onClick={onNext}>
          <ChevronRight className="h-10 w-10" />
        </Button>
      </div>

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-6 opacity-0 transition-opacity group-hover:opacity-100">
        <div className="flex justify-between items-center">
          <div className="flex gap-3">
            <Button variant="secondary" size="sm" className="bg-white/10 border-white/10 text-white hover:bg-white/20 font-bold uppercase text-[10px]" onClick={openExternal}>
              <ExternalLink className="mr-2 h-4 w-4" />
              Player Externo
            </Button>
          </div>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10" onClick={toggleFullScreen}>
              <Maximize className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
