"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, Music } from "lucide-react";
import { useEffect, useRef } from "react";

type VideoPlayerProps = {
  source: string;
};

// List of common audio file extensions
const audioExtensions = ['.mp3', '.aac', '.ogg', '.wav', '.flac', '.m4a'];

export function VideoPlayer({ source }: VideoPlayerProps) {
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    // Cleanup function to stop audio when component unmounts or source changes
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, [source]);

  if (!source.trim()) {
    return (
      <div className="text-center text-muted-foreground p-4">
        <p>Selecione um canal na barra lateral para começar.</p>
      </div>
    );
  }

  let embedSrc = "";
  let isRawEmbed = false;
  let isAudio = false;

  try {
    const url = new URL(source);
    if (audioExtensions.some(ext => url.pathname.toLowerCase().endsWith(ext))) {
      isAudio = true;
      embedSrc = source;
    }
  } catch (e) {
    // Not a valid URL, might be an embed code
  }


  // 1. Check for YouTube URL
  const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/;
  const youtubeMatch = source.match(youtubeRegex);
  if (youtubeMatch) {
    const videoId = youtubeMatch[1];
    embedSrc = `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`;
  }

  // 2. Check for Canva URL
  const canvaRegex = /(?:https?:\/\/)?(?:www\.)?canva\.com\/design\/([a-zA-Z0-9_-]+)\/(?:view|watch)/;
  const canvaMatch = source.match(canvaRegex);
  if (canvaMatch && !embedSrc) {
    const designId = canvaMatch[1];
    embedSrc = `https://www.canva.com/design/${designId}/view?embed`;
  }
  
  // 3. Check for raw embed code
  if (!embedSrc && !isAudio) {
      const srcRegex = /src="([^"]+)"/;
      const srcMatch = source.match(srcRegex);
      if (/<(iframe|div)/i.test(source) && srcMatch) {
          const rawSrc = srcMatch[1];
          // Check if it's a canva link that needs the "embed" param
          if(rawSrc.includes('canva.com/design') && !rawSrc.includes('embed')) {
            const url = new URL(rawSrc);
            url.pathname += url.pathname.endsWith('/') ? 'view' : '/view';
            url.searchParams.set('embed', '');
            embedSrc = url.toString();
          } else {
            embedSrc = rawSrc;
          }
      } else if (/<(iframe|div)/i.test(source)) {
        isRawEmbed = true;
      }
  }

  // Fallback for any other valid URL that isn't audio
  if(!embedSrc && !isRawEmbed && !isAudio) {
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
          <audio ref={audioRef} controls autoPlay src={embedSrc} className="w-3/4 max-w-lg">
              Seu navegador não suporta o elemento de áudio.
          </audio>
      </div>
    )
  }


  if (embedSrc && !isRawEmbed) {
     return (
        <div className="w-full h-full">
            <iframe
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
  
  // 4. Handle error/invalid input
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
