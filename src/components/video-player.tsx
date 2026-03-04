"use client"

import * as React from "react"
import { Maximize, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"

interface VideoPlayerProps {
  url: string
  title: string
  onNext?: () => void
  onPrev?: () => void
}

export function VideoPlayer({ url, title, onNext, onPrev }: VideoPlayerProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)

  const getEmbedUrl = (rawUrl: string) => {
    if (!rawUrl) return ""
    
    // YouTube
    if (rawUrl.includes("youtube.com/watch?v=")) {
      const id = rawUrl.split("v=")[1]?.split("&")[0]
      return `https://www.youtube.com/embed/${id}?autoplay=1&modestbranding=1&rel=0`
    }
    if (rawUrl.includes("youtu.be/")) {
      const id = rawUrl.split("youtu.be/")[1]?.split("?")[0]
      return `https://www.youtube.com/embed/${id}?autoplay=1&modestbranding=1&rel=0`
    }
    
    // Dailymotion
    if (rawUrl.includes("dailymotion.com/video/")) {
      const id = rawUrl.split("/video/")[1]?.split("?")[0]
      return `https://www.dailymotion.com/embed/video/${id}?autoplay=1`
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

  return (
    <div ref={containerRef} className="group relative aspect-video w-full overflow-hidden bg-black rounded-xl shadow-2xl border border-white/5">
      <iframe
        src={embedUrl}
        className="h-full w-full border-0 relative z-10"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
      />
      
      {/* Camadas de Controle Simplificadas (Apenas aparecem no hover) */}
      <div className="absolute inset-0 z-20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        {/* Título Superior */}
        <div className="absolute top-0 inset-x-0 p-4 bg-gradient-to-b from-black/80 to-transparent">
          <h3 className="text-sm font-bold text-white uppercase tracking-tight">{title}</h3>
        </div>

        {/* Botões Laterais de Navegação */}
        <div className="absolute inset-y-0 left-0 flex items-center p-4">
          <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full bg-black/40 text-white hover:bg-primary pointer-events-auto" onClick={onPrev}>
            <ChevronLeft className="h-8 w-8" />
          </Button>
        </div>

        <div className="absolute inset-y-0 right-0 flex items-center p-4">
          <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full bg-black/40 text-white hover:bg-primary pointer-events-auto" onClick={onNext}>
            <ChevronRight className="h-8 w-8" />
          </Button>
        </div>

        {/* Barra Inferior */}
        <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-black/80 to-transparent flex justify-between items-center">
          <Button variant="secondary" size="sm" className="bg-white/10 text-white h-8 text-[10px] uppercase font-bold pointer-events-auto" onClick={() => window.open(url, '_blank')}>
            <ExternalLink className="mr-2 h-3 w-3" /> Player Externo
          </Button>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 pointer-events-auto" onClick={toggleFullScreen}>
            <Maximize className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
