
"use client"

import * as React from "react"
import { Loader2, ChevronRight, ChevronLeft, RefreshCcw, Maximize, Minimize, Play, Pause, BellRing, X } from "lucide-react"
import { getGlobalSettings } from "@/lib/store"

interface VideoPlayerProps {
  url: string
  title: string
  id?: string
  onNext?: () => void
  onPrev?: () => void
}

/**
 * PLAYER MASTER SOBERANO v338 - MURAL DE AVISOS PERSISTENTE
 * Implementado alerta que sobrepõe o player e exige fechamento manual.
 */
export function VideoPlayer({ url, title, onNext, onPrev }: VideoPlayerProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const [loading, setLoading] = React.useState(true)
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const [isMounted, setIsMounted] = React.useState(false)
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [playerKey, setPlayerKey] = React.useState(0)
  const [announcement, setAnnouncement] = React.useState<string | null>(null)
  const [showAnnouncement, setShowAnnouncement] = React.useState(false)
  
  const playPromiseRef = React.useRef<Promise<void> | null>(null);

  const safeUrl = React.useMemo(() => {
    if (!url) return "";
    return url.toString().trim();
  }, [url]);

  const lowUrl = safeUrl.toLowerCase();
  const isYoutube = lowUrl.includes('youtube.com') || lowUrl.includes('youtu.be');
  const isAudioEmbed = lowUrl.includes('spotify') || lowUrl.includes('deezer');
  
  const isDirectFile = lowUrl.includes('.m3u8') || 
                       lowUrl.includes('.ts') || 
                       lowUrl.includes('.mp4') || 
                       lowUrl.includes('.mp3') || 
                       lowUrl.includes('.mkv');

  const isIframe = !isDirectFile || 
                   lowUrl.includes('rdcanais') || 
                   lowUrl.includes('redecanais') || 
                   lowUrl.includes('reidoscanais') ||
                   lowUrl.includes('playcnvs') || 
                   lowUrl.includes('xvideos') ||
                   lowUrl.includes('rdcplayer');

  const cleanup = React.useCallback(async () => {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.src = "";
      videoRef.current.load();
    }
    playPromiseRef.current = null;
  }, []);

  const initPlayer = React.useCallback(async () => {
    if (!isMounted || !safeUrl) return;
    setLoading(true);

    // Carrega Aviso do Mural
    try {
      const settings = await getGlobalSettings();
      if (settings.announcement && settings.announcement.trim()) {
        setAnnouncement(settings.announcement);
        setShowAnnouncement(true);
      }
    } catch (e) {}

    if (isIframe || isYoutube || isAudioEmbed) {
      setPlayerKey(Date.now());
      setIsPlaying(true);
      setTimeout(() => setLoading(false), 2000);
      return;
    }

    if (isDirectFile && videoRef.current) {
      try {
        videoRef.current.src = safeUrl;
        videoRef.current.load();
        
        const promise = videoRef.current.play();
        playPromiseRef.current = promise;

        promise
          .then(() => {
            setIsPlaying(true);
            setLoading(false)
          })
          .catch(() => {
            if (videoRef.current) {
              videoRef.current.muted = true;
              videoRef.current.play().catch(() => {});
            }
            setIsPlaying(true);
            setLoading(false);
          });
      } catch (e) {
        setLoading(false);
      }
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
    if (isIframe || isYoutube) { 
      setPlayerKey(Date.now()); 
      setIsPlaying(true); 
      return; 
    }

    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        containerRef.current.requestFullscreen().catch(() => {});
        setIsFullscreen(true);
      } else {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    } catch (e) {}
  };

  if (!isMounted || !safeUrl) return null;

  return (
    <div ref={containerRef} className={`relative w-full bg-black flex items-center justify-center ${isFullscreen ? 'h-screen w-screen z-[999]' : 'h-[85vh] rounded-none md:rounded-[3rem] overflow-hidden shadow-2xl'}`}>
      
      {(isIframe || isYoutube || isAudioEmbed) && (
        <iframe 
          key={playerKey}
          src={safeUrl}
          className="w-full h-full border-0"
          allow="autoplay; encrypted-media; fullscreen"
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
        />
      )}

      {loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="text-[10px] font-black uppercase text-primary animate-pulse tracking-widest">Sintonizando v338...</p>
          </div>
        </div>
      )}

      {/* MURAL DE AVISOS MASTER SOBERANO */}
      {showAnnouncement && (
        <div className="absolute inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-500">
           <div className="max-w-md w-full bg-card rounded-[2rem] border-2 border-primary shadow-2xl overflow-hidden animate-in zoom-in-95">
              <div className="bg-primary p-6 flex items-center gap-4">
                 <div className="bg-white/20 p-3 rounded-2xl"><BellRing className="h-6 w-6 text-white" /></div>
                 <h3 className="font-black uppercase italic text-white tracking-widest">Aviso do Mestre Léo</h3>
              </div>
              <div className="p-8">
                 <p className="text-sm font-bold leading-relaxed text-foreground whitespace-pre-wrap">{announcement}</p>
                 <button 
                  onClick={() => setShowAnnouncement(false)}
                  className="w-full mt-8 h-14 bg-primary text-white font-black uppercase rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all"
                 >
                   CIENTE / FECHAR AVISO
                 </button>
              </div>
           </div>
        </div>
      )}

      <div className="absolute bottom-10 right-10 z-[160] flex gap-3">
        {onPrev && <button onClick={onPrev} className="h-12 w-12 rounded-2xl bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-primary transition-all"><ChevronLeft className="h-5 w-5 text-white" /></button>}
        
        <button onClick={handleTogglePlay} className="h-16 w-16 rounded-[1.5rem] bg-primary shadow-2xl flex items-center justify-center border-4 border-white/20 hover:scale-110 active:scale-95 transition-all">
          {isPlaying ? <Pause className="h-8 w-8 text-white fill-white" /> : <Play className="h-8 w-8 text-white fill-white" />}
        </button>

        <button onClick={() => { cleanup(); initPlayer(); }} className="h-12 w-12 rounded-2xl bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-emerald-500 transition-all">
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
