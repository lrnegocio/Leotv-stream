
"use client"

import * as React from "react"
import { Maximize, ExternalLink, ChevronLeft, ChevronRight, AlertCircle, Loader2, PlayCircle, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"

interface VideoPlayerProps {
  url: string
  title: string
  onNext?: () => void
  onPrev?: () => void
}

export function VideoPlayer({ url, title, onNext, onPrev }: VideoPlayerProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [loading, setLoading] = React.useState(true)
  const [isMixedContent, setIsMixedContent] = React.useState(false)
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  const { embedUrl, isDirectVideo } = React.useMemo(() => {
    if (!url || typeof url !== 'string' || url.trim() === "") {
      return { embedUrl: null, isDirectVideo: false }
    }
    
    let processedUrl = url.trim()
    const isPageHttps = typeof window !== 'undefined' && window.location.protocol === 'https:'
    const isUrlHttp = processedUrl.startsWith('http://')
    
    // Detecta se é Mixed Content (Protocolo Incompatível)
    if (isPageHttps && isUrlHttp) {
      setIsMixedContent(true)
    } else {
      setIsMixedContent(false)
    }

    // Limpar URL
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
      isDirectVideo: isDirect
    }
  }, [url])

  React.useEffect(() => {
    setLoading(true)
    const timer = setTimeout(() => setLoading(false), 2000)
    return () => clearTimeout(timer)
  }, [url])

  if (!isMounted) return <div className="aspect-video bg-black rounded-3xl animate-pulse" />

  if (!embedUrl) {
    return (
      <div className="aspect-video w-full flex flex-col items-center justify-center gap-4 bg-black rounded-3xl border border-white/5 text-center p-6">
        <AlertCircle className="h-12 w-12 text-destructive/50" />
        <p className="font-bold uppercase text-xs tracking-widest text-white italic">Sinal Master não identificado</p>
      </div>
    )
  }

  // SOLUÇÃO PARA HTTP EM SITE HTTPS (CASO DA WANDINHA E M3U8)
  if (isMixedContent) {
    return (
      <div className="aspect-video w-full flex flex-col items-center justify-center gap-6 bg-black/95 rounded-3xl border border-white/10 text-center p-8">
        <div className="bg-primary/20 p-4 rounded-full border border-primary/30">
          <Globe className="h-10 w-10 text-primary animate-pulse" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-black uppercase italic tracking-tight text-white">Sinal P2P Protegido</h3>
          <p className="text-[10px] text-muted-foreground uppercase leading-tight max-w-sm mx-auto font-bold tracking-widest">
            Este canal usa protocolo HTTP que é bloqueado por segurança neste navegador. <br/>Clique abaixo para abrir o sinal original em uma nova aba.
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
          <span className="mt-4 text-[10px] font-black text-primary uppercase tracking-[0.3em] animate-pulse">Acelerando P2P Master</span>
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

        {onPrev && (
          <div className="absolute inset-y-0 left-0 flex items-center p-4">
            <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full bg-black/40 text-white hover:bg-primary pointer-events-auto" onClick={onPrev}>
              <ChevronLeft className="h-8 w-8" />
            </Button>
          </div>
        )}

        {onNext && (
          <div className="absolute inset-y-0 right-0 flex items-center p-4">
            <Button variant="ghost" size="icon" className="h-12 w-12 rounded-full bg-black/40 text-white hover:bg-primary pointer-events-auto" onClick={onNext}>
              <ChevronRight className="h-8 w-8" />
            </Button>
          </div>
        )}

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
