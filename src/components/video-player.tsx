
"use client"

import * as React from "react"
import { Loader2, ChevronRight, ChevronLeft, RefreshCcw, Maximize, Minimize, Volume2, VolumeX } from "lucide-react"
import { getGlobalSettings } from "@/lib/store"

interface VideoPlayerProps {
  url: string
  title: string
  id?: string
  onNext?: () => void
  onPrev?: () => void
}

/**
 * PLAYER MASTER SOBERANA v369 - MESTRE DE FORMATOS
 * Suporte a .ts via mpegts.js e Swap Gênio inteligente.
 */
export function VideoPlayer({ url, title, onNext, onPrev }: VideoPlayerProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const [loading, setLoading] = React.useState(true)
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const [isMounted, setIsMounted] = React.useState(false)
  const [isMuted, setIsMuted] = React.useState(false)
  const [playerKey, setPlayerKey] = React.useState(0)
  const [announcement, setAnnouncement] = React.useState<string | null>(null)
  const [showAnnouncement, setShowAnnouncement] = React.useState(false)
  
  const mpegtsPlayerRef = React.useRef<any>(null);

  const safeUrl = React.useMemo(() => {
    if (!url) return "";
    return url.toString().trim();
  }, [url]);

  const lowUrl = safeUrl.toLowerCase();
  
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
                   lowUrl.includes('rdcplayer') ||
                   lowUrl.includes('dailymotion');

  const cleanup = React.useCallback(async () => {
    if (mpegtsPlayerRef.current) {
      mpegtsPlayerRef.current.destroy();
      mpegtsPlayerRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.src = "";
      videoRef.current.load();
    }
  }, []);

  const initPlayer = React.useCallback(async () => {
    if (!isMounted || !safeUrl) return;
    setLoading(true);

    try {
      const settings = await getGlobalSettings();
      if (settings.announcement && settings.announcement.trim()) {
        const lastSeen = localStorage.getItem('leotv_last_announcement');
        if (lastSeen !== settings.announcement) {
          setAnnouncement(settings.announcement);
          setShowAnnouncement(true);
        }
      }
    } catch (e) {}

    if (isIframe) {
      setPlayerKey(Date.now());
      setTimeout(() => setLoading(false), 2000);
      return;
    }

    if (isDirectFile && videoRef.current) {
      try {
        // Suporte especial para .ts via mpegts.js
        if (lowUrl.includes('.ts') && (window as any).mpegts) {
          const mpegts = (window as any).mpegts;
          if (mpegts.getFeatureList().mse) {
            mpegtsPlayerRef.current = mpegts.createPlayer({
              type: 'mse',
              url: safeUrl
            });
            mpegtsPlayerRef.current.attachMediaElement(videoRef.current);
            mpegtsPlayerRef.current.load();
            mpegtsPlayerRef.current.play().catch(() => {
              if (videoRef.current) videoRef.current.muted = true;
              mpegtsPlayerRef.current.play();
            });
            setLoading(false);
            return;
          }
        }

        // Padrao para outros arquivos diretos (.mp4, .m3u8 nativo)
        videoRef.current.src = safeUrl;
        videoRef.current.load();
        videoRef.current.play()
          .then(() => setLoading(false))
          .catch(() => {
            if (videoRef.current) {
              videoRef.current.muted = true;
              setIsMuted(true);
              videoRef.current.play();
            }
            setLoading(false);
          });
      } catch (e) {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, [safeUrl, isMounted, isDirectFile, isIframe, lowUrl]);

  React.useEffect(() => {
    setIsMounted(true);
    initPlayer();
    return () => { cleanup(); };
  }, [initPlayer, cleanup, safeUrl]);

  const handleToggleMute = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (videoRef.current) {
      const newMuteState = !videoRef.current.muted;
      videoRef.current.muted = newMuteState;
      setIsMuted(newMuteState);
    } else if (isIframe) {
      setPlayerKey(Date.now());
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
      
      {isIframe && (
        <iframe 
          key={playerKey}
          src={safeUrl}
          className="w-full h-full border-0"
          allow="autoplay; encrypted-media; fullscreen"
          onLoad={() => setLoading(false)}
        />
      )}

      {!isIframe && (
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
            <p className="text-[10px] font-black uppercase text-primary animate-pulse tracking-widest">Sintonizando v369...</p>
          </div>
        </div>
      )}

      {showAnnouncement && announcement && (
        <div className="absolute inset-0 z-[200] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
           <div className="max-w-md w-full bg-card rounded-[2rem] border-2 border-primary p-8 shadow-2xl">
              <h3 className="font-black uppercase text-primary mb-4">Aviso do Mestre Léo</h3>
              <p className="text-sm font-bold leading-relaxed mb-8">{announcement}</p>
              <button onClick={() => setShowAnnouncement(false)} className="w-full h-14 bg-primary text-white font-black uppercase rounded-2xl shadow-xl">ENTENDIDO</button>
           </div>
        </div>
      )}

      <div className="absolute bottom-10 right-10 z-[160] flex gap-3">
        {onPrev && <button onClick={onPrev} className="h-12 w-12 rounded-2xl bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-primary transition-all"><ChevronLeft className="h-5 w-5 text-white" /></button>}
        
        <button onClick={handleToggleMute} className="h-16 w-16 rounded-[1.5rem] bg-primary shadow-2xl flex items-center justify-center border-4 border-white/20 hover:scale-110 active:scale-95 transition-all">
          {isMuted ? <VolumeX className="h-8 w-8 text-white animate-pulse" /> : <Volume2 className="h-8 w-8 text-white" />}
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
