
"use client"

import * as React from "react"
import { Maximize, Loader2, SkipBack, SkipForward, Volume2, VolumeX, ExternalLink, AlertTriangle, RefreshCcw, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"

interface VideoPlayerProps {
  url: string
  title: string
  onNext?: () => void
  onPrev?: () => void
}

export function VideoPlayer({ url, title, onNext, onPrev }: VideoPlayerProps) {
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

  const { processedUrl, isHls, isYoutube, isIframe, isNoSandboxDomain } = React.useMemo(() => {
    if (!url || typeof url !== 'string' || url.trim() === "") return { processedUrl: null, isHls: false, isYoutube: false, isIframe: false, isNoSandboxDomain: false }
    const targetUrl = url.trim()

    // SINAIS QUE BLOQUEIAM SANDBOX (Rei dos Canais / RdCanais)
    const isProtectedSource = targetUrl.includes('rdcanais.com') || targetUrl.includes('reidoscanais.ooo');

    // YOUTUBE
    if (targetUrl.includes('youtube.com') || targetUrl.includes('youtu.be')) {
      const id = targetUrl.includes('v=') ? targetUrl.split('v=')[1]?.split('&')[0] : targetUrl.split('youtu.be/')[1]?.split('?')[0];
      return { 
        processedUrl: `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&mute=0&rel=0&modestbranding=1&controls=1`,
        isHls: false, isYoutube: true, isIframe: true, isNoSandboxDomain: false
      }
    }

    // HLS / M3U8 / TS (IPTV Direto)
    const isDirectStream = /\.(m3u8|ts|mp4|mkv)$/i.test(targetUrl.split('?')[0]) || targetUrl.includes('.m3u8') || targetUrl.includes('.ts');

    return { 
      processedUrl: targetUrl, 
      isHls: isDirectStream, 
      isYoutube: false, 
      isIframe: !isDirectStream,
      isNoSandboxDomain: isProtectedSource
    };
  }, [url])

  React.useEffect(() => {
    if (!isHls || !videoRef.current || !processedUrl) return;

    let hls: any = null;
    const video = videoRef.current;

    const loadHls = async () => {
      // @ts-ignore
      if (typeof Hls !== 'undefined') {
        // @ts-ignore
        if (Hls.isSupported()) {
          // @ts-ignore
          hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 90
          });
          hls.loadSource(processedUrl);
          hls.attachMedia(video);
          hls.on('hlsManifestParsed', () => {
            video.play().catch(() => {});
            setLoading(false);
          });
          hls.on('hlsError', (event: any, data: any) => {
            if (data.fatal) {
              setHasError(true);
              setLoading(false);
            }
          });
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
          video.src = processedUrl;
          video.addEventListener('loadedmetadata', () => {
            video.play().catch(() => {});
            setLoading(false);
          });
        }
      } else {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/hls.js@latest';
        script.onload = () => loadHls();
        document.head.appendChild(script);
      }
    };

    loadHls();

    return () => {
      if (hls) hls.destroy();
    };
  }, [isHls, processedUrl]);

  const openExternal = () => {
    window.open(url, '_blank', 'width=1280,height=720,menubar=no,toolbar=no,location=no,status=no');
  }

  if (!isMounted) return <div className="aspect-video bg-black rounded-3xl animate-pulse" />

  return (
    <div ref={containerRef} className="group relative aspect-video w-full overflow-hidden bg-black shadow-2xl rounded-3xl border border-white/5 select-none">
      <div className="absolute top-4 left-4 z-[80] flex items-center gap-2 bg-primary/20 backdrop-blur-md px-3 py-1.5 rounded-full border border-primary/30 opacity-0 group-hover:opacity-100 transition-opacity">
        <ShieldCheck className="h-3 w-3 text-primary animate-pulse" />
        <span className="text-[8px] font-black text-primary uppercase tracking-widest">Sinal Master Blindado Ativo</span>
      </div>

      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black z-[60]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <span className="mt-4 text-[10px] font-black text-primary uppercase animate-pulse tracking-widest">Sintonizando sinal master...</span>
        </div>
      )}

      {isHls ? (
        <video 
          ref={videoRef}
          key={processedUrl} 
          autoPlay 
          muted={isMuted} 
          playsInline
          className="h-full w-full object-contain relative z-10" 
          onError={() => { setLoading(false); setHasError(true); }} 
        />
      ) : isIframe ? (
        <iframe 
          key={processedUrl} 
          src={processedUrl!} 
          className="h-full w-full border-0 relative z-10" 
          allowFullScreen 
          allow="autoplay; encrypted-media; picture-in-picture"
          // MODO BRAVE: Bloqueia tudo EXCETO o necessário. Se for rdcanais, remove o sandbox para evitar o erro.
          sandbox={isNoSandboxDomain ? undefined : "allow-scripts allow-same-origin allow-forms allow-presentation allow-modals"}
          onLoad={() => setLoading(false)} 
          onError={() => { setLoading(false); setHasError(true); }} 
        />
      ) : (
        <video 
          key={processedUrl} 
          src={processedUrl!} 
          autoPlay 
          muted={isMuted} 
          controls 
          className="h-full w-full object-contain relative z-10" 
          onLoadedData={() => setLoading(false)} 
          onError={() => { setLoading(false); setHasError(true); }} 
        />
      )}

      {hasError && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#1E161D]/95 z-[70] p-10 text-center space-y-6">
           <AlertTriangle className="h-16 w-16 text-destructive animate-pulse" />
           <h3 className="text-2xl font-black uppercase italic text-destructive tracking-tighter">SINAL INSTÁVEL</h3>
           <p className="text-[10px] uppercase font-bold text-white/40">O sinal de origem pode estar offline ou bloqueado para este player.</p>
           <div className="flex gap-4">
             <Button onClick={() => window.location.reload()} variant="outline" className="text-white border-white/10 font-black uppercase text-[10px] rounded-2xl h-14 px-8"><RefreshCcw className="mr-2 h-4 w-4" /> RECARREGAR</Button>
             <Button onClick={openExternal} className="bg-primary text-white font-black uppercase text-[10px] rounded-2xl h-14 px-8"><ExternalLink className="mr-2 h-4 w-4" /> ABRIR EXTERNO</Button>
           </div>
        </div>
      )}
      
      <div className="absolute inset-0 z-40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
        <div className="absolute top-0 inset-x-0 p-6 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between pointer-events-auto">
          <h3 className="text-xl font-black text-white uppercase italic truncate max-w-md">{title}</h3>
          <div className="flex gap-2">
            <Button variant="ghost" size="icon" onClick={openExternal} className="h-14 w-14 bg-black/40 hover:bg-primary rounded-full shadow-2xl transition-all"><ExternalLink className="h-6 w-6 text-white" /></Button>
            <button className="h-14 w-14 bg-black/40 hover:bg-primary rounded-full flex items-center justify-center transition-all shadow-2xl" onClick={() => setIsMuted(!isMuted)}>
              {isMuted ? <VolumeX className="h-8 w-8 text-destructive" /> : <Volume2 className="h-8 w-8 text-primary" />}
            </button>
          </div>
        </div>

        <div className="absolute inset-y-0 left-0 flex items-center pl-6 z-50 pointer-events-auto">
          {onPrev && (
            <Button variant="ghost" size="icon" onClick={onPrev} className="h-16 w-16 rounded-full bg-black/60 text-white hover:bg-primary shadow-2xl flex"><SkipBack className="h-10 w-10" /></Button>
          )}
        </div>
        <div className="absolute inset-y-0 right-0 flex items-center pr-6 z-50 pointer-events-auto">
          {onNext && (
            <Button variant="ghost" size="icon" onClick={onNext} className="h-16 w-16 rounded-full bg-black/60 text-white hover:bg-primary shadow-2xl flex"><SkipForward className="h-10 w-10" /></Button>
          )}
        </div>

        <div className="absolute bottom-0 inset-x-0 p-8 bg-gradient-to-t from-black/80 to-transparent flex justify-end pointer-events-auto">
          <Button variant="ghost" size="icon" className="text-white h-12 w-12" onClick={() => containerRef.current?.requestFullscreen()}><Maximize className="h-6 w-6" /></Button>
        </div>
      </div>
    </div>
  )
}
