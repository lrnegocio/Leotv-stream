
"use client"

import * as React from "react"
import { Loader2, AlertCircle, Maximize, Minimize, RefreshCw, ChevronRight, ChevronLeft } from "lucide-react"
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
  const [error, setError] = React.useState(false)
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const [isMounted, setIsMounted] = React.useState(false)
  
  const hlsRef = React.useRef<any>(null)
  const mpegtsRef = React.useRef<any>(null)

  const cleanup = React.useCallback(() => {
    if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
    if (mpegtsRef.current) { mpegtsRef.current.destroy(); mpegtsRef.current = null; }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.removeAttribute('src');
      videoRef.current.load();
      // LIMPEZA ATÔMICA: Remove todos os filhos para resetar o estado do browser
      while (videoRef.current.firstChild) {
        videoRef.current.removeChild(videoRef.current.firstChild);
      }
    }
  }, [])

  const getYouTubeId = (videoUrl: string) => {
    if (!videoUrl) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|\/v\/|shorts\/)([^#\&\?]*).*/;
    const match = videoUrl.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const initPlayer = React.useCallback(async () => {
    if (!isMounted || !url || !videoRef.current) return
    
    // Passo 1: Limpeza Total antes de sintonizar
    cleanup()
    setError(false)
    setLoading(true)

    const lowUrl = url.toLowerCase();
    const ytId = getYouTubeId(url);
    const trimmedUrl = url.trim();

    // Domínios que DEVEM ser abertos em Iframe
    const isIframeDomain = (lowUrl.includes('mercadolivre.com.br/assistir') || 
                           lowUrl.includes('mercadoplay') || 
                           lowUrl.includes('visioncine') || 
                           lowUrl.includes('reidoscanais') || 
                           lowUrl.includes('rdcanais') || 
                           lowUrl.includes('redecanaistv') ||
                           lowUrl.includes('tvacabo.top') ||
                           lowUrl.includes('playcnvs.stream') ||
                           lowUrl.includes('pluto.tv') ||
                           lowUrl.includes('player?') ||
                           lowUrl.includes('/s/') ||
                           lowUrl.includes('/player3/') ||
                           lowUrl.includes('.php?') ||
                           lowUrl.includes('.html')) && 
                           !lowUrl.includes('.mp4') && 
                           !lowUrl.includes('.m3u8') && 
                           !lowUrl.includes('.ts');

    // Sinais que DEVEM ser abertos no Motor de Vídeo Nativo/MSE
    const isDirectVideo = !isIframeDomain && (
      lowUrl.includes('.m3u8') || 
      lowUrl.includes('.ts') || 
      lowUrl.includes('.mp4') || 
      lowUrl.includes('mlstatic.com') ||
      lowUrl.includes('archive.org')
    );

    // MODO IFRAME (YouTube, Mercado Play Site, Portais IPTV)
    if (!isDirectVideo && (ytId || trimmedUrl.startsWith('<') || isIframeDomain)) {
      return 
    }

    // MODO MOTOR DE HARDWARE (M3U8, TS, MP4)
    try {
      // 1. Motor MPEG-TS (Canais de Baixa Latência)
      if (lowUrl.includes('.ts') && typeof window !== 'undefined' && (window as any).mpegts) {
        const mpegts = (window as any).mpegts
        if (mpegts.isSupported()) {
          const player = mpegts.createPlayer({ type: 'mse', isLive: true, url: url })
          player.attachMediaElement(videoRef.current)
          player.load()
          player.play().catch(() => { if (videoRef.current) videoRef.current.muted = true; player.play(); })
          mpegtsRef.current = player
          return
        }
      }

      // 2. Motor HLS (Sinais de Satélite/M3U8)
      if (lowUrl.includes('.m3u8') && typeof window !== 'undefined' && (window as any).Hls) {
        const Hls = (window as any).Hls
        if (Hls.isSupported()) {
          const hls = new Hls({ enableWorker: true, lowLatencyMode: true })
          hls.loadSource(url)
          hls.attachMedia(videoRef.current)
          hlsRef.current = hls
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            videoRef.current?.play().catch(() => { if (videoRef.current) videoRef.current.muted = true; videoRef.current?.play(); })
          })
          hls.on(Hls.Events.ERROR, (event: any, data: any) => {
             if (data.fatal) {
                switch(data.type) {
                   case Hls.ErrorTypes.NETWORK_ERROR: hls.startLoad(); break;
                   case Hls.ErrorTypes.MEDIA_ERROR: hls.recoverMediaError(); break;
                   default: cleanup(); setError(true); break;
                }
             }
          });
          return
        }
      } 
      
      // 3. Motor Nativo (MP4 / Archive.org / Mercado Livre CDN)
      // Blinda contra o NotSupportedError garantindo que o src é setado por último
      videoRef.current.src = url
      videoRef.current.load()
      // O play() é chamado automaticamente pelos eventos onCanPlay/onLoadedData no JSX
    } catch (e) {
      setError(true)
      setLoading(false)
    }
  }, [url, isMounted, cleanup])

  React.useEffect(() => {
    setIsMounted(true)
    const timer = setTimeout(initPlayer, 300)
    return () => {
      clearTimeout(timer)
      cleanup()
    }
  }, [initPlayer, cleanup, url])

  const toggleFullscreen = () => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {
        const el = containerRef.current as any;
        if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
        else if (el.mozRequestFullScreen) el.mozRequestFullScreen();
        else if (el.msRequestFullscreen) el.msRequestFullscreen();
      })
      setIsFullscreen(true)
    } else {
      if (document.exitFullscreen) document.exitFullscreen().catch(() => {});
      setIsFullscreen(false)
    }
  }

  if (!isMounted) return null

  const lowUrl = (url || "").toLowerCase();
  const ytId = getYouTubeId(url);
  const trimmedUrl = (url || "").trim();
  
  const isIframeDomain = (lowUrl.includes('mercadolivre.com.br/assistir') || 
                         lowUrl.includes('mercadoplay') || 
                         lowUrl.includes('visioncine') || 
                         lowUrl.includes('reidoscanais') || 
                         lowUrl.includes('rdcanais') || 
                         lowUrl.includes('redecanaistv') ||
                         lowUrl.includes('tvacabo.top') ||
                         lowUrl.includes('playcnvs.stream') ||
                         lowUrl.includes('xvideos.com') ||
                         lowUrl.includes('pluto.tv') ||
                         lowUrl.includes('player?') ||
                         lowUrl.includes('/s/') ||
                         lowUrl.includes('/player3/') ||
                         lowUrl.includes('.php?') ||
                         lowUrl.includes('.html')) && 
                         !lowUrl.includes('.mp4') && 
                         !lowUrl.includes('.m3u8') && 
                         !lowUrl.includes('.ts');

  const isDirectVideo = !isIframeDomain && (
    lowUrl.includes('.m3u8') || 
    lowUrl.includes('.ts') || 
    lowUrl.includes('.mp4') || 
    lowUrl.includes('mlstatic.com') ||
    lowUrl.includes('archive.org')
  );

  let finalIframeSrc = url;
  const iframeMatch = trimmedUrl.match(/src=["'](.*?)["']/);
  
  if (iframeMatch) {
    finalIframeSrc = iframeMatch[1];
  } else if (ytId) {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    // REFORÇO v234/v238: Identidade completa para o YouTube
    finalIframeSrc = `https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0&modestbranding=1&enablejsapi=1&origin=${encodeURIComponent(origin)}&widget_referrer=${encodeURIComponent(origin)}&hl=pt`;
  } else if (trimmedUrl.includes('xvideos.com/video.')) {
    const xvMatch = trimmedUrl.match(/video\.([a-z0-9]+)/);
    if (xvMatch) finalIframeSrc = `https://www.xvideos.com/embedframe/${xvMatch[1]}`;
  }

  const isIframe = !isDirectVideo && (ytId || trimmedUrl.startsWith('<') || isIframeDomain);
  const isIPTVPortal = lowUrl.includes('rdcanais') || lowUrl.includes('reidoscanais') || lowUrl.includes('redecanaistv') || lowUrl.includes('playcnvs') || lowUrl.includes('be/player');
  
  const finalReferrerPolicy = isIPTVPortal ? "no-referrer" : (ytId ? "no-referrer-when-downgrade" : "no-referrer");

  return (
    <div ref={containerRef} className={`relative w-full bg-black flex items-center justify-center ${isFullscreen ? 'h-screen w-screen z-[999]' : 'h-[85vh] rounded-none md:rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl'}`}>
      {loading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-[10px] font-black uppercase italic animate-pulse text-primary tracking-widest">Sintonizando Sinal Master...</p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/95 text-center p-10">
          <AlertCircle className="h-16 w-16 text-destructive mb-6" />
          <p className="text-white font-black uppercase mb-6 text-xs tracking-widest">Falha ao sintonizar sinal.</p>
          <Button onClick={initPlayer} variant="outline" className="text-primary border-primary/20 font-black uppercase text-[10px] h-12 rounded-xl">RECONECTAR AGORA</Button>
        </div>
      )}
      
      {isIframe ? (
        <iframe 
          key={finalIframeSrc} 
          src={finalIframeSrc} 
          className="w-full h-full border-0" 
          allowFullScreen 
          allow="autoplay; encrypted-media; fullscreen; picture-in-picture" 
          referrerPolicy={finalReferrerPolicy}
          onLoad={() => setLoading(false)} 
        />
      ) : (
        <video 
          key={url} 
          ref={videoRef} 
          className="w-full h-full object-contain" 
          autoPlay 
          playsInline 
          controls 
          crossOrigin="anonymous"
          onCanPlay={() => setLoading(false)}
          onLoadedData={() => setLoading(false)}
          onError={(e) => { 
            // Só dispara erro se realmente não houver sinal após o timeout
            if (videoRef.current?.networkState === 3) {
              setError(true); 
              setLoading(false); 
            }
          }}
        />
      )}

      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-40 bg-black/60 px-6 py-2 rounded-full border border-white/10 backdrop-blur-md">
         <p className="text-[10px] font-black uppercase italic text-primary truncate max-w-[300px]">{title}</p>
      </div>

      <div className="absolute bottom-6 right-6 z-40 flex gap-2">
        {onPrev && <button onClick={onPrev} title="Anterior" className="h-10 w-10 rounded-xl bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-primary transition-all shadow-lg"><ChevronLeft className="h-4 w-4 text-white" /></button>}
        <button onClick={initPlayer} title="Recarregar" className="h-10 w-10 rounded-xl bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-primary transition-all shadow-lg"><RefreshCw className="h-4 w-4 text-white" /></button>
        <button onClick={toggleFullscreen} title="Tela Cheia" className="h-10 w-10 rounded-xl bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-primary transition-all shadow-lg">{isFullscreen ? <Minimize className="h-4 w-4 text-white" /> : <Maximize className="h-4 w-4 text-white" />}</button>
        {onNext && <button onClick={onNext} title="Próximo" className="h-10 w-10 rounded-xl bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-primary transition-all shadow-lg"><ChevronRight className="h-4 w-4 text-white" /></button>}
      </div>
    </div>
  )
}
