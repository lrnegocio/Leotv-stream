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

  const sintonize = React.useCallback((u: string) => {
    if (!u) return { processedUrl: null, type: 'unknown' }
    let urlStr = u.trim()

    // CONVERSÃO SOBERANA: Troca .ts por .m3u8 para ativar o manifest automático do fornecedor
    if (urlStr.toLowerCase().endsWith('.ts')) {
      urlStr = urlStr.substring(0, urlStr.length - 3) + '.m3u8';
    } else if (urlStr.toLowerCase().includes('.ts?')) {
      urlStr = urlStr.replace(/\.ts\?/i, '.m3u8?');
    }

    const lowerUrl = urlStr.toLowerCase();
    
    if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
      let ytId = "";
      const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
      const match = urlStr.match(regExp);
      ytId = (match && match[7] && match[7].length === 11) ? match[7] : "";
      if (ytId) return { processedUrl: `https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`, type: 'iframe' };
    }

    const isHLS = lowerUrl.includes('.m3u8') || lowerUrl.includes('chunklist');
    
    // Se for link seguro (https) e for HLS, carrega direto pra economizar banda
    if (urlStr.startsWith('https:') && isHLS) {
      return { processedUrl: urlStr, type: 'hls' };
    }

    // Caso contrário, usa o proxy master
    return { 
      processedUrl: `/api/proxy?url=${encodeURIComponent(urlStr)}`, 
      type: isHLS ? 'hls' : 'video' 
    };
  }, [])

  const { processedUrl, type } = React.useMemo(() => sintonize(url), [url, sintonize])

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen();
    }
  }

  React.useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (document.fullscreenElement) setShowControls(false);
    }, 3000);
  }

  const cleanup = React.useCallback(() => {
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
    const v = videoRef.current;
    if (v) { v.pause(); v.removeAttribute('src'); v.load(); }
  }, []);

  const init = React.useCallback(async () => {
    if (!processedUrl || type === 'iframe') {
      if (type === 'iframe') setLoading(false);
      return;
    }
    cleanup();
    setError(null);
    setLoading(true);

    if (type === 'hls') {
      const Hls = (window as any).Hls;
      if (Hls && Hls.isSupported()) {
        const hls = new Hls({ 
          enableWorker: true, 
          lowLatencyMode: true,
          xhrSetup: (xhr: any) => { 
            xhr.withCredentials = false;
          },
          manifestLoadingMaxRetry: 4,
          levelLoadingMaxRetry: 4
        });
        hls.loadSource(processedUrl);
        hls.attachMedia(videoRef.current!);
        hlsRef.current = hls;
        
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          videoRef.current?.play().catch(() => { 
            if (videoRef.current) videoRef.current.muted = true; 
            videoRef.current?.play(); 
          });
          setLoading(false);
        });

        hls.on(Hls.Events.ERROR, (_: any, data: any) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                hls.recoverMediaError();
                break;
              default:
                setError("Sinal instável. Reconectando...");
                setTimeout(init, 2000);
                break;
            }
          }
        });
      } else if (videoRef.current?.canPlayType('application/vnd.apple.mpegurl')) {
        videoRef.current.src = processedUrl;
        setLoading(false);
      }
    } else {
      if (videoRef.current) { 
        videoRef.current.src = processedUrl; 
        videoRef.current.onloadeddata = () => { videoRef.current?.play().catch(() => {}); setLoading(false); };
        videoRef.current.onerror = () => { 
          setError("Sinal não suportado."); 
          setLoading(false); 
        };
      }
    }
  }, [processedUrl, type, cleanup]);

  React.useEffect(() => { init(); return () => cleanup(); }, [init, cleanup]);

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className={`relative w-full bg-black overflow-hidden flex items-center justify-center transition-all ${isFullscreen ? 'h-screen w-screen' : 'max-h-[85vh] aspect-video rounded-3xl border border-white/5 shadow-2xl'}`}
    >
      {loading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-[10px] font-black uppercase text-primary animate-pulse tracking-widest">Sintonizando Sinal Master Léo TV...</p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/95 text-center p-6">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <p className="text-white font-bold uppercase text-xs mb-4">{error}</p>
          <Button onClick={init} variant="outline" className="border-primary/40 text-primary uppercase font-black text-[10px]">TENTAR RECONEXÃO</Button>
        </div>
      )}
      
      {type === 'iframe' ? (
        <iframe 
          src={processedUrl!} 
          className="w-full h-full border-0 z-10" 
          allowFullScreen 
          allow="autoplay; encrypted-media; fullscreen" 
          onLoad={() => setLoading(false)} 
        />
      ) : (
        <video 
          ref={videoRef} 
          className="w-full h-full object-contain z-10" 
          autoPlay 
          playsInline 
          controls={!isFullscreen} 
          crossOrigin="anonymous" 
        />
      )}

      {(onNext || onPrev) && !error && (
        <div className={`absolute inset-0 z-40 flex items-center justify-between px-6 pointer-events-none transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          <button onClick={(e) => { e.stopPropagation(); onPrev?.(); }} className="pointer-events-auto h-14 w-14 rounded-full bg-black/40 backdrop-blur-xl flex items-center justify-center border border-white/10 hover:bg-primary transition-all">
            <ChevronLeft className="h-7 w-7 text-white" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onNext?.(); }} className="pointer-events-auto h-14 w-14 rounded-full bg-black/40 backdrop-blur-xl flex items-center justify-center border border-white/10 hover:bg-primary transition-all">
            <ChevronRight className="h-7 w-7 text-white" />
          </button>
        </div>
      )}

      <div className={`absolute bottom-6 right-6 z-40 transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <button onClick={toggleFullscreen} className="h-10 w-10 rounded-xl bg-black/40 backdrop-blur-xl flex items-center justify-center border border-white/10 hover:bg-white/10 transition-all">
          {isFullscreen ? <Minimize className="h-5 w-5 text-white" /> : <Maximize className="h-5 w-5 text-white" />}
        </button>
      </div>

      {isFullscreen && showControls && (
        <div className="absolute top-8 left-8 z-40 bg-black/40 backdrop-blur-xl px-6 py-2 rounded-2xl border border-white/10">
          <p className="text-xs font-black uppercase italic text-white tracking-widest">{title}</p>
        </div>
      )}
    </div>
  )
}