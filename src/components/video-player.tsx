
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
  const hlsRef = React.useRef<any>(null)
  const [hlsLoaded, setHlsLoaded] = React.useState(false)
  const [retryCount, setRetryCount] = React.useState(0)

  React.useEffect(() => {
    const checkHls = () => {
      if ((window as any).Hls) setHlsLoaded(true);
      else setTimeout(checkHls, 200);
    };
    checkHls();
  }, []);

  const sintonize = React.useCallback((u: string) => {
    if (!u) return { processedUrl: null, type: 'unknown' }
    const urlStr = u.trim()
    const lowerUrl = urlStr.toLowerCase()

    // SINTONIZADOR SNIPER v34
    if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
      const vidId = urlStr.includes('v=') ? urlStr.split('v=')[1]?.split('&')[0] : urlStr.split('youtu.be/')[1]?.split('?')[0];
      return { processedUrl: `https://www.youtube-nocookie.com/embed/${vidId}?autoplay=1&rel=0`, type: 'iframe' }
    }

    if (lowerUrl.includes('dailymotion.com')) {
      const vidId = urlStr.split('/video/')[1]?.split('?')[0];
      return { processedUrl: `https://www.dailymotion.com/embed/video/${vidId}?autoplay=1`, type: 'iframe' }
    }

    if (lowerUrl.includes('pornhub.com')) {
      const viewKeyMatch = urlStr.match(/viewkey=([a-z0-9]+)/i);
      const viewKey = viewKeyMatch ? viewKeyMatch[1] : null;
      if (viewKey) return { processedUrl: `https://www.pornhub.com/embed/${viewKey}`, type: 'iframe' };
    }

    // XVideos Sniper v34 (Suporte a IDs complexos como video.kikftvd...)
    if (lowerUrl.includes('xvideos.com')) {
      const vidIdMatch = urlStr.match(/video\.?([a-z0-9]+)/i) || urlStr.match(/\/video([0-9]+)/);
      const vidId = vidIdMatch ? vidIdMatch[1] : null;
      if (vidId) return { processedUrl: `https://www.xvideos.com/embedframe/${vidId}`, type: 'iframe' };
    }

    // SINTONIZADOR DE STREAMING XUI STYLE (PROXY OBRIGATÓRIO PARA .TS, .M3U8 E HTTP)
    const isM3U8 = lowerUrl.includes('.m3u8') || lowerUrl.includes('mpegurl') || lowerUrl.includes('blinder.space');
    const isTS = lowerUrl.includes('.ts') || lowerUrl.includes('stream');
    const isPHP = lowerUrl.includes('.php') || lowerUrl.includes('canal=') || lowerUrl.includes('webplayer.one');
    const isHTTP = urlStr.startsWith('http://');
    
    const proxied = `/api/proxy?url=${encodeURIComponent(urlStr)}`;

    if (isPHP) return { processedUrl: proxied, type: 'iframe' }; 
    if (isM3U8 || isTS || isHTTP) return { processedUrl: proxied, type: 'hls' };
    
    return { processedUrl: urlStr, type: 'video' };
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
      video.removeAttribute('src');
      video.load();
    }
  }, []);

  const initPlayer = React.useCallback(async () => {
    const video = videoRef.current;
    if (!processedUrl) return;
    if (type !== 'iframe' && !video) return;
    if (type === 'hls' && !hlsLoaded) return;

    cleanupPlayer();
    setError(null);
    setLoading(true);

    if (type === 'hls') {
      const Hls = (window as any).Hls;
      if (Hls && Hls.isSupported()) {
        const hls = new Hls({
          xhrSetup: (xhr: any, rUrl: string) => {
            if (!rUrl.includes('/api/proxy')) xhr.open('GET', `/api/proxy?url=${encodeURIComponent(rUrl)}`, true);
          },
          autoStartLoad: true,
          retryDelay: 1500,
          onErrorFatalRetry: true,
          enableWorker: true
        });

        hls.loadSource(processedUrl);
        hls.attachMedia(video!);
        hlsRef.current = hls;
        
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          video?.play().catch(() => { if(video) { video.muted = true; video.play().catch(() => {}); } });
          setLoading(false);
        });

        hls.on(Hls.Events.ERROR, (_: any, data: any) => {
          if (data.fatal && retryCount < 5) {
            setRetryCount(prev => prev + 1);
            hls.startLoad();
          } else if (data.fatal) {
            setError("Sinal instável. Tente re-sincronizar.");
            setLoading(false);
          }
        });
      } else if (video?.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = processedUrl;
        setLoading(false);
      }
    } else if (type === 'video') {
      if (video) {
        video.src = processedUrl;
        video.onloadeddata = () => {
          video.play().catch(() => { if(video){ video.muted = true; video.play().catch(() => {}); } });
          setLoading(false);
        };
        video.onerror = () => { setError("Falha ao carregar sinal de vídeo."); setLoading(false); };
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
    <div key={processedUrl} className="relative aspect-video w-full bg-black overflow-hidden border border-white/5 group shadow-2xl rounded-lg">
      {loading && !error && (
        <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-black">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary opacity-60">Sintonizando sinal master...</p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-black/95 p-10 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4 opacity-50" />
          <p className="text-white text-[10px] font-black uppercase mb-6 opacity-60">{error}</p>
          <Button onClick={() => { setRetryCount(0); initPlayer(); }} variant="outline" className="h-10 border-primary/20 text-primary hover:bg-primary hover:text-white rounded-md px-6 font-black uppercase text-[9px]">
            <RefreshCcw className="h-3 w-3 mr-2" /> RE-SINCRONIZAR SINAL
          </Button>
        </div>
      )}
      
      {type === 'iframe' ? (
        <iframe 
          key={processedUrl}
          src={processedUrl!} 
          className="w-full h-full border-0 relative z-10" 
          allowFullScreen 
          onLoad={() => setLoading(false)}
          sandbox="allow-scripts allow-same-origin allow-forms allow-presentation allow-popups-to-escape-sandbox"
        />
      ) : (
        <video 
          key={processedUrl}
          ref={videoRef} 
          className="w-full h-full object-contain relative z-10" 
          autoPlay 
          playsInline 
          controls={true}
          crossOrigin="anonymous"
        />
      )}

      <div className={`absolute inset-0 z-20 flex items-center justify-between px-4 pointer-events-none transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <button onClick={(e) => { e.stopPropagation(); onPrev?.(); }} className="pointer-events-auto h-12 w-12 rounded-full bg-black/60 backdrop-blur-xl flex items-center justify-center border border-white/10 hover:bg-primary transition-all group/btn opacity-0 group-hover:opacity-100">
          <ChevronLeft className="h-6 w-6 text-white group-hover/btn:scale-110" />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onNext?.(); }} className="pointer-events-auto h-12 w-12 rounded-full bg-black/60 backdrop-blur-xl flex items-center justify-center border border-white/10 hover:bg-primary transition-all group/btn opacity-0 group-hover:opacity-100">
          <ChevronRight className="h-6 w-6 text-white group-hover/btn:scale-110" />
        </button>
      </div>
    </div>
  )
}
