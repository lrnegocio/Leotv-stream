
"use client"

import * as React from "react"
import { Maximize, Loader2, SkipBack, SkipForward, Volume2, Tv, VolumeX, ExternalLink, Zap, Lock, AlertTriangle, RefreshCcw, ShieldCheck } from "lucide-react"
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
  const [isMuted, setIsMuted] = React.useState(false)
  const [hasError, setHasError] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
    if (url) {
      setLoading(true)
      setHasError(false)
    }
  }, [url])

  const { processedUrl, isDirectVideo, isIframe, isShielded } = React.useMemo(() => {
    if (!url || typeof url !== 'string' || url.trim() === "") return { processedUrl: null, isDirectVideo: false, isIframe: false, isShielded: false }
    let targetUrl = url.trim()

    // DETECÇÃO DE SINAIS QUE PEDIRAM DESBLOQUEIO DE SANDBOX
    const isSpecialLink = targetUrl.includes('rdcanais.com') || targetUrl.includes('reidoscanais.ooo');

    // SUPORTE YOUTUBE
    if (targetUrl.includes('youtube.com') || targetUrl.includes('youtu.be')) {
      const id = targetUrl.includes('v=') ? targetUrl.split('v=')[1]?.split('&')[0] : targetUrl.split('youtu.be/')[1]?.split('?')[0];
      return { 
        processedUrl: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=0&rel=0&modestbranding=1&controls=1`,
        isDirectVideo: false, isIframe: true, isShielded: true
      }
    }

    // SUPORTE DIRETO (MP4, TS, M3U8)
    const isDirect = /\.(mp4|webm|ogg|ts|mkv|mpegts|m3u8)$/i.test(targetUrl.split('?')[0]) || targetUrl.includes('.ts') || targetUrl.includes('.m3u8');

    return { 
      processedUrl: targetUrl, 
      isDirectVideo: isDirect, 
      isIframe: !isDirect,
      isShielded: !isSpecialLink // Se for especial, NÃO usa sandbox/shield restritivo
    };
  }, [url])

  const openExternal = () => {
    window.open(url, '_blank', 'width=1280,height=720,menubar=no,toolbar=no,location=no,status=no');
  }

  if (!isMounted) return <div className="aspect-video bg-black rounded-3xl animate-pulse" />

  return (
    <div ref={containerRef} className="group relative aspect-video w-full overflow-hidden bg-black shadow-2xl rounded-3xl border border-white/5 select-none">
      <div className="absolute top-4 left-4 z-[80] flex items-center gap-2 bg-primary/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-primary/30 opacity-0 group-hover:opacity-100 transition-opacity">
        <ShieldCheck className="h-3 w-3 text-primary animate-pulse" />
        <span className="text-[8px] font-black text-primary uppercase tracking-widest">Sinal Master Blindado</span>
      </div>

      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-[60]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <span className="mt-4 text-[10px] font-black text-primary uppercase animate-pulse tracking-widest">SINTONIZANDO SINAL MASTER...</span>
        </div>
      )}

      {isDirectVideo ? (
        <video 
          key={processedUrl} 
          src={processedUrl!} 
          autoPlay 
          muted={isMuted} 
          controls 
          className="h-full w-full object-contain relative z-10" 
          onLoadedData={() => setLoading(false)} 
          onError={() => { setLoading(false); setHasError(true); }} 
        />
      ) : (
        <iframe 
          key={processedUrl} 
          src={processedUrl!} 
          className="h-full w-full border-0 relative z-10" 
          allowFullScreen 
          // Se for sinal protegido (rdcanais), remove o sandbox para funcionar direto
          sandbox={isShielded ? "allow-scripts allow-same-origin allow-forms allow-presentation allow-modals" : undefined}
          onLoad={() => setLoading(false)} 
          onError={() => { setLoading(false); setHasError(true); }} 
        />
      )}

      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1E161D]/95 z-[70] p-10 text-center space-y-6">
           <AlertTriangle className="h-16 w-16 text-destructive animate-pulse" />
           <h3 className="text-2xl font-black uppercase italic text-destructive">SINAL INSTÁVEL</h3>
           <div className="flex gap-4">
             <Button onClick={() => window.location.reload()} variant="outline" className="text-white border-white/10 font-black uppercase text-[10px] rounded-2xl h-14 px-8"><RefreshCcw className="mr-2 h-4 w-4" /> RECARREGAR</Button>
             <Button onClick={openExternal} className="bg-primary text-white font-black uppercase text-[10px] rounded-2xl h-14 px-8"><ExternalLink className="mr-2 h-4 w-4" /> ABRIR EXTERNO</Button>
           </div>
        </div>
      )}
      
      <div className="absolute inset-0 z-40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="absolute top-0 inset-x-0 p-6 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between pointer-events-none">
          <h3 className="text-xl font-black text-white uppercase italic truncate max-w-md">{title}</h3>
          <div className="flex gap-2 pointer-events-auto">
            <Button variant="ghost" size="icon" onClick={openExternal} className="h-14 w-14 bg-black/40 hover:bg-primary rounded-full shadow-2xl transition-all"><ExternalLink className="h-6 w-6 text-white" /></Button>
            <button className="h-14 w-14 bg-black/40 hover:bg-primary rounded-full flex items-center justify-center transition-all shadow-2xl" onClick={() => setIsMuted(!isMuted)}>
              {isMuted ? <VolumeX className="h-8 w-8 text-destructive" /> : <Volume2 className="h-8 w-8 text-primary" />}
            </button>
          </div>
        </div>

        <div className="absolute inset-y-0 left-0 flex items-center pl-6 z-50">
          {onPrev && (
            <Button variant="ghost" size="icon" onClick={onPrev} className="h-16 w-16 rounded-full bg-black/60 text-white pointer-events-auto hover:bg-primary shadow-2xl flex"><SkipBack className="h-10 w-10" /></Button>
          )}
        </div>
        <div className="absolute inset-y-0 right-0 flex items-center pr-6 z-50">
          {onNext && (
            <Button variant="ghost" size="icon" onClick={onNext} className="h-16 w-16 rounded-full bg-black/60 text-white pointer-events-auto hover:bg-primary shadow-2xl flex"><SkipForward className="h-10 w-10" /></Button>
          )}
        </div>

        <div className="absolute bottom-0 inset-x-0 p-8 bg-gradient-to-t from-black/80 to-transparent flex justify-end">
          <Button variant="ghost" size="icon" className="text-white h-12 w-12 pointer-events-auto" onClick={() => containerRef.current?.requestFullscreen()}><Maximize className="h-6 w-6" /></Button>
        </div>
      </div>
    </div>
  )
}
