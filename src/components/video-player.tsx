
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
 * PLAYER MASTER SOBERANO v310 - SINCRONIZAÇÃO ABSOLUTA
 * Blindado contra Client-Side Exception e scripts de Popups/Novas Abas.
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

  // Analisa a URL de forma ultra-segura para evitar "client-side exception"
  const getSafeUrl = (raw: string) => {
    if (!raw) return "";
    try {
      const s = raw.toString();
      // Se já for proxy, não mexe
      if (s.includes('/api/proxy')) return s;
      return s;
    } catch (e) { return ""; }
  };

  const safeUrl = getSafeUrl(url);
  if (!safeUrl) return null;

  const lowDecoded = safeUrl.toLowerCase();
  
  // Detecção inteligente de tipo de sinal
  const isDirectFile = lowDecoded.includes('.m3u8') || lowDecoded.includes('.ts') || lowDecoded.includes('.mp4') || lowDecoded.includes('.mp3') || lowDecoded.includes('.mkv');
  const isYoutube = lowDecoded.includes('youtube.com') || lowDecoded.includes('youtu.be');
  const isAudioEmbed = lowDecoded.includes('spotify') || lowDecoded.includes('deezer');
  
  // Sites que PRECISAM de Iframe Blindado v310
  const isIframe = !isDirectFile || 
                   lowDecoded.includes('rdcanais') || 
                   lowDecoded.includes('redecanais') || 
                   lowDecoded.includes('playcnvs') || 
                   lowDecoded.includes('xvideos') ||
                   lowDecoded.includes('rdcplayer');

  const getFreshUrl = (baseUrl: string) => {
    if (!baseUrl) return "";
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}v310=${Date.now()}`;
  };

  const cleanup = React.useCallback(async () => {
    if (videoRef.current) {
      if (playPromiseRef.current) {
        try { await playPromiseRef.current; } catch (e) { }
      }
      videoRef.current.pause();
      videoRef.current.src = "";
      videoRef.current.load();
    }
    playPromiseRef.current = null;
  }, [])

  const initPlayer = React.useCallback(async () => {
    if (!isMounted || !safeUrl) return
    setLoading(true);

    if (isIframe || isYoutube || isAudioEmbed) {
      setPlayerKey(Date.now());
      setIsPlaying(true);
      // Timeout maior para dar tempo de "furar" o Cloudflare via Proxy
      setTimeout(() => setLoading(false), 3000);
      return;
    }

    if (isDirectFile && videoRef.current) {
      videoRef.current.src = safeUrl;
      videoRef.current.load();
      
      const promise = videoRef.current.play();
      playPromiseRef.current = promise;

      promise
        .then(() => {
          setIsPlaying(true);
          setLoading(false);
        })
        .catch(() => {
          if (videoRef.current) {
            videoRef.current.muted = true;
            videoRef.current.play().catch(() => {});
          }
          setIsPlaying(true);
          setLoading(false);
        });
    } else {
      setLoading(false);
      setIsPlaying(true);
    }
  }, [safeUrl, isMounted, isDirectFile, isIframe, isYoutube, isAudioEmbed]);

  React.useEffect(() => {
    setIsMounted(true);
    initPlayer();
    return () => { cleanup(); };
  }, [initPlayer, cleanup, safeUrl]);

  const handleTogglePlay = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (isIframe) { setPlayerKey(Date.now()); setIsPlaying(true); return; }

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
      
      {(isIframe || isYoutube || isAudioEmbed) && playerKey > 0 && (
        <iframe 
          key={playerKey}
          src={isYoutube || isAudioEmbed ? safeUrl : getFreshUrl(safeUrl)}
          className="w-full h-full border-0"
          // Sandbox v310: Impede que o site original abra novas janelas
          sandbox="allow-forms allow-scripts allow-same-origin allow-presentation allow-pointer-lock"
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          onLoad={() => setLoading(false)}
        />
      )}

      {!isIframe && !isYoutube && !isAudioEmbed && (
        <video 
          key={safeUrl} 
          ref={videoRef} 
          className="w-full h-full object-contain" 
          autoPlay 
          playsInline 
          controls 
          onPlay={() => setIsPlaying(true)} 
          onPause={() => setIsPlaying(false)} 
        />
      )}

      {loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="text-[10px] font-black uppercase text-primary animate-pulse tracking-widest">Sincronizando v310...</p>
          </div>
        </div>
      )}

      <div className="absolute bottom-10 right-10 z-[160] flex gap-3">
        {onPrev && <button onClick={onPrev} className="h-12 w-12 rounded-2xl bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-primary transition-all"><ChevronLeft className="h-5 w-5 text-white" /></button>}
        
        <button onClick={handleTogglePlay} className="h-16 w-16 rounded-[1.5rem] bg-primary shadow-2xl flex items-center justify-center border-4 border-white/20 hover:scale-110 active:scale-95 transition-all">
          {isPlaying ? <Pause className="h-8 w-8 text-white fill-white" /> : <Play className="h-8 w-8 text-white fill-white" />}
        </button>

        <button onClick={() => { cleanup(); setPlayerKey(Date.now()); initPlayer(); }} className="h-12 w-12 rounded-2xl bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-emerald-500 transition-all">
          <RefreshCcw className="h-5 w-5 text-white" />
        </button>

        <button onClick={toggleFullscreen} className="h-12 w-12 rounded-2xl bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-primary transition-all">
          {isFullscreen ? <Minimize className="h-5 w-5 text-white" /> : <Maximize className="h-5 w-5 text-white" />}
        </button>
        
        {onNext && <button onClick={onNext} className="h-12 w-12 rounded-2xl bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-primary transition-all"><ChevronRight className="h-5 w-5 text-white" /></button>}
      </div>

      <div className="absolute top-6 left-6 z-[160] bg-black/60 px-6 py-2 rounded-full border border-white/10 backdrop-blur-md pointer-events-none">
         <p className="text-[10px] font-black uppercase italic text-primary truncate max-w-[250px]">{title}</p>
      </div>
    </div>
  )
}
