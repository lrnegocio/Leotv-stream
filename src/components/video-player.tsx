
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
    
    let processedUrl = url.trim()

    // 1. SUPORTE A TAG IFRAME COMPLETA
    // Se o usuário colar um <iframe src="..."></iframe>, extraímos apenas o link
    if (processedUrl.toLowerCase().includes('<iframe')) {
      const srcMatch = processedUrl.match(/src=["']([^"']+)["']/i)
      if (srcMatch && srcMatch[1]) {
        processedUrl = srcMatch[1]
      }
    }
    
    // 2. DETECÇÃO DE SINAL DIRETO (HLS / MP4 / TS)
    const lowerUrl = processedUrl.toLowerCase()
    const isDirect = lowerUrl.includes('.mp4') || 
                    lowerUrl.includes('.m3u8') || 
                    lowerUrl.includes('.ts') || 
                    lowerUrl.includes('.mkv') ||
                    lowerUrl.includes('/hls/') ||
                    lowerUrl.includes('playlist.m3u8');

    if (isDirect) {
      return { embedUrl: processedUrl, isVideoFile: true }
    }

    // 3. CONVERSÃO INTELIGENTE PARA EMBED (PLATAFORMAS)

    // YouTube & YouTube No-Cookie
    if (processedUrl.includes("youtube.com/watch?v=")) {
      const id = processedUrl.split("v=")[1]?.split("&")[0]
      return { embedUrl: `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`, isVideoFile: false }
    }
    if (processedUrl.includes("youtu.be/")) {
      const id = processedUrl.split("youtu.be/")[1]?.split("?")[0]
      return { embedUrl: `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`, isVideoFile: false }
    }
    if (processedUrl.includes("youtube-nocookie.com/embed/")) {
      return { embedUrl: processedUrl, isVideoFile: false }
    }

    // XVideos
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
      return { embedUrl: `https://www.dailymotion.com/embed/video/${id}?autoplay=1`, isVideoFile: false }
    }

    // Canva & Outros embeds de apresentação
    if (processedUrl.includes("canva.com/design/")) {
      if (!processedUrl.includes("/view?embed")) {
        return { embedUrl: `${processedUrl}/view?embed`, isVideoFile: false }
      }
    }

    // Para links de VisionCine, Mercado Play ou qualquer outro:
    // Carregamos direto no Iframe, garantindo que o sandbox e permissões estejam ativos
    return { embedUrl: processedUrl, isVideoFile: false }
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
        <p className="font-bold uppercase text-xs tracking-widest text-white italic">Sinal Master não identificado</p>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="group relative aspect-video w-full overflow-hidden bg-black rounded-3xl shadow-3xl border border-white/5">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-20">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
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
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          onLoad={() => setLoading(false)}
          referrerPolicy="strict-origin-when-cross-origin"
        />
      )}
      
      <div className="absolute inset-0 z-20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="absolute top-0 inset-x-0 p-8 bg-gradient-to-b from-black/90 to-transparent">
          <h3 className="text-xl font-black text-white uppercase tracking-tight italic font-headline">{title}</h3>
        </div>

        {onPrev && (
          <div className="absolute inset-y-0 left-0 flex items-center p-6">
            <Button variant="ghost" size="icon" className="h-16 w-16 rounded-full bg-black/60 text-white hover:bg-primary pointer-events-auto" onClick={onPrev}>
              <ChevronLeft className="h-12 w-12" />
            </Button>
          </div>
        )}

        {onNext && (
          <div className="absolute inset-y-0 right-0 flex items-center p-6">
            <Button variant="ghost" size="icon" className="h-16 w-16 rounded-full bg-black/60 text-white hover:bg-primary pointer-events-auto" onClick={onNext}>
              <ChevronRight className="h-12 w-12" />
            </Button>
          </div>
        )}

        <div className="absolute bottom-0 inset-x-0 p-8 bg-gradient-to-t from-black/90 to-transparent flex justify-between items-center">
          <div className="flex gap-3 pointer-events-auto">
            <Button variant="secondary" size="sm" className="bg-primary hover:scale-105 transition-transform text-white h-12 px-8 text-xs uppercase font-black rounded-2xl" onClick={() => window.open(embedUrl, '_blank')}>
              <ExternalLink className="mr-2 h-5 w-5" /> Abrir Fonte
            </Button>
          </div>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 pointer-events-auto h-14 w-14" onClick={toggleFullScreen}>
            <Maximize className="h-8 w-8" />
          </Button>
        </div>
      </div>
    </div>
  )
}
