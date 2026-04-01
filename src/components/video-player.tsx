
"use client"

import * as React from "react"
import { Loader2, AlertTriangle, Volume2, VolumeX, Maximize } from "lucide-react"
import { Button } from "@/components/ui/button"

interface VideoPlayerProps {
  url: string
  title: string
}

export function VideoPlayer({ url, title }: VideoPlayerProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(false)
  const [isMuted, setIsMuted] = React.useState(false)

  const { processedUrl, type } = React.useMemo(() => {
    if (!url) return { processedUrl: null, type: 'unknown' }
    const u = url.trim()

    // 1. IFRAMES MASTER (RedeCanais, RD Canais, Players Prontos)
    if (u.includes('ch.php?') || u.includes('redecanaistv') || u.includes('rdcanais') || u.includes('player')) {
      return { processedUrl: u, type: 'iframe' }
    }

    // 2. EMBEDS DE ELITE (XVideos, Pornhub, YouTube)
    if (u.includes('xvideos.com/video')) {
      const id = u.match(/video\.?([a-z0-9]+)/i)?.[1];
      return { processedUrl: id ? `https://www.xvideos.com/embedframe/${id}` : u, type: 'iframe' }
    }
    if (u.includes('pornhub.com/view_video.php')) {
      const id = u.split('viewkey=')[1]?.split(/[&?#]/)[0];
      return { processedUrl: id ? `https://www.pornhub.com/embed/${id}` : u, type: 'iframe' }
    }
    if (u.includes('youtube.com') || u.includes('youtu.be')) {
      const id = u.includes('v=') ? u.split('v=')[1]?.split('&')[0] : u.split('youtu.be/')[1]?.split('?')[0];
      return { processedUrl: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1`, type: 'iframe' }
    }

    // 3. TÚNEL MASTER (Archive.org, blinder.space, CDNs Bloqueadas, HTTP)
    const isRestrictedHost = u.includes('archive.org') || u.includes('blinder.space') || u.includes('phncdn.com') || u.includes('xvideos-cdn.com') || u.startsWith('http://');
    
    if (isRestrictedHost) {
      const proxyUrl = `/api/proxy?url=${encodeURIComponent(u)}`;
      return { processedUrl: proxyUrl, type: u.includes('.m3u8') ? 'hls' : 'video' }
    }

    return { processedUrl: u, type: u.includes('.m3u8') ? 'hls' : 'video' }
  }, [url])

  React.useEffect(() => {
    if (!videoRef.current || !processedUrl || type === 'iframe') return;
    const video = videoRef.current;
    let hls: any = null;

    const init = () => {
      setLoading(true);
      setError(false);
      
      if (type === 'hls' && (window as any).Hls) {
        if ((window as any).Hls.isSupported()) {
          hls = new (window as any).Hls();
          hls.loadSource(processedUrl);
          hls.attachMedia(video);
          hls.on((window as any).Hls.Events.MANIFEST_PARSED, () => {
            video.play().catch(() => {});
            setLoading(false);
          });
          hls.on((window as any).Hls.Events.ERROR, (_: any, data: any) => {
            if (data.fatal) setError(true);
          });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = processedUrl;
          video.addEventListener('loadedmetadata', () => { video.play(); setLoading(false); });
        }
      } else {
        video.src = processedUrl;
        video.load();
        video.play().catch(() => {
          video.muted = true;
          video.play().catch(() => setError(true));
        });
      }
    };

    init();
    return () => { if (hls) hls.destroy(); };
  }, [processedUrl, type])

  return (
    <div ref={containerRef} className="relative aspect-video w-full bg-black rounded-[2rem] overflow-hidden border border-white/5 group shadow-2xl">
      {loading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary animate-pulse">Sintonizando Sinal Master...</p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-card/95 p-10 text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-white font-black uppercase">Sinal Master Offline</h3>
          <Button variant="outline" onClick={() => window.location.reload()} className="mt-6 border-white/10 uppercase font-black text-[10px]">Tentar Reentry</Button>
        </div>
      )}

      {type === 'iframe' ? (
        <iframe src={processedUrl!} className="w-full h-full border-0" allowFullScreen allow="autoplay" onLoad={() => setLoading(false)} />
      ) : (
        <video ref={videoRef} className="w-full h-full object-contain" autoPlay playsInline controls={!loading} onLoadedData={() => setLoading(false)} onError={() => setError(true)} crossOrigin="anonymous" />
      )}

      <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="absolute top-0 inset-x-0 p-6 bg-gradient-to-b from-black/80 to-transparent flex justify-between items-center pointer-events-auto">
          <h3 className="text-white font-black uppercase italic truncate max-w-md">{title}</h3>
          <button onClick={() => setIsMuted(!isMuted)} className="h-10 w-10 bg-black/40 rounded-full flex items-center justify-center hover:bg-primary transition-all">
            {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
          </button>
        </div>
        <div className="absolute bottom-6 right-6 pointer-events-auto">
          <Button variant="ghost" size="icon" onClick={() => containerRef.current?.requestFullscreen()} className="text-white h-12 w-12 hover:bg-primary/20 rounded-full">
            <Maximize className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  )
}
