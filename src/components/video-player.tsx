
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

  // PROCESSADOR DE SINAL MASTER 22.0: CONVERSÃO DE PROTOCOLOS E BYPASS DE ERROS
  const processedUrl = React.useMemo(() => {
    if (!url || typeof url !== 'string') return ""
    
    let targetUrl = url.trim()
    
    // 1. Inteligência YouTube Master (Remoção de Erro 153)
    if (targetUrl.includes('youtube.com') || targetUrl.includes('youtu.be')) {
      let videoId = ""
      try {
        if (targetUrl.includes('v=')) {
          videoId = targetUrl.split('v=')[1].split('&')[0]
        } else if (targetUrl.includes('youtu.be/')) {
          videoId = targetUrl.split('youtu.be/')[1].split('?')[0]
        } else if (targetUrl.includes('embed/')) {
          videoId = targetUrl.split('embed/')[1].split('?')[0]
        }
      } catch (e) {}
      
      if (videoId) {
        // Usar servidor de compatibilidade com origin para liberar o sinal
        const origin = typeof window !== 'undefined' ? window.location.origin : ''
        return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=0&rel=0&modestbranding=1&origin=${encodeURIComponent(origin)}`
      }
    }

    // 2. Detecção de M3U8 (Sinal de Stream Direto - Sem Carregamento Infinito)
    if (targetUrl.toLowerCase().includes('.m3u8') || targetUrl.toLowerCase().includes('hls')) {
      return `https://p2p-player.vercel.app/?url=${encodeURIComponent(targetUrl)}`
    }

    // 3. Inteligência XVideos
    if (targetUrl.includes('xvideos.com')) {
      if (targetUrl.includes('embedframe')) return targetUrl
      const match = targetUrl.match(/video\.([^/]+)\//) || targetUrl.match(/video-([^/]+)\//)
      if (match && match[1]) {
        return `https://www.xvideos.com/embedframe/${match[1]}`
      }
    }

    // 4. Inteligência Dailymotion
    if (targetUrl.includes('dailymotion.com')) {
      if (targetUrl.includes('embed/video/')) return targetUrl
      const idMatch = targetUrl.match(/video\/([^?]+)/)
      if (idMatch && idMatch[1]) {
        return `https://www.dailymotion.com/embed/video/${idMatch[1]}?autoplay=1`
      }
    }

    // 5. Limpeza de iFrame (Pega apenas o src se o usuário colar o código todo)
    if (targetUrl.includes('<iframe')) {
      const match = targetUrl.match(/src="([^"]+)"/)
      if (match && match[1]) return match[1]
    }

    return targetUrl
  }, [url])

  // POLÍTICA DE REFERRER DINÂMICA: YouTube precisa de origem, RedeCanais precisa de sigilo
  const referrerPolicy = React.useMemo(() => {
    if (processedUrl.includes('youtube.com')) return "no-referrer-when-downgrade"
    return "no-referrer"
  }, [processedUrl])

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
          <span className="mt-4 text-[9px] font-black text-primary uppercase tracking-widest animate-pulse italic">Sintonizando Sinal Master...</span>
        </div>
      )}

      {/* CAMADA DE NAVEGAÇÃO MASTER (z-[100] para garantir o clique) */}
      <div className="absolute inset-0 z-[100] pointer-events-none flex items-center justify-between px-4">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-24 w-12 rounded-full bg-black/40 text-white/50 hover:text-white hover:bg-primary/80 pointer-events-auto border border-white/10 backdrop-blur-md transition-all hover:scale-110 active:scale-95"
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
          className="h-24 w-12 rounded-full bg-black/40 text-white/50 hover:text-white hover:bg-primary/80 pointer-events-auto border border-white/10 backdrop-blur-md transition-all hover:scale-110 active:scale-95"
          onClick={(e) => { 
            e.preventDefault(); 
            e.stopPropagation(); 
            if (onNext) onNext();
          }}
        >
          <ChevronRight className="h-10 w-10" />
        </Button>
      </div>

      {/* PLAYER ABERTO (SEM SANDBOX PARA COMPATIBILIDADE TOTAL) */}
      <iframe
        key={processedUrl}
        src={processedUrl}
        className="h-full w-full border-0 relative z-10"
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
        allowFullScreen
        referrerPolicy={referrerPolicy as any}
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
          <Button variant="secondary" size="sm" className="bg-primary text-white h-10 px-6 text-[10px] uppercase font-black rounded-xl pointer-events-auto shadow-lg shadow-primary/20" onClick={openSecureLink}>
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
