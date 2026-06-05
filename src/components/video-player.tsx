
"use client"

import * as React from "react"
import { Loader2, ChevronRight, ChevronLeft, Maximize, Minimize, AlertTriangle } from "lucide-react"
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
  
  const safeUrl = React.useMemo(() => url?.toString().trim() || "", [url]);
  
  // DETECTOR UNIVERSAL v385-S PLUS (TVACABO & SHORTFLIX)
  const isIframe = safeUrl.includes('embed') || 
                   safeUrl.includes('youtube.com') || 
                   safeUrl.includes('ok.ru') || 
                   safeUrl.includes('vidsrc') || 
                   safeUrl.includes('shortflix.net') || 
                   safeUrl.includes('tvacabo.top') || 
                   safeUrl.includes('tokyvideo') || 
                   !safeUrl.match(/\.(m3u8|mp4|ts|mpd)(\?|$)/i);

  const initPlayer = React.useCallback(async () => {
    if (!safeUrl) return;
    setLoading(true);
    setError(false);

    if (isIframe) {
      setTimeout(() => setLoading(false), 2500);
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    video.volume = 1.0; 
    video.muted = false;

    try {
      if (safeUrl.includes('.m3u8')) {
        const Hls = (window as any).Hls;
        if (Hls && Hls.isSupported()) {
          const hls = new Hls({ 
            enableWorker: true, 
            lowLatencyMode: true,
            backBufferLength: 90 
          });
          hls.loadSource(safeUrl);
          hls.attachMedia(video);
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            video.play().catch(() => {
              video.muted = true;
              video.play();
            });
            setLoading(false);
          });
          hls.on(Hls.Events.ERROR, (event: any, data: any) => {
            if (data.fatal) setError(true);
          });
        } else {
          video.src = safeUrl;
          video.play().finally(() => setLoading(false));
        }
      } else {
        video.src = safeUrl;
        video.play().finally(() => setLoading(false));
      }
    } catch (e) {
      setError(true);
      setLoading(false);
    }
  }, [safeUrl, isIframe]);

  React.useEffect(() => {
    initPlayer();
  }, [initPlayer]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <div ref={containerRef} className={`relative w-full bg-black flex items-center justify-center ${isFullscreen ? 'h-screen' : 'h-[85vh] rounded-[3rem] overflow-hidden border border-white/5 shadow-2xl'}`}>
      {error ? (
        <div className="flex flex-col items-center gap-4 text-center p-10">
           <AlertTriangle className="h-20 w-20 text-amber-500" />
           <h3 className="text-xl font-black uppercase italic text-primary">Sinal Oscilando v385-S</h3>
           <p className="text-xs font-bold opacity-60">Mestre Léo, o sinal pode estar bloqueado pelo site original.</p>
           <Button onClick={() => initPlayer()} className="bg-primary h-12 px-8 rounded-xl font-black uppercase text-[10px]">RECONECTAR TÚNEL</Button>
        </div>
      ) : isIframe ? (
        <iframe 
          src={safeUrl} 
          className="w-full h-full border-0" 
          allow="autoplay; fullscreen; picture-in-picture" 
          allowFullScreen
          title="Player Universal"
        />
      ) : (
        <video 
          ref={videoRef} 
          className="w-full h-full object-contain" 
          autoPlay 
          playsInline 
          controls 
        />
      )}

      {loading && !error && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/95">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
          <p className="mt-4 text-[10px] font-black uppercase italic text-primary tracking-widest">Sintonizando v385-S...</p>
        </div>
      )}

      <div className="absolute bottom-10 right-10 z-[160] flex gap-3">
        <Button size="icon" onClick={toggleFullscreen} className="h-14 w-14 bg-black/60 rounded-2xl hover:bg-primary transition-all border border-white/10">
          {isFullscreen ? <Minimize className="h-6 w-6 text-white" /> : <Maximize className="h-6 w-6 text-white" />}
        </Button>
      </div>

      <div className="absolute top-8 left-8 z-[160] bg-black/60 px-8 py-3 rounded-full border border-white/10">
         <p className="text-[11px] font-black uppercase italic text-primary tracking-widest">{title}</p>
      </div>
    </div>
  )
}
