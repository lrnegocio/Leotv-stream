
"use client"

import * as React from "react"
import { Maximize, Loader2, SkipBack, SkipForward, Volume2, Tv, VolumeX } from "lucide-react"
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
  const [isMuted, setIsMuted] = React.useState(true)

  React.useEffect(() => {
    setIsMounted(true)
    if (url) {
      setLoading(true)
    }
  }, [url])

  const processedUrl = React.useMemo(() => {
    if (!url || typeof url !== 'string' || url.trim() === "") return null
    let targetUrl = url.trim()
    const muteVal = isMuted ? "1" : "0"

    // YouTube Handling
    if (targetUrl.includes('youtube.com/watch?v=') || targetUrl.includes('youtu.be/')) {
      const id = targetUrl.includes('v=') 
        ? targetUrl.split('v=')[1]?.split('&')[0] 
        : targetUrl.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=${muteVal}&rel=0&modestbranding=1&controls=1&showinfo=0`
    }

    // Dailymotion Handling
    if (targetUrl.includes('dailymotion.com/video/')) {
      const videoId = targetUrl.split('video/')[1]?.split('?')[0];
      return `https://www.dailymotion.com/embed/video/${videoId}?autoplay=1&mute=${muteVal}&ui-logo=0&ui-start-screen-info=0`;
    }

    // XVideos Handling
    if (targetUrl.includes('xvideos.com/video')) {
      const videoId = targetUrl.match(/video[.-]([^/]+)/)?.[1];
      if (videoId) return `https://www.xvideos.com/embedframe/${videoId}?autoplay=1&mute=${muteVal}`;
    }

    const connector = targetUrl.includes('?') ? '&' : '?'
    return `${targetUrl}${connector}autoplay=1&mute=${muteVal}&playsinline=1`
  }, [url, isMuted])

  const handleToggleAudio = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsMuted(!isMuted)
    setLoading(true)
  }

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

      <iframe
        key={processedUrl}
        src={processedUrl}
        className="h-full w-full border-0 relative z-10"
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
        allowFullScreen
        onLoad={() => setLoading(false)}
      />
      
      {/* Botões de Controle Blindados */}
      <div className="absolute inset-0 z-40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        {/* Topo com Título e Som */}
        <div className="absolute top-0 inset-x-0 p-6 bg-gradient-to-b from-black/95 flex items-center justify-between pointer-events-none">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
            <h3 className="text-xl font-black text-white uppercase italic truncate tracking-tighter max-w-[200px] sm:max-w-md">{title}</h3>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white pointer-events-auto h-14 w-14 bg-black/40 hover:bg-primary rounded-full transition-all border border-white/10" 
            onClick={handleToggleAudio}
          >
            {isMuted ? <VolumeX className="h-8 w-8 text-destructive animate-pulse" /> : <Volume2 className="h-8 w-8 text-primary" />}
          </Button>
        </div>

        {/* Setas de Navegação Laterais */}
        <div className="absolute inset-y-0 left-0 flex items-center pl-6 z-50">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onPrev?.(); }} 
            className={`h-16 w-16 rounded-full bg-black/60 text-white pointer-events-auto hover:bg-primary transition-all shadow-2xl ${!onPrev ? 'opacity-0' : 'opacity-100 hover:scale-110'}`}
          >
            <SkipBack className="h-10 w-10" />
          </Button>
        </div>
        <div className="absolute inset-y-0 right-0 flex items-center pr-6 z-50">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onNext?.(); }} 
            className={`h-16 w-16 rounded-full bg-black/60 text-white pointer-events-auto hover:bg-primary transition-all shadow-2xl ${!onNext ? 'opacity-0' : 'opacity-100 hover:scale-110'}`}
          >
            <SkipForward className="h-10 w-10" />
          </Button>
        </div>

        {/* Rodapé com Tela Cheia */}
        <div className="absolute bottom-0 inset-x-0 p-8 bg-gradient-to-t from-black/95 flex justify-end items-center">
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
