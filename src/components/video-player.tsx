
"use client"

import * as React from "react"
import { Loader2, AlertCircle, Maximize, Minimize, RefreshCw, ChevronRight, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

interface VideoPlayerProps {
  url: string
  title: string
  id?: string
  onNext?: () => void
  onPrev?: () => void
}

export function VideoPlayer({ url, title, onNext, onPrev }: VideoPlayerProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(false)
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const [isMounted, setIsMounted] = React.useState(false)
  
  const hlsRef = React.useRef<any>(null)
  const mpegtsRef = React.useRef<any>(null)

  const cleanup = React.useCallback(() => {
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
    if (mpegtsRef.current) { mpegtsRef.current.destroy(); mpegtsRef.current = null; }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.removeAttribute('src');
      videoRef.current.load();
    }
  }, [])

  const getYouTubeId = (videoUrl: string) => {
    if (!videoUrl) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|\/v\/|shorts\/)([^#\&\?]*).*/;
    const match = videoUrl.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const lowUrl = (url || "").toLowerCase();
  const ytId = getYouTubeId(url);
  
  // PROTOCOLO SUPREMO v245: Identificação de fluxo com suporte a Proxy
  const isDirectFile = lowUrl.includes('.mp4') || lowUrl.includes('archive.org') || lowUrl.includes('mlstatic.com');
  const isHls = lowUrl.includes('.m3u8') || lowUrl.includes('proxy?url=');
  const isTs = lowUrl.includes('.ts');
  const isIframe = !isDirectFile && !isHls && !isTs && (ytId || url.includes('http'));

  const initPlayer = React.useCallback(async () => {
    if (!isMounted || !url) return
    
    setError(false);
    
    // MODO VOD: Arquivos MP4 carregam nativamente e liberam a tela na hora
    if (isDirectFile && !url.includes('.m3u8')) {
      setLoading(false);
      if (videoRef.current) {
        videoRef.current.src = url;
        videoRef.current.load();
        videoRef.current.play().catch(() => { if (videoRef.current) videoRef.current.muted = true; videoRef.current?.play(); });
      }
      return;
    }

    if (!videoRef.current) return;

    try {
      // Motor MPEG-TS (Canais brutos)
      if (isTs && typeof window !== 'undefined' && (window as any).mpegts) {
        const mpegts = (window as any).mpegts
        if (mpegts.isSupported()) {
          const player = mpegts.createPlayer({ type: 'mse', isLive: true, url: url })
          player.attachMediaElement(videoRef.current)
          player.load()
          player.play().catch(() => { if (videoRef.current) videoRef.current.muted = true; player.play(); })
          mpegtsRef.current = player
          setLoading(false);
          return
        }
      }

      // Motor HLS (Canais de Satélite e AgroPesca/Punycode via Proxy)
      if (isHls && typeof window !== 'undefined' && (window as any).Hls) {
        const Hls = (window as any).Hls
        if (Hls.isSupported()) {
          const hls = new Hls({ 
            enableWorker: true, 
            lowLatencyMode: true,
            backBufferLength: 60,
            maxMaxBufferLength: 30
          })
          hls.loadSource(url)
          hls.attachMedia(videoRef.current)
          hlsRef.current = hls
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            setLoading(false);
            videoRef.current?.play().catch(() => { if (videoRef.current) videoRef.current.muted = true; videoRef.current?.play(); })
          })
          hls.on(Hls.Events.ERROR, (event: any, data: any) => {
             if (data.fatal) {
                switch(data.type) {
                   case Hls.ErrorTypes.NETWORK_ERROR: hls.startLoad(); break;
                   case Hls.ErrorTypes.MEDIA_ERROR: hls.recoverMediaError(); break;
                   default: setError(true); setLoading(false); break;
                }
             }
          });
          return
        }
      }
      
      // Fallback nativo (Smart TVs modernas)
      if (isHls && videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        videoRef.current.src = url;
        setLoading(false);
      }

    } catch (e) {
      setError(true);
      setLoading(false);
    }
  }, [url, isMounted, isDirectFile, isHls, isTs])

  React.useEffect(() => {
    setIsMounted(true)
    const timer = setTimeout(initPlayer, 10)
    return () => {
      clearTimeout(timer)
      cleanup()
    }
  }, [initPlayer, cleanup, url])

  const toggleFullscreen = () => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {
        const el = containerRef.current as any;
        if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
        else if (el.msRequestFullscreen) el.msRequestFullscreen();
      })
      setIsFullscreen(true)
    } else {
      if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
      setIsFullscreen(false)
    }
  }

  if (!isMounted) return null

  let finalIframeSrc = url;
  if (ytId) {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    finalIframeSrc = `https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1&origin=${encodeURIComponent(origin)}&widget_referrer=${encodeURIComponent(origin)}&hl=pt`;
  }

  return (
    <div ref={containerRef} className={`relative w-full bg-black flex items-center justify-center ${isFullscreen ? 'h-screen w-screen z-[999]' : 'h-[85vh] rounded-none md:rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl'}`}>
      
      {loading && !isIframe && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-none">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-[10px] font-black uppercase italic animate-pulse text-primary tracking-widest">Sintonizando Sinal Master...</p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/95 text-center p-10">
          <AlertCircle className="h-16 w-16 text-destructive mb-6" />
          <p className="text-white font-black uppercase mb-6 text-xs tracking-widest">Erro de Sintonização.</p>
          <Button onClick={() => { cleanup(); initPlayer(); }} variant="outline" className="text-primary border-primary/20 font-black uppercase text-[10px] h-12 rounded-xl">RECONECTAR AGORA</Button>
        </div>
      )}
      
      {isIframe ? (
        <iframe 
          key={url} 
          src={finalIframeSrc} 
          className="w-full h-full border-0 relative z-20" 
          allowFullScreen 
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture" 
          onLoad={() => setLoading(false)} 
        />
      ) : (
        <video 
          key={url} 
          ref={videoRef} 
          className="w-full h-full object-contain relative z-20" 
          autoPlay 
          playsInline 
          controls 
          preload="auto"
          onLoadedData={() => setLoading(false)}
          onError={() => { if(!isDirectFile) setError(true); }}
        />
      )}

      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-40 bg-black/60 px-6 py-2 rounded-full border border-white/10 backdrop-blur-md">
         <p className="text-[10px] font-black uppercase italic text-primary truncate max-w-[300px]">{title}</p>
      </div>

      <div className="absolute bottom-6 right-6 z-40 flex gap-2">
        {onPrev && <button onClick={onPrev} title="Anterior" className="h-10 w-10 rounded-xl bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-primary transition-all shadow-lg"><ChevronLeft className="h-4 w-4 text-white" /></button>}
        <button onClick={() => { cleanup(); initPlayer(); }} title="Recarregar" className="h-10 w-10 rounded-xl bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-primary transition-all shadow-lg"><RefreshCw className="h-4 w-4 text-white" /></button>
        <button onClick={toggleFullscreen} title="Tela Cheia" className="h-10 w-10 rounded-xl bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-primary transition-all shadow-lg">{isFullscreen ? <Minimize className="h-4 w-4 text-white" /> : <Maximize className="h-4 w-4 text-white" />}</button>
        {onNext && <button onClick={onNext} title="Próximo" className="h-10 w-10 rounded-xl bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-primary transition-all shadow-lg"><ChevronRight className="h-4 w-4 text-white" /></button>}
      </div>
    </div>
  )
}
