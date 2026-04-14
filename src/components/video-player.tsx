
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
  const [isClient, setIsClient] = React.useState(false)
  
  const hlsRef = React.useRef<any>(null)
  const mpegtsRef = React.useRef<any>(null)

  React.useEffect(() => {
    setIsClient(true)
  }, [])

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
    if (!isClient || !url || !videoRef.current) return
    
    cleanup()
    setError(false)
    setLoading(true)

    const finalUrl = formatMasterLink(url)
    const testUrl = url.toLowerCase()
    
    const isHLS = testUrl.includes('.m3u8')
    const isMPEGTS = testUrl.includes('.ts')
    const isIframe = testUrl.includes('youtube.com') || testUrl.includes('youtu.be') || testUrl.includes('xvideos.com')

    if (isIframe) {
      setLoading(false)
      return 
    }

    try {
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
      
      // FALLBACK DIRETO (MP4)
      videoRef.current.src = finalUrl
      videoRef.current.play().catch(() => {
        if (videoRef.current) videoRef.current.muted = true
        videoRef.current?.play()
      })
      setLoading(false)
    } catch (e) {
      console.error("Player Error:", e)
      setError(true)
      setLoading(false)
    }
  }, [url, isClient, cleanup])

  React.useEffect(() => {
    const timer = setTimeout(initPlayer, 300)
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

  const testUrl = url.toLowerCase()
  const isIframe = testUrl.includes('youtube.com') || testUrl.includes('youtu.be') || testUrl.includes('xvideos.com')

  return (
    <div ref={containerRef} className={`relative w-full bg-black flex items-center justify-center ${isFullscreen ? 'h-screen w-screen z-[999]' : 'h-[85vh] rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl'}`}>
      {loading && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black">
          <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
          <p className="text-[10px] font-black uppercase italic animate-pulse">Sintonizando Canal...</p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/95 text-center p-10">
          <AlertCircle className="h-16 w-16 text-destructive mb-6" />
          <Button onClick={initPlayer} variant="outline" className="text-primary border-primary/20 font-black uppercase text-[10px] h-12 rounded-xl">RECONECTAR SINAL</Button>
        </div>
      )}
      
      {isIframe ? (
        <iframe key={url} src={testUrl.includes('youtube') ? `https://www.youtube.com/embed/${url.split('v=')[1] || url.split('/').pop()}?autoplay=1` : url} className="w-full h-full border-0" allowFullScreen allow="autoplay; encrypted-media; fullscreen" onLoad={() => setLoading(false)} />
      ) : (
        <video key={url} ref={videoRef} className="w-full h-full object-contain" autoPlay playsInline controls />
      )}

      <div className="absolute bottom-6 right-6 z-40 flex gap-2">
        <button onClick={initPlayer} className="h-10 w-10 rounded-xl bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-primary transition-all"><RefreshCw className="h-4 w-4 text-white" /></button>
        <button onClick={toggleFullscreen} className="h-10 w-10 rounded-xl bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-primary transition-all">{isFullscreen ? <Minimize className="h-4 w-4 text-white" /> : <Maximize className="h-4 w-4 text-white" />}</button>
      </div>
    </div>
  )
}
