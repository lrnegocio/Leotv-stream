"use client"

import * as React from "react"
import { Maximize, ExternalLink, AlertCircle, Loader2, PlayCircle, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"

interface VideoPlayerProps {
  url: string
  title: string
}

export function VideoPlayer({ url, title }: VideoPlayerProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [loading, setLoading] = React.useState(true)
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  const { embedUrl, isDirectVideo, isMixedContent } = React.useMemo(() => {
    if (!url || typeof url !== 'string' || url.trim() === "") {
      return { embedUrl: null, isDirectVideo: false, isMixedContent: false }
    }
    
    let processedUrl = url.trim()
    
    // Detecta Mixed Content (HTTP em página HTTPS)
    const isPageHttps = typeof window !== 'undefined' && window.location.protocol === 'https:'
    const isUrlHttp = processedUrl.startsWith('http://')
    const mixed = isPageHttps && isUrlHttp

    // 1. FORMATAR YOUTUBE
    if (processedUrl.includes('youtube.com/watch?v=')) {
      const id = processedUrl.split('v=')[1]?.split('&')[0]
      processedUrl = `https://www.youtube.com/embed/${id}?autoplay=1`
    } else if (processedUrl.includes('youtu.be/')) {
      const id = processedUrl.split('youtu.be/')[1]?.split('?')[0]
      processedUrl = `https://www.youtube.com/embed/${id}?autoplay=1`
    }
    
    // 2. FORMATAR DAILYMOTION
    if (processedUrl.includes('dailymotion.com/video/')) {
      const id = processedUrl.split('video/')[1]?.split('?')[0]
      processedUrl = `https://www.dailymotion.com/embed/video/${id}?autoplay=1`
    }

    // 3. FORMATAR XVIDEOS (TENTATIVA DE EMBED)
    if (processedUrl.includes('xvideos.com/video.')) {
      const match = processedUrl.match(/video\.([^/]+)/)
      if (match && match[1]) {
        processedUrl = `https://www.xvideos.com/embedframe/${match[1]}`
      }
    }

    // 4. LIMPAR IFRAME CASO VENHA COMPLETO
    if (processedUrl.toLowerCase().includes('<iframe')) {
      const srcMatch = processedUrl.match(/src=["']([^"']+)["']/i)
      if (srcMatch && srcMatch[1]) {
        processedUrl = srcMatch[1]
      }
    }
    
    const lowerUrl = processedUrl.toLowerCase()
    const isDirect = lowerUrl.includes('.m3u8') || 
                    lowerUrl.includes('.mp4') || 
                    lowerUrl.includes('.ts') || 
                    lowerUrl.includes('stream.php');

    return { 
      embedUrl: processedUrl, 
      isDirectVideo: isDirect,
      isMixedContent: mixed
    }
  }, [url])

  React.useEffect(() => {
    setLoading(true)
    const timer = setTimeout(() => setLoading(false), 3000)
    return () => clearTimeout(timer)
  }, [url])

  if (!isMounted) return <div className="aspect-video bg-black rounded-3xl animate-pulse" />

  if (!embedUrl) {
    return (
      <div className="aspect-video w-full flex flex-col items-center justify-center gap-4 bg-black rounded-3xl border border-white/5 text-center p-6">
        <AlertCircle className="h-12 w-12 text-destructive/50" />
        <p className="font-bold uppercase text-[10px] tracking-widest text-white italic">Sinal Master não identificado</p>
      </div>
    )
  }

  // Se for sinal HTTP em site HTTPS, o navegador bloqueia. Mostramos o botão de sinal direto.
  if (isMixedContent && !embedUrl.includes('youtube.com') && !embedUrl.includes('dailymotion.com')) {
    return (
      <div className="aspect-video w-full flex flex-col items-center justify-center gap-6 bg-black/95 rounded-3xl border border-white/10 text-center p-8">
        <div className="bg-primary/20 p-4 rounded-full border border-primary/30">
          <Globe className="h-10 w-10 text-primary animate-pulse" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-black uppercase italic tracking-tight text-white">Sinal P2P Protegido</h3>
          <p className="text-[9px] text-muted-foreground uppercase leading-tight max-w-sm mx-auto font-bold tracking-widest">
            Este sinal usa protocolo HTTP que é bloqueado por segurança neste navegador moderno.
          </p>
        </div>
        <Button 
          className="h-14 px-10 bg-primary hover:scale-105 transition-all text-lg font-black uppercase italic shadow-2xl shadow-primary/40 rounded-2xl"
          onClick={() => window.open(embedUrl, '_blank')}
        >
          <PlayCircle className="mr-3 h-6 w-6" /> SINTONIZAR AGORA
        </Button>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="group relative aspect-video w-full overflow-hidden bg-black rounded-3xl shadow-2xl border border-white/5">
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-30">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <span className="mt-4 text-[9px] font-black text-primary uppercase tracking-[0.3em] animate-pulse">Sincronizando sinal master</span>
        </div>
      )}
      
      {isDirectVideo ? (
        <video
          src={embedUrl}
          controls
          autoPlay
          className="h-full w-full relative z-10 object-contain"
          onLoadedData={() => setLoading(false)}
        />
      ) : (
        <iframe
          src={embedUrl}
          className="h-full w-full border-0 relative z-10"
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
          allowFullScreen
          onLoad={() => setLoading(false)}
        />
      )}
      
      <div className="absolute inset-0 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none">
        <div className="absolute top-0 inset-x-0 p-6 bg-gradient-to-b from-black/90 via-transparent">
          <h3 className="text-lg font-black text-white uppercase italic truncate pr-20">{title}</h3>
        </div>

        <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/90 via-transparent flex justify-between items-center">
          <Button variant="secondary" size="sm" className="bg-primary text-white h-10 px-6 text-[10px] uppercase font-black rounded-xl pointer-events-auto" onClick={() => window.open(embedUrl, '_blank')}>
            <ExternalLink className="mr-2 h-4 w-4" /> Link Direto
          </Button>
          <Button variant="ghost" size="icon" className="text-white h-12 w-12 pointer-events-auto" onClick={() => {
            if (!document.fullscreenElement) {
              containerRef.current?.requestFullscreen();
            } else {
              document.exitFullscreen();
            }
          }}>
            <Maximize className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  )
}