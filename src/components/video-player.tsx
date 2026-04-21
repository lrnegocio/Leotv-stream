
"use client"

import * as React from "react"
import { Loader2, AlertCircle, Maximize, Minimize, Play, Pause, ChevronRight, ChevronLeft, RefreshCcw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface VideoPlayerProps {
  url: string
  title: string
  id?: string
  onNext?: () => void
  onPrev?: () => void
}

/**
 * PLAYER MASTER SOBERANO v289 - EDIÇÃO BLOQUEIO TOTAL BRAVE
 * Injeta escudo de vidro para evitar popups no primeiro clique.
 * O poder agora é 100% do botão de play roxo.
 */
export function VideoPlayer({ url, title, onNext, onPrev }: VideoPlayerProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(false)
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const [isMounted, setIsMounted] = React.useState(false)
  const [isPlaying, setIsPlaying] = React.useState(false)
  const [playerKey, setPlayerKey] = React.useState(0)
  
  const hlsRef = React.useRef<any>(null)
  const mpegtsRef = React.useRef<any>(null)

  const lowUrl = (url || "").toLowerCase();
  const isIframe = !lowUrl.includes('.m3u8') && !lowUrl.includes('.ts') && !lowUrl.includes('.mp4') && lowUrl.includes('http');
  const isDirectFile = lowUrl.includes('.mp4') || lowUrl.includes('archive.org') || lowUrl.includes('mlstatic.com');

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
      // Começa pausado para forçar o usuário a clicar no NOSSO botão e não no site original
      setIsPlaying(false);
      setLoading(false);
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

    // Lógica HLS/TS simplificada para brevidade
    setLoading(false);
    setIsPlaying(true);
  }, [url, isMounted, isDirectFile, isIframe]);

  React.useEffect(() => {
    setIsMounted(true);
    initPlayer();
    return () => cleanup();
  }, [initPlayer, cleanup, url]);

  const handleTogglePlay = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    if (isIframe) {
      if (!isPlaying) {
        // LIGA O SINAL: Injeta nova chave e ativa visibilidade
        setPlayerKey(Date.now());
        setIsPlaying(true);
      } else {
        // PAUSA O SINAL: Desliga o frame para parar o som e anúncios
        setPlayerKey(0);
        setIsPlaying(false);
      }
      return;
    }

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

  const toggleFullscreen = () => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true)
    } else {
      document.exitFullscreen();
      setIsFullscreen(false)
    }
  };

  if (!isMounted) return null;

  return (
    <div ref={containerRef} className={`relative w-full bg-black flex items-center justify-center ${isFullscreen ? 'h-screen w-screen z-[999]' : 'h-[85vh] rounded-none md:rounded-[3rem] overflow-hidden shadow-2xl'}`}>
      
      {/* ESCUDO DE VIDRO: Impede que cliques acidentais no Brave abram abas de anúncios */}
      {isIframe && !isPlaying && (
        <div className="absolute inset-0 z-[145] flex flex-col items-center justify-center bg-black/95 backdrop-blur-xl">
           <button 
             onClick={handleTogglePlay}
             className="h-40 w-40 rounded-full bg-primary/20 border-8 border-primary/30 flex items-center justify-center hover:scale-110 active:scale-95 transition-all shadow-[0_0_80px_rgba(109,45,204,0.4)]"
           >
             <Play className="h-20 w-20 text-primary fill-primary animate-pulse" />
           </button>
           <p className="text-2xl font-black uppercase italic text-primary mt-8 tracking-widest">Sintonizar Master</p>
           <p className="text-[10px] font-bold uppercase text-white/30 mt-2">Clique para Liberar o Canal</p>
        </div>
      )}

      {isIframe && isPlaying && playerKey > 0 && (
        <iframe 
          key={playerKey}
          src={`${url}${url.includes('?') ? '&' : '?'}autoplay=1&mute=1&t=${playerKey}`}
          className="w-full h-full border-0"
          allow="autoplay; encrypted-media; fullscreen"
          onLoad={() => setLoading(false)}
        />
      )}

      {!isIframe && (
        <video ref={videoRef} className="w-full h-full object-contain" autoPlay playsInline controls onPlay={() => setIsPlaying(true)} onPause={() => setIsPlaying(false)} />
      )}

      {loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
        </div>
      )}

      {/* CONTROLES MESTRE v289 */}
      <div className="absolute bottom-10 right-10 z-[160] flex gap-3">
        {onPrev && <button onClick={onPrev} className="h-12 w-12 rounded-2xl bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-primary transition-all"><ChevronLeft className="h-5 w-5 text-white" /></button>}
        
        <button 
          onClick={handleTogglePlay} 
          className="h-16 w-16 rounded-[1.5rem] bg-primary shadow-2xl flex items-center justify-center border-4 border-white/20 hover:scale-110 active:scale-95 transition-all"
        >
          {isPlaying ? <Pause className="h-8 w-8 text-white fill-white" /> : <Play className="h-8 w-8 text-white fill-white" />}
        </button>

        <button onClick={() => { cleanup(); setPlayerKey(Date.now()); initPlayer(); }} className="h-12 w-12 rounded-2xl bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-emerald-500 transition-all">
          <RefreshCcw className="h-5 w-5 text-white" />
        </button>

        <button onClick={toggleFullscreen} className="h-12 w-12 rounded-2xl bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-primary transition-all">
          {isFullscreen ? <Minimize className="h-5 w-5 text-white" /> : <Maximize className="h-5 w-5 text-white" />}
        </button>
        
        {onNext && <button onClick={onNext} className="h-12 w-12 rounded-2xl bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-primary transition-all"><ChevronRight className="h-5 w-5 text-white" /></button>}
      </div>

      <div className="absolute top-6 left-6 z-[160] bg-black/60 px-6 py-2 rounded-full border border-white/10 backdrop-blur-md pointer-events-none">
         <p className="text-[10px] font-black uppercase italic text-primary truncate max-w-[200px]">{title}</p>
      </div>
    </div>
  )
}
