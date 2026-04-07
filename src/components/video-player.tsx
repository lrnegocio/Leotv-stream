"use client"

import * as React from "react"
import { Loader2, ChevronLeft, ChevronRight, AlertCircle, Maximize, Minimize } from "lucide-react"
import { Button } from "@/components/ui/button"

interface VideoPlayerProps {
  url: string
  title: string
  id?: string
  onNext?: () => void
  onPrev?: () => void
}

export function VideoPlayer({ url, title, onNext, onPrev }: VideoPlayerProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const [showControls, setShowControls] = React.useState(true)
  const controlsTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)
  const hlsRef = React.useRef<any>(null)

<<<<<<< HEAD
  // Tecnologia Master: Detecta e limpa links sujos (iFrames)
  // MANTENDO A LÓGICA DE LINKS CONFORME SOLICITADO (ESTILO CANVA)
=======
  // Tecnologia Master: Detecta e limpa links (iFrames, YouTube, HLS, MP4)
>>>>>>> e3559e6bfc52055b03fadf839d4c772d0f6149bb
  const sintonize = React.useCallback((u: string) => {
    if (!u) return { processedUrl: null, type: 'unknown' }
    let urlStr = u.trim()

    // Limpa tags de iFrame se o usuário colar o código inteiro
    if (urlStr.toLowerCase().includes('<iframe')) {
      const srcMatch = urlStr.match(/src=["'](.*?)["']/i);
      if (srcMatch && srcMatch[1]) urlStr = srcMatch[1];
    }

    const lowerUrl = urlStr.toLowerCase()
    
    // YouTube sem Erro 153 (Sinal Limpo)
    if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
      let ytId = "";
      const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
      const match = urlStr.match(regExp);
      ytId = (match && match[7] && match[7].length === 11) ? match[7] : "";
      if (ytId) return { processedUrl: `https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`, type: 'iframe' };
    }

<<<<<<< HEAD
=======
    // Suporte a Links Adultos (Pornhub)
    if (lowerUrl.includes('pornhub.com/view_video.php')) {
      const vKey = urlStr.split('viewkey=')[1]?.split('&')[0];
      if (vKey) return { processedUrl: `https://www.pornhub.com/embed/${vKey}`, type: 'iframe' };
    }

    // Proxy para HTTP, M3U8 ou MP4 (Evita Mixed Content e CORS)
>>>>>>> e3559e6bfc52055b03fadf839d4c772d0f6149bb
    const isHLS = lowerUrl.includes('.m3u8') || lowerUrl.includes('.ts') || lowerUrl.includes('chunklist');
    const isDirect = lowerUrl.includes('.mp4') || lowerUrl.includes('.webm') || lowerUrl.includes('.mpeg');
    
    if (isHLS || isDirect || urlStr.startsWith('http:')) {
      const finalUrl = `/api/proxy?url=${encodeURIComponent(urlStr)}`;
      return { processedUrl: finalUrl, type: isHLS ? 'hls' : 'video' };
    }

    return { processedUrl: urlStr, type: 'iframe' };
  }, [])

  const { processedUrl, type } = React.useMemo(() => sintonize(url), [url, sintonize])

  // Gerenciamento de Tela Cheia Soberano
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
<<<<<<< HEAD
      document.exitFullscreen().catch(() => {});
    }
  }

=======
      document.exitFullscreen();
    }
  }

  // Sincroniza estado do Fullscreen com o navegador (ESC key etc)
>>>>>>> e3559e6bfc52055b03fadf839d4c772d0f6149bb
  React.useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (document.fullscreenElement) setShowControls(false);
    }, 3000);
  }

  const cleanup = React.useCallback(() => {
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
    const v = videoRef.current;
    if (v) { v.pause(); v.removeAttribute('src'); v.load(); }
  }, []);

  const init = React.useCallback(async () => {
    if (!processedUrl) return;
    cleanup();
    setError(null);
    setLoading(true);

    if (type === 'hls') {
      const Hls = (window as any).Hls;
      if (Hls && Hls.isSupported()) {
        const hls = new Hls({ 
          enableWorker: true, 
          lowLatencyMode: true,
          xhrSetup: (xhr: any) => { xhr.withCredentials = false; }
        });
        hls.loadSource(processedUrl);
        hls.attachMedia(videoRef.current!);
        hlsRef.current = hls;
        hls.on(Hls.Events.MANIFEST_PARSED, () => { 
          videoRef.current?.play().catch(() => { 
            if (videoRef.current) videoRef.current.muted = true; 
            videoRef.current?.play(); 
          }); 
          setLoading(false); 
        });
        hls.on(Hls.Events.ERROR, (_: any, data: any) => { 
<<<<<<< HEAD
          if(data.fatal) { hls.recoverMediaError(); } 
=======
          if(data.fatal) { 
            hls.recoverMediaError(); 
          } 
>>>>>>> e3559e6bfc52055b03fadf839d4c772d0f6149bb
        });
      } else if (videoRef.current?.canPlayType('application/vnd.apple.mpegurl')) {
        videoRef.current.src = processedUrl;
        setLoading(false);
      }
    } else if (type === 'video') {
      if (videoRef.current) { 
        videoRef.current.src = processedUrl; 
<<<<<<< HEAD
        videoRef.current.onloadeddata = () => { videoRef.current?.play().catch(() => {}); setLoading(false); }; 
        videoRef.current.onerror = () => { setError("Sinal instável."); setLoading(false); };
=======
        videoRef.current.onloadeddata = () => { 
          videoRef.current?.play().catch(() => {}); 
          setLoading(false); 
        }; 
        videoRef.current.onerror = () => { 
          setError("Erro no sinal. Link offline ou instável."); 
          setLoading(false); 
        };
>>>>>>> e3559e6bfc52055b03fadf839d4c772d0f6149bb
      }
    }
  }, [processedUrl, type, cleanup]);

  React.useEffect(() => { init(); return () => cleanup(); }, [init, cleanup]);

  return (
    <div 
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onTouchStart={handleMouseMove}
<<<<<<< HEAD
      className={`relative w-full bg-black overflow-hidden group shadow-2xl flex items-center justify-center ${isFullscreen ? 'h-screen w-screen' : 'aspect-video rounded-2xl border border-white/5'}`}
=======
      className={`relative w-full bg-black overflow-hidden group transition-all duration-500 ${isFullscreen ? 'h-screen w-screen' : 'aspect-video rounded-3xl border border-white/5 shadow-2xl'}`}
>>>>>>> e3559e6bfc52055b03fadf839d4c772d0f6149bb
    >
      {/* OVERLAY DE CARREGAMENTO */}
      {loading && (
        <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-black">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary animate-pulse">Sintonizando Sinal Master...</p>
        </div>
      )}

      {/* OVERLAY DE ERRO */}
      {error && (
<<<<<<< HEAD
        <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-black/90 p-10 text-center">
          <AlertCircle className="h-10 w-10 text-destructive mb-4 mx-auto" />
          <Button onClick={init} variant="outline" className="h-10 border-primary/40 text-primary uppercase font-black text-[10px]">RECONECTAR SINAL</Button>
=======
        <div className="absolute inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 p-10 text-center">
          <AlertCircle className="h-16 w-16 text-destructive mb-6" />
          <h3 className="text-xl font-black uppercase text-white mb-2 italic">Sinal Fora de Sincronia</h3>
          <p className="text-xs font-bold text-zinc-500 uppercase mb-8">{error}</p>
          <Button onClick={init} variant="outline" className="h-14 px-10 border-primary/40 text-primary uppercase font-black text-xs hover:bg-primary hover:text-white rounded-2xl transition-all">RECONECTAR AGORA</Button>
>>>>>>> e3559e6bfc52055b03fadf839d4c772d0f6149bb
        </div>
      )}
      
      {/* RENDERIZADOR DE VÍDEO / IFRAME */}
      {type === 'iframe' ? (
        <iframe 
          src={processedUrl!} 
          className="w-full h-full border-0 relative z-10" 
          allowFullScreen 
          allow="autoplay; encrypted-media; fullscreen" 
          onLoad={() => setLoading(false)} 
        />
      ) : (
        <video 
          ref={videoRef} 
          className="w-full h-full object-contain relative z-10" 
          autoPlay 
          playsInline 
          controls={!isFullscreen && !loading && !error} 
          crossOrigin="anonymous" 
        />
      )}

<<<<<<< HEAD
      {/* SETAS MASTER - VISÍVEIS EM TELA CHEIA (Z-INDEX 200) */}
      {(onNext || onPrev) && (
        <div className={`absolute inset-0 z-[200] flex items-center justify-between px-6 md:px-10 pointer-events-none transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          <button 
            onClick={(e) => { e.stopPropagation(); onPrev?.(); }} 
            className="pointer-events-auto h-12 w-12 md:h-16 md:w-16 rounded-full bg-black/40 backdrop-blur-xl flex items-center justify-center border border-white/10 hover:bg-primary hover:scale-110 transition-all shadow-2xl group/btn"
          >
            <ChevronLeft className="h-6 w-6 md:h-8 md:w-8 text-white group-hover/btn:scale-110 transition-transform" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onNext?.(); }} 
            className="pointer-events-auto h-12 w-12 md:h-16 md:w-16 rounded-full bg-black/40 backdrop-blur-xl flex items-center justify-center border border-white/10 hover:bg-primary hover:scale-110 transition-all shadow-2xl group/btn"
          >
            <ChevronRight className="h-6 w-6 md:h-8 md:w-8 text-white group-hover/btn:scale-110 transition-transform" />
=======
      {/* CONTROLES SOBERANOS (SETAS) - VISÍVEIS EM FULLSCREEN */}
      {(onNext || onPrev) && !error && (
        <div className={`absolute inset-0 z-[150] flex items-center justify-between px-10 pointer-events-none transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          <button 
            onClick={(e) => { e.stopPropagation(); onPrev?.(); }} 
            className="pointer-events-auto h-20 w-20 rounded-full bg-black/40 backdrop-blur-2xl flex items-center justify-center border border-white/10 hover:bg-primary hover:scale-110 transition-all shadow-[0_0_40px_rgba(0,0,0,0.5)] active:scale-90"
          >
            <ChevronLeft className="h-10 w-10 text-white" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onNext?.(); }} 
            className="pointer-events-auto h-20 w-20 rounded-full bg-black/40 backdrop-blur-2xl flex items-center justify-center border border-white/10 hover:bg-primary hover:scale-110 transition-all shadow-[0_0_40px_rgba(0,0,0,0.5)] active:scale-90"
          >
            <ChevronRight className="h-10 w-10 text-white" />
>>>>>>> e3559e6bfc52055b03fadf839d4c772d0f6149bb
          </button>
        </div>
      )}

      {/* TÍTULO DO CANAL EM FULLSCREEN */}
      {isFullscreen && showControls && !loading && (
        <div className="absolute top-8 left-10 z-[150] animate-in slide-in-from-top-4">
           <h2 className="text-2xl font-black uppercase italic text-white text-shadow-lg flex items-center gap-3">
             <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_#10b981]" />
             {title}
           </h2>
        </div>
      )}

      {/* BOTÃO FULLSCREEN CUSTOM */}
<<<<<<< HEAD
      <div className={`absolute bottom-6 right-6 z-[200] transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <button onClick={toggleFullscreen} className="h-12 w-12 rounded-xl bg-black/40 backdrop-blur-xl flex items-center justify-center border border-white/10 hover:bg-white/10 transition-all">
          {isFullscreen ? <Minimize className="h-5 w-5 text-white" /> : <Maximize className="h-5 w-5 text-white" />}
=======
      <div className={`absolute bottom-8 right-8 z-[150] transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <button 
          onClick={toggleFullscreen} 
          className="h-14 w-14 rounded-2xl bg-black/40 backdrop-blur-2xl flex items-center justify-center border border-white/10 hover:bg-white/10 transition-all hover:scale-110 active:scale-95"
        >
          {isFullscreen ? <Minimize className="h-6 w-6 text-white" /> : <Maximize className="h-6 w-6 text-white" />}
>>>>>>> e3559e6bfc52055b03fadf839d4c772d0f6149bb
        </button>
      </div>

      {isFullscreen && showControls && (
        <div className="absolute top-6 left-6 z-[200] bg-black/40 backdrop-blur-xl px-4 py-2 rounded-xl border border-white/10">
          <p className="text-[10px] font-black uppercase tracking-widest text-white">{title}</p>
        </div>
      )}
    </div>
  )
}
