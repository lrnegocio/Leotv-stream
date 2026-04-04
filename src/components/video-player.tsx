
"use client"

import * as React from "react"
import { Loader2, ChevronLeft, ChevronRight, AlertCircle, RefreshCcw } from "lucide-react"
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
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [showControls, setShowControls] = React.useState(true)
  const controlsTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)
  const hlsRef = React.useRef<any>(null)
  const [hlsLoaded, setHlsLoaded] = React.useState(false)

  // MONITOR DE MOTOR HLS
  React.useEffect(() => {
    const checkHls = () => {
      if ((window as any).Hls) {
        setHlsLoaded(true);
      } else {
        setTimeout(checkHls, 200);
      }
    };
    checkHls();
  }, []);

  const sintonize = React.useCallback((u: string) => {
    if (!u) return { processedUrl: null, type: 'unknown' }
    const urlStr = u.trim()

    // CONVERSOR EMBED MASTER (PORNHUB/XVIDEOS/DAILYMOTION)
    if (urlStr.includes('youtube.com') || urlStr.includes('youtu.be')) {
      const vidId = urlStr.includes('v=') ? urlStr.split('v=')[1]?.split('&')[0] : urlStr.split('youtu.be/')[1]?.split('?')[0];
      return { processedUrl: `https://www.youtube-nocookie.com/embed/${vidId}?autoplay=1&rel=0`, type: 'iframe' }
    }

    if (urlStr.includes('dailymotion.com')) {
      const vidId = urlStr.split('/video/')[1]?.split('?')[0];
      return { processedUrl: `https://www.dailymotion.com/embed/video/${vidId}?autoplay=1`, type: 'iframe' }
    }

    if (urlStr.includes('pornhub.com')) {
      const viewKeyMatch = urlStr.match(/viewkey=([a-z0-9]+)/i);
      const viewKey = viewKeyMatch ? viewKeyMatch[1] : null;
      if (viewKey) return { processedUrl: `https://www.pornhub.com/embed/${viewKey}`, type: 'iframe' };
    }

    if (urlStr.includes('xvideos.com')) {
      const vidIdMatch = urlStr.match(/video\.?([a-z0-9]+)/i) || urlStr.match(/\/video([0-9]+)/);
      const vidId = vidIdMatch ? vidIdMatch[1] : null;
      if (vidId) return { processedUrl: `https://www.xvideos.com/embedframe/${vidId}`, type: 'iframe' };
    }

    const isM3U8 = urlStr.toLowerCase().includes('.m3u8');
    const isPHP = urlStr.toLowerCase().includes('.php');

    // BLINDAGEM MESTRE: Força proxy para links HTTP, m3u8 ou blinder
    const needsProxy = urlStr.startsWith('http://') || urlStr.includes('blinder.space') || isM3U8 || isPHP;
    const proxied = `/api/proxy?url=${encodeURIComponent(urlStr)}`;

    if (isPHP) return { processedUrl: proxied, type: 'iframe' };
    if (isM3U8) return { processedUrl: proxied, type: 'hls' };
    
    return { processedUrl: needsProxy ? proxied : urlStr, type: 'video' };
  }, [])

  const { processedUrl, type } = React.useMemo(() => sintonize(url), [url, sintonize])

  const handleUserInteraction = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 4000);
  };

  const cleanupPlayer = () => {
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.removeAttribute('src');
      videoRef.current.load();
    }
  };

  const initPlayer = React.useCallback(async () => {
    const video = videoRef.current;
    if (!processedUrl || !video) return;
    if (type === 'hls' && !hlsLoaded) return;

    cleanupPlayer();
    setError(null);
    setLoading(true);

    if (type === 'hls') {
      const Hls = (window as any).Hls;
      if (Hls && Hls.isSupported()) {
        const hls = new Hls({
          xhrSetup: (xhr: any, rUrl: string) => {
            // Garante que cada fragmento (.ts) também passe pelo túnel invisível
            if (!rUrl.includes('/api/proxy')) {
              xhr.open('GET', `/api/proxy?url=${encodeURIComponent(rUrl)}`, true);
            }
          },
          autoStartLoad: true,
          retryDelay: 1000,
          onErrorFatalRetry: true,
          enableWorker: true
        });

        hls.loadSource(processedUrl);
        hls.attachMedia(video);
        hlsRef.current = hls;
        
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(() => { video.muted = true; video.play(); });
          setLoading(false);
        });

        hls.on(Hls.Events.ERROR, (_: any, data: any) => {
          if (data.fatal) {
            if (data.type === Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
            else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
            else { cleanupPlayer(); setError("Erro Fatal no Sinal. Tente novamente."); }
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = processedUrl;
        video.play().catch(() => {});
        setLoading(false);
      } else {
        setError("Navegador não suporta sinal m3u8.");
        setLoading(false);
      }
    } else if (type === 'video') {
      video.src = processedUrl;
      video.play().catch(() => { video.muted = true; video.play(); }).finally(() => setLoading(false));
    } else {
      setLoading(type === 'iframe');
    }
  }, [processedUrl, type, hlsLoaded]);

  React.useEffect(() => {
    initPlayer();
    return () => cleanupPlayer();
  }, [initPlayer]);

  return (
    <div onMouseMove={handleUserInteraction} onTouchStart={handleUserInteraction} className="relative aspect-video w-full bg-black rounded-[2.5rem] overflow-hidden border border-white/5 group shadow-2xl">
      {loading && !error && (
        <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-black">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Sintonizando Sinal Master...</p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-black/90 p-10 text-center">
          <AlertCircle className="h-16 w-16 text-destructive mb-6" />
          <p className="text-white text-xs font-black uppercase mb-6">{error}</p>
          <Button onClick={() => initPlayer()} variant="outline" className="h-12 border-primary text-primary hover:bg-primary hover:text-white rounded-xl px-8 font-black uppercase text-[10px]">
            <RefreshCcw className="h-4 w-4 mr-2" /> Tentar Re-Sincronizar
          </Button>
        </div>
      )}
      
      {type === 'iframe' ? (
        <iframe 
          key={processedUrl}
          src={processedUrl!} 
          className="w-full h-full border-0 relative z-10" 
          allowFullScreen 
          allow="autoplay; encrypted-media; fullscreen" 
          onLoad={() => setLoading(false)}
          sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
        />
      ) : (
        <video 
          key={processedUrl} // XEQUE-MATE NO NOTSUPPORTEDERROR: Força reset do player do zero
          ref={videoRef} 
          className="w-full h-full object-contain relative z-10" 
          autoPlay 
          playsInline 
          controls={true}
          crossOrigin="anonymous"
          onLoadedData={() => setLoading(false)}
        />
      )}

      <div className={`absolute inset-0 z-20 flex items-center justify-between px-6 pointer-events-none transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <button onClick={(e) => { e.stopPropagation(); onPrev?.(); }} className="pointer-events-auto h-14 w-14 rounded-full bg-black/40 backdrop-blur-xl flex items-center justify-center border border-white/10 hover:bg-primary transition-all group/btn opacity-0 group-hover:opacity-100 shadow-2xl">
          <ChevronLeft className="h-8 w-8 text-white group-hover/btn:scale-110" />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onNext?.(); }} className="pointer-events-auto h-14 w-14 rounded-full bg-black/40 backdrop-blur-xl flex items-center justify-center border border-white/10 hover:bg-primary transition-all group/btn opacity-0 group-hover:opacity-100 shadow-2xl">
          <ChevronRight className="h-8 w-8 text-white group-hover/btn:scale-110" />
        </button>
      </div>
    </div>
  )
}
