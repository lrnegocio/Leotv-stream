
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

    // DETECTOR DE PLATAFORMAS MASTER
    if (urlStr.includes('youtube.com') || urlStr.includes('youtu.be')) {
      const vidId = urlStr.includes('v=') ? urlStr.split('v=')[1]?.split('&')[0] : urlStr.split('youtu.be/')[1]?.split('?')[0];
      return { processedUrl: `https://www.youtube-nocookie.com/embed/${vidId}?autoplay=1&rel=0`, type: 'iframe' }
    }

    if (urlStr.includes('dailymotion.com')) {
      const vidId = urlStr.split('/video/')[1]?.split('?')[0] || urlStr.split('/embed/video/')[1]?.split('?')[0];
      return { processedUrl: `https://www.dailymotion.com/embed/video/${vidId}?autoplay=1`, type: 'iframe' }
    }

    if (urlStr.includes('pornhub.com')) {
      const viewKeyMatch = urlStr.match(/viewkey=([a-z0-9]+)/i);
      const viewKey = viewKeyMatch ? viewKeyMatch[1] : null;
      if (viewKey) return { processedUrl: `https://www.pornhub.com/embed/${viewKey}`, type: 'iframe' }
    }

    if (urlStr.includes('xvideos.com')) {
      const match = urlStr.match(/video\.([a-z0-9]+)/i) || urlStr.match(/\/video([a-z0-9]+)/i);
      const vidId = match ? match[1] : null;
      if (vidId) return { processedUrl: `https://www.xvideos.com/embedframe/${vidId}`, type: 'iframe' }
    }

    // LINKS QUE EXIGEM TÚNEL MASTER (HTTP, m3u8, mp4, players PHP)
    const needsProxy = urlStr.startsWith('http://') || 
                       urlStr.includes('.m3u8') || 
                       urlStr.includes('.mp4') || 
                       urlStr.includes('.php') || 
                       urlStr.includes('redecanais') || 
                       urlStr.includes('blinder') || 
                       urlStr.includes('wurl.tv');

    if (needsProxy) {
      const proxied = `/api/proxy?url=${encodeURIComponent(urlStr)}`;
      // Se for player PHP (como RedeCanais), abrimos como Iframe via Túnel
      if (urlStr.includes('.php') || urlStr.includes('player')) return { processedUrl: proxied, type: 'iframe' };
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
    if (!processedUrl || type === 'iframe') { 
      setLoading(false); 
      return; 
    }

    const video = videoRef.current;
    if (!video) return;

    let hls: any = null;
    const init = async () => {
      setLoading(true);
      if (type === 'hls' && (window as any).Hls) {
        if ((window as any).Hls.isSupported()) {
          hls = new (window as any).Hls({
            xhrSetup: (xhr: any, rUrl: string) => {
              // GARANTE QUE CADA PEDAÇO DO VÍDEO PASSE PELA BLINDAGEM
              if (!rUrl.includes('/api/proxy') && (rUrl.includes('.ts') || rUrl.includes('.m3u8') || rUrl.includes('.m4s'))) {
                xhr.open('GET', `/api/proxy?url=${encodeURIComponent(rUrl)}`, true);
              }
            },
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 90
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
                case (window as any).Hls.ErrorTypes.NETWORK_ERROR:
                  hls.startLoad();
                  break;
                case (window as any).Hls.ErrorTypes.MEDIA_ERROR:
                  hls.recoverMediaError();
                  break;
                default:
                  init();
                  break;
              }
            }
          });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = processedUrl;
          video.play().catch(() => {});
          setLoading(false);
        }
      } else {
        video.src = processedUrl!;
        video.load();
        video.play().then(() => setLoading(false)).catch(() => {
          video.muted = true;
          video.play();
          setLoading(false);
        });
      }
    };
    init();
    return () => { if (hls) hls.destroy(); if (video) { video.pause(); video.src = ""; } };
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
          src={processedUrl!} 
          className="w-full h-full border-0" 
          allowFullScreen 
          allow="autoplay; encrypted-media; fullscreen" 
          onLoad={() => setLoading(false)}
          /* ESCUDO AD-BLOCK: Permite controles e scripts, mas bloqueia popups e novas abas */
          sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
        />
      ) : (
        <video 
          ref={videoRef} 
          className="w-full h-full object-contain" 
          autoPlay 
          playsInline 
          controls={true} // ATIVADO: Pausa e Fullscreen restaurados
        />
      )}

      {/* Navegação Rápida Master (Sobreposição) */}
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
