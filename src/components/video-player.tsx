
"use client"

import * as React from "react"
import { Loader2, ChevronLeft, ChevronRight, AlertCircle, Maximize, Minimize, RefreshCw } from "lucide-react"
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
  const [error, setError] = React.useState<{type: string, msg: string} | null>(null)
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const hlsRef = React.useRef<any>(null)
  const mpegtsRef = React.useRef<any>(null)

  const cleanup = React.useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }
    if (mpegtsRef.current) {
      mpegtsRef.current.destroy()
      mpegtsRef.current = null
    }
    const v = videoRef.current
    if (v) {
      v.pause()
      v.removeAttribute('src')
      v.load()
    }
  }, [])

  const initPlayer = React.useCallback(async () => {
    if (!url || !videoRef.current) return
    cleanup()
    setError(null)
    setLoading(true)

    const lowerUrl = url.trim().toLowerCase()
    let finalUrl = url.trim()

    // LÓGICA DE PROXY INTELIGENTE v195
    const needsProxy = 
      finalUrl.startsWith('http:') || 
      lowerUrl.includes('.ts') || 
      lowerUrl.includes('blinder') || 
      lowerUrl.includes('contfree') || 
      lowerUrl.includes('reidoscanais') ||
      lowerUrl.includes('archive.org');

    if (needsProxy && !finalUrl.includes('/api/proxy')) {
      finalUrl = `/api/proxy?url=${encodeURIComponent(finalUrl)}`
    }

    const isHLS = lowerUrl.includes('.m3u8') || finalUrl.includes('m3u8');
    const isMPEGTS = lowerUrl.includes('.ts') || finalUrl.includes('video/mp2t');
    const isYouTube = lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')

    try {
      if (isYouTube) {
        setLoading(false)
        return 
      }

      // MOTOR MPEG-TS (.TS) - TECNOLOGIA SUPREMO
      if (isMPEGTS) {
        const mpegts = (window as any).mpegts;
        if (mpegts && mpegts.getFeatureList().mseLivePlayback) {
          const player = mpegts.createPlayer({
            type: 'mse',
            isLive: true,
            url: finalUrl
          }, {
            enableWorker: true,
            enableStashBuffer: false,
            stashInitialSize: 128,
            liveBufferLatencyChasing: true,
            liveBufferLatencyMaxLatency: 2,
            liveBufferLatencyMinRemaining: 0.1
          });
          player.attachMediaElement(videoRef.current);
          player.load();
          player.play().catch(() => {
            if (videoRef.current) videoRef.current.muted = true;
            player.play();
          });
          mpegtsRef.current = player;
          setLoading(false);
          return;
        }
      }

      // MOTOR HLS (.M3U8)
      if (isHLS) {
        const Hls = (window as any).Hls
        if (Hls && Hls.isSupported()) {
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 60,
            manifestLoadingMaxRetry: 10,
            levelLoadingMaxRetry: 10
          })
          hls.loadSource(finalUrl)
          hls.attachMedia(videoRef.current)
          hlsRef.current = hls
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            videoRef.current?.play().catch(() => {
              if (videoRef.current) videoRef.current.muted = true
              videoRef.current?.play()
            })
            setLoading(false)
          })
          hls.on(Hls.Events.ERROR, (event: any, data: any) => {
            if (data.fatal) {
               console.error("HLS Fatal Error, tentando fallback nativo...");
               videoRef.current!.src = finalUrl;
            }
          });
        } else if (videoRef.current.canPlayType('application/vnd.apple.mpegurl')) {
          videoRef.current.src = finalUrl
          videoRef.current.onloadedmetadata = () => { videoRef.current?.play(); setLoading(false); }
        }
      } else {
        // FALLBACK PARA MP4 OU LINKS DIRETOS
        videoRef.current.src = finalUrl
        videoRef.current.play().catch(() => {
          if (videoRef.current) {
            videoRef.current.muted = true;
            videoRef.current.play();
          }
        });
        setLoading(false)
      }
    } catch (e) {
      setError({ type: 'SINAL', msg: "Erro ao sintonizar sinal. Tente recarregar o sinal mestre." })
      setLoading(false)
    }
  }, [url, cleanup])

  React.useEffect(() => {
    initPlayer()
    return () => cleanup()
  }, [initPlayer, cleanup])

  const toggleFullscreen = () => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) containerRef.current.requestFullscreen()
    else document.exitFullscreen()
  }

  const isIframe = (!url.toLowerCase().includes('.m3u8') && !url.toLowerCase().includes('.ts') && !url.toLowerCase().includes('.mp4')) || url.includes('youtube')

  return (
    <div 
      ref={containerRef}
      className={`relative w-full bg-black overflow-hidden flex items-center justify-center transition-all ${isFullscreen ? 'h-screen w-screen z-[9999]' : 'h-[85vh] aspect-video rounded-[3rem] border border-white/5 shadow-2xl'}`}
    >
      {loading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black">
          <Loader2 className="h-16 w-16 animate-spin text-primary mb-6" />
          <p className="text-[12px] font-black uppercase text-primary animate-pulse tracking-[0.3em] italic">Sintonizando Rede Master...</p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/95 text-center p-10">
          <AlertCircle className="h-20 w-20 text-destructive mb-8 animate-pulse" />
          <h3 className="text-white font-black uppercase italic text-2xl mb-4 tracking-tighter">Sinal Oscilou</h3>
          <p className="text-zinc-400 font-bold uppercase text-[10px] mb-10 max-w-xs mx-auto leading-relaxed tracking-widest">{error.msg}</p>
          <Button onClick={initPlayer} variant="outline" className="border-primary/40 text-primary uppercase font-black text-[10px] px-10 h-14 rounded-2xl">RECONECTAR SINAL</Button>
        </div>
      )}
      
      {isIframe && !error ? (
        <iframe 
          key={url}
          src={url.includes('youtube') ? `https://www.youtube.com/embed/${url.split('v=')[1] || url.split('/').pop()}?autoplay=1` : url}
          className="w-full h-full border-0 z-10" 
          allowFullScreen 
          allow="autoplay; encrypted-media; fullscreen" 
          onLoad={() => setLoading(false)} 
        />
      ) : (
        !error && <video key={url} ref={videoRef} className="w-full h-full object-contain z-10" autoPlay playsInline controls={!isFullscreen} />
      )}

      <div className="absolute bottom-8 right-8 z-40 flex gap-3">
        <button onClick={initPlayer} className="h-12 w-12 rounded-2xl bg-black/40 backdrop-blur-xl flex items-center justify-center border border-white/10 hover:bg-white/10 transition-all opacity-40 hover:opacity-100">
          <RefreshCw className="h-5 w-5 text-white" />
        </button>
        <button onClick={toggleFullscreen} className="h-12 w-12 rounded-2xl bg-black/40 backdrop-blur-xl flex items-center justify-center border border-white/10 hover:bg-white/10 transition-all opacity-40 hover:opacity-100">
          {isFullscreen ? <Minimize className="h-6 w-6 text-white" /> : <Maximize className="h-6 w-6 text-white" />}
        </button>
      </div>
    </div>
  )
}
