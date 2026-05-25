"use client"

import * as React from "react"
import { Loader2, ChevronRight, ChevronLeft, Maximize, Minimize } from "lucide-react"
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
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  
  const safeUrl = React.useMemo(() => url?.toString().trim() || "", [url]);
  const isIframe = safeUrl.toLowerCase().includes('youtube.com') || safeUrl.toLowerCase().includes('ok.ru') || safeUrl.toLowerCase().includes('rdcanais') || safeUrl.toLowerCase().includes('redecanais');

  const initPlayer = React.useCallback(async () => {
    if (!safeUrl) return;
    setLoading(true);

    if (isIframe) {
      setTimeout(() => setLoading(false), 2000);
      return;
    }

    const video = videoRef.current;
    if (!video) return;

    // GANHO DE ÁUDIO MASTER v370-S - FORÇA 100% DE VOLUME
    video.volume = 1.0; 

    if (safeUrl.includes('.m3u8')) {
      const Hls = (window as any).Hls;
      if (Hls && Hls.isSupported()) {
        const hls = new Hls();
        hls.loadSource(safeUrl);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(() => { 
            video.muted = true; 
            video.play(); 
          });
          setLoading(false);
        });
      } else {
        video.src = safeUrl;
        video.play().finally(() => setLoading(false));
      }
    } else {
      video.src = safeUrl;
      video.play().finally(() => setLoading(false));
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
    <div ref={containerRef} className={`relative w-full bg-black flex items-center justify-center ${isFullscreen ? 'h-screen' : 'h-[85vh] rounded-[3rem] overflow-hidden'}`}>
      {isIframe ? (
        <iframe src={safeUrl} className="w-full h-full border-0" allow="autoplay; fullscreen" />
      ) : (
        <video ref={videoRef} className="w-full h-full object-contain" autoPlay playsInline controls />
      )}

      {loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      )}

      <div className="absolute bottom-10 right-10 z-[160] flex gap-3">
        {onPrev && <Button size="icon" onClick={onPrev} className="h-12 w-12 bg-black/40"><ChevronLeft className="h-5 w-5 text-white" /></Button>}
        <Button size="icon" onClick={toggleFullscreen} className="h-12 w-12 bg-black/40">{isFullscreen ? <Minimize className="h-5 w-5 text-white" /> : <Maximize className="h-5 w-5 text-white" />}</Button>
        {onNext && <Button size="icon" onClick={onNext} className="h-12 w-12 bg-black/40"><ChevronRight className="h-5 w-5 text-white" /></Button>}
      </div>

      <div className="absolute top-6 left-6 z-[160] bg-black/60 px-6 py-2 rounded-full border border-white/10">
         <p className="text-[10px] font-black uppercase text-primary">{title}</p>
      </div>
    </div>
  )
}
