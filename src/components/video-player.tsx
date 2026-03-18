
"use client"

import * as React from "react"
import { Maximize, ExternalLink, Loader2, ChevronLeft, ChevronRight } from "lucide-react"
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

  const { embedUrl } = React.useMemo(() => {
    if (!url || typeof url !== 'string' || url.trim() === "") {
      return { embedUrl: null }
    }
    
    let processedUrl = url.trim()
    
    // Detecção Inteligente de YouTube
    if (processedUrl.includes('youtube.com') || processedUrl.includes('youtu.be')) {
      const id = processedUrl.includes('v=') ? processedUrl.split('v=')[1]?.split('&')[0] : processedUrl.split('youtu.be/')[1]?.split('?')[0]
      return { embedUrl: `https://www.youtube.com/embed/${id}?autoplay=1` }
    } 
    // Dailymotion
    else if (processedUrl.includes('dailymotion.com')) {
      const id = processedUrl.split('video/')[1]?.split('?')[0]
      return { embedUrl: `https://www.dailymotion.com/embed/video/${id}?autoplay=1` }
    }
    // XVideos
    else if (processedUrl.includes('xvideos.com')) {
      const match = processedUrl.match(/video\.([^/]+)/) || processedUrl.match(/video(\d+)/)
      if (match) return { embedUrl: `https://www.xvideos.com/embedframe/${match[1]}` }
    }

    return { embedUrl: processedUrl }
  }, [url])

  React.useEffect(() => {
    setLoading(true)
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
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-[100]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <span className="mt-4 text-[9px] font-black text-primary uppercase tracking-widest animate-pulse italic">Sintonizando Sinal Master</span>
        </div>
      )}

      {/* PLAYER TOTALMENTE LIBERADO - SEM ATRIBUTO SANDBOX PARA EVITAR ERROS */}
      <iframe
        key={url}
        src={embedUrl || ""}
        className="h-full w-full border-0 relative z-10"
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
        allowFullScreen
        referrerPolicy="no-referrer"
        onLoad={() => setLoading(false)}
      />
      
      {/* Camada de Troca de Canal - Z-INDEX MÁXIMO PARA GARANTIR O CLIQUE NO CONTROLE REMOTO */}
      <div className="absolute inset-0 z-[9999] pointer-events-none flex items-center justify-between px-6">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-16 w-16 rounded-full bg-black/60 text-white hover:bg-primary hover:text-white pointer-events-auto border border-white/10 shadow-2xl transition-all active:scale-90"
          onClick={(e) => { 
            e.preventDefault(); 
            e.stopPropagation(); 
            if (onPrev) onPrev();
          }}
        >
          <ChevronLeft className="h-10 w-10" />
        </Button>

        <Button 
          variant="ghost" 
          size="icon" 
          className="h-16 w-16 rounded-full bg-black/60 text-white hover:bg-primary hover:text-white pointer-events-auto border border-white/10 shadow-2xl transition-all active:scale-90"
          onClick={(e) => { 
            e.preventDefault(); 
            e.stopPropagation(); 
            if (onNext) onNext();
          }}
        >
          <ChevronRight className="h-10 w-10" />
        </Button>
      </div>

      <div className="absolute inset-0 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none">
        <div className="absolute top-0 inset-x-0 p-6 bg-gradient-to-b from-black/90 via-transparent">
          <h3 className="text-lg font-black text-white uppercase italic truncate tracking-tighter">{title}</h3>
        </div>
        <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/90 via-transparent flex justify-between items-center px-8">
          <Button variant="secondary" size="sm" className="bg-primary text-white h-10 px-6 text-[10px] uppercase font-black rounded-xl pointer-events-auto shadow-lg" onClick={openSecureLink}>
            <ExternalLink className="mr-2 h-4 w-4" /> Sinal Externo
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
