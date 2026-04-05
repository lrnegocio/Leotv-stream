
"use client"

import * as React from "react"
import { Loader2, ChevronLeft, ChevronRight, AlertCircle, RefreshCcw, Maximize, Minimize } from "lucide-react"
import { Button } from "@/components/ui/button"

interface VideoPlayerProps {
  url: string
  title: string
  id?: string
  onNext?: () => void
  onPrev?: () => void
}

export function VideoPlayer({ url, title, id, onNext, onPrev }: VideoPlayerProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const hlsRef = React.useRef<any>(null)
  const [retryCount, setRetryCount] = React.useState(0)

  React.useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const sintonize = React.useCallback((u: string) => {
    if (!u) return { processedUrl: null, type: 'unknown' }
    let urlStr = u.trim()

    // Detectar se é um iFrame bruto colado
    if (urlStr.toLowerCase().includes('<iframe')) {
      const srcMatch = urlStr.match(/src=["'](.*?)["']/i);
      if (srcMatch && srcMatch[1]) urlStr = srcMatch[1];
    }

    const lowerUrl = urlStr.toLowerCase()

    // SINTONIZADOR YOUTUBE SOBERANO (REFINADO PARA EVITAR ERRO 153)
    if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
      let ytId = "";
      const match = urlStr.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i);
      if (match && match[1]) ytId = match[1];
      
      if (ytId) {
        return { 
          processedUrl: `https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1&origin=${window.location.origin}`, 
          type: 'iframe' 
        };
      }
    }

    // SINTONIZADOR ADULTO MASTER (XVideos, BangBros, Brazzers)
    if (lowerUrl.includes('xvideos.com')) {
      // Extração de ID em links tipo /video.ID/titulo ou /videoID/titulo
      const vidMatch = urlStr.match(/video[.\/]?([a-z0-9]{7,15})/i);
      if (vidMatch && vidMatch[1]) {
        return { 
          processedUrl: `https://www.xvideos.com/embedframe/${vidMatch[1]}`, 
          type: 'iframe' 
        };
      }
    }

    // Provedores de iFrame conhecidos
    const iframeProviders = ['embed', 'player', 'voodrew', 'rdcanais', 'redecanais', 'reidoscanais', 'brazzers.com', 'bangbros.com', 'pornhub.com/embed'];
    if (iframeProviders.some(p => lowerUrl.includes(p)) && !lowerUrl.includes('.m3u8')) {
      return { processedUrl: urlStr, type: 'iframe' };
    }

    // SINTONIZADOR HLS / M3U8 / TS (TÚNEL MASTER PROXY)
    const isM3U8 = lowerUrl.includes('.m3u8') || lowerUrl.includes('m3u8');
    const isTS = lowerUrl.includes('.ts') || lowerUrl.includes('.mpeg') || lowerUrl.includes('ts=') || lowerUrl.includes('stream');
    
    if (isM3U8 || isTS) {
       return { processedUrl: `/api/proxy?url=${encodeURIComponent(urlStr)}`, type: 'hls' };
    }
    
    // Fallback para HTTP comum (Proxy para evitar Mixed Content)
    if (urlStr.startsWith('http://') && !lowerUrl.includes('localhost')) {
       return { processedUrl: `/api/proxy?url=${encodeURIComponent(urlStr)}`, type: 'video' };
    }
    
    return { processedUrl: urlStr, type: isM3U8 ? 'hls' : 'video' };
  }, [])

  const { processedUrl, type } = React.useMemo(() => sintonize(url), [url, sintonize])

  const cleanupPlayer = React.useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    const video = videoRef.current;
    if (video) {
      video.pause();
      video.src = "";
      video.load();
    }
  }, []);

  const initPlayer = React.useCallback(async () => {
    if (!processedUrl) return;
    cleanupPlayer();
    setError(null);
    setLoading(true);

    const video = videoRef.current;

    if (type === 'hls') {
      const Hls = (window as any).Hls;
      if (Hls && Hls.isSupported()) {
        const hls = new Hls({
          xhrSetup: (xhr: any, rUrl: string) => {
            if (!rUrl.includes('/api/proxy') && !rUrl.startsWith('data:') && !rUrl.startsWith('/') && !rUrl.includes(window.location.hostname)) {
               xhr.open('GET', `/api/proxy?url=${encodeURIComponent(rUrl)}`, true);
            }
          },
          autoStartLoad: true,
          retryDelay: 1000
        });

        hls.loadSource(processedUrl);
        hls.attachMedia(video!);
        hlsRef.current = hls;
        
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video?.play().catch(() => { 
            if(video) { video.muted = true; video.play().catch(() => {}); } 
          });
          setLoading(false);
        });

        hls.on(Hls.Events.ERROR, (_: any, data: any) => {
          if (data.fatal) {
            if (retryCount < 2) {
              setRetryCount(prev => prev + 1);
              hls.startLoad();
            } else {
              setError("Sinal instável ou bloqueado. Tente outro canal.");
              setLoading(false);
            }
          }
        });
      } else if (video?.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = processedUrl;
        video.addEventListener('loadedmetadata', () => { video.play().catch(() => {}); setLoading(false); });
      }
    } else if (type === 'video') {
      if (video) {
        video.src = processedUrl;
        video.onloadeddata = () => { video.play().catch(() => {}); setLoading(false); };
        video.onerror = () => { setError("Sinal de vídeo não suportado."); setLoading(false); };
      }
    } else {
      if (type !== 'iframe') setLoading(false);
    }
  }, [processedUrl, type, cleanupPlayer, retryCount]);

  React.useEffect(() => {
    initPlayer();
    return () => cleanupPlayer();
  }, [initPlayer, cleanupPlayer]);

  return (
    <div ref={containerRef} key={`${id}-${url}`} className="relative aspect-video w-full bg-black overflow-hidden border border-border group shadow-2xl rounded-2xl">
      {loading && (
        <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-black">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-[10px] font-black uppercase tracking-widest text-primary">Sintonizando Sinal Master...</p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-black/90 p-10 text-center">
          <AlertCircle className="h-10 w-10 text-destructive mb-4" />
          <p className="text-white text-[10px] font-bold uppercase mb-6 opacity-60">{error}</p>
          <Button onClick={() => { setRetryCount(0); initPlayer(); }} variant="outline" className="h-10 border-primary/40 text-primary rounded-xl px-6 font-black uppercase text-[10px]">
            <RefreshCcw className="h-4 w-4 mr-2" /> RECONECTAR
          </Button>
        </div>
      )}
      
      {type === 'iframe' ? (
        <iframe 
          key={`frame-${url}`}
          src={processedUrl!} 
          className="w-full h-full border-0 relative z-10" 
          allowFullScreen 
          onLoad={() => setLoading(false)}
          allow="autoplay; encrypted-media; fullscreen"
          referrerPolicy="no-referrer"
        />
      ) : (
        <video 
          ref={videoRef} 
          className="w-full h-full object-contain relative z-10" 
          autoPlay 
          playsInline 
          controls={true}
          crossOrigin="anonymous"
        />
      )}

      {/* Controles de Navegação */}
      <div className="absolute inset-0 z-20 flex items-center justify-between px-6 pointer-events-none transition-opacity duration-300 opacity-0 group-hover:opacity-100">
        <button 
          onClick={(e) => { e.stopPropagation(); onPrev?.(); }} 
          className="pointer-events-auto h-12 w-12 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-primary transition-all shadow-xl"
        >
          <ChevronLeft className="h-6 w-6 text-white" />
        </button>
        
        <button 
          onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }} 
          className="pointer-events-auto h-12 w-12 rounded-xl bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-primary transition-all absolute top-6 right-6"
        >
          {isFullscreen ? <Minimize className="h-5 w-5 text-white" /> : <Maximize className="h-5 w-5 text-white" />}
        </button>

        <button 
          onClick={(e) => { e.stopPropagation(); onNext?.(); }} 
          className="pointer-events-auto h-12 w-12 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-primary transition-all shadow-xl"
        >
          <ChevronRight className="h-6 w-6 text-white" />
        </button>
      </div>
    </div>
  )
}
