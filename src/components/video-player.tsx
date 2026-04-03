
"use client"

import * as React from "react"
import { Loader2, AlertTriangle, ChevronLeft, ChevronRight, RefreshCw } from "lucide-react"
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
  const [error, setError] = React.useState(false)
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
      const vidId = urlStr.split('/video/')[1]?.split('?')[0];
      return { processedUrl: `https://www.dailymotion.com/embed/video/${vidId}?autoplay=1`, type: 'iframe' }
    }

    if (urlStr.includes('pornhub.com')) {
      const viewKeyMatch = urlStr.match(/viewkey=([a-z0-9]+)/i);
      const viewKey = viewKeyMatch ? viewKeyMatch[1] : null;
      if (viewKey) return { processedUrl: `https://www.pornhub.com/embed/${viewKey}`, type: 'iframe' }
    }

    if (urlStr.includes('xvideos.com') || urlStr.includes('brazzers.com') || urlStr.includes('bangbros.com')) {
      const match = urlStr.match(/video\.([a-z0-9]+)/i) || urlStr.match(/\/video([a-z0-9]+)/i);
      const vidId = match ? match[1] : null;
      if (vidId && urlStr.includes('xvideos')) return { processedUrl: `https://www.xvideos.com/embedframe/${vidId}`, type: 'iframe' }
      return { processedUrl: `/api/proxy?url=${encodeURIComponent(urlStr)}`, type: 'iframe' }
    }

    // SNIPER 206: Qualquer link m3u8 ou mp4 externo passa pelo Túnel de Camuflagem
    const isHls = urlStr.includes('.m3u8') || urlStr.includes('chunklist') || urlStr.includes('playlist.m3u8');
    const isVideoFile = urlStr.includes('.mp4') || urlStr.includes('.mkv') || urlStr.includes('.avi') || urlStr.includes('.ts');
    const isProblematic = urlStr.includes('blinder.space') || urlStr.includes('jmvstream') || urlStr.includes('redecanais') || urlStr.startsWith('http://');

    if (isHls || isVideoFile || isProblematic) {
      return { processedUrl: `/api/proxy?url=${encodeURIComponent(urlStr)}`, type: isHls ? 'hls' : 'video' }
    }

    return { processedUrl: urlStr, type: urlStr.includes('.mp4') ? 'video' : 'iframe' }
  }, [])

  const { processedUrl, type } = React.useMemo(() => sintonize(url), [url, sintonize])

  const handleUserInteraction = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 4000);
  };

  React.useEffect(() => {
    if (!processedUrl) return;
    if (type === 'iframe') { setLoading(false); return; }

    const video = videoRef.current;
    if (!video) return;

    let hls: any = null;
    const init = async () => {
      setLoading(true); setError(false);
      if (type === 'hls' && (window as any).Hls) {
        if ((window as any).Hls.isSupported()) {
          hls = new (window as any).Hls({
            // SINTONIZADOR SNIPER: Força cada pedaço do m3u8 (.ts) a passar pelo proxy
            xhrSetup: (xhr: any, rUrl: string) => {
              if (!rUrl.includes('/api/proxy') && (rUrl.includes('.ts') || rUrl.includes('.m3u8'))) {
                xhr.open('GET', `/api/proxy?url=${encodeURIComponent(rUrl)}`, true);
              }
            },
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 90
          });
          hls.loadSource(processedUrl); hls.attachMedia(video);
          hls.on((window as any).Hls.Events.MANIFEST_PARSED, () => { video.play().catch(() => video.muted = true); setLoading(false); });
          hls.on((window as any).Hls.Events.ERROR, (_: any, d: any) => { if (d.fatal) hls.startLoad(); });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = processedUrl; video.play().catch(() => {}); setLoading(false);
        }
      } else {
        video.src = processedUrl!; video.load();
        video.play().then(() => setLoading(false)).catch(() => { video.muted = true; video.play(); setLoading(false); });
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
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Sintonizando Master Léo TV...</p>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-card/95 p-10 text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-white font-black uppercase italic text-xl">Sinal Offline</h3>
          <Button onClick={() => window.location.reload()} className="bg-primary uppercase font-black text-[10px] rounded-xl h-12 px-8 mt-6"><RefreshCw className="mr-2 h-4 w-4" /> Recarregar</Button>
        </div>
      )}
      {type === 'iframe' ? (
        <iframe src={processedUrl!} className="w-full h-full border-0" allowFullScreen allow="autoplay; encrypted-media" onLoad={() => setLoading(false)} />
      ) : (
        <video ref={videoRef} className="w-full h-full object-contain" autoPlay playsInline controls={false} />
      )}
      {!loading && !error && (
        <div className={`absolute inset-0 flex items-center justify-between px-6 pointer-events-none transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          <button onClick={(e) => { e.stopPropagation(); onPrev?.(); }} className="pointer-events-auto h-16 w-16 rounded-full bg-black/40 backdrop-blur-xl flex items-center justify-center border border-white/10 hover:bg-primary transition-all group/btn"><ChevronLeft className="h-8 w-8 text-white group-hover/btn:scale-110" /></button>
          <button onClick={(e) => { e.stopPropagation(); onNext?.(); }} className="pointer-events-auto h-16 w-16 rounded-full bg-black/40 backdrop-blur-xl flex items-center justify-center border border-white/10 hover:bg-primary transition-all group/btn"><ChevronRight className="h-8 w-8 text-white group-hover/btn:scale-110" /></button>
        </div>
      )}
    </div>
  )
}
