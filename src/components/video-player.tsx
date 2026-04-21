
"use client"

import * as React from "react"
import { Loader2, ChevronRight, ChevronLeft, RefreshCcw, Maximize, Minimize, Play, Pause } from "lucide-react"

interface VideoPlayerProps {
  url: string
  title: string
  id?: string
  onNext?: () => void
  onPrev?: () => void
}

/**
 * PLAYER MASTER SOBERANO v304 - SINCRONIZAÇÃO TOTAL
 * Blinda o player para que o que funciona no teste funcione no cliente.
 * Identifica automaticamente se precisa de Iframe ou Video Tag.
 */
export function VideoPlayer({ url, title, onNext, onPrev }: VideoPlayerProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const [loading, setLoading] = React.useState(true)
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const [isMounted, setIsMounted] = React.useState(false)
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [playerKey, setPlayerKey] = React.useState(0)
  
  const playPromiseRef = React.useRef<Promise<void> | null>(null);

  const lowUrl = (url || "").toLowerCase();
  
  // Identifica se é um arquivo de vídeo direto ou se precisa de Iframe (Embed)
  const isDirectFile = lowUrl.includes('.m3u8') || lowUrl.includes('.ts') || lowUrl.includes('.mp4');
  const isYouTube = lowUrl.includes('youtube.com/embed');
  
  // Se não for arquivo direto, usamos o modo Iframe (Túnel Master)
  const isIframe = !isDirectFile && (lowUrl.includes('http') || lowUrl.startsWith('/api/proxy') || isYouTube);

  // Cache-Buster v304: Garante sinal novo toda vez que abre
  const getFreshUrl = (baseUrl: string) => {
    if (!baseUrl) return "";
    if (isYouTube) return baseUrl; 
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}sync_id=${Date.now()}`;
  };

  const cleanup = React.useCallback(async () => {
    if (videoRef.current) {
      if (playPromiseRef.current) {
        try { await playPromiseRef.current; } catch (e) { }
      }
      videoRef.current.pause();
      videoRef.current.removeAttribute('src');
      videoRef.current.load();
    }
    playPromiseRef.current = null;
  }, [])

  const initPlayer = React.useCallback(async () => {
    if (!isMounted || !url) return
    setLoading(true);

    if (isIframe) {
      setPlayerKey(Date.now());
      setIsPlaying(true);
      // Nginx e Cloudflare as vezes levam 1-2s para responder o proxy
      setTimeout(() => setLoading(false), 1500);
      return;
    }

    if (isDirectFile && videoRef.current) {
      videoRef.current.src = url;
      videoRef.current.load();
      
      const promise = videoRef.current.play();
      playPromiseRef.current = promise;

      promise
        .then(() => {
          setIsPlaying(true);
          setLoading(false);
        })
        .catch((error) => {
          if (error.name === 'AbortError') return;
          if (videoRef.current) {
            videoRef.current.muted = true;
            videoRef.current.play().catch(() => {});
          }
          setIsPlaying(true);
          setLoading(false);
        });
      return;
    }

    setLoading(false);
    setIsPlaying(true);
  }, [url, isMounted, isDirectFile, isIframe]);

  React.useEffect(() => {
    setIsMounted(true);
    initPlayer();
    return () => { cleanup(); };
  }, [initPlayer, cleanup, url]);

  const handleTogglePlay = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    if (isIframe) {
      if (!isPlaying) {
        setPlayerKey(Date.now());
        setIsPlaying(true);
      } else {
        setPlayerKey(0);
        setIsPlaying(false);
      }
      return;
    }

    if (videoRef.current) {
      if (videoRef.current.paused) {
        const promise = videoRef.current.play();
        playPromiseRef.current = promise;
        promise.then(() => setIsPlaying(true)).catch(() => {});
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true)
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false)
    }
  };

  if (!isMounted) return null;

  return (
    <div ref={containerRef} className={`relative w-full bg-black flex items-center justify-center ${isFullscreen ? 'h-screen w-screen z-[999]' : 'h-[85vh] rounded-none md:rounded-[3rem] overflow-hidden shadow-2xl'}`}>
      
      {isIframe && playerKey > 0 && (
        <iframe 
          key={playerKey}
          src={getFreshUrl(url)}
          className="w-full h-full border-0"
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          onLoad={() => setLoading(false)}
        />
      )}

      {!isIframe && (
        <video ref={videoRef} className="w-full h-full object-contain" autoPlay playsInline controls onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} />
      )}

      {loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      )}

      <div className="absolute bottom-10 right-10 z-[160] flex gap-3">
        {onPrev && <button onClick={onPrev} className="h-12 w-12 rounded-2xl bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-primary transition-all"><ChevronLeft className="h-5 w-5 text-white" /></button>}
        
        <button 
          onClick={handleTogglePlay} 
          className="h-16 w-16 rounded-[1.5rem] bg-primary shadow-2xl flex items-center justify-center border-4 border-white/20 hover:scale-110 active:scale-95 transition-all"
        >
          {isPlaying ? <Pause className="h-8 w-8 text-white fill-white" /> : <Play className="h-8 w-8 text-white fill-white" />}
        </button>

        <button onClick={() => { cleanup(); setPlayerKey(Date.now()); initPlayer(); }} className="h-12 w-12 rounded-2xl bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-emerald-500 transition-all" title="Reiniciar Sinal">
          <RefreshCcw className="h-5 w-5 text-white" />
        </button>

        <button onClick={toggleFullscreen} className="h-12 w-12 rounded-2xl bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-primary transition-all">
          {isFullscreen ? <Minimize className="h-5 w-5 text-white" /> : <Maximize className="h-5 w-5 text-white" />}
        </button>
        
        {onNext && <button onClick={onNext} className="h-12 w-12 rounded-2xl bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-primary transition-all"><ChevronRight className="h-5 w-5 text-white" /></button>}
      </div>

      <div className="absolute top-6 left-6 z-[160] bg-black/60 px-6 py-2 rounded-full border border-white/10 backdrop-blur-md pointer-events-none">
         <p className="text-[10px] font-black uppercase italic text-primary truncate max-w-[200px]">{title}</p>
      </div>
    </div>
  )
}
