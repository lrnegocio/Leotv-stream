
"use client"

import * as React from "react"
import { Maximize, Loader2, Volume2, VolumeX, ShieldCheck, ExternalLink, RefreshCcw } from "lucide-react"
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
    
    // 1. DETECÇÃO DE IMAGEM MASTER
    const isImage = /\.(jpg|jpeg|png|gif|webp|bmp|svg)/i.test(targetUrl) || 
                   targetUrl.includes('gstatic.com') || 
                   targetUrl.includes('images?q=tbn') ||
                   targetUrl.includes('picsum.photos') ||
                   targetUrl.includes('encrypted-tbn');
    
    if (isImage) return { processedUrl: targetUrl, type: 'image' }

    // 2. SINTONIZADOR XVIDEOS MASTER
    if (targetUrl.includes('xvideos.com')) {
      const parts = targetUrl.split('video.');
      if (parts.length > 1) {
        const id = parts[1].split('/')[0];
        return {
          processedUrl: `https://www.xvideos.com/embedframe/${id}`,
          type: 'xvideos'
        }
      }
    }

    // 3. SUPORTE YOUTUBE
    if (targetUrl.includes('youtube.com') || targetUrl.includes('youtu.be')) {
      const id = targetUrl.includes('v=') ? targetUrl.split('v=')[1]?.split('&')[0] : targetUrl.split('youtu.be/')[1]?.split('?')[0];
      return { 
        processedUrl: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=0&rel=0&modestbranding=1&controls=1`,
        type: 'youtube'
      }
    }

    // 4. TÚNEL MASTER PARA LINKS HTTP (Resolve o bloqueio do blinder.space e outros)
    let finalUrl = targetUrl;
    if (targetUrl.startsWith('http://')) {
      finalUrl = `/api/proxy?url=${encodeURIComponent(targetUrl)}`;
    }

    const lowUrl = targetUrl.toLowerCase();
    if (lowUrl.includes('.m3u8')) return { processedUrl: finalUrl, type: 'hls' }
    if (lowUrl.includes('.ts')) return { processedUrl: finalUrl, type: 'mpegts' }
    if (lowUrl.includes('.mp4') || lowUrl.includes('.mkv') || lowUrl.includes('.mov') || lowUrl.includes('.avi')) return { processedUrl: finalUrl, type: 'video' }
    
    // Fallback para vídeo se tiver extensão de mídia
    return { processedUrl: finalUrl, type: 'video' }
  }, [url])

  React.useEffect(() => {
    if (!videoRef.current || !processedUrl || type === 'image' || type === 'youtube' || type === 'xvideos') return;

    const video = videoRef.current;
    let hls: any = null;
    let mpegtsPlayer: any = null;
    
    const initPlayer = () => {
      // @ts-ignore
      if (type === 'hls' && window.Hls && window.Hls.isSupported()) {
        // @ts-ignore
        hls = new window.Hls({ 
          enableWorker: true, 
          lowLatencyMode: true,
          // Não tenta atualizar links HTTP internos para HTTPS se já estivermos no túnel
          xhrSetup: (xhr: any) => { xhr.withCredentials = false; }
        });
        hls.loadSource(processedUrl);
        hls.attachMedia(video);
        hls.on('hlsManifestParsed', () => { 
          video.play().catch(() => { video.muted = true; video.play().catch(() => {}); }); 
          setLoading(false); 
        });
        hls.on('hlsError', (event: any, data: any) => {
          if (data.fatal) {
            console.error("Erro fatal HLS:", data);
            setLoading(false);
          }
        });
      } 
      // @ts-ignore
      else if ((type === 'mpegts' || processedUrl.includes('.ts')) && window.mpegts && window.mpegts.isSupported()) {
        // @ts-ignore
        mpegtsPlayer = window.mpegts.createPlayer({ type: 'mse', url: processedUrl });
        mpegtsPlayer.attachMediaElement(video);
        mpegtsPlayer.load();
        mpegtsPlayer.play().catch(() => { video.muted = true; mpegtsPlayer.play().catch(() => {}); });
        setLoading(false);
      }
      else {
        video.src = processedUrl;
        video.load();
        video.play().catch(() => {
          video.muted = true;
          video.play().catch(() => setLoading(false));
        });
      }
    };

    const timeout = setTimeout(initPlayer, 300);
    return () => { 
      clearTimeout(timeout);
      if (hls) hls.destroy(); 
      if (mpegtsPlayer) mpegtsPlayer.destroy();
    };
  }, [type, processedUrl]);

  if (!isMounted) return <div className="aspect-video bg-black rounded-3xl animate-pulse" />

  return (
    <div ref={containerRef} className="group relative aspect-video w-full overflow-hidden bg-black shadow-2xl rounded-3xl border border-white/5 select-none">
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-[60]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <span className="mt-4 text-[10px] font-black text-primary uppercase animate-pulse tracking-widest">SINTONIZANDO SINAL MASTER...</span>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-[70] p-10 text-center">
          <RefreshCcw className="h-12 w-12 text-destructive mb-4 animate-spin-slow" />
          <h3 className="text-xl font-black uppercase text-white mb-2">Sinal Instável</h3>
          <p className="text-[10px] text-muted-foreground uppercase mb-6">O servidor externo está oscilando ou bloqueado.</p>
          <Button onClick={() => window.location.reload()} className="bg-primary uppercase font-black text-xs h-12 px-8 rounded-xl">Recarregar Sistema</Button>
        </div>
      )}

      {type === 'image' ? (
        <div className="relative w-full h-full flex items-center justify-center bg-black">
          <img src={processedUrl!} alt={title} className="max-w-full max-h-full object-contain" onLoad={() => setLoading(false)} onError={() => { setLoading(false); setError(true); }} />
        </div>
      ) : (type === 'youtube' || type === 'xvideos') ? (
        <iframe 
          key={processedUrl} 
          src={processedUrl!} 
          className="h-full w-full border-0" 
          allowFullScreen 
          allow="autoplay; encrypted-media" 
          onLoad={() => setLoading(false)} 
        />
      ) : (
        <video 
          ref={videoRef} 
          key={processedUrl} 
          autoPlay 
          muted={isMuted} 
          playsInline 
          webkit-playsinline="true"
          crossOrigin="anonymous" 
          className="h-full w-full object-contain" 
          onLoadedData={() => setLoading(false)} 
          onError={() => { setLoading(false); setError(true); }} 
        />
      )}
      
      <div className="absolute inset-0 z-40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="absolute top-0 inset-x-0 p-6 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between pointer-events-auto">
          <h3 className="text-xl font-black text-white uppercase italic truncate max-w-md">{title}</h3>
          <button className="h-12 w-12 bg-black/40 hover:bg-primary rounded-full flex items-center justify-center transition-all shadow-2xl" onClick={() => setIsMuted(!isMuted)}>
            {isMuted ? <VolumeX className="h-6 w-6 text-destructive" /> : <Volume2 className="h-6 w-6 text-primary" />}
          </button>
        </div>

        <div className="absolute bottom-0 inset-x-0 p-8 bg-gradient-to-t from-black/80 to-transparent flex justify-between items-center pointer-events-auto">
          <div className="flex gap-4">
             <Button className="h-12 px-6 rounded-xl bg-primary text-white font-black uppercase text-[10px]" onClick={() => window.open(url || "", '_blank')}>
               <ExternalLink className="mr-2 h-4 w-4" /> LINK EXTERNO DIRETO
             </Button>
          </div>
          <div className="flex gap-4 items-center">
            <div className="flex items-center gap-2 px-4 py-2 bg-black/40 rounded-full border border-white/5">
              <ShieldCheck className="h-4 w-4 text-primary" />
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">SINAL BLINDADO</span>
            </div>
            <Button variant="ghost" size="icon" className="text-white h-12 w-12 hover:bg-primary/20" onClick={() => containerRef.current?.requestFullscreen()}><Maximize className="h-6 w-6" /></Button>
          </div>
        </div>
      </div>
    </div>
  )
}
