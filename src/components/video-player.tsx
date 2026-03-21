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
    const timer = setTimeout(() => setLoading(false), 2000)
    const muteTimer = setTimeout(() => setShowMuteNotice(false), 6000)
    return () => {
      clearTimeout(timer)
      clearTimeout(muteTimer)
    }
  }, [url])

  // MOTOR DE SINAL MASTER 8.0 - AUTOPLAY TOTAL E EMBEDS BLINDADOS
  const processedUrl = React.useMemo(() => {
    if (!url || typeof url !== 'string') return ""
    let targetUrl = url.trim()

    // 1. YouTube Master (Embed Blindado)
    if (targetUrl.includes('youtube.com/watch?v=') || targetUrl.includes('youtu.be/')) {
      const id = targetUrl.includes('v=') 
        ? targetUrl.split('v=')[1]?.split('&')[0] 
        : targetUrl.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&rel=0&modestbranding=1`
    }

    // 2. Dailymotion Master (Conversão para Embed)
    if (targetUrl.includes('dailymotion.com/video/')) {
      const id = targetUrl.split('video/')[1]?.split('?')[0];
      return `https://www.dailymotion.com/embed/video/${id}?autoplay=1&mute=1`
    }

    // 3. XVideos Master (Suporte a video.ID e video-ID)
    if (targetUrl.includes('xvideos.com/video')) {
      const match = targetUrl.match(/video[.-]([^/]+)\//) || targetUrl.match(/video[.-]([^/]+)$/)
      if (match && match[1]) {
        return `https://www.xvideos.com/embedframe/${match[1]}?autoplay=1&mute=1`
      }
    }

    // 4. Pornhub Master
    if (targetUrl.includes('pornhub.com/view_video.php')) {
      const viewkey = new URLSearchParams(targetUrl.split('?')[1]).get('viewkey')
      if (viewkey) {
        return `https://www.pornhub.com/embed/${viewkey}?autoplay=1&mute=1`
      }
    }

    // 5. Sinal Geral com Autoplay Forçado (mute=1 é obrigatório para autoplay)
    const connector = targetUrl.includes('?') ? '&' : '?'
    return `${targetUrl}${connector}autoplay=1&mute=1`
  }, [url])

  if (!isMounted) return <div className="aspect-video bg-black rounded-3xl animate-pulse" />

  return (
    <div ref={containerRef} className="group relative aspect-video w-full overflow-hidden bg-black rounded-3xl shadow-3xl border border-white/5">
      
      {/* CAMADA DE NAVEGAÇÃO SUPREMA - PRIORIDADE MÁXIMA PARA TROCA DE CANAL */}
      <div className="absolute inset-0 z-[999999] pointer-events-none flex items-center justify-between px-4 sm:px-10">
        {onPrev && (
          <button 
            type="button"
            className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-primary/20 hover:bg-primary text-white pointer-events-auto border-4 border-white/10 backdrop-blur-md transition-all hover:scale-110 active:scale-90 flex items-center justify-center shadow-2xl opacity-0 group-hover:opacity-100"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onPrev(); }}
          >
            <ChevronLeft className="h-12 w-12 sm:h-14 sm:w-14" />
          </button>
        )}
        
        {onNext && (
          <button 
            type="button"
            className="h-20 w-20 sm:h-24 sm:w-24 rounded-full bg-primary/20 hover:bg-primary text-white pointer-events-auto border-4 border-white/10 backdrop-blur-md transition-all hover:scale-110 active:scale-90 flex items-center justify-center shadow-2xl opacity-0 group-hover:opacity-100"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onNext(); }}
          >
            <ChevronRight className="h-12 w-12 sm:h-14 sm:w-14" />
          </button>
        )}
      </div>

      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-[60]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <span className="mt-4 text-[9px] font-black text-primary uppercase tracking-widest animate-pulse italic">Sintonizando Sinal...</span>
        </div>
      )}

      {showMuteNotice && !loading && (
        <div className="absolute top-10 left-1/2 -translate-x-1/2 z-[70] bg-black/80 px-4 py-2 rounded-full border border-primary/30 flex items-center gap-2 animate-in fade-in zoom-in duration-300">
          <Volume2 className="h-3 w-3 text-primary" />
          <span className="text-[8px] font-black text-white uppercase tracking-tight">Ative o Som se Desejar</span>
        </div>
      )}

      {/* PLAYER LIBERADO: SEM SANDBOX PARA FUNCIONAR SINAIS P2P E AUTOPLAY TOTAL */}
      <iframe
        key={processedUrl}
        src={processedUrl}
        className="h-full w-full border-0 relative z-10"
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
        allowFullScreen
        onLoad={() => setLoading(false)}
      />
      
      {/* OVERLAY DE INTERFACE MASTER */}
      <div className="absolute inset-0 z-40 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none">
        <div className="absolute top-0 inset-x-0 p-8 bg-gradient-to-b from-black/95 via-transparent">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
            <h3 className="text-xl font-black text-white uppercase italic truncate tracking-tighter">{title}</h3>
          </div>
        </div>
        <div className="absolute bottom-0 inset-x-0 p-8 bg-gradient-to-t from-black/95 via-transparent flex justify-between items-center px-10">
          <Button variant="secondary" size="sm" className="bg-primary text-white h-12 px-8 text-[11px] uppercase font-black rounded-2xl pointer-events-auto shadow-xl" onClick={() => window.open(url, '_blank')}>
            <ExternalLink className="mr-2 h-5 w-5" /> Abrir Sinal Externo
          </Button>
          <Button variant="ghost" size="icon" className="text-white h-14 w-14 pointer-events-auto hover:bg-white/10 rounded-full" onClick={() => {
            if (!document.fullscreenElement) containerRef.current?.requestFullscreen();
            else document.exitFullscreen();
          }}>
            <Maximize className="h-7 w-7" />
          </Button>
        </div>
      </div>
    </div>
  )
}
