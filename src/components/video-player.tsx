
"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, Music } from "lucide-react";
import { useEffect, useRef } from "react";

type VideoPlayerProps = {
  source: string;
  onEnded: () => void;
};

// List of common audio file extensions
const audioExtensions = ['.mp3', '.aac', '.ogg', '.wav', '.flac', '.m4a'];

export function VideoPlayer({ source, onEnded }: VideoPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  
  useEffect(() => {
    const handleMediaEnd = () => {
      if (onEnded) {
        onEnded();
      }
    };

    const handleMessage = (event: MessageEvent) => {
        try {
            if (typeof event.data === 'string') {
                const data = JSON.parse(event.data);
                // Listen for events from various embeddable players (e.g. YouTube, Vimeo)
                if (event.origin.includes('youtube.com') && data.event === 'onStateChange' && data.info === 0) {
                     handleMediaEnd(); // YouTube's ended state
                } else if (data.event === 'ended' || data.event === 'finish' || data.event === 'end') {
                    handleMediaEnd();
                }
            }
        } catch (e) {
            // Not a JSON message, ignore
        }
    };
    
    window.addEventListener('message', handleMessage);

    const currentAudioRef = audioRef.current;
    if (currentAudioRef) {
        currentAudioRef.addEventListener('ended', handleMediaEnd);
    }
    
    const currentVideoRef = videoRef.current;
    if (currentVideoRef) {
        currentVideoRef.addEventListener('ended', handleMediaEnd);
    }

    return () => {
      if (currentAudioRef) {
        currentAudioRef.removeEventListener('ended', handleMediaEnd);
      }
      if (currentVideoRef) {
        currentVideoRef.removeEventListener('ended', handleMediaEnd);
      }
      window.removeEventListener('message', handleMessage);
    };
  }, [source, onEnded]);


  if (!source || !source.trim()) {
    return (
      <div className="text-center text-muted-foreground p-4">
        <p>Selecione um canal na barra lateral para começar.</p>
      </div>
    );
  }

  let embedSrc = "";
  let isRawEmbed = false;
  let isAudio = false;
  let isVideo = false;

  try {
    const url = new URL(source);
    if (audioExtensions.some(ext => url.pathname.toLowerCase().endsWith(ext))) {
      isAudio = true;
    }
    const videoExtensions = ['.mp4', '.webm', '.mkv', '.ogg', '.mov'];
    if (videoExtensions.some(ext => url.pathname.toLowerCase().endsWith(ext))) {
      isVideo = true;
    }
  } catch (e) {
    // Not a valid URL, might be an embed code
  }


  // 1. Check for YouTube URL
  const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/;
  const youtubeMatch = source.match(youtubeRegex);
  if (youtubeMatch) {
    const videoId = youtubeMatch[1];
    embedSrc = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&enablejsapi=1&origin=${window.location.origin}`;
  }

  // 2. Check for Canva URL (both long and short formats)
  const canvaLongRegex = /(?:https?:\/\/)?(?:www\.)?canva\.com\/design\/([a-zA-Z0-9_-]+)\/(?:view|watch)/;
  const canvaShortRegex = /(?:https?:\/\/)?(?:www\.)?canva\.com\/V\/([a-zA-Z0-9_-]+)/;
  const canvaLongMatch = source.match(canvaLongRegex);
  const canvaShortMatch = source.match(canvaShortRegex);

  if (!embedSrc && (canvaLongMatch || canvaShortMatch)) {
    // Canva's embed format is different from the watch format. It uses the design ID.
    // The short /V/ link redirects to the long /design/ link. We can construct the embed URL from the design ID.
    // However, the simplest way to embed Canva is using their specific embed URL.
    // Let's create a generic embed for any Canva link.
    const url = new URL(source);
    const pathParts = url.pathname.split('/').filter(p => p);
    if(pathParts[0] === 'design' && pathParts[2] === 'view') {
        embedSrc = `${url.origin}/design/${pathParts[1]}/view?embed`;
    } else if (pathParts[0] === 'V') {
         // The short link itself can often be embedded. Let's try that.
         // A more robust solution might be needed if they change this.
         // For now we'll assume it redirects properly inside an iframe.
         embedSrc = source;
    }
  }
  
  // 3. Check for Dailymotion URL
  const dailymotionRegex = /(?:https?:\/\/)?(?:www\.)?dailymotion\.com\/(?:video|embed\/video)\/([a-zA-Z0-9]+)/;
  const dailymotionMatch = source.match(dailymotionRegex);
  if (!embedSrc && dailymotionMatch) {
    const videoId = dailymotionMatch[1];
    embedSrc = `https://www.dailymotion.com/embed/video/${videoId}?autoplay=1`;
  }
  
  // 4. Check for Tokyvideo URL
  const tokyvideoRegex = /(?:https?:\/\/)?(?:www\.)?tokyvideo\.com\/(?:br\/)?video\/([a-zA-Z0-9-]+)/;
  const tokyvideoMatch = source.match(tokyvideoRegex);
  if (!embedSrc && tokyvideoMatch) {
    // Tokyvideo uses the video title/slug as an ID in the URL, but the embed usually works with a numerical ID.
    // However, their embed generator often just uses the full path in an iframe.
    // The most reliable way is often just to get the embed ID from the page, but since we can't do that,
    // we'll try to construct a generic embed URL which often works.
    const videoSlug = tokyvideoMatch[1];
    // Tokyvideo embed URLs are often just `https://www.tokyvideo.com/embed/{ID}`. We need to find the ID.
    // A simpler approach is to try embedding the page itself, which sometimes works for these sites.
    // A common embed format is just /embed/<slug-or-id>
    // Let's try to extract the last part of the url, which is often the id
    const parts = source.split('/');
    const videoId = parts[parts.length -1].split('?')[0]; // get last part of path
     embedSrc = `https://www.tokyvideo.com/embed/${videoId}`;
  }


  // 5. Check for raw embed code
  if (!embedSrc && !isAudio && !isVideo) {
      const srcRegex = /src="([^"]+)"/;
      const srcMatch = source.match(srcRegex);
      if (/<(iframe|div)/i.test(source) && srcMatch) {
          let rawSrc = srcMatch[1];
          // Ensure autoplay and other useful params if possible
          try {
            const url = new URL(rawSrc);
            if(url.hostname.includes('youtube.com') || url.hostname.includes('youtube-nocookie.com')) {
                url.searchParams.set('autoplay', '1');
                url.searchParams.set('enablejsapi', '1');
                url.searchParams.set('origin', window.location.origin);
            } else if (url.hostname.includes('dailymotion.com')) {
                 url.searchParams.set('autoplay', '1');
            }
            embedSrc = url.toString();
          } catch {
             embedSrc = rawSrc;
          }
      } else if (/<(iframe|div)/i.test(source)) {
        isRawEmbed = true;
      }
  }

  // Fallback for any other valid URL that isn't audio or video
  if(!embedSrc && !isRawEmbed && !isAudio && !isVideo) {
    try {
        const url = new URL(source);
        if(url.protocol === 'http:' || url.protocol === 'https:') {
            embedSrc = source;
        }
    } catch (e) {
        // not a valid URL
    }
  }
  
  if (isAudio) {
    return (
       <div className="w-full h-full flex flex-col items-center justify-center bg-black text-white">
          <Music size={96} className="text-accent mb-4" />
          <p className="text-lg mb-4">Tocando rádio</p>
          <audio ref={audioRef} controls autoPlay src={source} className="w-3/4 max-w-lg">
              Seu navegador não suporta o elemento de áudio.
          </audio>
      </div>
    )
  }

  if (isVideo) {
    return (
         <div className="w-full h-full">
            <video 
              ref={videoRef}
              src={source} 
              controls 
              autoPlay 
              className="w-full h-full"
            />
         </div>
    )
  }


  if (embedSrc && !isRawEmbed) {
     return (
        <div className="w-full h-full">
            <iframe
            ref={iframeRef}
            key={embedSrc}
            src={embedSrc}
            title="Embedded Content"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="w-full h-full border-0"
            />
        </div>
    );
  }

  if (isRawEmbed) {
    return (
      <div
        className="w-full h-full [&_iframe]:w-full [&_iframe]:h-full [&_iframe]:border-0 [&_div]:w-full [&_div]:h-full"
        dangerouslySetInnerHTML={{ __html: source.replace(/<a[^>]*>.*<\/a>/g, '') }}
      />
    );
  }
  
  // Handle error/invalid input
  return (
    <div className="w-full h-full flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md bg-destructive/20 border-destructive text-destructive-foreground">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Entrada Inválida</AlertTitle>
        <AlertDescription>
            O link ou código fornecido não é um formato válido de vídeo, rádio ou embed. Por favor, verifique sua entrada.
        </AlertDescription>
        </Alert>
    </div>
  );
}
