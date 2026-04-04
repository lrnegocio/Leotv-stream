
"use client"

import * as React from "react"
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react"

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
  const [showControls, setShowControls] = React.useState(true)
  const controlsTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  const sintonize = React.useCallback((u: string) => {
    if (!u) return { processedUrl: null, type: 'unknown' }
    const urlStr = u.trim()

    if (urlStr.includes('youtube.com') || urlStr.includes('youtu.be')) {
      const vidId = urlStr.includes('v=') ? urlStr.split('v=')[1]?.split('&')[0] : urlStr.split('youtu.be/')[1]?.split('?')[0];
      return { processedUrl: `https://www.youtube-nocookie.com/embed/${vidId}?autoplay=1&rel=0`, type: 'iframe' }
    }

    if (urlStr.includes('dailymotion.com')) {
      const vidId = urlStr.split('/video/')[1]?.split('?')[0] || urlStr.split('/embed/video/')[1]?.split('?')[0];
      return { processedUrl: `https://www.dailymotion.com/embed/video/${vidId}?autoplay=1`, type: 'iframe' }
    }

    const needsProxy = urlStr.startsWith('http://') || 
                       urlStr.includes('.m3u8') || 
                       urlStr.includes('.mp4') || 
                       urlStr.includes('.php') || 
                       urlStr.includes('redecanais') || 
                       urlStr.includes('blinder') || 
                       urlStr.includes('contfree') ||
                       urlStr.includes('wurl.tv');

    if (needsProxy) {
      const proxied = `/api/proxy?url=${encodeURIComponent(urlStr)}`;
      if (urlStr.includes('.php') || urlStr.includes('player3')) return { processedUrl: proxied, type: 'iframe' };
      return { processedUrl: proxied, type: urlStr.includes('.m3u8') ? 'hls' : 'video' };
    }

    return { processedUrl: urlStr, type: 'iframe' }
  }, [])

  const { processedUrl, type } = React.useMemo(() => sintonize(url), [url, sintonize])

  const handleUserInteraction = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 4000);
  };

  React.useEffect(() => {
    // REINICIALIZAÇÃO MASTER: Limpa o player antes de trocar de sinal
    const video = videoRef.current;
    if (video) {
      video.pause();
      video.removeAttribute('src');
      video.load();
    }

    if (!processedUrl || type === 'iframe') { 
      setLoading(type === 'iframe'); 
      return; 
    }

    if (!video) return;

    let hls: any = null;
    const init = async () => {
      setLoading(true);
      if (type === 'hls' && (window as any).Hls) {
        if ((window as any).Hls.isSupported()) {
          hls = new (window as any).Hls({
            xhrSetup: (xhr: any, rUrl: string) => {
              if (!rUrl.includes('/api/proxy')) {
                const proxyUrl = `/api/proxy?url=${encodeURIComponent(rUrl)}`;
                xhr.open('GET', proxyUrl, true);
              }
            },
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 90,
            maxBufferLength: 30,
            autoStartLoad: true
          });
          hls.loadSource(processedUrl);
          hls.attachMedia(video);
          hls.on((window as any).Hls.Events.MANIFEST_PARSED, () => {
            video.play().catch(() => video.muted = true);
            setLoading(false);
          });
          hls.on((window as any).Hls.Events.ERROR, (event: any, data: any) => {
            if (data.fatal) {
              switch (data.type) {
                case (window as any).Hls.ErrorTypes.NETWORK_ERROR: hls.startLoad(); break;
                case (window as any).Hls.ErrorTypes.MEDIA_ERROR: hls.recoverMediaError(); break;
                default: hls.destroy(); setLoading(false); break;
              }
            }
          });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = processedUrl;
          video.play().catch(() => {});
          setLoading(false);
        }
      } else if (type === 'video') {
        video.src = processedUrl!;
        video.load();
        video.play().then(() => setLoading(false)).catch(() => {
          video.muted = true;
          video.play().finally(() => setLoading(false));
        });
      }
    };
    
    // Pequeno delay para garantir que o DOM limpou o sinal antigo
    const timer = setTimeout(init, 100);
    return () => { 
      clearTimeout(timer);
      if (hls) hls.destroy(); 
      if (video) { video.pause(); video.src = ""; video.load(); } 
    };
  }, [processedUrl, type]);

  return (
    <div onMouseMove={handleUserInteraction} onTouchStart={handleUserInteraction} className="relative aspect-video w-full bg-black rounded-[2.5rem] overflow-hidden border border-white/5 group shadow-2xl">
      {loading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Sintonizando Canal Master...</p>
        </div>
      )}
      
      {type === 'iframe' ? (
        <iframe 
          key={processedUrl}
          src={processedUrl!} 
          className="w-full h-full border-0" 
          allowFullScreen 
          allow="autoplay; encrypted-media; fullscreen" 
          onLoad={() => setLoading(false)}
          sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
        />
      ) : (
        <video 
          ref={videoRef} 
          className="w-full h-full object-contain" 
          autoPlay 
          playsInline 
          controls={true} 
          onLoadedData={() => setLoading(false)}
        />
      )}

      <div className={`absolute inset-0 flex items-center justify-between px-6 pointer-events-none transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <button onClick={(e) => { e.stopPropagation(); onPrev?.(); }} className="pointer-events-auto h-14 w-14 rounded-full bg-black/40 backdrop-blur-xl flex items-center justify-center border border-white/10 hover:bg-primary transition-all group/btn opacity-0 group-hover:opacity-100">
          <ChevronLeft className="h-8 w-8 text-white group-hover/btn:scale-110" />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onNext?.(); }} className="pointer-events-auto h-14 w-14 rounded-full bg-black/40 backdrop-blur-xl flex items-center justify-center border border-white/10 hover:bg-primary transition-all group/btn opacity-0 group-hover:opacity-100">
          <ChevronRight className="h-8 w-8 text-white group-hover/btn:scale-110" />
        </button>
      </div>
    </div>
  )
}
