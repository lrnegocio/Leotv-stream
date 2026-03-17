"use client"

import * as React from "react"
import { Maximize, ExternalLink, Loader2, PlayCircle, Globe, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"

interface VideoPlayerProps {
  url: string
  title: string
}

export function VideoPlayer({ url, title }: VideoPlayerProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [loading, setLoading] = React.useState(true)
  const [isMounted, setIsMounted] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  const { embedUrl, isBlockedContent, isMixedContent } = React.useMemo(() => {
    if (!url || typeof url !== 'string' || url.trim() === "") {
      return { embedUrl: null, isBlockedContent: true, isMixedContent: false }
    }
    
    let processedUrl = url.trim()
    const isPageHttps = typeof window !== 'undefined' && window.location.protocol === 'https:'
    const isUrlHttp = processedUrl.startsWith('http://')
    
    // Lista de domínios que bloqueiam iframe (PHP players, redecanais, etc)
    const blockedDomains = ['redecanaistv', 'ch.php', 'player3', 'vulcanzz', 'nizcdn']
    const isKnownBlocked = blockedDomains.some(d => processedUrl.includes(d))
    
    // YouTube
    if (processedUrl.includes('youtube.com') || processedUrl.includes('youtu.be')) {
      const id = processedUrl.includes('v=') ? processedUrl.split('v=')[1]?.split('&')[0] : processedUrl.split('youtu.be/')[1]?.split('?')[0]
      processedUrl = `https://www.youtube.com/embed/${id}?autoplay=1`
    } 
    // Dailymotion
    else if (processedUrl.includes('dailymotion.com')) {
      const id = processedUrl.split('video/')[1]?.split('?')[0]
      processedUrl = `https://www.dailymotion.com/embed/video/${id}?autoplay=1`
    }
    // XVideos
    else if (processedUrl.includes('xvideos.com')) {
      const match = processedUrl.match(/video\.([^/]+)/) || processedUrl.match(/video(\d+)/)
      if (match) processedUrl = `https://www.xvideos.com/embedframe/${match[1]}`
    }

    return { 
      embedUrl: processedUrl, 
      isBlockedContent: isKnownBlocked,
      isMixedContent: isPageHttps && isUrlHttp 
    }
  }, [url])

  React.useEffect(() => {
    setLoading(true)
    const timer = setTimeout(() => setLoading(false), 2000)
    return () => clearTimeout(timer)
  }, [url])

  if (!isMounted) return <div className="aspect-video bg-black rounded-3xl animate-pulse" />

  // CAMADA DE PROTEÇÃO P2P MASTER (Para links que bloqueiam iframe ou são HTTP)
  if (isBlockedContent || isMixedContent) {
    return (
      <div className="aspect-video w-full flex flex-col items-center justify-center gap-6 bg-black rounded-3xl border border-white/10 text-center p-8">
        <div className="bg-primary/20 p-6 rounded-full border border-primary/30 shadow-2xl shadow-primary/20">
          <Globe className="h-12 w-12 text-primary animate-pulse" />
        </div>
        <div className="space-y-3">
          <h3 className="text-xl font-black uppercase italic text-white tracking-tighter">Sinal P2P Master</h3>
          <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-[0.2em] max-w-sm mx-auto leading-relaxed">
            Este canal requer conexão direta segura.<br/>Clique abaixo para sintonizar no player nativo.
          </p>
        </div>
        <Button 
          className="h-16 px-12 bg-primary hover:bg-primary/90 hover:scale-105 transition-all text-xl font-black uppercase italic rounded-2xl shadow-2xl shadow-primary/30 border border-white/10"
          onClick={() => window.open(url, '_blank')}
        >
          <PlayCircle className="mr-3 h-7 w-7" /> SINTONIZAR AGORA
        </Button>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="group relative aspect-video w-full overflow-hidden bg-black rounded-3xl shadow-2xl border border-white/5">
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-30">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <span className="mt-4 text-[9px] font-black text-primary uppercase tracking-widest animate-pulse">Sincronizando sinal master</span>
        </div>
      )}
      
      <iframe
        src={embedUrl || ""}
        className="h-full w-full border-0 relative z-10"
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
        allowFullScreen
        onLoad={() => setLoading(false)}
      />
      
      <div className="absolute inset-0 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none">
        <div className="absolute top-0 inset-x-0 p-6 bg-gradient-to-b from-black/90 via-transparent">
          <h3 className="text-lg font-black text-white uppercase italic truncate">{title}</h3>
        </div>
        <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-black/90 via-transparent flex justify-between items-center">
          <Button variant="secondary" size="sm" className="bg-primary text-white h-10 px-6 text-[10px] uppercase font-black rounded-xl pointer-events-auto" onClick={() => window.open(url, '_blank')}>
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
