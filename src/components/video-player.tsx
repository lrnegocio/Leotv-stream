
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

  const getDailymotionId = (url: string) => {
    const m = url.match(/^.+dailymotion.com\/(video|hub)\/([^_]+)[^#]*$/);
    if (m) return m[2];
    const m2 = url.match(/^.+dai.ly\/([^_]+)[^#]*$/);
    if (m2) return m2[1];
    return null;
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

  React.useEffect(() => {
    setIsMounted(true)
    return () => cleanup()
  }, [cleanup])

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
    const dmId = getDailymotionId(originalUrl);
    
    const isIframeTarget = !!ytId || !!dmId || lowUrl.includes('.html') || (!isHLS && !isMPEGTS && !isMP4 && !url.includes('proxy'));

    if (isIframeTarget) {
      setLoading(false)
      return 
    }

    try {
      // MOTOR IPTV MASTER (.TS)
      if (isMPEGTS && (window as any).mpegts) {
        const mpegts = (window as any).mpegts
        if (mpegts.isSupported()) {
          const player = mpegts.createPlayer({ type: 'mse', isLive: true, url: url }, { enableWorker: true, liveBufferLatencyChasing: true })
          player.attachMediaElement(videoRef.current)
          player.load()
          player.play().catch(() => { if (videoRef.current) videoRef.current.muted = true; player.play(); })
          mpegtsRef.current = player
          setLoading(false)
          return
        }
      }

      // MOTOR HLS MASTER (.M3U8)
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
          return
        }
      } 
      
      // MOTOR NATIVO (.MP4 / PROXY)
      videoRef.current.src = url
      videoRef.current.play().catch(() => {
        if (videoRef.current) videoRef.current.muted = true
        videoRef.current?.play()
      })
      setLoading(false)
    } catch (e) {
      console.error("Player Error:", e);
      setError(true)
      setLoading(false)
    }
  }, [url, isMounted, cleanup, getOriginalUrl])

  React.useEffect(() => {
    if (isMounted) {
      const timer = setTimeout(initPlayer, 600)
      return () => clearTimeout(timer)
    }
  }, [initPlayer, isMounted])

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
  const ytId = getYouTubeId(originalUrl);
  const dmId = getDailymotionId(originalUrl);
  
  const isDirectVideo = originalUrl.toLowerCase().includes('.m3u8') || originalUrl.toLowerCase().includes('.ts') || originalUrl.toLowerCase().includes('.mp4');
  const isIframeTarget = !!ytId || !!dmId || originalUrl.toLowerCase().includes('.html') || (!isDirectVideo && !url.includes('proxy'));

  let iframeSrc = originalUrl;
  if (ytId) iframeSrc = `https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1`;
  if (dmId) iframeSrc = `https://www.dailymotion.com/embed/video/${dmId}?autoplay=1`;

  return (
    <div ref={containerRef} className={`relative w-full bg-black flex items-center justify-center ${isFullscreen ? 'h-screen w-screen z-[999]' : 'h-[85vh] rounded-none md:rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl'}`}>
      {loading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-[10px] font-black uppercase italic animate-pulse text-primary">Sincronizando Sinal Master Léo TV...</p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/95 text-center p-10">
          <AlertCircle className="h-16 w-16 text-destructive mb-6" />
          <p className="text-white font-black uppercase mb-6">Falha ao sintonizar sinal.</p>
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
        <video key={url} ref={videoRef} className="w-full h-full object-contain" autoPlay playsInline controls />
      )}

      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-40 bg-black/60 px-6 py-2 rounded-full border border-white/10 backdrop-blur-md">
         <p className="text-[10px] font-black uppercase italic text-primary truncate max-w-[300px]">{title}</p>
      </div>

      <div className="absolute bottom-6 right-6 z-40 flex gap-2">
        {onPrev && <button onClick={onPrev} className="h-10 w-10 rounded-xl bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-primary transition-all"><ChevronLeft className="h-4 w-4 text-white" /></button>}
        <button onClick={initPlayer} title="Recarregar" className="h-10 w-10 rounded-xl bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-primary transition-all"><RefreshCw className="h-4 w-4 text-white" /></button>
        <button onClick={toggleFullscreen} title="Tela Cheia" className="h-10 w-10 rounded-xl bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-primary transition-all">{isFullscreen ? <Minimize className="h-4 w-4 text-white" /> : <Maximize className="h-4 w-4 text-white" />}</button>
        {onNext && <button onClick={onNext} className="h-10 w-10 rounded-xl bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-primary transition-all"><ChevronRight className="h-4 w-4 text-white" /></button>}
      </div>
    </div>
  )
}
