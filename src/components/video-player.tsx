
"use client"

import * as React from "react"
import { Loader2, AlertCircle, Maximize, Minimize, RefreshCw, ChevronRight, ChevronLeft, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getGlobalSettings } from "@/lib/store"

interface VideoPlayerProps {
  url: string
  title: string
  id?: string
  onNext?: () => void
  onPrev?: () => void
}

/**
 * PLAYER MASTER SOBERANO v253 - MODO SUPREMO ANTI-ADWARE (BRAVE EDITION)
 * Suporte a HLS Proxy 8.0, MP4 Archive e Iframe Sandbox Blindado.
 * Bloqueia Redirects, Popups e Anúncios de sites externos automaticamente.
 */
export function VideoPlayer({ url, title, onNext, onPrev }: VideoPlayerProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(false)
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const [isMounted, setIsMounted] = React.useState(false)
  const [settings, setSettings] = React.useState<any>(null)
  
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
  
  const isDirectFile = lowUrl.includes('.mp4') || lowUrl.includes('archive.org') || lowUrl.includes('mlstatic.com');
  const isHls = lowUrl.includes('.m3u8') || lowUrl.includes('/api/proxy') || lowUrl.includes('xn--') || lowUrl.includes('agropesca');
  const isTs = lowUrl.includes('.ts') && !lowUrl.includes('.m3u8');
  const isIframe = (!isDirectFile && !isHls && !isTs && (ytId || url.includes('http'))) || lowUrl.includes('retrogames.cc') || lowUrl.includes('rdcanais') || lowUrl.includes('redecanaistv') || lowUrl.includes('tvacabo');

  const initPlayer = React.useCallback(async () => {
    if (!isMounted || !url) return
    
    setError(false);
    setLoading(true);

    const s = await getGlobalSettings();
    setSettings(s);
    
    // MODO VOD MP4/Archive: Entrega direta ao hardware
    if (isDirectFile && !url.includes('.m3u8')) {
      if (videoRef.current) {
        videoRef.current.src = url;
        videoRef.current.load();
        videoRef.current.play().catch(() => { 
          if (videoRef.current) videoRef.current.muted = true; 
          videoRef.current?.play(); 
        });
        setLoading(false); 
      }
      return;
    }

    if (!videoRef.current || isIframe) {
       if(isIframe) setLoading(false);
       return;
    }

    try {
      if (isTs && typeof window !== 'undefined' && (window as any).mpegts) {
        const mpegts = (window as any).mpegts;
        if (mpegts.isSupported()) {
          const player = mpegts.createPlayer({ type: 'mse', isLive: true, url: url });
          player.attachMediaElement(videoRef.current);
          player.load();
          player.play().catch(() => { if (videoRef.current) videoRef.current.muted = true; player.play(); });
          mpegtsRef.current = player;
          setLoading(false);
          return;
        }
      }

      if (isHls && typeof window !== 'undefined' && (window as any).Hls) {
        const Hls = (window as any).Hls;
        if (Hls.isSupported()) {
          const hls = new Hls({ 
            enableWorker: true, 
            lowLatencyMode: true,
            xhrSetup: (xhr: any) => { xhr.withCredentials = false; }
          });
          hls.loadSource(url);
          hls.attachMedia(videoRef.current);
          hlsRef.current = hls;
          
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            setLoading(false);
            videoRef.current?.play().catch(() => { 
              if (videoRef.current) videoRef.current.muted = true; 
              videoRef.current?.play(); 
            });
          });

          hls.on(Hls.Events.ERROR, (event: any, data: any) => {
            if (data.fatal) {
              switch(data.type) {
                case Hls.ErrorTypes.NETWORK_ERROR: hls.startLoad(); break;
                case Hls.ErrorTypes.MEDIA_ERROR: hls.recoverMediaError(); break;
                default: setError(true); setLoading(false); break;
              }
            }
          });
          return;
        }
      }
      
      if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
        videoRef.current.src = url;
        setLoading(false);
      }

    } catch (e) {
      setError(true);
      setLoading(false);
    }
  }, [url, isMounted, isDirectFile, isHls, isTs, isIframe])

  React.useEffect(() => {
    setIsMounted(true)
    const timer = setTimeout(initPlayer, 50)
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
    finalIframeSrc = `https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1&origin=${encodeURIComponent(origin)}`;
  }

  return (
    <div ref={containerRef} className={`relative w-full bg-black flex items-center justify-center ${isFullscreen ? 'h-screen w-screen z-[999]' : 'h-[85vh] rounded-none md:rounded-[3rem] overflow-hidden shadow-2xl'}`}>
      
      {loading && !isIframe && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/40 pointer-events-none">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-[10px] font-black uppercase text-white/40 mt-4 tracking-widest">Sintonizando Sinal Master...</p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/95 text-center p-10">
          <AlertCircle className="h-16 w-16 text-destructive mb-6" />
          <p className="text-white font-black uppercase mb-6 text-xs tracking-widest">Sinal Master Indisponível ou Protegido.</p>
          <Button onClick={() => { cleanup(); initPlayer(); }} variant="outline" className="text-primary border-primary/20 font-black uppercase text-[10px] h-12 rounded-xl">TENTAR RECONEXÃO</Button>
        </div>
      )}
      
      {isIframe ? (
        <iframe 
          key={url} 
          src={finalIframeSrc} 
          className="w-full h-full border-0 relative z-20" 
          allowFullScreen 
          allow="autoplay; encrypted-media; fullscreen" 
          onLoad={() => setLoading(false)} 
          sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
          referrerPolicy="no-referrer"
          title="Player Blindado Léo TV"
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
          onPlaying={() => setLoading(false)}
          onError={() => { if(!isDirectFile) setError(true); }}
        />
      )}

      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-40 bg-black/60 px-6 py-2 rounded-full border border-white/10 backdrop-blur-md pointer-events-none">
         <p className="text-[10px] font-black uppercase italic text-primary truncate max-w-[300px]">{title}</p>
      </div>

      {settings?.bannerUrl && (
        <div className="absolute top-6 right-6 z-40 hidden md:block">
           <div className="bg-black/60 backdrop-blur-md p-1 rounded-xl border border-white/10 overflow-hidden cursor-pointer" onClick={() => settings.bannerLink && window.open(settings.bannerLink, '_blank')}>
              <div className="relative w-32 h-10">
                 <img src={settings.bannerUrl} alt="Ad" className="w-full h-full object-cover rounded-lg" />
                 <div className="absolute -top-1 -right-1 bg-primary p-0.5 rounded-full"><Zap className="h-2 w-2 text-white" /></div>
              </div>
           </div>
        </div>
      )}

      <div className="absolute bottom-6 right-6 z-40 flex gap-2">
        {onPrev && <button onClick={onPrev} title="Anterior" className="h-10 w-10 rounded-xl bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-primary transition-all"><ChevronLeft className="h-4 w-4 text-white" /></button>}
        <button onClick={() => { cleanup(); initPlayer(); }} title="Recarregar" className="h-10 w-10 rounded-xl bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-primary transition-all"><RefreshCw className="h-4 w-4 text-white" /></button>
        <button onClick={toggleFullscreen} title="Tela Cheia" className="h-10 w-10 rounded-xl bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-primary transition-all">{isFullscreen ? <Minimize className="h-4 w-4 text-white" /> : <Maximize className="h-4 w-4 text-white" />}</button>
        {onNext && <button onClick={onNext} title="Próximo" className="h-10 w-10 rounded-xl bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-primary transition-all"><ChevronRight className="h-4 w-4 text-white" /></button>}
      </div>
    </div>
  )
}
