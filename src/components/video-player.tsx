"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal } from "lucide-react";

type VideoPlayerProps = {
  source: string;
};

export function VideoPlayer({ source }: VideoPlayerProps) {
  if (!source.trim()) {
    return (
      <div className="text-center text-muted-foreground">
        <p>Enter a URL or embed code above to get started.</p>
        <p className="text-sm">We support YouTube, Canva, and raw iframe/div embeds.</p>
      </div>
    );
  }

  // 1. Check for YouTube URL
  const youtubeRegex = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/;
  const youtubeMatch = source.match(youtubeRegex);
  if (youtubeMatch) {
    const videoId = youtubeMatch[1];
    const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}`;
    return (
      <div className="w-full aspect-video rounded-lg overflow-hidden border shadow-inner">
        <iframe
          src={embedUrl}
          title="YouTube video player"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowFullScreen
          className="w-full h-full"
        />
      </div>
    );
  }

  // 2. Check for Canva URL
  const canvaRegex = /(?:https?:\/\/)?(?:www\.)?canva\.com\/design\/([a-zA-Z0-9_-]+)\/view/;
  const canvaMatch = source.match(canvaRegex);
  if (canvaMatch) {
    const designId = canvaMatch[1];
    const embedUrl = `https://www.canva.com/design/${designId}/view?embed`;
    return (
      <div className="w-full aspect-video rounded-lg overflow-hidden border shadow-inner">
        <iframe
          loading="lazy"
          src={embedUrl}
          allowFullScreen
          allow="fullscreen"
          className="w-full h-full"
        />
      </div>
    );
  }

  // 3. Check for raw embed code
  const isEmbed = /<(iframe|div)/i.test(source);
  if (isEmbed) {
    return (
      <div
        className="w-full [&_iframe]:w-full [&_iframe]:h-full [&_iframe]:border-0 [&_iframe]:rounded-lg [&_div]:rounded-lg"
        dangerouslySetInnerHTML={{ __html: source }}
      />
    );
  }

  // 4. Handle error/invalid input
  return (
    <Alert variant="destructive" className="max-w-md">
      <Terminal className="h-4 w-4" />
      <AlertTitle>Invalid Input</AlertTitle>
      <AlertDescription>
        The provided input is not a valid YouTube/Canva URL or embed code. Please check your input and try again.
      </AlertDescription>
    </Alert>
  );
}
