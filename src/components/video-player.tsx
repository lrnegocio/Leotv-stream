
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

  // DETECTOR DE ESSÊNCIA: Descobre o formato real escondido no Proxy
  const getOriginalUrl = React.useCallback((inputUrl: string) => {
    if (!inputUrl) return "";
    if (inputUrl.includes('/api/proxy?url=')) {
      try {
        const decoded = decodeURIComponent(inputUrl.split('url=')[1]);
        return decoded;
      } catch(e) { return inputUrl; }
    }
    return inputUrl;
  }, []);

  const getYouTubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const cleanup = React.useCallback(() => {
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
    if (mpegtsRef.current) { mpegtsRef.current.destroy(); mpegtsRef.current = null; }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.removeAttribute('src');
      videoRef.current.load();
    }
  }, [])

  const initPlayer = React.useCallback(async () => {
    if (!isMounted || !url || !videoRef.current) return
    
    cleanup()
    setError(false)
    setLoading(true)

    const originalUrl = getOriginalUrl(url);
    const lowUrl = originalUrl.toLowerCase();
    
    const isHLS = lowUrl.includes('.m3u8');
    const isMPEGTS = lowUrl.includes('.ts');
    const isMP4 = lowUrl.includes('.mp4');
    
    const ytId = getYouTubeId(originalUrl);
    // Lista de sites que rodam via Iframe direto
    const isIframeTarget = !!ytId || 
      lowUrl.includes('.html') || 
      lowUrl.includes('visioncine') || 
      lowUrl.includes('mercadoplay') || 
      lowUrl.includes('reidoscanais') || 
      lowUrl.includes('tvacabo.top') ||
      (!isHLS && !isMPEGTS && !isMP4 && !url.includes('proxy'));

    if (isIframeTarget) {
      setLoading(false)
      return 
    }

    try {
      // MOTOR MPEGTS (.TS IPTV)
      if (isMPEGTS && (window as any).mpegts) {
        const mpegts = (window as any).mpegts
        if (mpegts.isSupported()) {
          const player = mpegts.createPlayer({ type: 'mse', isLive: true, url: url }, { 
            enableWorker: true, 
            liveBufferLatencyChasing: true,
            stashInitialSize: 128
          })
          player.attachMediaElement(videoRef.current)
          player.load()
          player.play().catch(() => { if (videoRef.current) videoRef.current.muted = true; player.play(); })
          mpegtsRef.current = player
          setLoading(false)
          return
        }
      }

      // MOTOR HLS (.M3U8 / XVideos / Pluto)
      if (isHLS && (window as any).Hls) {
        const Hls = (window as any).Hls
        if (Hls.isSupported()) {
          const hls = new Hls({ enableWorker: true, lowLatencyMode: true })
          hls.loadSource(url)
          hls.attachMedia(videoRef.current)
          hlsRef.current = hls
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            videoRef.current?.play().catch(() => { if (videoRef.current) videoRef.current.muted = true; videoRef.current?.play(); })
            setLoading(false)
          })
          hls.on(Hls.Events.ERROR, (event:any, data:any) => {
            if (data.fatal) { setError(true); setLoading(false); }
          });
          return
        }
      } 
      
      // MOTOR NATIVO (.MP4)
      videoRef.current.src = url
      videoRef.current.play().catch(() => {
        if (videoRef.current) videoRef.current.muted = true
        videoRef.current?.play()
      })
      setLoading(false)
    } catch (e) {
      setError(true)
      setLoading(false)
    }
  }, [url, isMounted, cleanup, getOriginalUrl])

  React.useEffect(() => {
    setIsMounted(true)
    const timer = setTimeout(initPlayer, 300)
    return () => {
      clearTimeout(timer)
      cleanup()
    }
  }, [initPlayer, cleanup, url])

  const toggleFullscreen = () => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {})
      setIsFullscreen(true)
    } else {
      document.exitFullscreen().catch(() => {})
      setIsFullscreen(false)
    }
  }

  if (!isMounted) return null

  const originalUrl = getOriginalUrl(url);
  const lowUrl = originalUrl.toLowerCase();
  const ytId = getYouTubeId(originalUrl);
  const isIframeTarget = !!ytId || 
    lowUrl.includes('.html') || 
    lowUrl.includes('visioncine') || 
    lowUrl.includes('mercadoplay') || 
    lowUrl.includes('reidoscanais') || 
    lowUrl.includes('tvacabo.top') ||
    (!lowUrl.includes('.m3u8') && !lowUrl.includes('.ts') && !lowUrl.includes('.mp4') && !url.includes('proxy'));

  let iframeSrc = originalUrl;
  if (ytId) iframeSrc = `https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1`;

  return (
    <div ref={containerRef} className={`relative w-full bg-black flex items-center justify-center ${isFullscreen ? 'h-screen w-screen z-[999]' : 'h-[85vh] rounded-none md:rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl'}`}>
      {loading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-[10px] font-black uppercase italic animate-pulse text-primary tracking-widest">Sincronizando Sinal Master...</p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/95 text-center p-10">
          <AlertCircle className="h-16 w-16 text-destructive mb-6" />
          <p className="text-white font-black uppercase mb-6 text-xs tracking-widest">Falha ao sintonizar sinal.</p>
          <Button onClick={initPlayer} variant="outline" className="text-primary border-primary/20 font-black uppercase text-[10px] h-12 rounded-xl">RECONECTAR AGORA</Button>
        </div>
      )}
      
      {isIframeTarget ? (
        <iframe 
          key={iframeSrc} 
          src={iframeSrc} 
          className="w-full h-full border-0" 
          allowFullScreen 
          allow="autoplay; encrypted-media; fullscreen" 
          onLoad={() => setLoading(false)} 
        />
      ) : (
        <video 
          key={url} 
          ref={videoRef} 
          className="w-full h-full object-contain" 
          autoPlay 
          playsInline 
          controls 
          crossOrigin="anonymous"
        />
      )}

      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-40 bg-black/60 px-6 py-2 rounded-full border border-white/10 backdrop-blur-md">
         <p className="text-[10px] font-black uppercase italic text-primary truncate max-w-[300px]">{title}</p>
      </div>

      <div className="absolute bottom-6 right-6 z-40 flex gap-2">
        {onPrev && <button onClick={onPrev} className="h-10 w-10 rounded-xl bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-primary transition-all shadow-lg"><ChevronLeft className="h-4 w-4 text-white" /></button>}
        <button onClick={initPlayer} title="Recarregar" className="h-10 w-10 rounded-xl bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-primary transition-all shadow-lg"><RefreshCw className="h-4 w-4 text-white" /></button>
        <button onClick={toggleFullscreen} title="Tela Cheia" className="h-10 w-10 rounded-xl bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-primary transition-all shadow-lg">{isFullscreen ? <Minimize className="h-4 w-4 text-white" /> : <Maximize className="h-4 w-4 text-white" />}</button>
        {onNext && <button onClick={onNext} className="h-10 w-10 rounded-xl bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-primary transition-all shadow-lg"><ChevronRight className="h-4 w-4 text-white" /></button>}
      </div>
    </div>
  )
}
