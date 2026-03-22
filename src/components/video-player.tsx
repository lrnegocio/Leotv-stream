
"use client"

import * as React from "react"
import { Maximize, ExternalLink, Loader2, SkipBack, SkipForward, Volume2, Tv } from "lucide-react"
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
    if (url) {
      setLoading(true)
      const muteTimer = setTimeout(() => setShowMuteNotice(false), 5000)
      return () => clearTimeout(muteTimer)
    }
  }, [url])

  const processedUrl = React.useMemo(() => {
    if (!url || typeof url !== 'string' || url.trim() === "") return null
    let targetUrl = url.trim()

    // Xvideos Embed Anti-Ads
    if (targetUrl.includes('xvideos.com/video')) {
      const videoId = targetUrl.match(/video[.-]([^/]+)/)?.[1];
      if (videoId) return `https://www.xvideos.com/embedframe/${videoId}?autoplay=1&mute=1`;
    }

    // Dailymotion Embed
    if (targetUrl.includes('dailymotion.com/video/')) {
      const videoId = targetUrl.split('video/')[1]?.split('?')[0];
      return `https://www.dailymotion.com/embed/video/${videoId}?autoplay=1&mute=1&ui-logo=0&ui-start-screen-info=0`;
    }

    // YouTube Embed
    if (targetUrl.includes('youtube.com/watch?v=') || targetUrl.includes('youtu.be/')) {
      const id = targetUrl.includes('v=') 
        ? targetUrl.split('v=')[1]?.split('&')[0] 
        : targetUrl.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=1&rel=0&modestbranding=1&controls=1`
    }

    // Adiciona parâmetros de autoplay se não existirem
    const connector = targetUrl.includes('?') ? '&' : '?'
    return `${targetUrl}${connector}autoplay=1&mute=1&playsinline=1`
  }, [url])

  if (!isMounted) return <div className="aspect-video bg-black rounded-3xl animate-pulse" />

  if (!processedUrl) {
    return (
      <div className="aspect-video bg-black rounded-3xl flex flex-col items-center justify-center border border-white/5">
        <Tv className="h-16 w-16 text-primary/20 mb-4" />
        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest italic text-center px-8">
          SINAL P2P NÃO DISPONÍVEL NESTE CONTEÚDO
        </span>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="group relative aspect-video w-full overflow-hidden bg-black shadow-2xl rounded-3xl">
      
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-[60]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <span className="mt-4 text-[10px] font-black text-primary uppercase tracking-widest animate-pulse italic">SINTONIZANDO SINAL MASTER...</span>
        </div>
      )}

      {showMuteNotice && !loading && (
        <div className="absolute top-10 left-1/2 -translate-x-1/2 z-[70] bg-black/80 px-6 py-2 rounded-full border border-primary/30 flex items-center gap-2 animate-in fade-in zoom-in">
          <Volume2 className="h-4 w-4 text-primary animate-bounce" />
          <span className="text-[9px] font-black text-white uppercase tracking-tighter">SINAL MUDO: CLIQUE PARA ATIVAR O SOM</span>
        </div>
      )}

      {/* REMOVIDO SANDBOX PARA LIBERAR RDCANAIS, DAILYMOTION E TODOS OS SINAIS MASTER */}
      <iframe
        key={processedUrl}
        src={processedUrl}
        className="h-full w-full border-0 relative z-10"
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
        allowFullScreen
        onLoad={() => setLoading(false)}
      />
      
      <div className="absolute inset-0 z-40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="absolute top-0 inset-x-0 p-6 bg-gradient-to-b from-black/90">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              <h3 className="text-lg font-black text-white uppercase italic truncate tracking-tighter">{title}</h3>
            </div>
          </div>
        </div>

        <div className="absolute inset-y-0 left-0 flex items-center pl-6 z-50">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onPrev?.(); }} 
            className={`h-14 w-14 rounded-full bg-black/60 text-white pointer-events-auto hover:bg-primary transition-all ${!onPrev ? 'opacity-0' : 'opacity-100'}`}
          >
            <SkipBack className="h-8 w-8" />
          </Button>
        </div>
        <div className="absolute inset-y-0 right-0 flex items-center pr-6 z-50">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onNext?.(); }} 
            className={`h-14 w-14 rounded-full bg-black/60 text-white pointer-events-auto hover:bg-primary transition-all ${!onNext ? 'opacity-0' : 'opacity-100'}`}
          >
            <SkipForward className="h-8 w-8" />
          </Button>
        </div>

        <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/90 flex justify-between items-center">
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" className="bg-primary/20 text-primary hover:bg-primary hover:text-white h-10 px-4 text-[9px] font-black rounded-xl pointer-events-auto transition-all" onClick={() => window.open(url, '_blank')}>
              <ExternalLink className="mr-2 h-3 w-3" /> ABRIR SINAL EXTERNO
            </Button>
          </div>
          <Button variant="ghost" size="icon" className="text-white h-10 w-10 pointer-events-auto hover:bg-white/10 rounded-full" onClick={() => {
            if (!containerRef.current) return;
            if (!document.fullscreenElement) containerRef.current.requestFullscreen();
            else document.exitFullscreen();
          }}>
            <Maximize className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
