
"use client"

import * as React from "react"
import { Loader2, ChevronLeft, ChevronRight, AlertCircle, Maximize, Minimize, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"

interface VideoPlayerProps {
  url: string
  title: string
  id?: string
  onNext?: () => void
  onPrev?: () => void
}

/**
 * PLAYER SOBERANO v175 - MOTOR COM FAILOVER AUTOMÁTICO
 * Se o link expirar, ele avisa o cliente de forma profissional.
 */
export function VideoPlayer({ url, title, onNext, onPrev }: VideoPlayerProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<{type: string, msg: string} | null>(null)
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const [showControls, setShowControls] = React.useState(true)
  const hlsRef = React.useRef<any>(null)

  const cleanup = React.useCallback(() => {
    if (hlsRef.current) {
      hlsRef.current.destroy()
      hlsRef.current = null
    }
    const v = videoRef.current
    if (v) {
      v.pause()
      v.removeAttribute('src')
      v.load()
    }
  }, [])

  const initPlayer = React.useCallback(async () => {
    if (!url) return
    cleanup()
    setError(null)
    setLoading(true)

    const lowerUrl = url.trim().toLowerCase()
    let finalUrl = url.trim()

    // TÚNEL MASTER OBRIGATÓRIO PARA PROTEÇÃO E BYPASS
    if (finalUrl.startsWith('http:') || lowerUrl.includes('xvideos') || lowerUrl.includes('.ts') || lowerUrl.includes('blinder')) {
      finalUrl = `/api/proxy?url=${encodeURIComponent(finalUrl)}`
    }

    const isHLS = lowerUrl.includes('.m3u8') || lowerUrl.includes('.ts') || lowerUrl.includes('chunklist')
    const isYouTube = lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')
    const isMP4 = lowerUrl.includes('.mp4') || lowerUrl.includes('.mov')

    try {
      // Verificação de expiração via Proxy
      if (finalUrl.startsWith('/api/proxy')) {
        const check = await fetch(finalUrl, { method: 'HEAD' });
        if (check.status === 401 || check.status === 403) {
          setError({ type: 'EXPIRED', msg: 'Sinal em Manutenção Técnica. Por favor, tente outro canal ou aguarde a recalibragem.' });
          setLoading(false);
          return;
        }
      }

      if (isYouTube) {
        setLoading(false)
        return 
      }

      if (isHLS) {
        const Hls = (window as any).Hls
        if (Hls && Hls.isSupported()) {
          const hls = new Hls({
            enableWorker: true,
            lowLatencyMode: true,
            backBufferLength: 90,
            autoStartLoad: true,
            xhrSetup: (xhr: any) => { xhr.withCredentials = false; }
          })
          hls.loadSource(finalUrl)
          hls.attachMedia(videoRef.current!)
          hlsRef.current = hls
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            videoRef.current?.play().catch(() => {
              if (videoRef.current) videoRef.current.muted = true
              videoRef.current?.play()
            })
            setLoading(false)
          })
          hls.on(Hls.Events.ERROR, (_: any, data: any) => {
            if (data.fatal) hls.recoverMediaError();
            if (data.response?.code === 401) setError({ type: 'EXPIRED', msg: 'Acesso à fonte expirou.' });
          })
        } else if (videoRef.current?.canPlayType('application/vnd.apple.mpegurl')) {
          videoRef.current.src = finalUrl
          videoRef.current.onloadedmetadata = () => { videoRef.current?.play(); setLoading(false); }
        }
      } else if (isMP4) {
        if (videoRef.current) {
          videoRef.current.src = finalUrl
          videoRef.current.onloadeddata = () => { videoRef.current?.play().catch(() => {}); setLoading(false); }
        }
      } else {
        setLoading(false)
      }
    } catch (e) {
      setError({ type: 'FATAL', msg: "Falha ao sintonizar sinal." })
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

  const isYouTube = url.toLowerCase().includes('youtube.com') || url.toLowerCase().includes('youtu.be')
  const isXVideos = url.toLowerCase().includes('xvideos.com')
  const isIframe = (!url.toLowerCase().includes('.m3u8') && !url.toLowerCase().includes('.ts') && !url.toLowerCase().includes('.mp4')) || isYouTube || isXVideos

  return (
    <div 
      ref={containerRef}
      onMouseMove={() => { setShowControls(true); }}
      className={`relative w-full bg-black overflow-hidden flex items-center justify-center transition-all ${isFullscreen ? 'h-screen w-screen z-[9999]' : 'h-[85vh] aspect-video rounded-3xl border border-white/5 shadow-2xl'}`}
    >
      {loading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-[10px] font-black uppercase text-primary animate-pulse tracking-widest">Sintonizando Rede Léo TV...</p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/95 text-center p-10">
          {error.type === 'EXPIRED' ? <ShieldAlert className="h-16 w-16 text-amber-500 mb-6 animate-bounce" /> : <AlertCircle className="h-16 w-16 text-destructive mb-6" />}
          <h3 className="text-white font-black uppercase italic text-xl mb-4">{error.type === 'EXPIRED' ? 'MANUTENÇÃO DE SINAL' : 'ERRO DE SINTONIA'}</h3>
          <p className="text-zinc-400 font-bold uppercase text-[10px] mb-8 max-w-xs mx-auto leading-relaxed">{error.msg}</p>
          <div className="flex gap-4">
             <Button onClick={initPlayer} variant="outline" className="border-primary/40 text-primary uppercase font-black text-[10px] px-8 h-12 rounded-xl">RECONECTAR</Button>
             {onNext && <Button onClick={onNext} className="bg-primary text-white uppercase font-black text-[10px] px-8 h-12 rounded-xl">PRÓXIMO CANAL</Button>}
          </div>
        </div>
      )}
      
      {isIframe && !error ? (
        <iframe 
          key={url}
          src={isYouTube ? `https://www.youtube.com/embed/${url.split('v=')[1] || url.split('/').pop()}?autoplay=1` : isXVideos ? `https://www.xvideos.com/embedframe/${url.match(/video\.([^/]+)/)?.[1] || url.match(/video(\d+)/)?.[1]}` : url}
          className="w-full h-full border-0 z-10" 
          allowFullScreen 
          allow="autoplay; encrypted-media; fullscreen" 
          onLoad={() => setLoading(false)} 
        />
      ) : (
        !error && <video key={url} ref={videoRef} className="w-full h-full object-contain z-10" autoPlay playsInline controls={!isFullscreen} />
      )}

      {(onNext || onPrev) && !error && (
        <div className={`absolute inset-0 z-40 flex items-center justify-between px-6 pointer-events-none transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
          <button onClick={(e) => { e.stopPropagation(); onPrev?.(); }} className="pointer-events-auto h-14 w-14 rounded-full bg-black/40 backdrop-blur-xl flex items-center justify-center border border-white/10 hover:bg-primary transition-all">
            <ChevronLeft className="h-7 w-7 text-white" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onNext?.(); }} className="pointer-events-auto h-14 w-14 rounded-full bg-black/40 backdrop-blur-xl flex items-center justify-center border border-white/10 hover:bg-primary transition-all">
            <ChevronRight className="h-7 w-7 text-white" />
          </button>
        </div>
      )}

      <div className={`absolute bottom-6 right-6 z-40 transition-opacity duration-500 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
        <button onClick={toggleFullscreen} className="h-10 w-10 rounded-xl bg-black/40 backdrop-blur-xl flex items-center justify-center border border-white/10 hover:bg-white/10 transition-all">
          {isFullscreen ? <Minimize className="h-5 w-5 text-white" /> : <Maximize className="h-5 w-5 text-white" />}
        </button>
      </div>
    </div>
  )
}
