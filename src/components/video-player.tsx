
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

  const { processedUrl, isDirectVideo, isSigmaLink, isIframe, isHls } = React.useMemo(() => {
    if (!url || typeof url !== 'string' || url.trim() === "") return { processedUrl: null, isDirectVideo: false, isSigmaLink: false, isIframe: false, isHls: false }
    let targetUrl = url.trim()

    // 1. SUPORTE HLS (.m3u8)
    const isM3U8 = targetUrl.toLowerCase().includes('.m3u8') || targetUrl.includes('index.m3u8');

    // 2. SUPORTE YOUTUBE
    if (targetUrl.includes('youtube.com') || targetUrl.includes('youtu.be')) {
      const id = targetUrl.includes('v=') ? targetUrl.split('v=')[1]?.split('&')[0] : targetUrl.split('youtu.be/')[1]?.split('?')[0];
      return { 
        processedUrl: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=0&rel=0&modestbranding=1&controls=1&iv_load_policy=3`,
        isDirectVideo: false, isSigmaLink: false, isIframe: true, isHls: false
      }
    }

    // 3. SUPORTE DAILYMOTION
    if (targetUrl.includes('dailymotion.com') || targetUrl.includes('dai.ly')) {
      const id = targetUrl.split('/').pop()?.split('?')[0];
      return {
        processedUrl: `https://www.dailymotion.com/embed/video/${id}?autoplay=1&mute=0&ui-logo=false&sharing-enable=false`,
        isDirectVideo: false, isSigmaLink: false, isIframe: true, isHls: false
      }
    }

    // 4. LINKS PROTEGIDOS QUE BLOQUEIAM SANDBOX (BRAVE DETECTADO)
    const isSigma = targetUrl.includes('webplayer.one') || 
                    targetUrl.includes('sigma') || 
                    targetUrl.includes('blinder.') || 
                    targetUrl.includes('blder.') ||
                    targetUrl.includes('cloudplayer') ||
                    targetUrl.includes('fplay.') ||
                    targetUrl.includes('reidoscanais') ||
                    targetUrl.includes('rdcanais');
    
    // 5. SUPORTE DIRETO (MP4, TS)
    const isDirect = /\.(mp4|webm|ogg|ts|mkv|mpegts)$/i.test(targetUrl.split('?')[0]) || 
                     targetUrl.includes('.ts');

    return { 
      processedUrl: targetUrl, 
      isDirectVideo: isDirect, 
      isSigmaLink: isSigma,
      isIframe: !isDirect && !isSigma && !isM3U8,
      isHls: isM3U8
    };
  }, [url])

  const openExternal = () => {
    // ABERTURA EM JANELA LIMPA PARA PULAR TRAVAS DE ANÚNCIO (ESTILO BRAVE)
    window.open(url, '_blank', 'width=1280,height=720,menubar=no,toolbar=no,location=no,status=no');
  }

  if (!isMounted) return <div className="aspect-video bg-black rounded-3xl animate-pulse" />

  return (
    <div ref={containerRef} className="group relative aspect-video w-full overflow-hidden bg-black shadow-2xl rounded-3xl border border-white/5 select-none">
      {/* BRAVE SHIELD INDICATOR */}
      <div className="absolute top-4 left-4 z-[80] flex items-center gap-2 bg-primary/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-primary/30 opacity-0 group-hover:opacity-100 transition-opacity">
        <ShieldCheck className="h-3 w-3 text-primary animate-pulse" />
        <span className="text-[8px] font-black text-primary uppercase tracking-widest">Brave Shield Ativo</span>
      </div>

      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-[60]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <span className="mt-4 text-[10px] font-black text-primary uppercase animate-pulse tracking-widest">SINTONIZANDO SINAL MASTER...</span>
        </div>
      )}

      {isSigmaLink ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1E161D] z-50 p-8 text-center space-y-6">
          <div className="p-6 bg-primary/10 rounded-full animate-pulse"><Zap className="h-16 w-16 text-primary" /></div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black uppercase italic text-primary">SINAL PROTEGIDO (BRAVE MODE)</h3>
            <p className="text-[11px] font-bold text-muted-foreground uppercase max-w-sm mx-auto leading-relaxed">
              Este sinal possui travas de propaganda. Clique abaixo para abrir em uma janela blindada sem anúncios.
            </p>
          </div>
          <Button onClick={openExternal} className="bg-primary h-16 px-12 rounded-2xl font-black uppercase shadow-2xl hover:scale-105 transition-transform">
            <ExternalLink className="mr-2 h-6 w-6" /> LIBERAR SINAL MASTER
          </Button>
        </div>
      ) : isDirectVideo ? (
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
          // sandbox restrito para bloquear redirecionamentos e anúncios
          sandbox="allow-scripts allow-same-origin allow-forms allow-presentation allow-modals"
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
