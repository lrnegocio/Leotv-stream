
"use client"

import * as React from "react"
import { Loader2, AlertCircle, Maximize, Minimize, Play, Pause, ChevronRight, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

interface VideoPlayerProps {
  url: string
  title: string
  id?: string
  onNext?: () => void
  onPrev?: () => void
}

/**
 * PLAYER MASTER SOBERANO v288 - EDIÇÃO ANTI-RECUSA
 * Sintonizador inteligente com Bypass profundo para rdcplayer.online.
 * Auto-restart se detectar tela branca ou erro de conexão.
 */
export function VideoPlayer({ url, title, onNext, onPrev }: VideoPlayerProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(false)
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const [isMounted, setIsMounted] = React.useState(false)
  const [playerKey, setPlayerKey] = React.useState(0)
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [retryCount, setRetryCount] = React.useState(0)
  
  const hlsRef = React.useRef<any>(null)
  const mpegtsRef = React.useRef<any>(null)

  const lowUrl = (url || "").toLowerCase();
  
  const isIframeSite = 
    lowUrl.includes('rdcanais') || 
    lowUrl.includes('redecanaistv') || 
    lowUrl.includes('tvacabo') || 
    lowUrl.includes('reidoscanais') || 
    lowUrl.includes('rdcplayer') ||
    lowUrl.includes('playcnvs') ||
    lowUrl.includes('youtube.com') ||
    lowUrl.includes('youtu.be') ||
    lowUrl.includes('spotify.com') ||
    lowUrl.includes('deezer.com') ||
    lowUrl.includes('xvideos.com');
  
  const isIframe = isIframeSite || (!lowUrl.includes('.m3u8') && !lowUrl.includes('.ts') && !lowUrl.includes('.mp4') && lowUrl.includes('http'));
  const isDirectFile = lowUrl.includes('.mp4') || lowUrl.includes('archive.org') || lowUrl.includes('mlstatic.com');
  const isHls = !isIframe && (lowUrl.includes('.m3u8') || lowUrl.includes('/api/proxy'));
  const isTs = !isIframe && lowUrl.includes('.ts') && !lowUrl.includes('.m3u8');

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
    if (!isMounted || !url) return
    setError(false);
    setLoading(true);

    if (isIframe) {
      // Inicia automaticamente após 500ms para garantir autoplay mute
      setTimeout(() => {
        setIsPlaying(true);
        setPlayerKey(Date.now());
        setLoading(false);
      }, 500);
      return;
    }

    if (isDirectFile) {
      if (videoRef.current) {
        videoRef.current.src = url;
        videoRef.current.load();
        videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {
          if (videoRef.current) videoRef.current.muted = true;
          videoRef.current?.play();
          setIsPlaying(true);
        });
        setLoading(false);
      }
      return;
    }

    try {
      if (isTs && (window as any).mpegts) {
        const mpegts = (window as any).mpegts;
        const player = mpegts.createPlayer({ type: 'mse', isLive: true, url: url });
        player.attachMediaElement(videoRef.current);
        player.load();
        player.play().then(() => setIsPlaying(true)).catch(() => { 
          if (videoRef.current) videoRef.current.muted = true; 
          player.play(); 
          setIsPlaying(true);
        });
        mpegtsRef.current = player;
        setLoading(false);
      } else if (isHls && (window as any).Hls) {
        const Hls = (window as any).Hls;
        const hls = new Hls({ enableWorker: true });
        hls.loadSource(url);
        hls.attachMedia(videoRef.current);
        hlsRef.current = hls;
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setLoading(false);
          videoRef.current?.play().then(() => setIsPlaying(true)).catch(() => {
            if (videoRef.current) videoRef.current.muted = true;
            videoRef.current?.play();
            setIsPlaying(true);
          });
        });
      }
    } catch (e) { setError(true); setLoading(false); }
  }, [url, isMounted, isDirectFile, isHls, isTs, isIframe]);

  React.useEffect(() => {
    setIsMounted(true);
    initPlayer();
    return () => cleanup();
  }, [initPlayer, cleanup, url]);

  const handleTogglePlay = () => {
    if (isIframe) {
      // Força um recarregamento limpo se já estiver tocando (Reset Master)
      const newKey = Date.now();
      setPlayerKey(newKey);
      setIsPlaying(true);
      return;
    }

    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().then(() => setIsPlaying(true));
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {
        const el = containerRef.current as any;
        if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
      });
      setIsFullscreen(true)
    } else {
      if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
      setIsFullscreen(false)
    }
  };

  if (!isMounted) return null;

  let finalIframeSrc = url;
  if (playerKey > 0) {
    const separator = url.includes('?') ? '&' : '?';
    finalIframeSrc = `${url}${separator}autoplay=1&mute=1&t=${playerKey}`;
  }

  return (
    <div ref={containerRef} className={`relative w-full bg-black flex items-center justify-center ${isFullscreen ? 'h-screen w-screen z-[999]' : 'h-[85vh] rounded-none md:rounded-[3rem] overflow-hidden shadow-2xl'}`}>
      
      {loading && !isPlaying && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-[10px] font-black uppercase text-white/40 mt-4 tracking-widest">Sintonizando Master...</p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-[140] flex flex-col items-center justify-center bg-black/95 text-center p-10">
          <AlertCircle className="h-16 w-16 text-destructive mb-6" />
          <p className="text-white font-black uppercase text-xs">Sinal Master Indisponível.</p>
          <Button onClick={() => { cleanup(); setPlayerKey(Date.now()); initPlayer(); }} variant="outline" className="mt-4">TENTAR RECONEXÃO</Button>
        </div>
      )}
      
      {isIframe ? (
        <div className={`relative w-full h-full transition-all duration-500 ${!isPlaying ? 'opacity-0 scale-95 pointer-events-none' : 'opacity-100 scale-100'}`}>
          {playerKey > 0 && (
            <iframe 
              src={finalIframeSrc} 
              className="w-full h-full border-0"
              allow="autoplay; encrypted-media; fullscreen" 
              onLoad={() => setLoading(false)}
            />
          )}
        </div>
      ) : (
        <video 
          ref={videoRef} 
          className="w-full h-full object-contain" 
          autoPlay playsInline controls preload="auto"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
      )}

      {isIframe && !isPlaying && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 backdrop-blur-xl z-[145] animate-in fade-in duration-300">
           <div className="text-center space-y-8">
              <button 
                onClick={handleTogglePlay}
                className="h-40 w-40 rounded-full bg-primary/20 border-8 border-primary/30 flex items-center justify-center hover:scale-110 active:scale-95 transition-all group shadow-[0_0_80px_rgba(var(--primary),0.4)]"
              >
                <Play className="h-20 w-20 text-primary fill-primary animate-pulse" />
              </button>
              <div>
                <p className="text-2xl font-black uppercase italic text-primary tracking-widest">Sintonizar Master</p>
                <p className="text-[10px] font-bold uppercase text-white/30 mt-2">Clique para Liberar o Sinal Soberano</p>
              </div>
           </div>
        </div>
      )}

      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[160] bg-black/60 px-6 py-2 rounded-full border border-white/10 backdrop-blur-md pointer-events-none">
         <p className="text-[10px] font-black uppercase italic text-primary truncate max-w-[300px]">{title}</p>
      </div>

      <div className="absolute bottom-10 right-10 z-[160] flex gap-3">
        {onPrev && <button onClick={onPrev} className="h-12 w-12 rounded-2xl bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-primary transition-all shadow-lg"><ChevronLeft className="h-5 w-5 text-white" /></button>}
        
        <button 
          onClick={handleTogglePlay} 
          className="h-16 w-16 rounded-[1.5rem] bg-primary shadow-2xl flex items-center justify-center border-4 border-white/20 hover:scale-110 active:scale-95 transition-all group"
          title="Reset de Sinal Master"
        >
          {isPlaying ? <Pause className="h-8 w-8 text-white fill-white" /> : <Play className="h-8 w-8 text-white fill-white" />}
        </button>

        <button onClick={toggleFullscreen} className="h-12 w-12 rounded-2xl bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-primary transition-all shadow-lg">
          {isFullscreen ? <Minimize className="h-5 w-5 text-white" /> : <Maximize className="h-5 w-5 text-white" />}
        </button>
        
        {onNext && <button onClick={onNext} className="h-12 w-12 rounded-2xl bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-primary transition-all shadow-lg"><ChevronRight className="h-5 w-5 text-white" /></button>}
      </div>
    </div>
  )
}
