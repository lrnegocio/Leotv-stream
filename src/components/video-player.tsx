
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

  // Extração inteligente de URL caso o usuário cole a tag <iframe> completa
  const processedUrl = React.useMemo(() => {
    if (!url || typeof url !== 'string') return ""
    
    let targetUrl = url.trim()
    
    // Se colarem o código <iframe> inteiro, extraímos o conteúdo do src
    if (targetUrl.includes('<iframe')) {
      const srcMatch = targetUrl.match(/src=["']([^"']+)["']/i)
      if (srcMatch && srcMatch[1]) {
        targetUrl = srcMatch[1]
      }
    }

    // Detecção Inteligente de YouTube
    if (targetUrl.includes('youtube.com') || targetUrl.includes('youtu.be')) {
      const id = targetUrl.includes('v=') ? targetUrl.split('v=')[1]?.split('&')[0] : targetUrl.split('youtu.be/')[1]?.split('?')[0]
      return `https://www.youtube.com/embed/${id}?autoplay=1`
    } 
    
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
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-50">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <span className="mt-4 text-[9px] font-black text-primary uppercase tracking-widest animate-pulse italic">Conectando Sinal P2P Master</span>
        </div>
      )}

      {/* PLAYER 100% LIVRE: SEM ATRIBUTO SANDBOX PARA EVITAR BLOQUEIOS DO REI DOS CANAIS */}
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
      
      {/* CAMADA DE TROCA DE CANAL: PRIORIDADE MÁXIMA (z-[9999]) FORA DO CONTEXTO DO IFRAME */}
      <div className="absolute inset-0 z-[9999] pointer-events-none flex items-center justify-between px-4">
        <Button 
          variant="ghost" 
          size="icon" 
          className="h-16 w-16 rounded-full bg-black/60 text-white hover:bg-primary hover:scale-110 pointer-events-auto border border-white/10 shadow-2xl transition-all active:scale-90"
          onClick={(e) => { 
            e.preventDefault(); 
            e.stopPropagation(); 
            if (onPrev) onPrev();
          }}
        >
          <ChevronLeft className="h-12 w-12" />
        </Button>

        <Button 
          variant="ghost" 
          size="icon" 
          className="h-16 w-16 rounded-full bg-black/60 text-white hover:bg-primary hover:scale-110 pointer-events-auto border border-white/10 shadow-2xl transition-all active:scale-90"
          onClick={(e) => { 
            e.preventDefault(); 
            e.stopPropagation(); 
            if (onNext) onNext();
          }}
        >
          <ChevronRight className="h-12 w-12" />
        </Button>
      </div>

      <div className="absolute inset-0 z-40 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none">
        <div className="absolute top-0 inset-x-0 p-6 bg-gradient-to-b from-black/90 via-transparent">
          <h3 className="text-lg font-black text-white uppercase italic truncate tracking-tighter">{title}</h3>
        </div>
        <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/90 via-transparent flex justify-between items-center px-8">
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
