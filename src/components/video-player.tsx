"use client"

import * as React from "react"
import { Loader2, ChevronRight, ChevronLeft, RefreshCcw, Maximize, Minimize, Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"

interface VideoPlayerProps {
  url: string
  title: string
  id?: string
  onNext?: () => void
  onPrev?: () => void
}

/**
 * PLAYER MASTER SOBERANA v370 - MOTOR DIAMANTE HLS
 * Sincronizado para HLS.js com Autoplay de Episódios.
 */
export function VideoPlayer({ url, title, onNext, onPrev }: VideoPlayerProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const [loading, setLoading] = React.useState(true)
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const [isMounted, setIsMounted] = React.useState(false)
  const [isMuted, setIsMuted] = React.useState(false)
  const [playerKey, setPlayerKey] = React.useState(0)
  
  const safeUrl = React.useMemo(() => url?.toString().trim() || "", [url]);
  const lowUrl = safeUrl.toLowerCase();
  
  const isYouTube = lowUrl.includes('youtube.com') || lowUrl.includes('youtu.be');
  const isM3u8 = lowUrl.includes('.m3u8') || lowUrl.includes('mpegurl') || (lowUrl.includes('proxy') && lowUrl.includes('url='));
  
  const isIframe = isYouTube || 
                   lowUrl.includes('rdcanais') || 
                   lowUrl.includes('redecanais') || 
                   lowUrl.includes('streamrdc') ||
                   lowUrl.includes('xvideos') ||
                   lowUrl.includes('pornhub') ||
                   lowUrl.includes('ok.ru');

  const initPlayer = React.useCallback(async () => {
    if (!isMounted || !safeUrl) return;
    setLoading(true);

    if (isIframe) {
      setPlayerKey(Date.now());
      setTimeout(() => setLoading(false), 2000);
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    if (isM3u8 || lowUrl.includes('proxy')) {
      const Hls = (window as any).Hls;
      if (Hls && Hls.isSupported()) {
        const hls = new Hls({
          xhrSetup: (xhr: any) => { xhr.withCredentials = false; },
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90
        });
        hls.loadSource(safeUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(() => { 
            if (videoRef.current) {
              videoRef.current.muted = true; 
              setIsMuted(true); 
              videoRef.current.play(); 
            }
          });
          setLoading(false);
        });
        hls.on(Hls.Events.ERROR, (event: any, data: any) => {
          if (data.fatal) {
            hls.recoverMediaError();
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = safeUrl;
        video.play().then(() => setLoading(false)).catch(() => { 
          video.muted = true; 
          setIsMuted(true); 
          video.play(); 
          setLoading(false); 
        });
      } else {
        video.src = safeUrl;
        video.play().then(() => setLoading(false)).catch(() => setLoading(false));
      }
    } else {
      video.src = safeUrl;
      video.play().then(() => setLoading(false)).catch(() => { 
        video.muted = true; 
        setIsMuted(true); 
        video.play().then(() => setLoading(false)).catch(() => setLoading(false)); 
      });
    }
  }, [safeUrl, isMounted, isIframe, isM3u8, lowUrl]);

  React.useEffect(() => {
    setIsMounted(true);
    initPlayer();
    
    return () => {
      if (videoRef.current) {
        videoRef.current.src = "";
        videoRef.current.load();
      }
    };
  }, [initPlayer, safeUrl]);

  const handleToggleMute = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (videoRef.current) {
      const newMuteState = !videoRef.current.muted;
      videoRef.current.muted = newMuteState;
      setIsMuted(newMuteState);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  if (!isMounted || !safeUrl) return null;

  return (
    <div ref={containerRef} className={`relative w-full bg-black flex items-center justify-center ${isFullscreen ? 'h-screen w-screen z-[999]' : 'h-[85vh] rounded-none md:rounded-[3rem] overflow-hidden shadow-2xl'}`}>
      
      {isIframe ? (
        <iframe 
          key={playerKey}
          src={safeUrl}
          className="w-full h-full border-0"
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
          onLoad={() => setLoading(false)}
        />
      ) : (
        <video 
          key={safeUrl} 
          ref={videoRef} 
          className="w-full h-full object-contain" 
          autoPlay 
          playsInline 
          controls 
          crossOrigin="anonymous"
          onEnded={onNext}
        />
      )}

      {loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
            <p className="text-[10px] font-black uppercase text-primary animate-pulse tracking-widest">Sintonizando v370 Permanente...</p>
          </div>
        </div>
      )}

      <div className="absolute bottom-10 right-10 z-[160] flex gap-3">
        {onPrev && <Button size="icon" onClick={onPrev} className="h-12 w-12 rounded-2xl bg-black/40 border-white/10 hover:bg-primary transition-all"><ChevronLeft className="h-5 w-5" /></Button>}
        
        {!isIframe && (
          <Button size="icon" onClick={handleToggleMute} className="h-16 w-16 rounded-[1.5rem] bg-primary shadow-2xl border-4 border-white/20 transition-transform active:scale-95">
            {isMuted ? <VolumeX className="h-8 w-8" /> : <Volume2 className="h-8 w-8" />}
          </Button>
        )}

        <Button size="icon" onClick={() => initPlayer()} className="h-12 w-12 rounded-2xl bg-black/40 border-white/10 hover:bg-emerald-500 transition-all">
          <RefreshCcw className="h-5 w-5" />
        </Button>

        <Button size="icon" onClick={toggleFullscreen} className="h-12 w-12 rounded-2xl bg-black/40 border-white/10 hover:bg-primary transition-all">
          {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
        </Button>
        
        {onNext && <Button size="icon" onClick={onNext} className="h-12 w-12 rounded-2xl bg-black/40 border-white/10 hover:bg-primary transition-all"><ChevronRight className="h-5 w-5" /></Button>}
      </div>

      <div className="absolute top-6 left-6 z-[160] bg-black/60 px-6 py-2 rounded-full border border-white/10 backdrop-blur-md">
         <p className="text-[10px] font-black uppercase italic text-primary truncate max-w-[250px]">{title}</p>
      </div>
    </div>
  )
}