
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
    // Esconde o aviso de mudo após 5 segundos
    const timer = setTimeout(() => setShowMuteNotice(false), 5000)
    return () => clearTimeout(timer)
  }, [url])

  // MOTOR DE SINAL MASTER 33.0 - AUTOPLAY FANTASMA
  const processedUrl = React.useMemo(() => {
    if (!url || typeof url !== 'string') return ""
    
    let targetUrl = url.trim()

    // 1. EXTRAÇÃO DE IFRAME (Caso cole a tag inteira)
    if (targetUrl.includes('<iframe') && targetUrl.includes('src="')) {
      const match = targetUrl.match(/src="([^"]+)"/)
      if (match && match[1]) targetUrl = match[1]
    }

    // 2. YOUTUBE MASTER: Único formato que aceita Autoplay sem Erro 153
    if (targetUrl.includes('youtube.com/watch') || targetUrl.includes('youtu.be/') || targetUrl.includes('youtube.com/embed/')) {
      const videoId = targetUrl.includes('v=') 
        ? targetUrl.split('v=')[1]?.split('&')[0] 
        : targetUrl.split('/').pop()?.split('?')[0]
      if (videoId) {
        // Autoplay + Mute (Obrigatório para o Chrome não bloquear o play automático)
        return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&mute=1&rel=0&showinfo=0&controls=1`
      }
    }

    // 3. PORNHUB MASTER: Conversão para Embed com Autoplay
    if (targetUrl.includes('pornhub.com')) {
      const urlParams = new URLSearchParams(targetUrl.split('?')[1])
      const viewkey = urlParams.get('viewkey')
      if (viewkey) return `https://www.pornhub.com/embed/${viewkey}?autoplay=1`
    }

    // 4. XVIDEOS MASTER: Conversão para Embed com Autoplay
    if (targetUrl.includes('xvideos.com')) {
      const match = targetUrl.match(/video-?([^/]+)\//)
      if (match && match[1]) return `https://www.xvideos.com/embedframe/${match[1]}?autoplay=1`
    }

    // 5. SINAL FANTASMA: Dailymotion, M3U8 e outros
    // Mantém o link original como pedido, mas tenta injetar autoplay se for link comum
    if (!targetUrl.includes('autoplay=')) {
      const connector = targetUrl.includes('?') ? '&' : '?'
      return `${targetUrl}${connector}autoplay=1&mute=1`
    }

    return targetUrl
  }, [url])

  if (!isMounted) return <div className="aspect-video bg-black rounded-3xl animate-pulse" />

  const openSecureLink = () => {
    window.open(processedUrl, '_blank', 'noreferrer,noopener');
  };

  return (
    <div ref={containerRef} className="group relative aspect-video w-full overflow-hidden bg-black rounded-3xl shadow-2xl border border-white/5">
      
      {/* CAMADA DE NAVEGAÇÃO MASTER: PRIORIDADE ABSOLUTA (z-[999999]) */}
      <div className="absolute inset-0 z-[999999] pointer-events-none flex items-center justify-between px-2 sm:px-6">
        {onPrev && (
          <button 
            type="button"
            className="h-16 w-16 sm:h-24 sm:w-24 rounded-full bg-primary/20 hover:bg-primary text-white pointer-events-auto border border-white/10 backdrop-blur-md transition-all hover:scale-110 active:scale-90 flex items-center justify-center shadow-2xl opacity-0 group-hover:opacity-100"
            onClick={(e) => { 
              e.preventDefault(); 
              e.stopPropagation(); 
              onPrev();
            }}
          >
            <ChevronLeft className="h-10 w-10 sm:h-16 sm:w-16" />
          </button>
        )}
        
        {onNext && (
          <button 
            type="button"
            className="h-16 w-16 sm:h-24 sm:w-24 rounded-full bg-primary/20 hover:bg-primary text-white pointer-events-auto border border-white/10 backdrop-blur-md transition-all hover:scale-110 active:scale-90 flex items-center justify-center shadow-2xl opacity-0 group-hover:opacity-100"
            onClick={(e) => { 
              e.preventDefault(); 
              e.stopPropagation(); 
              onNext();
            }}
          >
            <ChevronRight className="h-10 w-10 sm:h-16 sm:w-16" />
          </button>
        )}
      </div>

      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-[60]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <span className="mt-4 text-[9px] font-black text-primary uppercase tracking-widest animate-pulse italic">Sintonizando Canal Master...</span>
        </div>
      )}

      {/* AVISO DE MUDO PARA AUTOPLAY */}
      {showMuteNotice && !loading && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[70] bg-black/80 px-4 py-2 rounded-full border border-primary/30 flex items-center gap-2 animate-in fade-in zoom-in duration-300">
          <Volume2 className="h-4 w-4 text-primary animate-bounce" />
          <span className="text-[10px] font-bold text-white uppercase">Sinal Iniciado. Ative o som no player!</span>
        </div>
      )}

      {/* PLAYER LIBERADO: SEM SANDBOX E COM AUTOPLAY ATIVO */}
      <iframe
        key={processedUrl}
        src={processedUrl}
        className="h-full w-full border-0 relative z-10"
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
        allowFullScreen
        referrerPolicy="no-referrer"
        onLoad={() => setLoading(false)}
      />
      
      {/* OVERLAY DE INTERFACE DO PLAYER */}
      <div className="absolute inset-0 z-40 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none">
        <div className="absolute top-0 inset-x-0 p-6 bg-gradient-to-b from-black/90 via-transparent">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <h3 className="text-lg font-black text-white uppercase italic truncate tracking-tighter">{title}</h3>
          </div>
        </div>
        <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/90 via-transparent flex justify-between items-center px-8">
          <Button variant="secondary" size="sm" className="bg-primary text-white h-10 px-6 text-[10px] uppercase font-black rounded-xl pointer-events-auto shadow-lg" onClick={openSecureLink}>
            <ExternalLink className="mr-2 h-4 w-4" /> Link Externo
          </Button>
          <Button variant="ghost" size="icon" className="text-white h-12 w-12 pointer-events-auto hover:bg-white/10" onClick={() => {
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
