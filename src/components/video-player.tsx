
"use client"

import * as React from "react"
import { Loader2, ChevronLeft, ChevronRight, AlertCircle, Maximize, Minimize } from "lucide-react"
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
  const [error, setError] = React.useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const [showControls, setShowControls] = React.useState(true)
  const controlsTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)
  const hlsRef = React.useRef<any>(null)

  // Tecnologia Master: Detecta e limpa links sujos (iFrames)
  const sintonize = React.useCallback((u: string) => {
    if (!u) return { processedUrl: null, type: 'unknown' }
    let urlStr = u.trim()

    if (urlStr.toLowerCase().includes('<iframe')) {
      const srcMatch = urlStr.match(/src=["'](.*?)["']/i);
      if (srcMatch && srcMatch[1]) urlStr = srcMatch[1];
    }

    const lowerUrl = urlStr.toLowerCase()
    
    if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
      let ytId = "";
      const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
      const match = urlStr.match(regExp);
      ytId = (match && match[7] && match[7].length === 11) ? match[7] : "";
      if (ytId) return { processedUrl: `https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`, type: 'iframe' };
    }

    // Proxy para HTTP ou M3U8 (Evita Mixed Content e CORS)
    const isHLS = lowerUrl.includes('.m3u8') || lowerUrl.includes('.ts') || lowerUrl.includes('chunklist');
    const isDirect = lowerUrl.includes('.mp4') || lowerUrl.includes('.webm') || lowerUrl.includes('.mpeg');
    
    if (isHLS || isDirect) {
      const finalUrl = urlStr.startsWith('http:') ? `/api/proxy?url=${encodeURIComponent(urlStr)}` : urlStr;
      return { processedUrl: finalUrl, type: isHLS ? 'hls' : 'video' };
    }

    return { processedUrl: urlStr, type: 'iframe' };
  }, [])

  const { processedUrl, type } = React.useMemo(() => sintonize(url), [url, sintonize])

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  }

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isFullscreen) setShowControls(false);
    }, 3000);
  }

  const cleanup = React.useCallback(() => {
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
    const v = videoRef.current;
    if (v) { v.pause(); v.removeAttribute('src'); v.load(); }
  }, []);

  const init = React.useCallback(async () => {
    if (!processedUrl) return;
    cleanup();
    setError(null);
    setLoading(true);

    if (type === 'hls') {
      const Hls = (window as any).Hls;
      if (Hls && Hls.isSupported()) {
        const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
        hls.loadSource(processedUrl);
        hls.attachMedia(videoRef.current!);
        hlsRef.current = hls;
        hls.on(Hls.Events.MANIFEST_PARSED, () => { 
          videoRef.current?.play().catch(() => { if (videoRef.current) videoRef.current.muted = true; videoRef.current?.play(); }); 
          setLoading(false); 
        });
        hls.on(Hls.Events.ERROR, (_: any, data: any) => { if(data.fatal) { hls.recoverMediaError(); } });
      } else if (videoRef.current?.canPlayType('application/vnd.apple.mpegurl')) {
        videoRef.current.src = processedUrl;
        setLoading(false);
      }
    } else if (type === 'video') {
      if (videoRef.current) { 
        videoRef.current.src = processedUrl; 
        videoRef.current.onloadeddata = () => { videoRef.current?.play().catch(() => {}); setLoading(false); }; 
        videoRef.current.onerror = () => { setError("Erro no arquivo de vídeo."); setLoading(false); };
      }
    }
  }, [processedUrl, type, cleanup]);

  React.useEffect(() => { init(); return () => cleanup(); }, [init, cleanup]);

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onTouchStart={handleMouseMove}
      className={`relative w-full bg-black overflow-hidden group shadow-2xl ${isFullscreen ? 'h-screen' : 'aspect-video rounded-2xl border border-white/5'}`}
    >
      {loading && (
        <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-black">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-2" />
          <p className="text-[8px] font-black uppercase tracking-widest text-primary">Sintonizando...</p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-black/90 p-10">
          <AlertCircle className="h-10 w-10 text-destructive mb-4" />
          <Button onClick={init} variant="outline" className="h-10 border-primary/40 text-primary uppercase font-black text-[10px]">RECONECTAR</Button>
        </div>
      )}
      
      {type === 'iframe' ? (
        <iframe src={processedUrl!} className="w-full h-full border-0 relative z-10" allowFullScreen allow="autoplay; encrypted-media; fullscreen" onLoad={() => setLoading(false)} />
      ) : (
        <video ref={videoRef} className="w-full h-full object-contain relative z-10" autoPlay playsInline controls={!isFullscreen} crossOrigin="anonymous" />
      )}

      {/* SETAS MASTER - SEMPRE VISÍVEIS SE MOUSE MEXER */}
      {(onNext || onPrev) && (
        <div className={`absolute inset-0 z-50 flex items-center justify-between px-10 pointer-events-none transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          <button onClick={onPrev} className="pointer-events-auto h-16 w-16 rounded-full bg-black/40 backdrop-blur-xl flex items-center justify-center border border-white/10 hover:bg-primary hover:scale-110 transition-all shadow-2xl">
            <ChevronLeft className="h-8 w-8 text-white" />
          </button>
          <button onClick={onNext} className="pointer-events-auto h-16 w-16 rounded-full bg-black/40 backdrop-blur-xl flex items-center justify-center border border-white/10 hover:bg-primary hover:scale-110 transition-all shadow-2xl">
            <ChevronRight className="h-8 w-8 text-white" />
          </button>
        </div>
      )}

      {/* BOTÃO FULLSCREEN CUSTOM */}
      <div className={`absolute bottom-6 right-6 z-50 transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <button onClick={toggleFullscreen} className="h-12 w-12 rounded-xl bg-black/40 backdrop-blur-xl flex items-center justify-center border border-white/10 hover:bg-white/10 transition-all">
          {isFullscreen ? <Minimize className="h-5 w-5 text-white" /> : <Maximize className="h-5 w-5 text-white" />}
        </button>
      </div>
    </div>
  )
}
