"use client"

import * as React from "react"
import { Loader2, AlertCircle, Maximize, Minimize, Play, Pause, ChevronRight, ChevronLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

interface VideoPlayerProps {
  url: string
  title: string
  id?: string
  onNext?: () => void
  onPrev?: () => void
}

/**
 * PLAYER MASTER SOBERANO v278 - CONTROLE DE FLUXO E PERFORMANCE
 * Sistema de sintonização estabilizado para evitar reinícios e erro de sandbox.
 */
export function VideoPlayer({ url, title, onNext, onPrev }: VideoPlayerProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(false)
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const [isMounted, setIsMounted] = React.useState(false)
  const [playerKey, setPlayerKey] = React.useState(0)
  const [isPlaying, setIsPlaying] = React.useState(false)
  
  const hlsRef = React.useRef<any>(null)
  const mpegtsRef = React.useRef<any>(null)

  const lowUrl = (url || "").toLowerCase();
  
  const isIframeSite = 
    lowUrl.includes('rdcanais') || 
    lowUrl.includes('redecanaistv') || 
    lowUrl.includes('tvacabo') || 
    lowUrl.includes('reidoscanais') || 
    lowUrl.includes('playcnvs') ||
    lowUrl.includes('youtube.com') ||
    lowUrl.includes('youtu.be') ||
    lowUrl.includes('spotify.com');
  
  const isIframe = isIframeSite || (!lowUrl.includes('.m3u8') && !lowUrl.includes('.ts') && !lowUrl.includes('.mp4') && lowUrl.includes('http'));
  const isDirectFile = lowUrl.includes('.mp4') || lowUrl.includes('archive.org') || lowUrl.includes('mlstatic.com');
  const isHls = !isIframe && (lowUrl.includes('.m3u8') || lowUrl.includes('/api/proxy'));
  const isTs = !isIframe && lowUrl.includes('.ts') && !lowUrl.includes('.m3u8');

  // PROTOCOLO DE DESBLOQUEIO MESTRE: Remoção TOTAL do sandbox para evitar detecção
  const needsSandboxRemoval = lowUrl.includes('reidoscanais') || lowUrl.includes('rdcanais') || lowUrl.includes('redecanaistv');

  const cleanup = React.useCallback(() => {
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
    if (mpegtsRef.current) { mpegtsRef.current.destroy(); mpegtsRef.current = null; }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.removeAttribute('src');
      videoRef.current.load();
    }
  }, [])

  const initPlayer = React.useCallback(async () => {
    if (!isMounted || !url) return
    setError(false);
    setLoading(true);

    if (isIframe) {
      setLoading(false);
      // Mantém a chave se ela já existir para evitar reinício ao despausar
      if (playerKey === 0) setPlayerKey(Date.now());
      setIsPlaying(true);
      return;
    }

    if (isDirectFile) {
      if (videoRef.current) {
        videoRef.current.src = url;
        videoRef.current.load();
        videoRef.current.play().then(() => setIsPlaying(true)).catch(() => {
          if (videoRef.current) videoRef.current.muted = true;
          videoRef.current?.play();
          setIsPlaying(true);
        });
        setLoading(false);
      }
      return;
    }

    try {
      if (isTs && (window as any).mpegts) {
        const mpegts = (window as any).mpegts;
        const player = mpegts.createPlayer({ type: 'mse', isLive: true, url: url });
        player.attachMediaElement(videoRef.current);
        player.load();
        player.play().then(() => setIsPlaying(true)).catch(() => { 
          if (videoRef.current) videoRef.current.muted = true; 
          player.play(); 
          setIsPlaying(true);
        });
        mpegtsRef.current = player;
        setLoading(false);
      } else if (isHls && (window as any).Hls) {
        const Hls = (window as any).Hls;
        const hls = new Hls({ enableWorker: true });
        hls.loadSource(url);
        hls.attachMedia(videoRef.current);
        hlsRef.current = hls;
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          setLoading(false);
          videoRef.current?.play().then(() => setIsPlaying(true)).catch(() => {
            if (videoRef.current) videoRef.current.muted = true;
            videoRef.current?.play();
            setIsPlaying(true);
          });
        });
      }
    } catch (e) { setError(true); setLoading(false); }
  }, [url, isMounted, isDirectFile, isHls, isTs, isIframe, playerKey]);

  React.useEffect(() => {
    setIsMounted(true);
    initPlayer();
    return () => cleanup();
  }, [initPlayer, cleanup, url]);

  const handleTogglePlay = () => {
    if (isIframe) {
      // Para Iframes, alternamos a visibilidade e o "play" visual sem destruir a sintonização
      setIsPlaying(!isPlaying);
      return;
    }

    if (videoRef.current) {
      if (videoRef.current.paused) {
        videoRef.current.play().then(() => setIsPlaying(true));
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {
        const el = containerRef.current as any;
        if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
      });
      setIsFullscreen(true)
    } else {
      if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
      setIsFullscreen(false)
    }
  };

  if (!isMounted) return null;

  let finalIframeSrc = url;
  if (playerKey > 0) {
    const separator = url.includes('?') ? '&' : '?';
    finalIframeSrc = `${url}${separator}autoplay=1&mute=1&t=${playerKey}`;
  }

  return (
    <div ref={containerRef} className={`relative w-full bg-black flex items-center justify-center ${isFullscreen ? 'h-screen w-screen z-[999]' : 'h-[85vh] rounded-none md:rounded-[3rem] overflow-hidden shadow-2xl'}`}>
      
      {loading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-[10px] font-black uppercase text-white/40 mt-4 tracking-widest">Sintonizando...</p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-[140] flex flex-col items-center justify-center bg-black/95 text-center p-10">
          <AlertCircle className="h-16 w-16 text-destructive mb-6" />
          <p className="text-white font-black uppercase text-xs">Sinal Master Indisponível.</p>
          <Button onClick={() => { cleanup(); initPlayer(); }} variant="outline" className="mt-4">TENTAR RECONEXÃO</Button>
        </div>
      )}
      
      {isIframe ? (
        <div className={`relative w-full h-full transition-opacity duration-300 ${!isPlaying ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          {playerKey > 0 && (
            <iframe 
              src={finalIframeSrc} 
              className="w-full h-full border-0"
              allow="autoplay; encrypted-media; fullscreen" 
              // BLINDAGEM MESTRE: Omissão total do sandbox para evitar qualquer detecção
              sandbox={needsSandboxRemoval ? undefined : "allow-scripts allow-same-origin allow-forms allow-modals"}
              onLoad={() => setLoading(false)}
            />
          )}
        </div>
      ) : (
        <video 
          ref={videoRef} 
          className="w-full h-full object-contain" 
          autoPlay playsInline controls preload="auto"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        />
      )}

      {/* TELA DE PAUSA PARA IFRAME */}
      {isIframe && !isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-[145]">
           <div className="text-center space-y-4">
              <button 
                onClick={handleTogglePlay}
                className="h-24 w-24 rounded-full bg-primary/20 flex items-center justify-center hover:scale-110 transition-transform group"
              >
                <Play className="h-12 w-12 text-primary fill-primary animate-pulse" />
              </button>
              <p className="text-[10px] font-black uppercase text-primary/40 tracking-widest">Sinal em Pausa</p>
              <Button onClick={handleTogglePlay} className="bg-primary rounded-xl font-black uppercase px-8 shadow-xl">RETOMAR SINAL</Button>
           </div>
        </div>
      )}

      {/* CONTROLES MASTER */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[150] bg-black/60 px-6 py-2 rounded-full border border-white/10 backdrop-blur-md pointer-events-none">
         <p className="text-[10px] font-black uppercase italic text-primary truncate max-w-[300px]">{title}</p>
      </div>

      <div className="absolute bottom-6 right-6 z-[150] flex gap-2">
        {onPrev && <button onClick={onPrev} className="h-10 w-10 rounded-xl bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-primary transition-all"><ChevronLeft className="h-4 w-4 text-white" /></button>}
        
        <button 
          onClick={handleTogglePlay} 
          className="h-12 w-12 rounded-2xl bg-primary shadow-xl flex items-center justify-center border border-white/20 hover:scale-110 active:scale-95 transition-all"
          title="Executar/Pausar Sinal"
        >
          {isPlaying ? <Pause className="h-6 w-6 text-white fill-white" /> : <Play className="h-6 w-6 text-white fill-white" />}
        </button>

        <button onClick={toggleFullscreen} className="h-10 w-10 rounded-xl bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-primary transition-all">
          {isFullscreen ? <Minimize className="h-4 w-4 text-white" /> : <Maximize className="h-4 w-4 text-white" />}
        </button>
        
        {onNext && <button onClick={onNext} className="h-10 w-10 rounded-xl bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-primary transition-all"><ChevronRight className="h-4 w-4 text-white" /></button>}
      </div>
    </div>
  )
}
