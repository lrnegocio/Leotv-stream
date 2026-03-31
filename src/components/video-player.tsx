
"use client"

import * as React from "react"
import { Maximize, Loader2, Volume2, VolumeX, ShieldCheck, PlayCircle } from "lucide-react"
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

  React.useEffect(() => {
    setIsMounted(true)
    if (url) {
      setLoading(true)
    }
  }, [url])

  const { processedUrl, type } = React.useMemo(() => {
    if (!url || typeof url !== 'string') return { processedUrl: null, type: 'unknown' }
    const targetUrl = url.trim()
    
    // DETECÇÃO DE IMAGEM (Suporte total para links do Google/Gstatic)
    const isImage = /\.(jpg|jpeg|png|gif|webp|bmp|svg)/i.test(targetUrl) || 
                   targetUrl.includes('gstatic.com') || 
                   targetUrl.includes('images?q=tbn') ||
                   targetUrl.includes('picsum.photos');
    
    if (isImage) return { processedUrl: targetUrl, type: 'image' }

    // SUPORTE YOUTUBE
    if (targetUrl.includes('youtube.com') || targetUrl.includes('youtu.be')) {
      const id = targetUrl.includes('v=') ? targetUrl.split('v=')[1]?.split('&')[0] : targetUrl.split('youtu.be/')[1]?.split('?')[0];
      return { 
        processedUrl: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=0&rel=0&modestbranding=1&controls=1`,
        type: 'youtube'
      }
    }

    const lowUrl = targetUrl.toLowerCase();
    if (lowUrl.includes('.m3u8') || lowUrl.includes('.ts') || lowUrl.includes('.mpeg')) {
      return { processedUrl: targetUrl, type: 'hls' }
    }

    return { processedUrl: targetUrl, type: 'video' }
  }, [url])

  React.useEffect(() => {
    if (!videoRef.current || !processedUrl || (type !== 'hls' && type !== 'video')) return;

    const video = videoRef.current;
    // @ts-ignore
    let hls: any = null;
    
    const initPlayer = () => {
      // @ts-ignore
      if (type === 'hls' && typeof window !== 'undefined' && window.Hls && window.Hls.isSupported()) {
        // @ts-ignore
        hls = new window.Hls({
          enableWorker: true,
          lowLatencyMode: true,
          manifestLoadingMaxRetry: 10,
          xhrSetup: (xhr: any) => { xhr.withCredentials = false; }
        });
        hls.loadSource(processedUrl);
        hls.attachMedia(video);
        hls.on('hlsManifestParsed', () => {
          video.play().catch(() => {});
          setLoading(false);
        });
        hls.on('hlsError', () => {
          setLoading(false);
        });
      } else {
        video.src = processedUrl;
        video.play().catch(() => {
          setLoading(false);
        });
      }
    };

    // Pequeno delay para garantir que o Script de HLS.js carregou
    const timeout = setTimeout(initPlayer, 500);
    return () => { 
      clearTimeout(timeout);
      if (hls) hls.destroy(); 
    };
  }, [type, processedUrl]);

  if (!isMounted) return <div className="aspect-video bg-black rounded-3xl animate-pulse" />

  return (
    <div ref={containerRef} className="group relative aspect-video w-full overflow-hidden bg-black shadow-2xl rounded-3xl border border-white/5 select-none">
      <div className="absolute top-4 left-4 z-[80] flex items-center gap-2 bg-primary/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-primary/30 opacity-0 group-hover:opacity-100 transition-opacity">
        <ShieldCheck className="h-3 w-3 text-primary animate-pulse" />
        <span className="text-[8px] font-black text-primary uppercase tracking-widest">SINAL MASTER ATIVO</span>
      </div>

      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-[60]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <span className="mt-4 text-[10px] font-black text-primary uppercase animate-pulse tracking-widest">SINTONIZANDO...</span>
        </div>
      )}

      {type === 'image' ? (
        <div className="relative w-full h-full flex items-center justify-center bg-black">
          <img 
            src={processedUrl!} 
            alt={title} 
            className="max-w-full max-h-full object-contain relative z-10" 
            onLoad={() => setLoading(false)}
            onError={() => setLoading(false)}
          />
        </div>
      ) : (type === 'hls' || type === 'video') ? (
        <video 
          ref={videoRef}
          key={processedUrl} 
          autoPlay 
          muted={isMuted} 
          playsInline
          crossOrigin="anonymous"
          className="h-full w-full object-contain relative z-10" 
          onLoadedData={() => setLoading(false)}
          onError={() => setLoading(false)}
        />
      ) : (
        <iframe 
          key={processedUrl} 
          src={processedUrl!} 
          className="h-full w-full border-0 relative z-10" 
          allowFullScreen 
          allow="autoplay; encrypted-media; picture-in-picture"
          onLoad={() => setLoading(false)} 
        />
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

        <div className="absolute bottom-0 inset-x-0 p-8 bg-gradient-to-t from-black/80 to-transparent flex justify-between items-center pointer-events-auto">
          <div className="flex gap-4">
             <Button variant="outline" className="h-12 px-6 rounded-xl bg-white/5 border-white/10 hover:border-primary text-xs font-black uppercase text-white" onClick={() => window.open(url, '_blank')}>
               <PlayCircle className="mr-2 h-5 w-5" /> SINTONIZAR FORÇADO
             </Button>
          </div>
          <Button variant="ghost" size="icon" className="text-white h-12 w-12 hover:bg-primary/20" onClick={() => containerRef.current?.requestFullscreen()}><Maximize className="h-6 w-6" /></Button>
        </div>
      </div>
    </div>
  )
}
