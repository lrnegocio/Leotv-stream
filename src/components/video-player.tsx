
"use client"

import * as React from "react"
import { Loader2, ChevronLeft, ChevronRight, AlertCircle, RefreshCcw, Maximize, Minimize } from "lucide-react"
import { Button } from "@/components/ui/button"

interface VideoPlayerProps {
  url: string
  title: string
  id?: string
  onNext?: () => void
  onPrev?: () => void
}

export function VideoPlayer({ url, title, id, onNext, onPrev }: VideoPlayerProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [isFullscreen, setIsFullscreen] = React.useState(false)
  const hlsRef = React.useRef<any>(null)

  const sintonize = React.useCallback((u: string) => {
    if (!u) return { processedUrl: null, type: 'unknown' }
    let urlStr = u.trim()

    // LIMPADOR DE TAGS HTML (EXTRAI SRC DE IFRAMES)
    if (urlStr.toLowerCase().includes('<iframe')) {
      const srcMatch = urlStr.match(/src=["'](.*?)["']/i);
      if (srcMatch && srcMatch[1]) urlStr = srcMatch[1];
    }

    const lowerUrl = urlStr.toLowerCase()

    // PORNHUB SOBERANO
    if (lowerUrl.includes('pornhub.com')) {
      const viewKeyMatch = urlStr.match(/viewkey=([a-z0-9]+)/i);
      if (viewKeyMatch && viewKeyMatch[1]) {
        return { processedUrl: `https://www.pornhub.com/embed/${viewKeyMatch[1]}`, type: 'iframe' };
      }
    }

    // YOUTUBE BLINDADO (EVITA ERRO 153)
    if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
      let ytId = "";
      const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
      const match = urlStr.match(regExp);
      ytId = (match && match[7].length === 11) ? match[7] : "";
      if (ytId) {
        return { processedUrl: `https://www.youtube.com/embed/${ytId}?autoplay=1&origin=${window.location.origin}`, type: 'iframe' };
      }
    }

    // XVIDEOS MASTER
    if (lowerUrl.includes('xvideos.com')) {
      const vidMatch = urlStr.match(/video[.\/]?([a-z0-9]{7,15})/i);
      if (vidMatch && vidMatch[1]) {
        return { processedUrl: `https://www.xvideos.com/embedframe/${vidMatch[1]}`, type: 'iframe' };
      }
    }

    // HLS / M3U8 / TS (TÚNEL PROXY MASTER)
    const isHLS = lowerUrl.includes('.m3u8') || lowerUrl.includes('.ts') || lowerUrl.includes('chunklist');
    if (isHLS) {
      return { processedUrl: `/api/proxy?url=${encodeURIComponent(urlStr)}`, type: 'hls' };
    }

    // VÍDEOS DIRETOS (BLINDER / ARCHIVE / MP4)
    const isDirect = lowerUrl.includes('.mp4') || lowerUrl.includes('.webm') || lowerUrl.includes('.mpeg');
    if (isDirect) {
      return { processedUrl: `/api/proxy?url=${encodeURIComponent(urlStr)}`, type: 'video' };
    }

    return { processedUrl: urlStr, type: 'iframe' };
  }, [])

  const { processedUrl, type } = React.useMemo(() => sintonize(url), [url, sintonize])

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

    const video = videoRef.current;
    if (type === 'hls') {
      const Hls = (window as any).Hls;
      if (Hls && Hls.isSupported()) {
        const hls = new Hls({
          xhrSetup: (xhr: any, rUrl: string) => {
            if (!rUrl.includes('/api/proxy') && !rUrl.startsWith('/') && !rUrl.includes(window.location.hostname)) {
               xhr.open('GET', `/api/proxy?url=${encodeURIComponent(rUrl)}`, true);
            }
          }
        });
        hls.loadSource(processedUrl);
        hls.attachMedia(video!);
        hlsRef.current = hls;
        hls.on(Hls.Events.MANIFEST_PARSED, () => { video?.play().catch(() => { video!.muted = true; video?.play(); }); setLoading(false); });
        hls.on(Hls.Events.ERROR, (_: any, data: any) => { if(data.fatal) { setError("Sinal instável."); setLoading(false); } });
      }
    } else if (type === 'video') {
      if (video) { video.src = processedUrl; video.onloadeddata = () => { video.play().catch(() => {}); setLoading(false); }; }
    } else if (type === 'iframe') {
      // Iframe carrega via src diretamente
    }
  }, [processedUrl, type, cleanup]);

  React.useEffect(() => { init(); return () => cleanup(); }, [init, cleanup]);

  return (
    <div ref={containerRef} className="relative aspect-video w-full bg-black overflow-hidden border border-white/5 rounded-2xl group shadow-2xl">
      {loading && (
        <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-black">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-2" />
          <p className="text-[8px] font-black uppercase tracking-widest text-primary">Sintonizando Master...</p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-black/90 p-10">
          <AlertCircle className="h-10 w-10 text-destructive mb-4" />
          <Button onClick={init} variant="outline" className="h-10 border-primary/40 text-primary uppercase font-black text-[10px]">RECONECTAR</Button>
        </div>
      )}
      
      {type === 'iframe' ? (
        <iframe src={processedUrl!} className="w-full h-full border-0 relative z-10" allowFullScreen allow="autoplay; encrypted-media; fullscreen" onLoad={() => setLoading(false)} />
      ) : (
        <video ref={videoRef} className="w-full h-full object-contain relative z-10" autoPlay playsInline controls crossOrigin="anonymous" />
      )}

      <div className="absolute inset-0 z-20 flex items-center justify-between px-6 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={onPrev} className="pointer-events-auto h-12 w-12 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-primary"><ChevronLeft className="h-6 w-6 text-white" /></button>
        <button onClick={onNext} className="pointer-events-auto h-12 w-12 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-primary"><ChevronRight className="h-6 w-6 text-white" /></button>
      </div>
    </div>
  )
}
