"use client"

import * as React from "react"
import { Maximize, ExternalLink, ChevronLeft, ChevronRight, AlertCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"

interface VideoPlayerProps {
  url: string
  title: string
  onNext?: () => void
  onPrev?: () => void
}

export function VideoPlayer({ url, title, onNext, onPrev }: VideoPlayerProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const [loading, setLoading] = React.useState(true)

  const { embedUrl, isVideoFile } = React.useMemo(() => {
    if (!url || typeof url !== 'string' || url.trim() === "") {
      return { embedUrl: null, isVideoFile: false }
    }
    
    const trimmed = url.trim()
    
    // Detecção de Arquivo de Vídeo Direto
    const isDirect = trimmed.includes('.mp4') || 
                    trimmed.includes('.m3u8') || 
                    trimmed.includes('.ts') || 
                    trimmed.includes('.mkv');

    if (isDirect) {
      return { embedUrl: trimmed, isVideoFile: true }
    }

    // XVideos
    if (trimmed.includes("xvideos.com/video.")) {
      const idPart = trimmed.split("video.")[1]?.split("/")[0]
      if (idPart) {
        return { embedUrl: `https://www.xvideos.com/embedframe/${idPart}`, isVideoFile: false }
      }
    }

    // YouTube
    if (trimmed.includes("youtube.com/watch?v=")) {
      const id = trimmed.split("v=")[1]?.split("&")[0]
      return { embedUrl: `https://www.youtube.com/embed/${id}?autoplay=1`, isVideoFile: false }
    }
    if (trimmed.includes("youtu.be/")) {
      const id = trimmed.split("youtu.be/")[1]?.split("?")[0]
      return { embedUrl: `https://www.youtube.com/embed/${id}?autoplay=1`, isVideoFile: false }
    }
    
    // Pornhub
    if (trimmed.includes("pornhub.com/view_video.php?viewkey=")) {
      const id = trimmed.split("viewkey=")[1]?.split("&")[0]
      return { embedUrl: `https://www.pornhub.com/embed/${id}?autoplay=1`, isVideoFile: false }
    }

    // Dailymotion
    if (trimmed.includes("dailymotion.com/video/")) {
      const id = trimmed.split("/video/")[1]?.split("?")[0]
      return { embedUrl: `https://www.dailymotion.com/embed/video/${id}?autoplay=1`, isVideoFile: false }
    }

    return { embedUrl: trimmed, isVideoFile: false }
  }, [url])

  React.useEffect(() => {
    setLoading(true)
  }, [url])

  const toggleFullScreen = () => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {})
    } else {
      document.exitFullscreen()
    }
  }

  if (!embedUrl) {
    return (
      <div className="aspect-video w-full flex flex-col items-center justify-center gap-4 bg-black rounded-xl border border-white/5 text-center p-6">
        <AlertCircle className="h-12 w-12 text-destructive/50" />
        <p className="font-bold uppercase text-xs tracking-widest text-white">Sinal Não Encontrado</p>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="group relative aspect-video w-full overflow-hidden bg-black rounded-xl shadow-2xl border border-white/5">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-20">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      )}
      
      {isVideoFile ? (
        <video
          ref={videoRef}
          src={embedUrl}
          controls
          autoPlay
          className="h-full w-full relative z-10 object-contain"
          onLoadedData={() => setLoading(false)}
          onError={() => setLoading(false)}
        />
      ) : (
        <iframe
          src={embedUrl}
          className="h-full w-full border-0 relative z-10"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          onLoad={() => setLoading(false)}
        />
      )}
      
      <div className="absolute inset-0 z-20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="absolute top-0 inset-x-0 p-6 bg-gradient-to-b from-black/90 to-transparent">
          <h3 className="text-lg font-black text-white uppercase tracking-tight italic">{title}</h3>
        </div>

        {onPrev && (
          <div className="absolute inset-y-0 left-0 flex items-center p-4">
            <Button variant="ghost" size="icon" className="h-14 w-14 rounded-full bg-black/60 text-white hover:bg-primary pointer-events-auto" onClick={onPrev}>
              <ChevronLeft className="h-10 w-10" />
            </Button>
          </div>
        )}

        {onNext && (
          <div className="absolute inset-y-0 right-0 flex items-center p-4">
            <Button variant="ghost" size="icon" className="h-14 w-14 rounded-full bg-black/60 text-white hover:bg-primary pointer-events-auto" onClick={onNext}>
              <ChevronRight className="h-10 w-10" />
            </Button>
          </div>
        )}

        <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/90 to-transparent flex justify-between items-center">
          <div className="flex gap-2 pointer-events-auto">
            <Button variant="secondary" size="sm" className="bg-primary text-white h-10 px-6 text-[10px] uppercase font-black rounded-xl" onClick={() => window.open(url, '_blank')}>
              <ExternalLink className="mr-2 h-4 w-4" /> Link Externo
            </Button>
          </div>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 pointer-events-auto h-12 w-12" onClick={toggleFullScreen}>
            <Maximize className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  )
}