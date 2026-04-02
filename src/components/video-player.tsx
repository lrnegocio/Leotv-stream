
"use client"

import * as React from "react"
import { Loader2, AlertTriangle, Volume2, VolumeX, Maximize, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { incrementViews } from "@/lib/store"

interface VideoPlayerProps {
  url: string
  title: string
  id?: string
}

export function VideoPlayer({ url, title, id }: VideoPlayerProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(false)
  const [isMuted, setIsMuted] = React.useState(false) 
  const [isPlaying, setIsPlaying] = React.useState(true)
  const playPromiseRef = React.useRef<Promise<void> | null>(null)

  const { processedUrl, type, originalUrl } = React.useMemo(() => {
    if (!url) return { processedUrl: null, type: 'unknown', originalUrl: null }
    const u = url.trim()

    // SINTONIZADOR SNIPER v30.0 - MOTOR DE DETECÇÃO SOBERANO
    if (u.includes('xvideos.com')) {
      const match = u.match(/video\.?([a-z0-9]+)/i) || u.match(/\/video([a-z0-9]+)\//i);
      const videoId = match ? (match[1] || match[0]).replace('video.', '').replace('/', '').split('/')[0] : null;
      if (videoId) return { processedUrl: `https://www.xvideos.com/embedframe/${videoId}`, type: 'iframe', originalUrl: u }
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

    const isHls = u.includes('.m3u8') || u.includes('chunklist');
    return { 
      processedUrl: u, 
      type: isHls ? 'hls' : (u.includes('.mp4') || u.includes('.ts') ? 'video' : 'iframe'), 
      originalUrl: u 
    }
  }, [url])

  const safePlay = React.useCallback(async () => {
    if (!videoRef.current) return;
    try {
      playPromiseRef.current = videoRef.current.play();
      await playPromiseRef.current;
      setIsPlaying(true);
      if (id) incrementViews(id);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        videoRef.current.muted = true;
        setIsMuted(true);
        videoRef.current.play().catch(() => {});
      }
    } finally {
      playPromiseRef.current = null;
    }
  }, [id]);

  const safePause = React.useCallback(async () => {
    if (!videoRef.current) return;
    if (playPromiseRef.current) {
      try { await playPromiseRef.current; } catch (e) {}
    }
    videoRef.current.pause();
    setIsPlaying(false);
  }, []);

  React.useEffect(() => {
    if (!videoRef.current || !processedUrl || type === 'iframe') return;
    const video = videoRef.current;
    let hls: any = null;

    const init = async () => {
      setLoading(true);
      setError(false);
      
      const useProxy = originalUrl && (
        originalUrl.includes('phncdn.com') || 
        originalUrl.includes('xvideos') || 
        originalUrl.includes('archive.org') ||
        originalUrl.includes('jmvstream.com')
      );

      if (type === 'hls' && (window as any).Hls) {
        if ((window as any).Hls.isSupported()) {
          hls = new (window as any).Hls({
            enableWorker: true,
            xhrSetup: (xhr: any, requestUrl: string) => { 
              if (useProxy || requestUrl.includes('.ts') || requestUrl.includes('.m3u8')) {
                if (!requestUrl.includes('/api/proxy')) {
                  xhr.open('GET', `/api/proxy?url=${encodeURIComponent(requestUrl)}`, true);
                }
              }
            }
          });
          const finalUrl = useProxy ? `/api/proxy?url=${encodeURIComponent(processedUrl)}` : processedUrl;
          hls.loadSource(finalUrl);
          hls.attachMedia(video);
          hls.on((window as any).Hls.Events.MANIFEST_PARSED, () => { safePlay(); setLoading(false); });
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
        safePlay();
      }
    };

    init();
    return () => { if (hls) hls.destroy(); if (video) { video.pause(); video.src = ""; video.load(); } };
  }, [processedUrl, type, originalUrl, safePlay]);

  const seek = (seconds: number) => {
    if (videoRef.current) videoRef.current.currentTime += seconds;
  };

  return (
    <div 
      ref={containerRef} 
      onClick={() => {
        if (videoRef.current?.muted) { videoRef.current.muted = false; setIsMuted(false); }
        isPlaying ? safePause() : safePlay();
      }}
      className="relative aspect-video w-full bg-black rounded-[2.5rem] overflow-hidden border border-white/5 group shadow-2xl cursor-pointer"
    >
      {loading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary animate-pulse">Sintonizando Rede Master...</p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-card/95 p-10 text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-white font-black uppercase italic tracking-tighter">Sinal Recusado pela Fonte</h3>
          <Button variant="default" onClick={() => window.open(originalUrl!, '_blank')} className="bg-primary uppercase font-black text-[10px] rounded-xl h-12 px-8 mt-6">
            <ExternalLink className="mr-2 h-4 w-4" /> Abrir Externamente
          </Button>
        </div>
      )}

      {type === 'iframe' ? (
        <iframe src={processedUrl!} className="w-full h-full border-0" allowFullScreen allow="autoplay" onLoad={() => setLoading(false)} />
      ) : (
        <>
          <video 
            ref={videoRef} 
            className="w-full h-full object-contain" 
            autoPlay 
            playsInline 
            controls={false} 
            onLoadedData={() => setLoading(false)} 
            onError={() => setError(true)} 
            crossOrigin="anonymous" 
          />
          {!loading && !error && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex items-center gap-12">
                <button 
                  onClick={(e) => { e.stopPropagation(); seek(-10); }} 
                  className="pointer-events-auto h-20 w-20 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-primary transition-all scale-90 hover:scale-100"
                >
                  <ChevronLeft className="h-10 w-10 text-white" />
                  <span className="absolute bottom-4 text-[9px] font-black uppercase text-white">10s</span>
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); isPlaying ? safePause() : safePlay(); }} 
                  className="pointer-events-auto h-24 w-24 rounded-full bg-primary flex items-center justify-center shadow-2xl shadow-primary/40 hover:scale-110 transition-transform"
                >
                  {isPlaying ? <div className="h-8 w-2 bg-white rounded-full mr-1.5" /> : null}
                  {isPlaying ? <div className="h-8 w-2 bg-white rounded-full ml-1.5" /> : <div className="w-0 h-0 border-t-[15px] border-t-transparent border-l-[25px] border-l-white border-b-[15px] border-b-transparent ml-2" />}
                </button>
                <button 
                  onClick={(e) => { e.stopPropagation(); seek(10); }} 
                  className="pointer-events-auto h-20 w-20 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-primary transition-all scale-90 hover:scale-100"
                >
                  <ChevronRight className="h-10 w-10 text-white" />
                  <span className="absolute bottom-4 text-[9px] font-black uppercase text-white">10s</span>
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {!loading && !error && type !== 'iframe' && (
        <div className="absolute top-8 right-8 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
           <button onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); if(videoRef.current) videoRef.current.muted = !isMuted; }} className="h-12 w-12 bg-black/60 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/10">
              {isMuted ? <VolumeX className="h-5 w-5 text-white" /> : <Volume2 className="h-5 w-5 text-white" />}
            </button>
        </div>
      )}
    </div>
  )
}
