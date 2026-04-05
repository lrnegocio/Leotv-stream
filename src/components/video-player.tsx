
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

/**
 * SINTONIZADOR SNIPER v54.0 - MOTOR DE IGNIÇÃO UNIFICADO
 * Processamento agressivo para garantir que o link funcione no PWA.
 */
export function VideoPlayer({ url, title, id, onNext, onPrev }: VideoPlayerProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
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

  const sintonize = React.useCallback((u: string) => {
    if (!u) return { processedUrl: null, type: 'unknown' }
    const urlStr = u.trim()
    const lowerUrl = urlStr.toLowerCase()

    // EXTRATOR XVIDEOS ATÔMICO (Suporte a múltiplos padrões)
    if (lowerUrl.includes('xvideos.com') || lowerUrl.includes('video.')) {
      const vidIdMatch = urlStr.match(/video\.?([a-z0-9]+)/i) || urlStr.match(/\/video([0-9]+)/);
      if (vidIdMatch) {
        return { processedUrl: `https://www.xvideos.com/embedframe/${vidIdMatch[1]}`, type: 'iframe' };
      }
    }

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
      if (viewKeyMatch) return { processedUrl: `https://www.pornhub.com/embed/${viewKeyMatch[1]}`, type: 'iframe' };
    }

    // FORMATOS PROFISSIONAIS E BYPASS DE CORS
    const isBlinder = lowerUrl.includes('blinder.space');
    const isRedeCanais = lowerUrl.includes('redecanais') || lowerUrl.includes('ch.php');
    const isTS = lowerUrl.endsWith('.ts') || lowerUrl.includes('.ts?') || lowerUrl.includes('hls-') || lowerUrl.includes('.mpeg') || lowerUrl.includes('.mpg');
    const isM3U8 = lowerUrl.includes('.m3u8') || lowerUrl.includes('m3u8');
    const isMP4 = lowerUrl.includes('.mp4') || lowerUrl.endsWith('.mp4');
    
    // Força o uso do Proxy Master para maior estabilidade no PWA
    const proxied = `/api/proxy?url=${encodeURIComponent(urlStr)}`;

    // Qualquer link HTTP ou de origem restrita deve passar pelo Proxy
    if (isBlinder || isRedeCanais || isTS || isM3U8 || urlStr.startsWith('http://')) {
       if (isM3U8 || isTS) return { processedUrl: proxied, type: 'hls' };
       if (isMP4) return { processedUrl: proxied, type: 'video' };
       return { processedUrl: proxied, type: 'iframe' };
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
            // Garante que segmentos (.ts) também passem pelo proxy se o m3u8 principal for proxied
            if (!rUrl.includes('/api/proxy') && !rUrl.startsWith('/') && processedUrl.includes('/api/proxy')) {
               xhr.open('GET', `/api/proxy?url=${encodeURIComponent(rUrl)}`, true);
            }
          },
          autoStartLoad: true,
          retryDelay: 500,
          maxMaxBufferLength: 30,
          enableWorker: true,
          lowLatencyMode: true,
          backBufferLength: 90
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
              setError("Sinal instável. Verifique o link no painel.");
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
        video.onerror = () => { setError("Falha ao carregar arquivo de vídeo."); setLoading(false); };
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
    <div key={id || processedUrl} className="relative aspect-video w-full bg-black overflow-hidden border border-white/5 group shadow-2xl rounded-lg">
      {loading && !error && (
        <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-black">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary opacity-60 text-center px-4">Sintonizando Rede Master v54...</p>
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
          key={`frame-${id || processedUrl}`}
          src={processedUrl!} 
          className="w-full h-full border-0 relative z-10" 
          allowFullScreen 
          onLoad={() => setLoading(false)}
          sandbox="allow-scripts allow-same-origin allow-forms allow-presentation allow-popups-to-escape-sandbox"
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

      <div className="absolute inset-0 z-20 flex items-center justify-between px-6 pointer-events-none transition-opacity duration-500 opacity-0 group-hover:opacity-100">
        <button 
          onClick={(e) => { e.stopPropagation(); onPrev?.(); }} 
          className="pointer-events-auto h-16 w-16 rounded-full bg-black/60 backdrop-blur-xl flex items-center justify-center border border-white/10 hover:bg-primary hover:scale-110 transition-all shadow-2xl"
        >
          <ChevronLeft className="h-10 w-10 text-white" />
        </button>
        <button 
          onClick={(e) => { e.stopPropagation(); onNext?.(); }} 
          className="pointer-events-auto h-16 w-16 rounded-full bg-black/60 backdrop-blur-xl flex items-center justify-center border border-white/10 hover:bg-primary hover:scale-110 transition-all shadow-2xl"
        >
          <ChevronRight className="h-10 w-10 text-white" />
        </button>
      </div>
    </div>
  )
}
