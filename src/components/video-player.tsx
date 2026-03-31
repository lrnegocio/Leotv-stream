
"use client"

import * as React from "react"
import { Maximize, Loader2, Volume2, VolumeX, ShieldCheck, ExternalLink, AlertTriangle } from "lucide-react"
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
  const [error, setError] = React.useState(false)

  React.useEffect(() => {
    setIsMounted(true)
    if (url) {
      setLoading(true)
      setError(false)
    }
  }, [url])

  const { processedUrl, type } = React.useMemo(() => {
    if (!url || typeof url !== 'string') return { processedUrl: null, type: 'unknown' }
    const targetUrl = url.trim()
    
    // DETECÇÃO DE IMAGEM (Suporte total para links do Google e Fotos)
    const isImage = /\.(jpg|jpeg|png|gif|webp|bmp|svg)/i.test(targetUrl) || 
                   targetUrl.includes('gstatic.com') || 
                   targetUrl.includes('images?q=tbn') ||
                   targetUrl.includes('picsum.photos') ||
                   targetUrl.includes('encrypted-tbn');
    
    if (isImage) return { processedUrl: targetUrl, type: 'image' }

    // SUPORTE YOUTUBE
    if (targetUrl.includes('youtube.com') || targetUrl.includes('youtu.be')) {
      const id = targetUrl.includes('v=') ? targetUrl.split('v=')[1]?.split('&')[0] : targetUrl.split('youtu.be/')[1]?.split('?')[0];
      return { 
        processedUrl: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=0&rel=0&modestbranding=1&controls=1`,
        type: 'youtube'
      }
    }

    // FORMATOS IPTV
    const lowUrl = targetUrl.toLowerCase();
    if (lowUrl.includes('.m3u8')) return { processedUrl: targetUrl, type: 'hls' }
    if (lowUrl.includes('.ts')) return { processedUrl: targetUrl, type: 'mpegts' }
    if (lowUrl.includes('.mp4') || lowUrl.includes('.mpeg') || lowUrl.includes('.mkv')) return { processedUrl: targetUrl, type: 'video' }

    return { processedUrl: targetUrl, type: 'video' }
  }, [url])

  React.useEffect(() => {
    if (!videoRef.current || !processedUrl || (type === 'image' || type === 'youtube')) return;

    const video = videoRef.current;
    let hls: any = null;
    let mpegtsPlayer: any = null;
    
    const initPlayer = () => {
      // @ts-ignore
      if (type === 'hls' && window.Hls && window.Hls.isSupported()) {
        // @ts-ignore
        hls = new window.Hls({ enableWorker: true, lowLatencyMode: true });
        hls.loadSource(processedUrl);
        hls.attachMedia(video);
        hls.on('hlsManifestParsed', () => { video.play().catch(() => {}); setLoading(false); });
        hls.on('hlsError', () => setLoading(false));
      } 
      // @ts-ignore
      else if (type === 'mpegts' && window.mpegts && window.mpegts.isSupported()) {
        // @ts-ignore
        mpegtsPlayer = window.mpegts.createPlayer({ type: 'mse', url: processedUrl });
        mpegtsPlayer.attachMediaElement(video);
        mpegtsPlayer.load();
        mpegtsPlayer.play().catch(() => {});
        setLoading(false);
      }
      else {
        video.src = processedUrl;
        video.play().catch(() => {
          video.muted = true;
          video.play().catch(() => setLoading(false));
        });
      }
    };

    const timeout = setTimeout(initPlayer, 500);
    return () => { 
      clearTimeout(timeout);
      if (hls) hls.destroy(); 
      if (mpegtsPlayer) mpegtsPlayer.destroy();
    };
  }, [type, processedUrl]);

  if (!isMounted) return <div className="aspect-video bg-black rounded-3xl animate-pulse" />

  const isHttp = url.startsWith('http://');

  return (
    <div ref={containerRef} className="group relative aspect-video w-full overflow-hidden bg-black shadow-2xl rounded-3xl border border-white/5 select-none">
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-[60]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <span className="mt-4 text-[10px] font-black text-primary uppercase animate-pulse tracking-widest">SINTONIZANDO...</span>
        </div>
      )}

      {type === 'image' ? (
        <div className="relative w-full h-full flex items-center justify-center bg-black">
          <img src={processedUrl!} alt={title} className="max-w-full max-h-full object-contain" onLoad={() => setLoading(false)} onError={() => setLoading(false)} />
        </div>
      ) : type === 'youtube' ? (
        <iframe key={processedUrl} src={processedUrl!} className="h-full w-full border-0" allowFullScreen allow="autoplay; encrypted-media" onLoad={() => setLoading(false)} />
      ) : (
        <video ref={videoRef} key={processedUrl} autoPlay muted={isMuted} playsInline crossOrigin="anonymous" className="h-full w-full object-contain" onLoadedData={() => setLoading(false)} onError={() => { setLoading(false); setError(true); }} />
      )}
      
      {/* OVERLAY DE COMANDO MASTER */}
      <div className="absolute inset-0 z-40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="absolute top-0 inset-x-0 p-6 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-black text-white uppercase italic truncate max-w-md">{title}</h3>
            {isHttp && <div className="bg-orange-500/20 text-orange-500 px-3 py-1 rounded-full border border-orange-500/30 text-[8px] font-black uppercase flex items-center gap-1"><AlertTriangle className="h-3 w-3"/> SINAL HTTP (BLOQUEÁVEL PELA TV)</div>}
          </div>
          <button className="h-12 w-12 bg-black/40 hover:bg-primary rounded-full flex items-center justify-center transition-all shadow-2xl" onClick={() => setIsMuted(!isMuted)}>
            {isMuted ? <VolumeX className="h-6 w-6 text-destructive" /> : <Volume2 className="h-6 w-6 text-primary" />}
          </button>
        </div>

        <div className="absolute bottom-0 inset-x-0 p-8 bg-gradient-to-t from-black/80 to-transparent flex justify-between items-center pointer-events-auto">
          <div className="flex gap-4">
             <Button className="h-12 px-6 rounded-xl bg-primary text-white font-black uppercase text-[10px] shadow-lg shadow-primary/20" onClick={() => window.open(url, '_blank')}>
               <ExternalLink className="mr-2 h-4 w-4" /> SINTONIZAR DIRETAMENTE
             </Button>
          </div>
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2 px-4 py-2 bg-black/40 rounded-full border border-white/5">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">SINAL MASTER</span>
            </div>
            <Button variant="ghost" size="icon" className="text-white h-12 w-12 hover:bg-primary/20" onClick={() => containerRef.current?.requestFullscreen()}><Maximize className="h-6 w-6" /></Button>
          </div>
        </div>
      </div>
    </div>
  )
}
