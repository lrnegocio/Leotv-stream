"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

type VideoPlayerProps = {
  source: string;
};

export function VideoPlayer({ source }: VideoPlayerProps) {
  if (!source.trim()) {
    return (
      <div className="text-center text-muted-foreground p-4">
        <p>Insira um URL ou código de incorporação na barra lateral para começar.</p>
        <p className="text-sm">Suportamos YouTube, Canva e iframes/divs brutos.</p>
      </div>
    );
  }

  let embedSrc = "";
  let isRawEmbed = false;

  // 1. Check for YouTube URL
  const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/;
  const youtubeMatch = source.match(youtubeRegex);
  if (youtubeMatch) {
    const videoId = youtubeMatch[1];
    embedSrc = `https://www.youtube-nocookie.com/embed/${videoId}`;
  }

  // 2. Check for Canva URL
  const canvaRegex = /(?:https?:\/\/)?(?:www\.)?canva\.com\/design\/([a-zA-Z0-9_-]+)\/(?:view|watch)/;
  const canvaMatch = source.match(canvaRegex);
  if (canvaMatch && !embedSrc) {
    const designId = canvaMatch[1];
    embedSrc = `https://www.canva.com/design/${designId}/view?embed`;
  }
  
  // 3. Check for raw embed code
  if (!embedSrc) {
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
        <Alert variant="destructive" className="max-w-md">
        <Terminal className="h-4 w-4" />
        <AlertTitle>Entrada Inválida</AlertTitle>
        <AlertDescription>
            A entrada fornecida não é um URL válido do YouTube/Canva ou código de incorporação. Por favor, verifique sua entrada e tente novamente.
        </AlertDescription>
        </Alert>
    </div>
  );
}
