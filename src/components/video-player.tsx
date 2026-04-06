
"use client"

import * as React from "react"
import { Loader2, ChevronLeft, ChevronRight, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface VideoPlayerProps {
  url: string
  title: string
  id?: string
  onNext?: () => void
  onPrev?: () => void
}

export function VideoPlayer({ url, title, onNext, onPrev }: VideoPlayerProps) {
  const videoRef = React.useRef<HTMLVideoElement>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const hlsRef = React.useRef<any>(null)

  const sintonize = React.useCallback((u: string) => {
    if (!u) return { processedUrl: null, type: 'unknown' }
    let urlStr = u.trim()

    // DETECTOR DE TAGS HTML (EXTRAI SRC DE IFRAMES)
    if (urlStr.toLowerCase().includes('<iframe')) {
      const srcMatch = urlStr.match(/src=["'](.*?)["']/i);
      if (srcMatch && srcMatch[1]) urlStr = srcMatch[1];
    }

    const lowerUrl = urlStr.toLowerCase()
    
    // YOUTUBE FIEL (SIMPLES COMO NO CANVA)
    if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
      let ytId = "";
      const regExp = /^.*((youtu.be\/)|(v\/)|(\/u\/\w\/)|(embed\/)|(watch\?))\??v?=?([^#&?]*).*/;
      const match = urlStr.match(regExp);
      ytId = (match && match[7] && match[7].length === 11) ? match[7] : "";
      if (ytId) {
        return { processedUrl: `https://www.youtube.com/embed/${ytId}?autoplay=1&rel=0`, type: 'iframe' };
      }
    }

    // PORNHUB / XVIDEOS MASTER
    if (lowerUrl.includes('pornhub.com')) {
      const viewKeyMatch = urlStr.match(/viewkey=([a-z0-9]+)/i);
      if (viewKeyMatch && viewKeyMatch[1]) return { processedUrl: `https://www.pornhub.com/embed/${viewKeyMatch[1]}`, type: 'iframe' };
    }
    if (lowerUrl.includes('xvideos.com')) {
      const vidMatch = urlStr.match(/video[.\/]?([a-z0-9]{7,15})/i);
      if (vidMatch && vidMatch[1]) return { processedUrl: `https://www.xvideos.com/embedframe/${vidMatch[1]}`, type: 'iframe' };
    }

    // HLS / M3U8 / TS (TECNOLOGIA IPTV CANVA)
    const isHLS = lowerUrl.includes('.m3u8') || lowerUrl.includes('.ts') || lowerUrl.includes('chunklist');
    if (isHLS) {
      // Forçamos o Túnel apenas se for http:// para evitar Mixed Content
      const finalUrl = urlStr.startsWith('http:') ? `/api/proxy?url=${encodeURIComponent(urlStr)}` : urlStr;
      return { processedUrl: finalUrl, type: 'hls' };
    }

    // VÍDEOS DIRETOS (MP4 / BLINDER / ARCHIVE)
    const isDirect = lowerUrl.includes('.mp4') || lowerUrl.includes('.webm') || lowerUrl.includes('.mpeg');
    if (isDirect) {
      const finalUrl = urlStr.startsWith('http:') ? `/api/proxy?url=${encodeURIComponent(urlStr)}` : urlStr;
      return { processedUrl: finalUrl, type: 'video' };
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

    if (type === 'hls') {
      const Hls = (window as any).Hls;
      if (Hls && Hls.isSupported()) {
        const hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true,
          // Tecnologia Master: Força o uso do túnel em cada fragmento .ts se necessário
          xhrSetup: (xhr: any, url: string) => {
            if (url.startsWith('http:')) {
              xhr.open('GET', `/api/proxy?url=${encodeURIComponent(url)}`, true);
            }
          }
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
          if(data.fatal) { 
            switch(data.type) {
              case Hls.ErrorTypes.NETWORK_ERROR: hls.startLoad(); break;
              case Hls.ErrorTypes.MEDIA_ERROR: hls.recoverMediaError(); break;
              default: setError("Sinal instável. Tente reconectar."); setLoading(false); break;
            }
          } 
        });
      } else if (videoRef.current?.canPlayType('application/vnd.apple.mpegurl')) {
        videoRef.current.src = processedUrl;
        setLoading(false);
      }
    } else if (type === 'video') {
      if (videoRef.current) { 
        videoRef.current.src = processedUrl; 
        videoRef.current.onloadeddata = () => { 
          videoRef.current?.play().catch(() => {}); 
          setLoading(false); 
        }; 
        videoRef.current.onerror = () => { 
          setError("Erro no arquivo de vídeo."); 
          setLoading(false); 
        };
      }
    } else if (type === 'iframe') {
      // O loading do iFrame é controlado pelo onLoad
    }
  }, [processedUrl, type, cleanup]);

  React.useEffect(() => { init(); return () => cleanup(); }, [init, cleanup]);

  return (
    <div className="relative aspect-video w-full bg-black overflow-hidden border border-white/5 rounded-2xl group shadow-2xl">
      {loading && (
        <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-black">
          <Loader2 className="h-10 w-10 animate-spin text-primary mb-2" />
          <p className="text-[8px] font-black uppercase tracking-widest text-primary">Sintonizando Master...</p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 z-[60] flex flex-col items-center justify-center bg-black/90 p-10">
          <AlertCircle className="h-10 w-10 text-destructive mb-4" />
          <Button onClick={init} variant="outline" className="h-10 border-primary/40 text-primary uppercase font-black text-[10px]">RECONECTAR SINAL</Button>
        </div>
      )}
      
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
          controls 
          crossOrigin="anonymous" 
        />
      )}

      {(onNext || onPrev) && (
        <div className="absolute inset-0 z-20 flex items-center justify-between px-6 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={onPrev} className="pointer-events-auto h-12 w-12 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-primary transition-all"><ChevronLeft className="h-6 w-6 text-white" /></button>
          <button onClick={onNext} className="pointer-events-auto h-12 w-12 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-primary transition-all"><ChevronRight className="h-6 w-6 text-white" /></button>
        </div>
      )}
    </div>
  )
}
