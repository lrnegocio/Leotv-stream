
"use client"

import * as React from "react"
import { Maximize, ExternalLink, Loader2, ChevronLeft, ChevronRight, AlertTriangle } from "lucide-react"
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
  const [errorTimeout, setErrorTimeout] = React.useState(false)
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
    setLoading(true)
    setErrorTimeout(false)

    // MOTOR DE SINTONIZAÇÃO TURBO: Se em 6 segundos não abrir, libera a opção externa
    const timer = setTimeout(() => {
      setLoading(false)
      setErrorTimeout(true)
    }, 6000)

    return () => clearTimeout(timer)
  }, [url])

  // MOTOR DE SINAL MASTER 28.0: CONVERSÃO CIRÚRGICA
  const processedUrl = React.useMemo(() => {
    if (!url || typeof url !== 'string') return ""
    
    const targetUrl = url.trim()

    // 1. YOUTUBE MASTER: CONVERSÃO OBRIGATÓRIA PARA PLAYER (SEM ERRO 153)
    if (targetUrl.includes('youtube.com/watch?v=') || targetUrl.includes('youtu.be/')) {
      let videoId = ""
      if (targetUrl.includes('v=')) {
        videoId = targetUrl.split('v=')[1]?.split('&')[0]
      } else {
        videoId = targetUrl.split('/').pop()?.split('?')[0] || ""
      }
      if (videoId) return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`
    }

    // 2. PORNHUB MASTER: CONVERSÃO OBRIGATÓRIA PARA PLAYER
    if (targetUrl.includes('pornhub.com') && targetUrl.includes('view_video.php')) {
      const urlParams = new URLSearchParams(targetUrl.split('?')[1])
      const viewkey = urlParams.get('viewkey')
      if (viewkey) return `https://www.pornhub.com/embed/${viewkey}`
    }

    // 3. XVIDEOS MASTER: CONVERSÃO OBRIGATÓRIA PARA PLAYER
    if (targetUrl.includes('xvideos.com') && !targetUrl.includes('embedframe')) {
      const match = targetUrl.match(/video\.([^/]+)\//) || targetUrl.match(/video-([^/]+)\//)
      if (match && match[1]) return `https://www.xvideos.com/embedframe/${match[1]}`
    }

    // 4. M3U8 MASTER: MOTOR DE SINAL UNIVERSAL
    if (targetUrl.toLowerCase().endsWith('.m3u8')) {
      return `https://m3u8-player.com/embed.php?url=${encodeURIComponent(targetUrl)}`
    }

    // 5. SINAL FANTASMA: Dailymotion e Outros (LINK ORIGINAL COMO O MESTRE MANDOU)
    return targetUrl
  }, [url])

  if (!isMounted) return <div className="aspect-video bg-black rounded-3xl animate-pulse" />

  const openSecureLink = () => {
    const link = document.createElement('a');
    link.href = processedUrl;
    link.target = '_blank';
    link.rel = 'noreferrer noopener';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div ref={containerRef} className="group relative aspect-video w-full overflow-hidden bg-black rounded-3xl shadow-2xl border border-white/5">
      
      {/* CAMADA DE NAVEGAÇÃO MASTER (z-[9999]): PRIORIDADE ABSOLUTA DE CLIQUE */}
      <div className="absolute inset-0 z-[9999] pointer-events-none flex items-center justify-between px-4 sm:px-6">
        {onPrev && (
          <button 
            type="button"
            className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-primary/20 hover:bg-primary text-white pointer-events-auto border border-white/10 backdrop-blur-md transition-all hover:scale-110 active:scale-90 flex items-center justify-center shadow-[0_0_30px_rgba(var(--primary),0.3)] opacity-0 group-hover:opacity-100"
            onClick={(e) => { 
              e.preventDefault(); 
              e.stopPropagation(); 
              onPrev();
            }}
          >
            <ChevronLeft className="h-10 w-10 sm:h-12 sm:w-12" />
          </button>
        )}

        {onNext && (
          <button 
            type="button"
            className="h-16 w-16 sm:h-20 sm:w-20 rounded-full bg-primary/20 hover:bg-primary text-white pointer-events-auto border border-white/10 backdrop-blur-md transition-all hover:scale-110 active:scale-90 flex items-center justify-center shadow-[0_0_30px_rgba(var(--primary),0.3)] opacity-0 group-hover:opacity-100"
            onClick={(e) => { 
              e.preventDefault(); 
              e.stopPropagation(); 
              onNext();
            }}
          >
            <ChevronRight className="h-10 w-10 sm:h-12 sm:w-12" />
          </button>
        )}
      </div>

      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-[60]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <span className="mt-4 text-[9px] font-black text-primary uppercase tracking-widest animate-pulse italic">Sintonizando Sinal Master...</span>
        </div>
      )}

      {errorTimeout && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-[55] p-8 text-center">
          <AlertTriangle className="h-12 w-12 text-primary mb-4" />
          <h4 className="text-sm font-black uppercase text-white mb-2 tracking-tighter italic">Sinal com Proteção Externa</h4>
          <p className="text-[10px] text-muted-foreground uppercase font-bold max-w-xs mb-6">Este sinal requer conexão direta segura para evitar bloqueios do servidor.</p>
          <Button onClick={openSecureLink} className="bg-primary text-white font-black uppercase h-12 px-8 rounded-2xl shadow-xl">
            SINTONIZAR AGORA <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
        </div>
      )}

      {/* PLAYER ABERTO (SEM SANDBOX CONFORME AS ORDENS DO MESTRE) */}
      <iframe
        key={processedUrl}
        src={processedUrl}
        className="h-full w-full border-0 relative z-10"
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
        allowFullScreen
        referrerPolicy="no-referrer"
        onLoad={() => {
          setLoading(false);
          setErrorTimeout(false);
        }}
      />
      
      {/* OVERLAY DE INTERFACE DO PLAYER (z-40 para ficar abaixo das setas) */}
      <div className="absolute inset-0 z-40 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none">
        <div className="absolute top-0 inset-x-0 p-6 bg-gradient-to-b from-black/90 via-transparent">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <h3 className="text-lg font-black text-white uppercase italic truncate tracking-tighter">{title}</h3>
          </div>
        </div>
        <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/90 via-transparent flex justify-between items-center px-8">
          <Button variant="secondary" size="sm" className="bg-primary text-white h-10 px-6 text-[10px] uppercase font-black rounded-xl pointer-events-auto shadow-lg" onClick={openSecureLink}>
            <ExternalLink className="mr-2 h-4 w-4" /> Sinal Externo
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
