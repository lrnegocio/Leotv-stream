
"use client"

import * as React from "react"
import { Maximize, Loader2, SkipBack, SkipForward, Volume2, Tv, VolumeX, ExternalLink, ShieldAlert, Zap, Lock, AlertTriangle, RefreshCcw } from "lucide-react"
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
  const [hasError, setHasError] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
    if (url) {
      setLoading(true)
      setHasError(false)
    }
  }, [url])

  const { processedUrl, isDirectVideo, isExternalPage, isSigmaLink, isMercadoLivre, isTokyVideo } = React.useMemo(() => {
    if (!url || typeof url !== 'string' || url.trim() === "") return { processedUrl: null, isDirectVideo: false, isExternalPage: false, isSigmaLink: false, isMercadoLivre: false, isTokyVideo: false }
    let targetUrl = url.trim()
    const muteVal = isMuted ? "1" : "0"

    if (targetUrl.includes('mercadolivre.com.br')) {
      return { processedUrl: targetUrl, isDirectVideo: false, isExternalPage: true, isSigmaLink: false, isMercadoLivre: true, isTokyVideo: false };
    }

    const isSigma = targetUrl.includes('webplayer.one') || 
                    targetUrl.includes('sigma') || 
                    targetUrl.includes('blinder.') || 
                    targetUrl.includes('blder.') ||
                    targetUrl.includes('cloudplayer') ||
                    targetUrl.includes('fplay.');
    
    const isDirect = /\.(m3u8|mp4|webm|ogg|ts|mkv|mpegts)$/i.test(targetUrl.split('?')[0]) || targetUrl.includes('playlist.m3u8');

    if (targetUrl.includes('youtube.com') || targetUrl.includes('youtu.be')) {
      const id = targetUrl.includes('v=') ? targetUrl.split('v=')[1]?.split('&')[0] : targetUrl.split('youtu.be/')[1]?.split('?')[0];
      return { 
        processedUrl: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=${muteVal}&rel=0&modestbranding=1&controls=1`,
        isDirectVideo: false, isExternalPage: false, isSigmaLink: false, isMercadoLivre: false, isTokyVideo: false
      }
    }

    if (targetUrl.includes('tokyvideo.com')) {
      // Extração de ID melhorada para slugs do Tokyvideo
      const id = targetUrl.split('/').pop()?.split('?')[0];
      return {
        processedUrl: `https://www.tokyvideo.com/embed/${id}`,
        isDirectVideo: false,
        isExternalPage: false,
        isSigmaLink: false,
        isMercadoLivre: false,
        isTokyVideo: true
      }
    }

    if (targetUrl.includes('xvideos.com')) {
      const match = targetUrl.match(/video\.([a-z0-9]+)/i);
      if (match) return { processedUrl: `https://www.xvideos.com/embedframe/${match[1]}`, isDirectVideo: false, isExternalPage: false, isSigmaLink: false, isMercadoLivre: false, isTokyVideo: false };
    }
    if (targetUrl.includes('pornhub.com')) {
      const viewKey = new URL(targetUrl).searchParams.get('viewkey');
      if (viewKey) return { processedUrl: `https://www.pornhub.com/embed/${viewKey}`, isDirectVideo: false, isExternalPage: false, isSigmaLink: false, isMercadoLivre: false, isTokyVideo: false };
    }

    if (targetUrl.includes('/embed/') || targetUrl.includes('iframe')) {
       return { processedUrl: targetUrl, isDirectVideo: false, isExternalPage: false, isSigmaLink: false, isMercadoLivre: false, isTokyVideo: false };
    }

    return { 
      processedUrl: targetUrl, 
      isDirectVideo: isDirect, 
      isExternalPage: !isDirect || isSigma,
      isSigmaLink: isSigma,
      isMercadoLivre: false,
      isTokyVideo: false
    };
  }, [url, isMuted])

  const openExternal = () => {
    window.open(url, '_blank', 'width=1280,height=720,menubar=no,toolbar=no,location=no');
  }

  const isMixedContent = React.useMemo(() => {
    if (typeof window === 'undefined') return false;
    return window.location.protocol === 'https:' && processedUrl?.startsWith('http:');
  }, [processedUrl]);

  if (!isMounted) return <div className="aspect-video bg-black rounded-3xl animate-pulse" />

  if (!processedUrl) {
    return (
      <div className="aspect-video bg-black rounded-3xl flex flex-col items-center justify-center border border-white/5">
        <Tv className="h-16 w-16 text-primary/20 mb-4" />
        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">SINAL NÃO SINTONIZADO</span>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="group relative aspect-video w-full overflow-hidden bg-black shadow-2xl rounded-3xl border border-white/5 select-none">
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-[60]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <span className="mt-4 text-[10px] font-black text-primary uppercase animate-pulse tracking-widest">SINTONIZANDO SUPREMACIA...</span>
        </div>
      )}

      <div className="absolute top-4 left-4 z-[70] flex items-center gap-2 bg-black/60 px-3 py-1.5 rounded-full border border-primary/20 pointer-events-none">
         <Lock className="h-3 w-3 text-primary" />
         <span className="text-[8px] font-black uppercase text-primary tracking-widest">Sinal Blindado Léo Tv Stream</span>
      </div>

      {isMixedContent || isSigmaLink || isMercadoLivre ? (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1E161D] z-50 p-8 text-center space-y-6">
          <div className="p-6 bg-primary/10 rounded-full animate-pulse">
            <Zap className="h-16 w-16 text-primary" />
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-black uppercase italic text-primary">
              {isMercadoLivre ? "Sinal Mercado Livre" : isSigmaLink ? "Sinal Sigma Master" : "Sinal Externo Detectado"}
            </h3>
            <p className="text-[11px] font-bold text-muted-foreground uppercase max-w-sm mx-auto leading-relaxed">
              Este sinal exige sintonização externa para evitar bloqueios do navegador.
            </p>
          </div>
          <Button onClick={openExternal} className="bg-primary hover:bg-primary/90 h-16 px-12 rounded-2xl font-black uppercase text-sm shadow-2xl shadow-primary/40 hover:scale-105 transition-all">
            <ExternalLink className="mr-3 h-6 w-6" /> LIBERAR SINAL AGORA
          </Button>
        </div>
      ) : isDirectVideo ? (
        <video 
          key={processedUrl}
          src={processedUrl}
          autoPlay
          muted={isMuted}
          controls
          controlsList="nodownload noremoteplayback"
          disablePictureInPicture
          className="h-full w-full object-contain relative z-10"
          onLoadedData={() => setLoading(false)}
          onError={() => { setLoading(false); setHasError(true); }}
        />
      ) : (
        <iframe 
          key={processedUrl} 
          src={processedUrl} 
          className="h-full w-full border-0 relative z-10" 
          title={title} 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
          allowFullScreen 
          loading="eager"
          onLoad={() => setLoading(false)} 
          onError={() => { setLoading(false); setHasError(true); }}
        />
      )}

      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1E161D]/95 z-[70] p-10 text-center space-y-6">
           <div className="p-6 bg-destructive/10 rounded-full">
             <AlertTriangle className="h-16 w-16 text-destructive animate-pulse" />
           </div>
           <div className="space-y-2">
             <h3 className="text-2xl font-black uppercase italic text-destructive">SINAL FORA DO AR</h3>
             <p className="text-[11px] font-black text-muted-foreground uppercase max-w-sm mx-auto leading-relaxed">
               O link expirou ou o servidor bloqueou o acesso direto.
             </p>
           </div>
           <div className="flex gap-3">
             <Button onClick={openExternal} variant="outline" className="border-primary/20 text-primary font-black uppercase text-[10px] rounded-2xl h-14 px-8 hover:bg-primary/10">
               Tentar Abrir Externo
             </Button>
             <Button onClick={() => window.location.reload()} variant="ghost" className="text-white font-black uppercase text-[10px] rounded-2xl h-14 px-8">
               <RefreshCcw className="mr-2 h-4 w-4" /> Recarregar
             </Button>
           </div>
        </div>
      )}
      
      <div className="absolute inset-0 z-40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="absolute top-0 inset-x-0 p-6 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between pointer-events-none">
          <div className="flex flex-col">
            <span className="text-[8px] font-black text-primary uppercase tracking-[0.3em] mb-1">Sintonizando</span>
            <h3 className="text-xl font-black text-white uppercase italic truncate max-w-md">{title}</h3>
          </div>
          
          <div className="flex gap-2 pointer-events-auto">
            <Button variant="ghost" size="icon" onClick={openExternal} className="h-14 w-14 bg-black/40 hover:bg-primary rounded-full border border-white/10 shadow-2xl transition-all">
              <ExternalLink className="h-6 w-6 text-white" />
            </Button>
            <button 
              type="button"
              className="h-14 w-14 bg-black/40 hover:bg-primary rounded-full border border-white/10 flex items-center justify-center transition-all shadow-2xl" 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setIsMuted(!isMuted); }}
            >
              {isMuted ? <VolumeX className="h-8 w-8 text-destructive animate-pulse" /> : <Volume2 className="h-8 w-8 text-primary" />}
            </button>
          </div>
        </div>

        <div className="absolute inset-y-0 left-0 flex items-center pl-6 z-50">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onPrev?.(); }} 
            className={`h-16 w-16 rounded-full bg-black/60 text-white pointer-events-auto hover:bg-primary transition-all shadow-2xl ${!onPrev ? 'hidden' : 'flex'}`}
          >
            <SkipBack className="h-10 w-10" />
          </Button>
        </div>
        <div className="absolute inset-y-0 right-0 flex items-center pr-6 z-50">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); onNext?.(); }} 
            className={`h-16 w-16 rounded-full bg-black/60 text-white pointer-events-auto hover:bg-primary transition-all shadow-2xl ${!onNext ? 'hidden' : 'flex'}`}
          >
            <SkipForward className="h-10 w-10" />
          </Button>
        </div>

        <div className="absolute bottom-0 inset-x-0 p-8 bg-gradient-to-t from-black/80 to-transparent flex justify-end items-center">
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-white h-12 w-12 pointer-events-auto hover:bg-white/10 rounded-full" 
            onClick={() => { 
              if (!containerRef.current) return; 
              if (!document.fullscreenElement) containerRef.current.requestFullscreen(); 
              else document.exitFullscreen(); 
            }}
          >
            <Maximize className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  )
}
