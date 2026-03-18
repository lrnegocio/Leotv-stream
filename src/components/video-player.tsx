
"use client"

import * as React from "react"
import { Maximize, ExternalLink, Loader2, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react"
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
  const [isM3u8, setIsM3u8] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  // PROCESSADOR DE SINAL MASTER 21.0: CONVERSÃO DE PROTOCOLOS
  const processedUrl = React.useMemo(() => {
    if (!url || typeof url !== 'string') return ""
    
    let targetUrl = url.trim()
    
    // 1. Detecção de M3U8 (Sinal de Stream Direto)
    if (targetUrl.toLowerCase().includes('.m3u8') || targetUrl.toLowerCase().includes('hls')) {
      setIsM3u8(true)
      // Usamos um player universal de M3U8 via embed para garantir compatibilidade total
      return `https://m3u8player.org/?url=${encodeURIComponent(targetUrl)}`
    } else {
      setIsM3u8(false)
    }

    // 2. Inteligência YouTube (Converte para /embed/ e remove Error 153)
    if (targetUrl.includes('youtube.com') || targetUrl.includes('youtu.be')) {
      let videoId = ""
      if (targetUrl.includes('v=')) {
        videoId = targetUrl.split('v=')[1].split('&')[0]
      } else if (targetUrl.includes('youtu.be/')) {
        videoId = targetUrl.split('youtu.be/')[1].split('?')[0]
      } else if (targetUrl.includes('embed/')) {
        videoId = targetUrl.split('embed/')[1].split('?')[0]
      }
      return `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1`
    }

    // 3. Inteligência XVideos (Converte para embedframe)
    if (targetUrl.includes('xvideos.com')) {
      if (targetUrl.includes('embedframe')) return targetUrl
      const match = targetUrl.match(/video\.([^/]+)\//) || targetUrl.match(/video-([^/]+)\//)
      if (match && match[1]) {
        return `https://www.xvideos.com/embedframe/${match[1]}`
      }
    }

    // 4. Inteligência Dailymotion (Converte para /embed/video/)
    if (targetUrl.includes('dailymotion.com')) {
      if (targetUrl.includes('embed/video/')) return targetUrl
      const idMatch = targetUrl.match(/video\/([^?]+)/)
      if (idMatch && idMatch[1]) {
        return `https://www.dailymotion.com/embed/video/${idMatch[1]}?autoplay=1`
      }
    }

    // 5. Ajuste para RedeCanais (Remove referer para evitar bloqueio 1106)
    return targetUrl
  }, [url])

  React.useEffect(() => {
    setLoading(true)
  }, [processedUrl])

  const openSecureLink = () => {
    const link = document.createElement('a');
    link.href = processedUrl;
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
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-[60]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <span className="mt-4 text-[9px] font-black text-primary uppercase tracking-widest animate-pulse italic">Sintonizando Sinal P2P Master...</span>
        </div>
      )}

      {/* CAMADA DE CONTROLE MASTER: PRIORIDADE MÁXIMA (z-[100]) */}
      <div className="absolute inset-0 z-[100] pointer-events-none">
        <div className="flex items-center justify-between h-full px-4">
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-24 w-12 rounded-full bg-black/20 text-white/50 hover:text-white hover:bg-primary/80 pointer-events-auto border border-white/5 backdrop-blur-sm transition-all hover:scale-110 active:scale-95"
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
            className="h-24 w-12 rounded-full bg-black/20 text-white/50 hover:text-white hover:bg-primary/80 pointer-events-auto border border-white/5 backdrop-blur-sm transition-all hover:scale-110 active:scale-95"
            onClick={(e) => { 
              e.preventDefault(); 
              e.stopPropagation(); 
              if (onNext) onNext();
            }}
          >
            <ChevronRight className="h-10 w-10" />
          </Button>
        </div>
      </div>

      {/* PLAYER ABERTO: SEM SANDBOX PARA FUNCIONAR TODOS OS SINAIS */}
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
          <div className="flex gap-4">
            <Button variant="secondary" size="sm" className="bg-primary text-white h-10 px-6 text-[10px] uppercase font-black rounded-xl pointer-events-auto shadow-lg shadow-primary/20" onClick={openSecureLink}>
              <ExternalLink className="mr-2 h-4 w-4" /> Sinal Externo
            </Button>
          </div>
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
