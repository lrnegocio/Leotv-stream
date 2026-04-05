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
  const [hlsLoaded, setHlsLoaded] = React.useState(false)
  const [retryCount, setRetryCount] = React.useState(0)

  React.useEffect(() => {
    const checkHls = () => {
      if ((window as any).Hls) setHlsLoaded(true);
      else setTimeout(checkHls, 100);
    };
    checkHls();
  }, []);

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

    if (urlStr.toLowerCase().includes('<iframe')) {
      const srcMatch = urlStr.match(/src=["'](.*?)["']/i);
      if (srcMatch && srcMatch[1]) urlStr = srcMatch[1];
    }

    const lowerUrl = urlStr.toLowerCase()

    const iframeProviders = [
      'rdcanais.com', 
      'redecanais', 
      'reidoscanais', 
      'reidoscanais.ooo',
      'embed', 
      'player', 
      'streamad', 
      'voodrew', 
      'youtube.com',
      'youtu.be',
      'dailymotion.com',
      'xvideos.com'
    ];

    if (iframeProviders.some(p => lowerUrl.includes(p))) {
      let finalUrl = urlStr;
      
      if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
        const vidId = urlStr.includes('v=') ? urlStr.split('v=')[1]?.split('&')[0] : urlStr.split('youtu.be/')[1]?.split('?')[0];
        finalUrl = `https://www.youtube-nocookie.com/embed/${vidId}?autoplay=1&rel=0`;
      }

      return { processedUrl: finalUrl, type: 'iframe' };
    }

    const isM3U8 = lowerUrl.includes('.m3u8') || lowerUrl.includes('m3u8');
    const isTS = lowerUrl.includes('.ts') || lowerUrl.includes('.mpeg') || lowerUrl.includes('.mpg');
    
    if (isM3U8 || isTS || urlStr.startsWith('http://')) {
       return { processedUrl: `/api/proxy?url=${encodeURIComponent(urlStr)}`, type: isM3U8 || isTS ? 'hls' : 'video' };
    }
    
    return { processedUrl: urlStr, type: isM3U8 ? 'hls' : 'video' };
  }, [])

  const { processedUrl, type } = React.useMemo(() => sintonize(url), [url, sintonize])

  const cleanupPlayer = React.useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.stopLoad();
      hlsRef.current.detachMedia();
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
            if (!rUrl.includes('/api/proxy') && !rUrl.startsWith('data:') && !rUrl.startsWith('/')) {
               xhr.open('GET', `/api/proxy?url=${encodeURIComponent(rUrl)}`, true);
            }
          },
          autoStartLoad: true,
          retryDelay: 1000,
          enableWorker: true,
          lowLatencyMode: true
        });

        hls.loadSource(processedUrl);
        hls.attachMedia(video!);
        hlsRef.current = hls;
        
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video?.play().catch(() => { if(video) { video.muted = true; video.play().catch(() => {}); } });
          setLoading(false);
        });

        hls.on(Hls.Events.ERROR, (_: any, data: any) => {
          if (data.fatal) {
            if (retryCount < 3) {
              setRetryCount(prev => prev + 1);
              hls.startLoad();
            } else {
              setError("Sinal de transmissão indisponível no momento.");
              setLoading(false);
            }
          }
        });
      } else if (video?.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = processedUrl;
        video.play().catch(() => {});
        setLoading(false);
      }
    } else if (type === 'video') {
      if (video) {
        video.src = processedUrl;
        video.onloadeddata = () => {
          video.play().catch(() => { if(video){ video.muted = true; video.play().catch(() => {}); } });
          setLoading(false);
        };
        video.onerror = () => { setError("Falha ao carregar o arquivo de vídeo."); setLoading(false); };
      }
    } else {
      setLoading(false);
    }
  }, [processedUrl, type, hlsLoaded, cleanupPlayer, retryCount]);

  React.useEffect(() => {
    initPlayer();
    return () => cleanupPlayer();
  }, [initPlayer, cleanupPlayer]);

  return (
    <div ref={containerRef} key={id || url} className="relative aspect-video w-full bg-black overflow-hidden border border-border group shadow-2xl rounded-2xl">
      {loading && !error && (
        <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-black">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-[10px] font-black uppercase tracking-widest text-primary opacity-60">Sintonizando sinal...</p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-black/90 p-10 text-center">
          <AlertCircle className="h-10 w-10 text-destructive mb-4 opacity-50" />
          <p className="text-white text-[10px] font-bold uppercase mb-6 opacity-60">{error}</p>
          <Button onClick={() => { setRetryCount(0); initPlayer(); }} variant="outline" className="h-10 border-primary/40 text-primary hover:bg-primary hover:text-white rounded-xl px-6 font-black uppercase text-[10px]">
            <RefreshCcw className="h-4 w-4 mr-2" /> RECONECTAR SINAL
          </Button>
        </div>
      )}
      
      {type === 'iframe' ? (
        <iframe 
          key={`frame-${id || url}`}
          src={processedUrl!} 
          className="w-full h-full border-0 relative z-10" 
          allowFullScreen 
          onLoad={() => setLoading(false)}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
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