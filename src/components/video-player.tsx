"use client"

import * as React from "react"
import { Maximize, ExternalLink, ChevronLeft, ChevronRight, AlertCircle, Loader2, Zap } from "lucide-react"
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
  const [isAccelerating, setIsAccelerating] = React.useState(true)

  const { embedUrl, isVideoFile } = React.useMemo(() => {
    if (!url || typeof url !== 'string' || url.trim() === "") {
      return { embedUrl: null, isVideoFile: false }
    }
    
    let processedUrl = url.trim()

    // 1. SUPORTE A TAG IFRAME COMPLETA (EXTRAÇÃO TURBO)
    if (processedUrl.toLowerCase().includes('<iframe')) {
      const srcMatch = processedUrl.match(/src=["']([^"']+)["']/i)
      if (srcMatch && srcMatch[1]) {
        processedUrl = srcMatch[1]
      }
    }
    
    // 2. DETECÇÃO DE SINAL DIRETO (HLS / MP4 / TS / MKV)
    const lowerUrl = processedUrl.toLowerCase()
    const isDirect = lowerUrl.includes('.mp4') || 
                    lowerUrl.includes('.m3u8') || 
                    lowerUrl.includes('.ts') || 
                    lowerUrl.includes('.mkv') ||
                    lowerUrl.includes('/hls/') ||
                    lowerUrl.includes('playlist.m3u8') ||
                    lowerUrl.includes('stream.php');

    if (isDirect) {
      return { embedUrl: processedUrl, isVideoFile: true }
    }

    // 3. CONVERSÃO INTELIGENTE PARA EMBED (MAX COMPATIBILIDADE)
    // YouTube
    if (processedUrl.includes("youtube.com/watch?v=")) {
      const id = processedUrl.split("v=")[1]?.split("&")[0]
      return { embedUrl: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`, isVideoFile: false }
    }
    if (processedUrl.includes("youtu.be/")) {
      const id = processedUrl.split("youtu.be/")[1]?.split("?")[0]
      return { embedUrl: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`, isVideoFile: false }
    }

    // XVideos - Aceita IDs alfanuméricos (letras e números)
    if (processedUrl.includes("xvideos.com/video.")) {
      const idPart = processedUrl.split("video.")[1]?.split("/")[0]
      if (idPart) {
        return { embedUrl: `https://www.xvideos.com/embedframe/${idPart}`, isVideoFile: false }
      }
    }

    // Pornhub
    if (processedUrl.includes("pornhub.com/view_video.php?viewkey=")) {
      const id = processedUrl.split("viewkey=")[1]?.split("&")[0]
      return { embedUrl: `https://www.pornhub.com/embed/${id}?autoplay=1`, isVideoFile: false }
    }

    // Dailymotion
    if (processedUrl.includes("dailymotion.com/video/")) {
      const id = processedUrl.split("/video/")[1]?.split("?")[0]
      return { embedUrl: `https://www.dailymotion.com/embed/video/${id}?autoplay=1&mute=0`, isVideoFile: false }
    }

    // Canva
    if (processedUrl.includes("canva.com/design/")) {
      if (!processedUrl.includes("/view?embed")) {
        return { embedUrl: `${processedUrl}/view?embed`, isVideoFile: false }
      }
    }

    return { embedUrl: processedUrl, isVideoFile: false }
  }, [url])

  React.useEffect(() => {
    setLoading(true)
    setIsAccelerating(true)
    const timer = setTimeout(() => setIsAccelerating(false), 2000)
    return () => clearTimeout(timer)
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
        <p className="font-bold uppercase text-xs tracking-widest text-white italic">Sinal Master não identificado</p>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="group relative aspect-video w-full overflow-hidden bg-black rounded-3xl shadow-2xl border border-white/5">
      {(loading || isAccelerating) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-30 transition-opacity">
          <div className="relative">
            <Loader2 className="h-16 w-16 animate-spin text-primary opacity-20" />
            <Zap className="absolute inset-0 m-auto h-8 w-8 text-primary animate-pulse" />
          </div>
          <div className="mt-4 flex flex-col items-center gap-1">
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em] animate-pulse">Aceleração Master P2P</span>
            <div className="w-32 h-1 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-primary animate-progress-fast" />
            </div>
          </div>
        </div>
      )}
      
      {isVideoFile ? (
        <video
          ref={videoRef}
          src={embedUrl}
          controls
          autoPlay
          playsInline
          preload="auto"
          className="h-full w-full relative z-10 object-contain"
          onLoadedData={() => setLoading(false)}
          onError={() => setLoading(false)}
        />
      ) : (
        <iframe
          src={embedUrl}
          className="h-full w-full border-0 relative z-10"
          title={title}
          loading="eager"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
          allowFullScreen
          onLoad={() => setLoading(false)}
          referrerPolicy="no-referrer-when-downgrade"
          sandbox="allow-forms allow-modals allow-pointer-lock allow-popups allow-popups-to-escape-sandbox allow-same-origin allow-scripts allow-top-navigation-by-user-activation"
        />
      )}
      
      <div className="absolute inset-0 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none">
        <div className="absolute top-0 inset-x-0 p-6 bg-gradient-to-b from-black/90 via-black/40 to-transparent">
          <h3 className="text-lg font-black text-white uppercase tracking-tight italic font-headline truncate pr-20">{title}</h3>
        </div>

        {onPrev && (
          <div className="absolute inset-y-0 left-0 flex items-center p-4">
            <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full bg-black/40 text-white hover:bg-primary pointer-events-auto transition-transform active:scale-90" onClick={onPrev}>
              <ChevronLeft className="h-8 w-8" />
            </Button>
          </div>
        )}

        {onNext && (
          <div className="absolute inset-y-0 right-0 flex items-center p-4">
            <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full bg-black/40 text-white hover:bg-primary pointer-events-auto transition-transform active:scale-90" onClick={onNext}>
              <ChevronRight className="h-8 w-8" />
            </Button>
          </div>
        )}

        <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/90 via-black/40 to-transparent flex justify-between items-center">
          <div className="flex gap-2 pointer-events-auto">
            <Button variant="secondary" size="sm" className="bg-primary hover:scale-105 transition-all text-white h-10 px-6 text-[10px] uppercase font-black rounded-xl shadow-lg shadow-primary/20" onClick={() => window.open(embedUrl, '_blank')}>
              <ExternalLink className="mr-2 h-4 w-4" /> Link Original
            </Button>
          </div>
          <div className="flex items-center gap-4 pointer-events-auto">
            <div className="flex items-center gap-2 px-3 py-1 bg-green-500/20 rounded-full border border-green-500/30">
              <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[8px] font-bold text-green-400 uppercase tracking-widest">Sinal P2P Mestre</span>
            </div>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 h-12 w-12" onClick={toggleFullScreen}>
              <Maximize className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}