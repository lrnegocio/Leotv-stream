
"use client"

import * as React from "react"
import { Loader2, AlertTriangle, Volume2, VolumeX, Maximize, RotateCcw, RotateCw, Play, Pause } from "lucide-react"
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

  const { processedUrl, type } = React.useMemo(() => {
    if (!url) return { processedUrl: null, type: 'unknown' }
    const u = url.trim()

    // 1. IFRAMES MASTER (RedeCanais, RD Canais, Players Prontos)
    if (u.includes('ch.php?') || u.includes('redecanaistv') || u.includes('rdcanais') || u.includes('player')) {
      return { processedUrl: u, type: 'iframe' }
    }

    // 2. EMBEDS DE ELITE (XVideos, Pornhub, YouTube)
    if (u.includes('xvideos.com')) {
      const id = u.match(/video\.?([a-z0-9]+)/i)?.[1] || u.split('video')[1]?.split('/')[0];
      return { processedUrl: id ? `https://www.xvideos.com/embedframe/${id.replace('.', '')}` : u, type: 'iframe' }
    }
    if (u.includes('pornhub.com')) {
      const id = u.split('viewkey=')[1]?.split(/[&?#]/)[0];
      return { processedUrl: id ? `https://www.pornhub.com/embed/${id}` : u, type: 'iframe' }
    }
    if (u.includes('youtube.com') || u.includes('youtu.be')) {
      const id = u.includes('v=') ? u.split('v=')[1]?.split('&')[0] : u.split('youtu.be/')[1]?.split('?')[0];
      return { processedUrl: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1`, type: 'iframe' }
    }

    // 3. TÚNEL MASTER (Archive.org, blinder.space, CDNs, HTTP)
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
      
      // Tenta iniciar SEMPRE com som liberado
      video.muted = false;
      setIsMuted(false);

      if (type === 'hls' && (window as any).Hls) {
        if ((window as any).Hls.isSupported()) {
          hls = new (window as any).Hls({
            enableWorker: true,
            lowLatencyMode: true
          });
          hls.loadSource(processedUrl);
          hls.attachMedia(video);
          hls.on((window as any).Hls.Events.MANIFEST_PARSED, () => {
            video.play().catch(() => {
              // Regra de segurança do navegador: se falhar autoplay com som, inicia mudo
              video.muted = true;
              setIsMuted(true);
              video.play().catch(() => setError(true));
            });
            setLoading(false);
          });
          hls.on((window as any).Hls.Events.ERROR, (_: any, data: any) => {
            if (data.fatal) setError(true);
          });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = processedUrl;
          video.addEventListener('loadedmetadata', () => { 
            video.play().catch(() => {
              video.muted = true;
              setIsMuted(true);
              video.play();
            }); 
            setLoading(false); 
          });
        }
      } else {
        video.src = processedUrl;
        video.load();
        video.play().catch(() => {
          video.muted = true;
          setIsMuted(true);
          video.play().catch(() => setError(true));
        });
      }
    };

    init();
    return () => { if (hls) hls.destroy(); };
  }, [processedUrl, type])

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
      if (videoRef.current.paused) {
        videoRef.current.play();
        setIsPlaying(true);
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  // Liberação de Áudio Master no primeiro clique na tela
  const handleContainerClick = () => {
    if (videoRef.current && videoRef.current.muted) {
      videoRef.current.muted = false;
      setIsMuted(false);
    }
    togglePlay();
  };

  return (
    <div 
      ref={containerRef} 
      onClick={handleContainerClick}
      className="relative aspect-video w-full bg-black rounded-[2rem] overflow-hidden border border-white/5 group shadow-2xl cursor-pointer"
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
          <h3 className="text-white font-black uppercase italic tracking-tighter">Sinal Master Offline ou Bloqueado</h3>
          <p className="text-[10px] text-muted-foreground uppercase mt-2">Verifique o link ou tente recalibrar.</p>
          <Button variant="outline" onClick={() => window.location.reload()} className="mt-6 border-white/10 uppercase font-black text-[10px] rounded-xl h-12 px-8">Tentar Reentry</Button>
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

      {/* CONTROLES SOBERANOS (Visíveis no Hover) */}
      {!loading && !error && type !== 'iframe' && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/80 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-between p-6">
          <div className="flex justify-between items-center">
            <h3 className="text-white font-black uppercase italic truncate max-w-md tracking-tighter drop-shadow-md">{title}</h3>
            <button 
              onClick={toggleVolume} 
              className="h-12 w-12 bg-black/40 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-primary transition-all shadow-xl border border-white/5"
            >
              {isMuted ? <VolumeX className="h-6 w-6 text-white" /> : <Volume2 className="h-6 w-6 text-white" />}
            </button>
          </div>

          <div className="flex items-center justify-center gap-12">
            <button onClick={(e) => skip(-10, e)} className="p-4 bg-white/10 backdrop-blur-md rounded-full hover:bg-primary transition-all group/btn">
              <RotateCcw className="h-8 w-8 text-white group-hover/btn:scale-110" />
            </button>
            
            <button onClick={togglePlay} className="p-6 bg-primary rounded-full hover:scale-110 transition-all shadow-2xl shadow-primary/40">
              {isPlaying ? <Pause className="h-10 w-10 text-white" fill="currentColor" /> : <Play className="h-10 w-10 text-white ml-1" fill="currentColor" />}
            </button>

            <button onClick={(e) => skip(10, e)} className="p-4 bg-white/10 backdrop-blur-md rounded-full hover:bg-primary transition-all group/btn">
              <RotateCw className="h-8 w-8 text-white group-hover/btn:scale-110" />
            </button>
          </div>

          <div className="flex justify-end">
            <button 
              onClick={(e) => { e.stopPropagation(); containerRef.current?.requestFullscreen(); }} 
              className="h-12 w-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center hover:bg-primary transition-all"
            >
              <Maximize className="h-6 w-6 text-white" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
