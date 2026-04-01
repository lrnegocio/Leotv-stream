
"use client"

import * as React from "react"
import { Maximize, Loader2, Volume2, VolumeX, ShieldCheck, AlertTriangle } from "lucide-react"
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
    setLoading(true)
    setError(false)
  }, [url])

  const { processedUrl, type } = React.useMemo(() => {
    if (!url || typeof url !== 'string') return { processedUrl: null, type: 'unknown' }
    const targetUrl = url.trim()
    
    // 1. DETECÇÃO DE IMAGEM
    if (/\.(jpg|jpeg|png|gif|webp|bmp|svg)/i.test(targetUrl) || targetUrl.includes('gstatic.com') || targetUrl.includes('picsum.photos')) {
      return { processedUrl: targetUrl, type: 'image' }
    }

    // 2. EMBEDS DE ELITE (IFRAME MASTER)
    // SINTONIZADOR XVIDEOS SNIPER v3.0 (ID Alfanumérico)
    if (targetUrl.includes('xvideos.com/video')) {
      const match = targetUrl.match(/video\.([a-z0-9]+)/i);
      const id = match ? match[1] : null;
      if (id) return { processedUrl: `https://www.xvideos.com/embedframe/${id}`, type: 'iframe' }
    }

    if (targetUrl.includes('youtube.com') || targetUrl.includes('youtu.be')) {
      const id = targetUrl.includes('v=') ? targetUrl.split('v=')[1]?.split('&')[0] : targetUrl.split('youtu.be/')[1]?.split('?')[0];
      return { processedUrl: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1`, type: 'iframe' }
    }

    if (targetUrl.includes('dailymotion.com') || targetUrl.includes('dai.ly')) {
      let id = "";
      if (targetUrl.includes('video/')) id = targetUrl.split('video/')[1]?.split(/[?#]/)[0];
      else if (targetUrl.includes('dai.ly/')) id = targetUrl.split('dai.ly/')[1]?.split(/[?#]/)[0];
      if (id) return { processedUrl: `https://www.dailymotion.com/embed/video/${id}?autoplay=1`, type: 'iframe' }
    }

    if (targetUrl.includes('redecanaistv.cafe') || targetUrl.includes('ch.php')) {
      return { processedUrl: targetUrl, type: 'iframe' }
    }

    // 3. TÚNEL MASTER PARA LINKS PROTEGIDOS (Archive.org, CDNs, HTTP)
    let finalUrl = targetUrl;
    const lowUrl = targetUrl.toLowerCase();
    
    if (
      targetUrl.startsWith('http://') || 
      targetUrl.includes('archive.org') || 
      targetUrl.includes('xvideos-cdn.com') || 
      targetUrl.includes('blinder.space')
    ) {
      finalUrl = `/api/proxy?url=${encodeURIComponent(targetUrl)}`;
    }

    if (lowUrl.includes('.m3u8')) return { processedUrl: finalUrl, type: 'hls' }
    if (lowUrl.includes('.mp4') || lowUrl.includes('.webm')) return { processedUrl: finalUrl, type: 'video' }
    
    return { processedUrl: finalUrl, type: 'video' }
  }, [url])

  React.useEffect(() => {
    if (!videoRef.current || !processedUrl || type === 'image' || type === 'iframe') return;

    const video = videoRef.current;
    let hls: any = null;
    
    const initPlayer = () => {
      // Limpa estado anterior para não sobrepor áudio
      video.pause();
      video.removeAttribute('src');
      video.load();

      // MOTOR HLS MASTER
      // @ts-ignore
      if (type === 'hls' && window.Hls && window.Hls.isSupported()) {
        // @ts-ignore
        hls = new window.Hls({ 
          enableWorker: true, 
          lowLatencyMode: true,
          xhrSetup: (xhr: any) => { xhr.withCredentials = false; }
        });
        hls.loadSource(processedUrl);
        hls.attachMedia(video);
        hls.on('hlsManifestParsed', () => { 
          video.play().catch(() => { video.muted = true; video.play().catch(() => {}); }); 
          setLoading(false); 
        });
        hls.on('hlsError', (e: any, data: any) => { if (data.fatal) setError(true); });
      } 
      // MOTOR NATIVO MP4 / WEBM
      else if (type === 'video') {
        video.src = processedUrl;
        video.play().catch(() => {
          video.muted = true;
          video.play().catch(() => { setLoading(false); });
        });
      }
    };

    const timeout = setTimeout(initPlayer, 300);
    return () => { 
      clearTimeout(timeout);
      if (hls) hls.destroy(); 
    };
  }, [type, processedUrl]);

  if (!isMounted) return <div className="aspect-video bg-black rounded-[2.5rem] animate-pulse" />

  return (
    <div ref={containerRef} className="group relative aspect-video w-full overflow-hidden bg-black shadow-2xl rounded-[2.5rem] border border-white/5 select-none">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-16 w-16 animate-spin text-primary" />
            <p className="text-[10px] font-black uppercase text-primary tracking-[0.3em] animate-pulse">Sintonizando Fluxo Master...</p>
          </div>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-card/90 z-20 p-10 text-center">
          <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
          <h3 className="text-lg font-black uppercase text-white">Sinal Offline ou Incompatível</h3>
          <p className="text-[10px] text-muted-foreground uppercase mb-6">O link original pode estar fora do ar ou bloqueou o acesso.</p>
          <div className="flex gap-4">
            <Button variant="outline" onClick={() => window.location.reload()} className="border-white/10 uppercase font-black text-[10px] h-12 px-8 rounded-xl">REENTRAR</Button>
            <Button variant="outline" onClick={() => window.open(url, '_blank')} className="border-white/10 uppercase font-black text-[10px] h-12 px-8 rounded-xl">ABRIR EXTERNO</Button>
          </div>
        </div>
      )}

      {type === 'image' ? (
        <img src={processedUrl!} alt={title} className="w-full h-full object-contain" onLoad={() => setLoading(false)} />
      ) : type === 'iframe' ? (
        <iframe 
          key={processedUrl}
          src={processedUrl!} 
          className="h-full w-full border-0" 
          allowFullScreen 
          allow="autoplay; encrypted-media; picture-in-picture" 
          onLoad={() => setLoading(false)} 
        />
      ) : (
        <video 
          ref={videoRef} 
          key={processedUrl} 
          autoPlay 
          muted={isMuted} 
          playsInline 
          controls={!loading && !error}
          crossOrigin="anonymous" 
          className="h-full w-full object-contain" 
          onLoadedData={() => setLoading(false)} 
          onError={() => { if (!loading) setError(true); }} 
        />
      )}
      
      <div className="absolute inset-0 z-40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
        <div className="absolute top-0 inset-x-0 p-8 bg-gradient-to-b from-black/90 to-transparent flex items-center justify-between pointer-events-auto">
          <h3 className="text-xl font-black text-white uppercase italic truncate max-w-xl tracking-tighter">{title}</h3>
          <button className="h-12 w-12 bg-black/40 hover:bg-primary rounded-full flex items-center justify-center transition-all" onClick={() => setIsMuted(!isMuted)}>
            {isMuted ? <VolumeX className="h-5 w-5 text-destructive" /> : <Volume2 className="h-5 w-5 text-primary" />}
          </button>
        </div>

        <div className="absolute bottom-0 inset-x-0 p-8 bg-gradient-to-t from-black/90 to-transparent flex justify-between items-center pointer-events-auto">
          <div className="flex gap-4">
             <div className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-xl border border-primary/20">
               <ShieldCheck className="h-4 w-4 text-primary" />
               <span className="text-[10px] font-black uppercase tracking-widest text-primary">SINAL BLINDADO v9.2</span>
             </div>
          </div>
          <div className="flex gap-4 items-center">
            <Button variant="ghost" size="icon" className="text-white h-12 w-12 hover:bg-primary/20 rounded-full" onClick={() => containerRef.current?.requestFullscreen()}><Maximize className="h-6 w-6" /></Button>
          </div>
        </div>
      </div>
    </div>
  )
}
