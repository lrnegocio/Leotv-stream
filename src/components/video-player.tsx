
"use client"

import * as React from "react"
import { Loader2, AlertTriangle, Volume2, VolumeX, Maximize, RotateCcw, RotateCw, Play, Pause, ExternalLink } from "lucide-react"
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
  const [isPlaying, setIsPlaying] = React.useState(true)
  const playPromiseRef = React.useRef<Promise<void> | null>(null)

  const { processedUrl, type, originalUrl } = React.useMemo(() => {
    if (!url) return { processedUrl: null, type: 'unknown', originalUrl: null }
    const u = url.trim()

    // SINTONIZADOR SNIPER v20.0 - MOTOR DE DETECÇÃO SOBERANO (EMBED MASTER)
    
    // XVideos Sniper
    if (u.includes('xvideos.com')) {
      const match = u.match(/video\.?([a-z0-9]+)/i) || u.match(/\/video([a-z0-9]+)\//i);
      const id = match ? (match[1] || match[0]).replace('video.', '').replace('/', '') : null;
      if (id) return { processedUrl: `https://www.xvideos.com/embedframe/${id}`, type: 'iframe', originalUrl: u }
    }

    // Dailymotion Sniper
    if (u.includes('dailymotion.com')) {
      const id = u.split('/video/')[1]?.split(/[?#&]/)[0];
      if (id) return { processedUrl: `https://www.dailymotion.com/embed/video/${id}?autoplay=1`, type: 'iframe', originalUrl: u }
    }

    // Pornhub Sniper
    if (u.includes('pornhub.com/view_video.php') || u.includes('viewkey=')) {
      const id = u.split('viewkey=')[1]?.split(/[&?#]/)[0];
      if (id) return { processedUrl: `https://www.pornhub.com/embed/${id}`, type: 'iframe', originalUrl: u }
    }

    // YouTube Sniper
    if (u.includes('youtube.com') || u.includes('youtu.be')) {
      const id = u.includes('v=') ? u.split('v=')[1]?.split('&')[0] : u.split('youtu.be/')[1]?.split('?')[0];
      return { processedUrl: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1`, type: 'iframe', originalUrl: u }
    }

    // Sinais Diretos (M3U8 / MP4 / TS)
    const isDirectStream = u.includes('.m3u8') || u.includes('.mp4') || u.includes('.ts') || u.includes('hls');
    return { 
      processedUrl: u, 
      type: isDirectStream ? (u.includes('.m3u8') ? 'hls' : 'video') : 'iframe', 
      originalUrl: u 
    }
  }, [url])

  const safePlay = React.useCallback(async () => {
    if (!videoRef.current) return;
    try {
      playPromiseRef.current = videoRef.current.play();
      await playPromiseRef.current;
      setIsPlaying(true);
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        videoRef.current.muted = true;
        setIsMuted(true);
        videoRef.current.play().catch(() => {});
      }
    } finally {
      playPromiseRef.current = null;
    }
  }, []);

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
      
      const isRestricted = originalUrl && (
        originalUrl.includes('phncdn.com') || 
        originalUrl.includes('xvideos') || 
        originalUrl.includes('archive.org') ||
        originalUrl.includes('blinder.space')
      );

      if (type === 'hls' && (window as any).Hls) {
        if ((window as any).Hls.isSupported()) {
          hls = new (window as any).Hls({
            enableWorker: true,
            xhrSetup: (xhr: any, requestUrl: string) => { 
              if (isRestricted || requestUrl.includes('.ts') || requestUrl.includes('.m3u8')) {
                if (!requestUrl.includes('/api/proxy')) {
                  xhr.open('GET', `/api/proxy?url=${encodeURIComponent(requestUrl)}`, true);
                }
              }
            }
          });

          const finalUrl = isRestricted ? `/api/proxy?url=${encodeURIComponent(processedUrl)}` : processedUrl;
          hls.loadSource(finalUrl);
          hls.attachMedia(video);
          
          hls.on((window as any).Hls.Events.MANIFEST_PARSED, () => {
            safePlay();
            setLoading(false);
          });

          hls.on((window as any).Hls.Events.ERROR, (_: any, data: any) => {
            if (data.fatal) {
              if (data.type === (window as any).Hls.ErrorTypes.NETWORK_ERROR) hls.startLoad();
              else if (data.type === (window as any).Hls.ErrorTypes.MEDIA_ERROR) hls.recoverMediaError();
              else { hls.destroy(); setError(true); }
            }
          });
        }
      } else if (type === 'video') {
        const finalUrl = isRestricted ? `/api/proxy?url=${encodeURIComponent(processedUrl)}` : processedUrl;
        video.src = finalUrl;
        video.load();
        safePlay();
      }
    };

    init();
    return () => { 
      if (hls) hls.destroy(); 
      if (video) {
        video.pause();
        video.src = "";
        video.load();
      }
    };
  }, [processedUrl, type, originalUrl, safePlay]);

  const toggleVolume = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (videoRef.current) {
      const newMute = !videoRef.current.muted;
      videoRef.current.muted = newMute;
      setIsMuted(newMute);
    }
  };

  const skip = (seconds: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.currentTime += seconds;
    }
  };

  const togglePlay = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (videoRef.current) {
      if (videoRef.current.paused) safePlay();
      else safePause();
    }
  };

  return (
    <div 
      ref={containerRef} 
      onClick={() => {
        if (videoRef.current && videoRef.current.muted) {
          videoRef.current.muted = false;
          setIsMuted(false);
        }
        togglePlay();
      }}
      className="relative aspect-video w-full bg-black rounded-[2.5rem] overflow-hidden border border-white/5 group shadow-2xl cursor-pointer"
    >
      {loading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary animate-pulse">Sintonizando Sinal Master...</p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-card/95 p-10 text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-white font-black uppercase italic tracking-tighter">Sinal Recusado pela Fonte Original</h3>
          <p className="text-[10px] text-muted-foreground uppercase mt-2">Tente abrir o link original em outra aba.</p>
          <div className="flex gap-4 mt-6">
            <Button variant="outline" onClick={() => window.location.reload()} className="border-white/10 uppercase font-black text-[10px] rounded-xl h-12 px-8">Recalibrar</Button>
            <Button variant="default" onClick={() => window.open(originalUrl!, '_blank')} className="bg-primary uppercase font-black text-[10px] rounded-xl h-12 px-8">
              <ExternalLink className="mr-2 h-4 w-4" /> Link Original
            </Button>
          </div>
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
          onLoadedData={() => setLoading(false)} 
          onError={() => setError(true)} 
          crossOrigin="anonymous" 
        />
      )}

      {!loading && !error && type !== 'iframe' && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-8">
          <div className="flex justify-end items-start">
            <button onClick={toggleVolume} className="h-14 w-14 bg-black/60 backdrop-blur-xl rounded-full flex items-center justify-center hover:bg-primary transition-all border border-white/10">
              {isMuted ? <VolumeX className="h-7 w-7 text-white" /> : <Volume2 className="h-7 w-7 text-white" />}
            </button>
          </div>

          <div className="flex items-center justify-center gap-16">
            <button onClick={(e) => skip(-10, e)} className="p-5 bg-white/5 backdrop-blur-md rounded-full hover:bg-primary/20 transition-all border border-white/5" title="Voltar 10s">
              <RotateCcw className="h-10 w-10 text-white" />
            </button>
            <button onClick={(e) => togglePlay(e)} className="p-8 bg-primary rounded-full hover:scale-110 transition-all shadow-[0_0_40px_rgba(var(--primary),0.5)]">
              {isPlaying ? <Pause className="h-12 w-12 text-white" fill="currentColor" /> : <Play className="h-12 w-12 text-white ml-2" fill="currentColor" />}
            </button>
            <button onClick={(e) => skip(10, e)} className="p-5 bg-white/5 backdrop-blur-md rounded-full hover:bg-primary/20 transition-all border border-white/5" title="Avançar 10s">
              <RotateCw className="h-10 w-10 text-white" />
            </button>
          </div>

          <div className="flex justify-end">
            <button onClick={(e) => { e.stopPropagation(); containerRef.current?.requestFullscreen(); }} className="h-14 w-14 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-primary transition-all">
              <Maximize className="h-7 w-7 text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
