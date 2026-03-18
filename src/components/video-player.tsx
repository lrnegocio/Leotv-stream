
"use client"

import * as React from "react"
import { Maximize, ExternalLink, Loader2, PlayCircle, Globe, ChevronLeft, ChevronRight } from "lucide-react"
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
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  const { embedUrl, isKnownProtected } = React.useMemo(() => {
    if (!url || typeof url !== 'string' || url.trim() === "") {
      return { embedUrl: null, isKnownProtected: false }
    }
    
    let processedUrl = url.trim()
    
    // Detecção Inteligente de YouTube
    if (processedUrl.includes('youtube.com') || processedUrl.includes('youtu.be')) {
      const id = processedUrl.includes('v=') ? processedUrl.split('v=')[1]?.split('&')[0] : processedUrl.split('youtu.be/')[1]?.split('?')[0]
      return { embedUrl: `https://www.youtube.com/embed/${id}?autoplay=1`, isKnownProtected: false }
    } 
    // Dailymotion
    else if (processedUrl.includes('dailymotion.com')) {
      const id = processedUrl.split('video/')[1]?.split('?')[0]
      return { embedUrl: `https://www.dailymotion.com/embed/video/${id}?autoplay=1`, isKnownProtected: false }
    }
    // XVideos
    else if (processedUrl.includes('xvideos.com')) {
      const match = processedUrl.match(/video\.([^/]+)/) || processedUrl.match(/video(\d+)/)
      if (match) return { embedUrl: `https://www.xvideos.com/embedframe/${match[1]}`, isKnownProtected: false }
    }

    // Sites que costumam bloquear IFRAME via Cloudflare (abertura externa necessária como fallback)
    const protectedDomains = ['vulcanzz', 'reidoscanais']
    const isProtected = protectedDomains.some(d => processedUrl.includes(d))

    return { 
      embedUrl: processedUrl, 
      isKnownProtected: isProtected
    }
  }, [url])

  React.useEffect(() => {
    setLoading(true)
    // Velocidade Ultra: Carregamento instantâneo
    const timer = setTimeout(() => setLoading(false), 200)
    return () => clearTimeout(timer)
  }, [url])

  const openSecureLink = () => {
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noreferrer noopener';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (!isMounted) return <div className="aspect-video bg-black rounded-3xl animate-pulse" />

  return (
    <div ref={containerRef} className="group relative aspect-video w-full overflow-hidden bg-black rounded-3xl shadow-2xl border border-white/5">
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-30">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <span className="mt-4 text-[9px] font-black text-primary uppercase tracking-widest animate-pulse italic">Sintonizando Sinal Master</span>
        </div>
      )}

      {/* IFRAME SEM SANDBOX para permitir carregamento de anúncios/scripts necessários pelo sinal */}
      <iframe
        src={embedUrl || ""}
        className="h-full w-full border-0 relative z-10"
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
        allowFullScreen
        onLoad={() => setLoading(false)}
      />
      
      {/* Camada de Setas de Troca de Canal - Z-INDEX 40 para ficar acima do vídeo */}
      <div className="absolute inset-0 z-40 flex items-center justify-between px-6 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-20 w-20 rounded-full bg-black/60 text-white hover:bg-primary hover:text-white pointer-events-auto border border-white/10 shadow-2xl transition-transform active:scale-90"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onPrev?.(); }}
        >
          <ChevronLeft className="h-12 w-12" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-20 w-20 rounded-full bg-black/60 text-white hover:bg-primary hover:text-white pointer-events-auto border border-white/10 shadow-2xl transition-transform active:scale-90"
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onNext?.(); }}
        >
          <ChevronRight className="h-12 w-12" />
        </Button>
      </div>

      <div className="absolute inset-0 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none">
        <div className="absolute top-0 inset-x-0 p-6 bg-gradient-to-b from-black/90 via-transparent">
          <h3 className="text-lg font-black text-white uppercase italic truncate tracking-tighter">{title}</h3>
        </div>
        <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/90 via-transparent flex justify-between items-center">
          <Button variant="secondary" size="sm" className="bg-primary text-white h-10 px-6 text-[10px] uppercase font-black rounded-xl pointer-events-auto shadow-lg" onClick={openSecureLink}>
            <ExternalLink className="mr-2 h-4 w-4" /> Sinal Direto
          </Button>
          <Button variant="ghost" size="icon" className="text-white h-12 w-12 pointer-events-auto" onClick={() => {
            if (!document.fullscreenElement) containerRef.current?.requestFullscreen();
            else document.exitFullscreen();
          }}>
            <Maximize className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  )
}
