
"use client"

import * as React from "react"
import { Loader2, AlertTriangle, Volume2, VolumeX, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { incrementViews } from "@/lib/store"

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
  const [isMuted, setIsMuted] = React.useState(false) 
  const [showControls, setShowControls] = React.useState(true)
  const controlsTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  const { processedUrl, type, originalUrl } = React.useMemo(() => {
    if (!url) return { processedUrl: null, type: 'unknown', originalUrl: null }
    const u = url.trim().replace('pt.pornhub', 'www.pornhub');

    // SINTONIZADOR SNIPER v200.0 - MESTRE LÉO TV
    if (u.includes('xvideos.com')) {
      const match = u.match(/video\.?([a-z0-9]+)/i) || u.match(/\/video([a-z0-9]+)\//i);
      const vidId = match ? (match[1] || match[0]).replace('video.', '').replace('/', '').split(/[.?/]/)[0] : null;
      if (vidId) return { processedUrl: `https://www.xvideos.com/embedframe/${vidId}`, type: 'iframe', originalUrl: u }
    }

    if (u.includes('dailymotion.com')) {
      const vidId = u.split('/video/')[1]?.split(/[?#&]/)[0];
      if (vidId) return { processedUrl: `https://www.dailymotion.com/embed/video/${vidId}?autoplay=1`, type: 'iframe', originalUrl: u }
    }

    if (u.includes('pornhub.com')) {
      const vKey = u.split('viewkey=')[1]?.split(/[&?#]/)[0];
      if (vKey) return { processedUrl: `https://www.pornhub.com/embed/${vKey}`, type: 'iframe', originalUrl: u }
    }

    if (u.includes('youtube.com') || u.includes('youtu.be')) {
      const yid = u.includes('v=') ? u.split('v=')[1]?.split('&')[0] : u.split('youtu.be/')[1]?.split('?')[0];
      return { processedUrl: `https://www.youtube-nocookie.com/embed/${yid}?autoplay=1`, type: 'iframe', originalUrl: u }
    }

    const isHls = u.includes('.m3u8') || u.includes('chunklist') || u.includes('jmvstream');
    return { 
      processedUrl: u, 
      type: isHls ? 'hls' : (u.includes('.mp4') || u.includes('.ts') ? 'video' : 'iframe'), 
      originalUrl: u 
    }
  }, [url])

  const handleUserInteraction = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => setShowControls(false), 4000);
  };

  React.useEffect(() => {
    if (!videoRef.current || !processedUrl || type === 'iframe') {
      if (type === 'iframe') setLoading(false);
      return;
    }
    const video = videoRef.current;
    let hls: any = null;

    const init = async () => {
      setLoading(true);
      setError(false);
      
      const useProxy = originalUrl && (
        originalUrl.includes('phncdn.com') || 
        originalUrl.includes('xvideos') || 
        originalUrl.includes('archive.org') ||
        originalUrl.includes('jmvstream.com') ||
        originalUrl.includes('.ts') ||
        originalUrl.includes('.mp4') ||
        originalUrl.includes('chunklist')
      );

      if (type === 'hls' && (window as any).Hls) {
        if ((window as any).Hls.isSupported()) {
          hls = new (window as any).Hls({
            enableWorker: true,
            xhrSetup: (xhr: any, requestUrl: string) => { 
              if (useProxy) {
                const proxyUrl = `/api/proxy?url=${encodeURIComponent(requestUrl)}`;
                xhr.open('GET', proxyUrl, true);
              }
            }
          });
          const finalUrl = useProxy ? `/api/proxy?url=${encodeURIComponent(processedUrl)}` : processedUrl;
          hls.loadSource(finalUrl);
          hls.attachMedia(video);
          hls.on((window as any).Hls.Events.MANIFEST_PARSED, () => { 
            video.play().catch(() => { video.muted = true; setIsMuted(true); video.play().catch(() => {}); });
            setLoading(false); 
            if (id) incrementViews(id);
          });
          hls.on((window as any).Hls.Events.ERROR, (_: any, data: any) => {
            if (data.fatal) {
              if (data.type === (window as any).Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
              else if (data.type === (window as any).Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
              else { hls.destroy(); setError(true); }
            }
          });
        }
      } else {
        const finalUrl = useProxy ? `/api/proxy?url=${encodeURIComponent(processedUrl)}` : processedUrl;
        video.src = finalUrl;
        video.load();
        const playPromise = video.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            setLoading(false);
            if (id) incrementViews(id);
          }).catch(() => {
            video.muted = true;
            setIsMuted(true);
            video.play().catch(() => {});
            setLoading(false);
          });
        }
      }
    };

    init();
    return () => { if (hls) hls.destroy(); if (video) { video.pause(); video.src = ""; video.load(); } };
  }, [processedUrl, type, originalUrl, id]);

  return (
    <div 
      onMouseMove={handleUserInteraction}
      onTouchStart={handleUserInteraction}
      onClick={() => {
        if (type === 'iframe') return;
        if (videoRef.current?.paused) videoRef.current.play().catch(() => {});
        else videoRef.current?.pause();
      }}
      className="relative aspect-video w-full bg-black rounded-[2.5rem] overflow-hidden border border-white/5 group shadow-2xl"
    >
      {loading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">Sintonizando Sniper v200.0...</p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-card/95 p-10 text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-white font-black uppercase italic tracking-tighter">Sinal Snipper Bloqueado</h3>
          <Button variant="default" onClick={() => window.open(originalUrl!, '_blank')} className="bg-primary uppercase font-black text-[10px] rounded-xl h-12 px-8 mt-6">
            <ExternalLink className="mr-2 h-4 w-4" /> Tentar Modo Externo
          </Button>
        </div>
      )}

      {type === 'iframe' ? (
        <iframe src={processedUrl!} className="w-full h-full border-0" allowFullScreen allow="autoplay" onLoad={() => setLoading(false)} />
      ) : (
        <video 
          ref={videoRef} 
          className="w-full h-full object-contain" 
          autoPlay 
          playsInline 
          controls={false} 
          crossOrigin="anonymous" 
        />
      )}

      {!loading && !error && (
        <div className={`absolute inset-0 flex items-center justify-between px-6 pointer-events-none transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          <button 
            onClick={(e) => { e.stopPropagation(); onPrev?.(); }} 
            className="pointer-events-auto h-16 w-16 rounded-full bg-black/40 backdrop-blur-xl flex items-center justify-center border border-white/10 hover:bg-primary transition-all shadow-2xl group/btn"
          >
            <ChevronLeft className="h-8 w-8 text-white group-hover/btn:scale-110" />
          </button>
          
          <button 
            onClick={(e) => { e.stopPropagation(); onNext?.(); }} 
            className="pointer-events-auto h-16 w-16 rounded-full bg-black/40 backdrop-blur-xl flex items-center justify-center border border-white/10 hover:bg-primary transition-all shadow-2xl group/btn"
          >
            <ChevronRight className="h-8 w-8 text-white group-hover/btn:scale-110" />
          </button>
        </div>
      )}

      {!loading && !error && type !== 'iframe' && (
        <div className={`absolute top-8 right-8 z-10 transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
           <button onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); if(videoRef.current) videoRef.current.muted = !isMuted; }} className="h-12 w-12 bg-black/60 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/10 hover:bg-primary transition-all">
              {isMuted ? <VolumeX className="h-5 w-5 text-white" /> : <Volume2 className="h-5 w-5 text-white" />}
            </button>
        </div>
      )}
    </div>
  )
}
