
"use client"

import * as React from "react"
import { Maximize, Loader2, Volume2, VolumeX, AlertTriangle, RefreshCcw, ShieldCheck, PlayCircle, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

interface VideoPlayerProps {
  url: string
  title: string
}

export function VideoPlayer({ url, title }: VideoPlayerProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const [loading, setLoading] = React.useState(true)
  const [isMounted, setIsMounted] = React.useState(false)
  const [isMuted, setIsMuted] = React.useState(false)
  const [hasError, setHasError] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
    if (url) {
      setLoading(true)
      setHasError(false)
    }
  }, [url])

  const { processedUrl, type } = React.useMemo(() => {
    if (!url || typeof url !== 'string') return { processedUrl: null, type: 'unknown' }
    const targetUrl = url.trim()
    
    if (targetUrl.includes('youtube.com') || targetUrl.includes('youtu.be')) {
      const id = targetUrl.includes('v=') ? targetUrl.split('v=')[1]?.split('&')[0] : targetUrl.split('youtu.be/')[1]?.split('?')[0];
      return { 
        processedUrl: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=0&rel=0&modestbranding=1&controls=1`,
        type: 'youtube'
      }
    }

    if (targetUrl.includes('dailymotion.com') || targetUrl.includes('dai.ly')) {
      const id = targetUrl.includes('video/') ? targetUrl.split('video/')[1]?.split('?')[0] : targetUrl.split('dai.ly/')[1]?.split('?')[0];
      return {
        processedUrl: `https://www.dailymotion.com/embed/video/${id}?autoplay=1`,
        type: 'iframe'
      }
    }

    const lowUrl = targetUrl.toLowerCase();
    if (lowUrl.includes('.m3u8') || lowUrl.includes('.ts') || lowUrl.includes('.mpeg') || lowUrl.includes('.mp4') || lowUrl.includes('stream')) {
      return { processedUrl: targetUrl, type: 'hls' }
    }

    return { processedUrl: targetUrl, type: 'video' }
  }, [url])

  React.useEffect(() => {
    if (!videoRef.current || !processedUrl || (type !== 'hls' && type !== 'video')) return;

    const video = videoRef.current;
    let hls: any = null;
    
    const initHls = () => {
      // @ts-ignore
      if (typeof window !== 'undefined' && window.Hls && window.Hls.isSupported()) {
        // @ts-ignore
        hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true,
          manifestLoadingMaxRetry: 4,
          levelLoadingMaxRetry: 4,
          xhrSetup: (xhr: any) => { xhr.withCredentials = false; }
        });
        hls.loadSource(processedUrl);
        hls.attachMedia(video);
        hls.on('hlsManifestParsed', () => {
          video.play().catch(() => {});
          setLoading(false);
          setHasError(false);
        });
        hls.on('hlsError', (event: any, data: any) => {
          if (data.fatal) {
            setHasError(true);
            setLoading(false);
            hls.destroy();
          }
        });
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = processedUrl;
        video.play().catch(() => {});
        setLoading(false);
      } else {
        video.src = processedUrl;
        video.play().catch(() => {});
        setLoading(false);
      }
    };
    initHls();
    return () => { if (hls) hls.destroy(); };
  }, [type, processedUrl]);

  if (!isMounted) return <div className="aspect-video bg-black rounded-3xl animate-pulse" />

  const isHttpOnHttps = typeof window !== 'undefined' && window.location.protocol === 'https:' && url?.startsWith('http:');

  return (
    <div ref={containerRef} className="group relative aspect-video w-full overflow-hidden bg-black shadow-2xl rounded-3xl border border-white/5 select-none">
      <div className="absolute top-4 left-4 z-[80] flex items-center gap-2 bg-primary/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-primary/30 opacity-0 group-hover:opacity-100 transition-opacity">
        <ShieldCheck className="h-3 w-3 text-primary animate-pulse" />
        <span className="text-[8px] font-black text-primary uppercase tracking-widest">SINAL MASTER HIDRA v18 ATIVO</span>
      </div>

      {loading && !hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-[60]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <span className="mt-4 text-[10px] font-black text-primary uppercase animate-pulse tracking-widest">SINTONIZANDO SINAL...</span>
        </div>
      )}

      {(type === 'hls' || type === 'video') ? (
        <video 
          ref={videoRef}
          key={processedUrl} 
          autoPlay 
          muted={isMuted} 
          playsInline
          crossOrigin="anonymous"
          className="h-full w-full object-contain relative z-10" 
          onLoadedData={() => { setLoading(false); setHasError(false); }}
          onError={() => { setLoading(false); setHasError(true); }}
        />
      ) : (
        <iframe 
          key={processedUrl} 
          src={processedUrl!} 
          className="h-full w-full border-0 relative z-10" 
          allowFullScreen 
          allow="autoplay; encrypted-media; picture-in-picture"
          onLoad={() => { setLoading(false); setHasError(false); }} 
        />
      )}

      {(hasError || isHttpOnHttps) && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/95 z-[70] p-10 text-center space-y-4">
           <AlertTriangle className="h-12 w-12 text-destructive animate-bounce" />
           <h3 className="text-xl font-black uppercase italic text-destructive tracking-tighter">SINAL BLOQUEADO OU OFFLINE</h3>
           <p className="text-[9px] uppercase font-bold text-white/40 leading-relaxed max-w-sm">
             O sinal está online, mas as travas de segurança do navegador bloquearam o player interno.
           </p>
           <Button asChild className="h-16 bg-primary px-8 rounded-2xl font-black uppercase shadow-xl shadow-primary/20 hover:scale-105 transition-transform">
              <a href={url} target="_blank" rel="noopener noreferrer">SINTONIZAR DIRETAMENTE <ExternalLink className="ml-2 h-6 w-6" /></a>
           </Button>
           <Button onClick={() => window.location.reload()} variant="ghost" className="text-white text-[10px] font-black hover:text-primary">
             <RefreshCcw className="mr-2 h-4 w-4" /> RECONECTAR SINAL
           </Button>
        </div>
      )}
      
      <div className="absolute inset-0 z-40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="absolute top-0 inset-x-0 p-6 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between pointer-events-auto">
          <h3 className="text-xl font-black text-white uppercase italic truncate max-w-md">{title}</h3>
          <div className="flex gap-2">
            <button className="h-12 w-12 bg-black/40 hover:bg-primary rounded-full flex items-center justify-center transition-all shadow-2xl" onClick={() => setIsMuted(!isMuted)}>
              {isMuted ? <VolumeX className="h-6 w-6 text-destructive" /> : <Volume2 className="h-6 w-6 text-primary" />}
            </button>
          </div>
        </div>

        <div className="absolute bottom-0 inset-x-0 p-8 bg-gradient-to-t from-black/80 to-transparent flex justify-end pointer-events-auto">
          <Button variant="ghost" size="icon" className="text-white h-12 w-12 hover:bg-primary/20" onClick={() => containerRef.current?.requestFullscreen()}><Maximize className="h-6 w-6" /></Button>
        </div>
      </div>
    </div>
  )
}
