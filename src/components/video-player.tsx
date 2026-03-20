"use client"

import * as React from "react"
import { Maximize, ExternalLink, Loader2, ChevronLeft, ChevronRight, Volume2, ShieldAlert } from "lucide-react"
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
  const [isDelayed, setIsDelayed] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
    setLoading(true)
    setIsDelayed(false)
    
    // Motor de Sintonização Master: Se o link demorar > 4s, libera o botão externo
    const timer = setTimeout(() => {
      setIsDelayed(true)
      setLoading(false)
    }, 4000)

    // Esconde o aviso de mudo
    const muteTimer = setTimeout(() => setShowMuteNotice(false), 5000)
    
    return () => {
      clearTimeout(timer)
      clearTimeout(muteTimer)
    }
  }, [url])

  // MOTOR DE SINAL FANTASMA 35.0 - AUTOPLAY TOTAL E RESPEITO AOS LINKS ORIGINAIS
  const processedUrl = React.useMemo(() => {
    if (!url || typeof url !== 'string') return ""
    
    let targetUrl = url.trim()

    // 1. EXTRAÇÃO DE IFRAME (Limpeza)
    if (targetUrl.includes('<iframe') && targetUrl.includes('src="')) {
      const match = targetUrl.match(/src="([^"]+)"/)
      if (match && match[1]) targetUrl = match[1]
    }

    // 2. ORDEM DO MESTRE: YouTube e Dailymotion usam o LINK ORIGINAL
    // Não alteramos para embed para evitar erros de domínio e Erro 153.
    // Apenas injetamos o Autoplay Master se não tiver.
    if (targetUrl.includes('youtube.com') || targetUrl.includes('dailymotion.com') || targetUrl.includes('.m3u8')) {
      const connector = targetUrl.includes('?') ? '&' : '?'
      return `${targetUrl}${connector}autoplay=1&mute=1`
    }

    // 3. PORNHUB / XVIDEOS: Conversão para Embed (Únicos que funcionam melhor assim)
    if (targetUrl.includes('pornhub.com')) {
      const urlParams = new URLSearchParams(targetUrl.split('?')[1])
      const viewkey = urlParams.get('viewkey')
      if (viewkey) return `https://www.pornhub.com/embed/${viewkey}?autoplay=1&mute=1`
    }
    if (targetUrl.includes('xvideos.com')) {
      const match = targetUrl.match(/video-?([^/]+)\//)
      if (match && match[1]) return `https://www.xvideos.com/embedframe/${match[1]}?autoplay=1&mute=1`
    }

    // 4. SINAL GERAL: Autoplay Master Muted
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
    <div ref={containerRef} className="group relative aspect-video w-full overflow-hidden bg-black rounded-3xl shadow-3xl border border-white/5">
      
      {/* CAMADA DE NAVEGAÇÃO MASTER: PRIORIDADE ABSOLUTA (z-[999999]) */}
      <div className="absolute inset-0 z-[999999] pointer-events-none flex items-center justify-between px-2 sm:px-6">
        {onPrev && (
          <button 
            type="button"
            className="h-16 w-16 sm:h-24 sm:w-24 rounded-full bg-primary/30 hover:bg-primary text-white pointer-events-auto border-4 border-white/10 backdrop-blur-xl transition-all hover:scale-110 active:scale-90 flex items-center justify-center shadow-[0_0_50px_rgba(0,0,0,0.8)] opacity-0 group-hover:opacity-100"
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
            className="h-16 w-16 sm:h-24 sm:w-24 rounded-full bg-primary/30 hover:bg-primary text-white pointer-events-auto border-4 border-white/10 backdrop-blur-xl transition-all hover:scale-110 active:scale-90 flex items-center justify-center shadow-[0_0_50px_rgba(0,0,0,0.8)] opacity-0 group-hover:opacity-100"
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

      {/* TELA DE SINAL EXTERNO (CASO O SITE BLOQUEIE O IFRAME) */}
      {isDelayed && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-card/90 backdrop-blur-3xl z-[55] p-8 text-center animate-in fade-in duration-500">
          <ShieldAlert className="h-16 w-16 text-primary mb-6 animate-bounce" />
          <h2 className="text-2xl font-black uppercase italic tracking-tighter text-white mb-2">Sinal com Proteção Externa</h2>
          <p className="text-[10px] font-bold text-muted-foreground uppercase max-w-xs mb-8">Este sinal requer conexão direta segura para evitar bloqueios do servidor.</p>
          <Button onClick={openSecureLink} className="h-16 px-12 bg-primary text-white font-black text-xl rounded-2xl shadow-2xl shadow-primary/40 hover:scale-110 transition-transform">
            SINTONIZAR AGORA
          </Button>
        </div>
      )}

      {/* AVISO DE MUDO PARA AUTOPLAY */}
      {showMuteNotice && !loading && !isDelayed && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[70] bg-black/80 px-6 py-3 rounded-full border border-primary/30 flex items-center gap-3 animate-in fade-in zoom-in duration-300">
          <Volume2 className="h-5 w-5 text-primary animate-bounce" />
          <span className="text-[11px] font-black text-white uppercase tracking-tight">Play Automático Master. Ative o som!</span>
        </div>
      )}

      {/* PLAYER LIBERADO: SEM SANDBOX PARA FUNCIONAR TODOS OS SINAIS */}
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
        <div className="absolute top-0 inset-x-0 p-8 bg-gradient-to-b from-black/95 via-transparent">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_#22c55e]" />
            <h3 className="text-xl font-black text-white uppercase italic truncate tracking-tighter drop-shadow-lg">{title}</h3>
          </div>
        </div>
        <div className="absolute bottom-0 inset-x-0 p-8 bg-gradient-to-t from-black/95 via-transparent flex justify-between items-center px-10">
          <Button variant="secondary" size="sm" className="bg-primary text-white h-12 px-8 text-[11px] uppercase font-black rounded-2xl pointer-events-auto shadow-2xl shadow-primary/20 hover:scale-110 transition-transform" onClick={openSecureLink}>
            <ExternalLink className="mr-2 h-5 w-5" /> Sintonizar Externo
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
