"use client"

import * as React from "react"
import { Loader2, AlertCircle, Maximize, Minimize, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatMasterLink } from "@/lib/store"

interface VideoPlayerProps {
  url: string
  title: string
  id?: string
  onNext?: () => void
  onPrev?: () => void
}

export function VideoPlayer({ url, title }: VideoPlayerProps) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState(false)
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const [isClient, setIsMounted] = React.useState(false)
  
  const hlsRef = React.useRef<any>(null)
  const mpegtsRef = React.useRef<any>(null)

  // Evita erro de hidratação
  React.useEffect(() => {
    setIsMounted(true)
  }, [])

  const cleanup = React.useCallback(() => {
    try {
      if (hlsRef.current) { hlsRef.current.destroy(); hlsRef.current = null; }
      if (mpegtsRef.current) { mpegtsRef.current.destroy(); mpegtsRef.current = null; }
      const v = videoRef.current
      if (v) { v.pause(); v.removeAttribute('src'); v.load(); }
    } catch (e) {}
  }, [])

  const initPlayer = React.useCallback(async () => {
    if (!url || !videoRef.current || !isClient) return
    
    cleanup()
    setError(false)
    setLoading(true)

    try {
      const finalUrl = formatMasterLink(url)
      const testUrl = url.toLowerCase()
      
      const isHLS = testUrl.includes('.m3u8')
      const isMPEGTS = testUrl.includes('.ts') || testUrl.includes('video/mp2t')
      const isYouTube = testUrl.includes('youtube.com') || testUrl.includes('youtu.be')
      const isXVideos = testUrl.includes('xvideos.com')

      if (isYouTube || isXVideos) {
        setLoading(false)
        return 
      }

      // MOTOR MPEG-TS (.TS)
      if (isMPEGTS && (window as any).mpegts) {
        const mpegts = (window as any).mpegts
        if (mpegts.isSupported()) {
          const player = mpegts.createPlayer({ type: 'mse', isLive: true, url: finalUrl }, { enableWorker: true, liveBufferLatencyChasing: true })
          player.attachMediaElement(videoRef.current)
          player.load()
          player.play().catch(() => { if (videoRef.current) videoRef.current.muted = true; player.play(); })
          mpegtsRef.current = player
          setLoading(false)
          return
        }
      }

      // MOTOR HLS (.M3U8)
      if (isHLS && (window as any).Hls) {
        const Hls = (window as any).Hls
        if (Hls.isSupported()) {
          const hls = new Hls({ enableWorker: true })
          hls.loadSource(finalUrl)
          hls.attachMedia(videoRef.current)
          hlsRef.current = hls
          hls.on(Hls.Events.MANIFEST_PARSED, () => {
            videoRef.current?.play().catch(() => { if (videoRef.current) videoRef.current.muted = true; videoRef.current?.play(); })
            setLoading(false)
          })
          return
        }
      } 
      
      // FALLBACK MP4/DIRETO
      videoRef.current.src = finalUrl
      videoRef.current.play().catch(() => {
        if (videoRef.current) videoRef.current.muted = true
        videoRef.current?.play()
      })
      setLoading(false)
    } catch (e) {
      setError(true)
      setLoading(false)
    }
  }, [url, isClient, cleanup])

  React.useEffect(() => {
    const timer = setTimeout(initPlayer, 500)
    return () => { clearTimeout(timer); cleanup(); }
  }, [initPlayer, cleanup])

  const toggleFullscreen = () => {
    if (!containerRef.current) return
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {})
      setIsFullscreen(true)
    } else {
      document.exitFullscreen().catch(() => {})
      setIsFullscreen(false)
    }
  }

  if (!isClient) return null

  const testUrl = (url || "").toLowerCase()
  const isIframe = testUrl.includes('youtube.com') || testUrl.includes('youtu.be') || testUrl.includes('xvideos.com')

  return (
    <div ref={containerRef} className={`relative w-full bg-black overflow-hidden flex items-center justify-center transition-all ${isFullscreen ? 'h-screen w-screen z-[9999]' : 'h-[85vh] aspect-video rounded-[3rem] border border-white/5 shadow-2xl'}`}>
      {loading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-[10px] font-black uppercase text-primary animate-pulse italic">Sintonizando...</p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/95 text-center p-10">
          <AlertCircle className="h-16 w-16 text-destructive mb-6 animate-pulse" />
          <Button onClick={initPlayer} variant="outline" className="border-primary/40 text-primary uppercase font-black text-[9px] h-12 rounded-xl">RECONECTAR</Button>
        </div>
      )}
      
      {isIframe ? (
        <iframe key={url} src={testUrl.includes('youtube') ? `https://www.youtube.com/embed/${url.split('v=')[1] || url.split('/').pop()}?autoplay=1` : url} className="w-full h-full border-0 z-10" allowFullScreen allow="autoplay; encrypted-media; fullscreen" onLoad={() => setLoading(false)} />
      ) : (
        <video key={url} ref={videoRef} className="w-full h-full object-contain z-10" autoPlay playsInline controls />
      )}

      <div className="absolute bottom-6 right-6 z-40 flex gap-2">
        <button onClick={initPlayer} className="h-10 w-10 rounded-xl bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 opacity-40 hover:opacity-100 transition-all"><RefreshCw className="h-4 w-4 text-white" /></button>
        <button onClick={toggleFullscreen} className="h-10 w-10 rounded-xl bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 opacity-40 hover:opacity-100 transition-all">{isFullscreen ? <Minimize className="h-4 w-4 text-white" /> : <Maximize className="h-4 w-4 text-white" />}</button>
      </div>
    </div>
  )
}
