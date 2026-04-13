
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
  const [error, setError] = React.useState<{type: string, msg: string} | null>(null)
  const [isFullscreen, setIsFullscreen] = React.useState(false)
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

    // MOTOR SOBERANO v192: Detecção agressiva de links que exigem bypass via VPS
    const isHttp = finalUrl.startsWith('http:');
    const isProblematicDomain = 
      lowerUrl.includes('contfree.shop') || 
      lowerUrl.includes('blinder.space') || 
      lowerUrl.includes('archive.org') ||
      lowerUrl.includes('xvideos') ||
      lowerUrl.includes('reidoscanais') ||
      lowerUrl.includes('.ts');

    // Se for HTTP ou de um domínio conhecido por bloquear navegadores, passa pelo nosso Proxy
    if ((isHttp || isProblematicDomain) && !finalUrl.includes('/api/proxy')) {
      finalUrl = `/api/proxy?url=${encodeURIComponent(finalUrl)}`
    }

    const isHLS = lowerUrl.includes('.m3u8') || lowerUrl.includes('.ts') || finalUrl.includes('proxy') || finalUrl.includes('playlist.m3u8');
    const isYouTube = lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')
    const isMP4 = lowerUrl.includes('.mp4') || lowerUrl.includes('.mov')

    try {
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
            autoStartLoad: true,
            backBufferLength: 90,
            xhrSetup: (xhr: any) => { 
              xhr.withCredentials = false;
            }
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
          })
        } else if (videoRef.current?.canPlayType('application/vnd.apple.mpegurl')) {
          videoRef.current.src = finalUrl
          videoRef.current.onloadedmetadata = () => { videoRef.current?.play(); setLoading(false); }
        } else {
          setLoading(false)
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
      setError({ type: 'SINAL', msg: "Erro ao sintonizar sinal. O servidor de origem pode estar offline." })
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
          <div className="flex gap-4">
             <Button onClick={initPlayer} variant="outline" className="border-primary/40 text-primary uppercase font-black text-[10px] px-10 h-14 rounded-2xl hover:bg-primary/10">RECONECTAR</Button>
             {onNext && <Button onClick={onNext} className="bg-primary text-white uppercase font-black text-[10px] px-10 h-14 rounded-2xl shadow-xl shadow-primary/20">PRÓXIMO CANAL</Button>}
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
        <div className="absolute inset-0 z-40 flex items-center justify-between px-8 pointer-events-none group">
          <button onClick={(e) => { e.stopPropagation(); onPrev?.(); }} className="pointer-events-auto h-16 w-16 rounded-full bg-black/40 backdrop-blur-xl flex items-center justify-center border border-white/10 hover:bg-primary transition-all opacity-0 group-hover:opacity-100 shadow-2xl">
            <ChevronLeft className="h-8 w-8 text-white" />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onNext?.(); }} className="pointer-events-auto h-16 w-16 rounded-full bg-black/40 backdrop-blur-xl flex items-center justify-center border border-white/10 hover:bg-primary transition-all opacity-0 group-hover:opacity-100 shadow-2xl">
            <ChevronRight className="h-8 w-8 text-white" />
          </button>
        </div>
      )}

      <div className="absolute bottom-8 right-8 z-40 flex gap-3">
        <button onClick={toggleFullscreen} className="h-12 w-12 rounded-2xl bg-black/40 backdrop-blur-xl flex items-center justify-center border border-white/10 hover:bg-white/10 transition-all opacity-40 hover:opacity-100">
          {isFullscreen ? <Minimize className="h-6 w-6 text-white" /> : <Maximize className="h-6 w-6 text-white" />}
        </button>
      </div>
    </div>
  )
}
