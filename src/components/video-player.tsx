
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

  // MONITOR DE BIBLIOTECA: Garante que o Hls.js esteja pronto antes de sintonizar
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

    if (urlStr.includes('youtube.com') || urlStr.includes('youtu.be')) {
      const vidId = urlStr.includes('v=') ? urlStr.split('v=')[1]?.split('&')[0] : urlStr.split('youtu.be/')[1]?.split('?')[0];
      return { processedUrl: `https://www.youtube-nocookie.com/embed/${vidId}?autoplay=1&rel=0`, type: 'iframe' }
    }

    const isM3U8 = urlStr.toLowerCase().includes('.m3u8');
    const isMP4 = urlStr.toLowerCase().includes('.mp4');
    const isPHP = urlStr.toLowerCase().includes('.php');

    // TÚNEL MASTER: Todo link externo passa pela nossa blindagem
    const proxied = `/api/proxy?url=${encodeURIComponent(urlStr)}`;

    if (isPHP) return { processedUrl: proxied, type: 'iframe' };
    if (isM3U8) return { processedUrl: proxied, type: 'hls' };
    if (isMP4) return { processedUrl: proxied, type: 'video' };

    // Fallback para outros tipos ou links diretos
    return { processedUrl: urlStr, type: 'video' };
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
      videoRef.current.removeAttribute('src'); // LIMPEZA TOTAL PARA EVITAR NOTSUPPORTEDERROR
      videoRef.current.load();
    }
  };

  const initPlayer = React.useCallback(async () => {
    const video = videoRef.current;
    if (!processedUrl || !video) return;

    // Se for HLS mas a biblioteca ainda não carregou, espera
    if (type === 'hls' && !hlsLoaded) return;

    cleanupPlayer();
    setError(null);
    setLoading(true);

    if (type === 'hls') {
      const Hls = (window as any).Hls;
      if (Hls && Hls.isSupported()) {
        const hls = new Hls({
          xhrSetup: (xhr: any, rUrl: string) => {
            // PROXY REVERSO EM CADEIA: Garante que cada segmento (.ts) passe pelo túnel
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
          video.play().catch(() => { 
            video.muted = true; 
            video.play().catch(e => console.error("Auto-play blocked", e)); 
          });
          setLoading(false);
        });

        hls.on(Hls.Events.ERROR, (_: any, data: any) => {
          if (data.fatal) {
            switch (data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR:
                setError("Falha de Rede. O servidor do canal está instável.");
                hls.startLoad();
                break;
              case Hls.ErrorTypes.MEDIA_ERROR:
                setError("Erro de Mídia. Tentando recuperar sinal...");
                hls.recoverMediaError();
                break;
              default:
                setError("Sinal Indisponível no Momento.");
                cleanupPlayer();
                break;
            }
            setLoading(false);
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Suporte Nativo (Safari/iOS)
        video.src = processedUrl;
        video.play().catch(() => {});
        setLoading(false);
      } else {
        setError("Seu navegador não suporta este formato de vídeo.");
        setLoading(false);
      }
    } else if (type === 'video') {
      video.src = processedUrl;
      video.play()
        .then(() => setLoading(false))
        .catch(() => {
          video.muted = true;
          video.play().catch(() => {}).finally(() => setLoading(false));
        });
    } else {
      // Iframe loading é tratado pelo onLoad do próprio iframe
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
          <h3 className="text-xl font-black uppercase italic text-white mb-2">Falha na Sintonização</h3>
          <p className="text-[10px] font-bold uppercase opacity-60 mb-8 max-w-xs">{error}</p>
          <Button onClick={() => initPlayer()} variant="outline" className="h-12 border-primary text-primary hover:bg-primary hover:text-white rounded-xl px-8 font-black uppercase text-[10px]">
            <RefreshCcw className="h-4 w-4 mr-2" /> Tentar Novamente
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
          key={processedUrl} // XEQUE-MATE NO NOTSUPPORTEDERROR: Força destruição do elemento antigo
          ref={videoRef} 
          className="w-full h-full object-contain relative z-10" 
          autoPlay 
          playsInline 
          controls={true}
          crossOrigin="anonymous"
          onLoadedData={() => setLoading(false)}
          onError={(e) => {
            if (!loading && !error) {
              console.error("Video Error:", e);
              setError("O servidor não enviou dados de vídeo compatíveis.");
            }
          }}
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

      <div className={`absolute top-0 left-0 right-0 z-20 p-8 bg-gradient-to-b from-black/80 to-transparent pointer-events-none transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-primary italic">Sinal Master: {title}</h2>
      </div>
    </div>
  )
}
