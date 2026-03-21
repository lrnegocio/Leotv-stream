"use client"

import * as React from "react"
import { Maximize, ExternalLink, Loader2, ChevronLeft, ChevronRight, Volume2 } from "lucide-react"
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
  const [showMuteNotice, setShowMuteNotice] = React.useState(true)

  React.useEffect(() => {
    setIsMounted(true)
    setLoading(true)
    const timer = setTimeout(() => setLoading(false), 2500)
    const muteTimer = setTimeout(() => setShowMuteNotice(false), 6000)
    return () => {
      clearTimeout(timer)
      clearTimeout(muteTimer)
    }
  }, [url])

  const processedUrl = React.useMemo(() => {
    if (!url || typeof url !== 'string') return ""
    let targetUrl = url.trim()

    // BLINDAGEM ADULTA: Converte link do xvideos em player limpo
    if (targetUrl.includes('xvideos.com/video.')) {
      const parts = targetUrl.split('video.');
      if (parts[1]) {
        const videoId = parts[1].split('/')[0];
        return `https://www.xvideos.com/embedframe/${videoId}`;
      }
    }

    // Lógica de YouTube Autoplay
    if (targetUrl.includes('youtube.com/watch?v=') || targetUrl.includes('youtu.be/')) {
      const id = targetUrl.includes('v=') 
        ? targetUrl.split('v=')[1]?.split('&')[0] 
        : targetUrl.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&rel=0&modestbranding=1&controls=1`
    }

    const connector = targetUrl.includes('?') ? '&' : '?'
    return `${targetUrl}${connector}autoplay=1&mute=1&playsinline=1`
  }, [url])

  if (!isMounted) return <div className="aspect-video bg-black rounded-3xl animate-pulse" />

  return (
    <div ref={containerRef} className="group relative aspect-video w-full overflow-hidden bg-black shadow-2xl rounded-3xl">
      
      {/* NAVEGAÇÃO MASTER - Z-INDEX 1000 */}
      <div className="absolute inset-0 z-[1000] pointer-events-none flex items-center justify-between px-4 sm:px-12">
        {onPrev && (
          <button 
            type="button"
            className="h-16 w-16 sm:h-24 sm:w-24 rounded-full bg-black/60 hover:bg-primary text-white pointer-events-auto border border-white/10 backdrop-blur-xl transition-all hover:scale-110 active:scale-90 flex items-center justify-center shadow-3xl opacity-0 group-hover:opacity-100"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onPrev(); }}
          >
            <ChevronLeft className="h-10 w-10 sm:h-14 sm:w-14" />
          </button>
        )}
        
        {onNext && (
          <button 
            type="button"
            className="h-16 w-16 sm:h-24 sm:w-24 rounded-full bg-black/60 hover:bg-primary text-white pointer-events-auto border border-white/10 backdrop-blur-xl transition-all hover:scale-110 active:scale-90 flex items-center justify-center shadow-3xl opacity-0 group-hover:opacity-100"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onNext(); }}
          >
            <ChevronRight className="h-10 w-10 sm:h-14 sm:w-14" />
          </button>
        )}
      </div>

      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-[60]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <span className="mt-4 text-[10px] font-black text-primary uppercase tracking-widest animate-pulse italic">ESTABILIZANDO SINAL P2P...</span>
        </div>
      )}

      {showMuteNotice && !loading && (
        <div className="absolute top-10 left-1/2 -translate-x-1/2 z-[70] bg-black/80 px-6 py-2 rounded-full border border-primary/30 flex items-center gap-2 animate-in fade-in zoom-in">
          <Volume2 className="h-4 w-4 text-primary animate-bounce" />
          <span className="text-[9px] font-black text-white uppercase tracking-tighter">VÍDEO MUTADO: CLIQUE PARA ATIVAR O SOM</span>
        </div>
      )}

      <iframe
        key={processedUrl}
        src={processedUrl}
        className="h-full w-full border-0 relative z-10"
        title={title}
        // SANDBOX BLINDADO: BLOQUEIA POPUPS E REDIRECIONAMENTOS
        sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
        allowFullScreen
        onLoad={() => setLoading(false)}
      />
      
      <div className="absolute inset-0 z-40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="absolute top-0 inset-x-0 p-6 bg-gradient-to-b from-black/90">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
            <h3 className="text-xl font-black text-white uppercase italic truncate tracking-tighter">{title}</h3>
          </div>
        </div>
        <div className="absolute bottom-0 inset-x-0 p-8 bg-gradient-to-t from-black/90 flex justify-between items-center">
          <Button variant="secondary" size="sm" className="bg-primary text-white h-12 px-6 text-[10px] uppercase font-black rounded-xl pointer-events-auto shadow-xl" onClick={() => window.open(url, '_blank')}>
            <ExternalLink className="mr-2 h-4 w-4" /> LINK EXTERNO
          </Button>
          <Button variant="ghost" size="icon" className="text-white h-12 w-12 pointer-events-auto hover:bg-white/10 rounded-full" onClick={() => {
            if (!containerRef.current) return;
            if (!document.fullscreenElement) containerRef.current.requestFullscreen();
            else document.exitFullscreen();
          }}>
            <Maximize className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  )
}