
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
  const retryCountRef = React.useRef(0)

  const sintonize = React.useCallback((u: string) => {
    if (!u) return { processedUrl: null, type: 'unknown' }
    const urlStr = u.trim()

    // 1. FILTRO DE PLAYERS OFICIAIS (DIRETO)
    if (urlStr.includes('youtube.com') || urlStr.includes('youtu.be')) {
      const vidId = urlStr.includes('v=') ? urlStr.split('v=')[1]?.split('&')[0] : urlStr.split('youtu.be/')[1]?.split('?')[0];
      return { processedUrl: `https://www.youtube-nocookie.com/embed/${vidId}?autoplay=1&rel=0`, type: 'iframe' }
    }

    if (urlStr.includes('dailymotion.com')) {
      const vidId = urlStr.split('/video/')[1]?.split('?')[0] || urlStr.split('/embed/video/')[1]?.split('?')[0];
      return { processedUrl: `https://www.dailymotion.com/embed/video/${vidId}?autoplay=1`, type: 'iframe' }
    }

    // 2. FILTRO DE TÚNEL MASTER (BYPASS CORS & CLOUDFLARE)
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
      // Se for um player em PHP (como RedeCanais), abre como iframe através do proxy
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

  const initPlayer = React.useCallback(async () => {
    const video = videoRef.current;
    if (!processedUrl || type === 'iframe' || !video) {
      setLoading(type === 'iframe');
      return;
    }

    setError(null);
    setLoading(true);
    
    let hls: any = null;

    if (type === 'hls' && (window as any).Hls) {
      if ((window as any).Hls.isSupported()) {
        hls = new (window as any).Hls({
          xhrSetup: (xhr: any, rUrl: string) => {
            // INTERCEPTOR MESTRE: Força cada micro-pedaço do vídeo a passar pela blindagem
            if (!rUrl.includes('/api/proxy')) {
              xhr.open('GET', `/api/proxy?url=${encodeURIComponent(rUrl)}`, true);
            }
          },
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90,
          maxBufferLength: 30,
          autoStartLoad: true,
          retryDelay: 1000,
          onErrorFatalRetry: true
        });

        hls.loadSource(processedUrl);
        hls.attachMedia(video);
        
        hls.on((window as any).Hls.Events.MANIFEST_PARSED, () => {
          video.play().catch(() => { video.muted = true; video.play().catch(() => {}); });
          setLoading(false);
          retryCountRef.current = 0;
        });

        hls.on((window as any).Hls.Events.ERROR, (_: any, data: any) => {
          if (data.fatal) {
            console.error("Erro HLS Fatal:", data.type);
            if (retryCountRef.current < 3) {
              retryCountRef.current++;
              hls.startLoad();
            } else {
              setError("Sinal instável. Tente novamente em instantes.");
              setLoading(false);
            }
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Suporte nativo para Safari/iOS
        video.src = processedUrl;
        video.play().catch(() => {});
        setLoading(false);
      }
    } else if (type === 'video') {
      video.src = processedUrl;
      video.load();
      video.play()
        .then(() => { setLoading(false); retryCountRef.current = 0; })
        .catch(() => {
          video.muted = true;
          video.play().finally(() => setLoading(false));
        });
    }

    return () => {
      if (hls) hls.destroy();
      if (video) {
        video.pause();
        video.src = "";
        video.load();
      }
    };
  }, [processedUrl, type]);

  React.useEffect(() => {
    const cleanup = initPlayer();
    return () => { cleanup.then(cb => cb?.()); };
  }, [initPlayer]);

  return (
    <div onMouseMove={handleUserInteraction} onTouchStart={handleUserInteraction} className="relative aspect-video w-full bg-black rounded-[2.5rem] overflow-hidden border border-white/5 group shadow-2xl">
      {loading && !error && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Sintonizando Canal Master...</p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/90 p-10 text-center">
          <AlertCircle className="h-16 w-16 text-destructive mb-6" />
          <h3 className="text-xl font-black uppercase italic text-white mb-2">Falha na Sintonização</h3>
          <p className="text-[10px] font-bold uppercase opacity-60 mb-8 max-w-xs">{error}</p>
          <Button onClick={() => initPlayer()} variant="outline" className="h-12 border-primary text-primary hover:bg-primary hover:text-white rounded-xl px-8 font-black uppercase text-[10px]">
            <RefreshCcw className="h-4 w-4 mr-2" /> Tentar Recalibrar
          </Button>
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
          // Sandbox de Elite: Permite o vídeo rodar mas MATA propagandas e pop-ups
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
          onError={() => {
            if (!loading) setError("O formato deste vídeo não é suportado pelo seu dispositivo.");
          }}
        />
      )}

      {/* CONTROLES LATERAIS (PRÓXIMO / ANTERIOR) */}
      <div className={`absolute inset-0 flex items-center justify-between px-6 pointer-events-none transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <button onClick={(e) => { e.stopPropagation(); onPrev?.(); }} className="pointer-events-auto h-14 w-14 rounded-full bg-black/40 backdrop-blur-xl flex items-center justify-center border border-white/10 hover:bg-primary transition-all group/btn opacity-0 group-hover:opacity-100 shadow-2xl">
          <ChevronLeft className="h-8 w-8 text-white group-hover/btn:scale-110" />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onNext?.(); }} className="pointer-events-auto h-14 w-14 rounded-full bg-black/40 backdrop-blur-xl flex items-center justify-center border border-white/10 hover:bg-primary transition-all group/btn opacity-0 group-hover:opacity-100 shadow-2xl">
          <ChevronRight className="h-8 w-8 text-white group-hover/btn:scale-110" />
        </button>
      </div>

      {/* TÍTULO DO SINAL */}
      <div className={`absolute top-0 left-0 right-0 p-8 bg-gradient-to-b from-black/80 to-transparent pointer-events-none transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary italic">Sintonizado: {title}</h2>
      </div>
    </div>
  )
}
