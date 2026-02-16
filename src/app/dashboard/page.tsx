"use client";

import { useEffect, useRef, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Terminal, Music } from "lucide-react";

/* =========================
   VideoPlayer
========================= */

type VideoPlayerProps = {
  source: string;
  onEnded: () => void;
};

const audioExtensions = [".mp3", ".aac", ".ogg", ".wav", ".flac", ".m4a"];
const videoExtensions = [".mp4", ".webm", ".mkv", ".ogg", ".mov"];

function VideoPlayer({ source, onEnded }: VideoPlayerProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (!source) return;

    const handleMediaEnd = () => {
      onEnded();
    };

    const handleMessage = (event: MessageEvent) => {
      try {
        if (typeof event.data !== "string") return;
        const data = JSON.parse(event.data);

        if (data.event === "onStateChange" && data.info === 0) {
          handleMediaEnd();
        }
      } catch {}
    };

    window.addEventListener("message", handleMessage);
    audioRef.current?.addEventListener("ended", handleMediaEnd);
    videoRef.current?.addEventListener("ended", handleMediaEnd);

    return () => {
      window.removeEventListener("message", handleMessage);
      audioRef.current?.removeEventListener("ended", handleMediaEnd);
      videoRef.current?.removeEventListener("ended", handleMediaEnd);
    };
  }, [source, onEnded]);

  if (!source?.trim()) {
    return (
      <div className="text-center text-muted-foreground p-4">
        <p>Selecione um canal na barra lateral para começar.</p>
      </div>
    );
  }

  let isAudio = false;
  let isVideo = false;
  let embedSrc = "";

  try {
    const url = new URL(source);
    isAudio = audioExtensions.some(ext =>
      url.pathname.toLowerCase().endsWith(ext)
    );
    isVideo = videoExtensions.some(ext =>
      url.pathname.toLowerCase().endsWith(ext)
    );
  } catch {}

  const ytMatch = source.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([\w-]{11})/
  );

  if (ytMatch) {
    embedSrc = `https://www.youtube-nocookie.com/embed/${ytMatch[1]}?autoplay=1&enablejsapi=1&origin=${window.location.origin}`;
  }

  if (isAudio) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-black text-white">
        <Music size={96} className="text-accent mb-4" />
        <p className="text-lg mb-4">Tocando áudio</p>
        <audio
          ref={audioRef}
          src={source}
          autoPlay
          controls
          className="w-3/4 max-w-lg"
        />
      </div>
    );
  }

  if (isVideo) {
    return (
      <video
        ref={videoRef}
        src={source}
        autoPlay
        controls
        className="w-full h-full bg-black"
      />
    );
  }

  if (embedSrc) {
    return (
      <iframe
        ref={iframeRef}
        src={embedSrc}
        allow="autoplay; fullscreen"
        allowFullScreen
        className="w-full h-full border-0"
      />
    );
  }

  return (
    <Alert variant="destructive" className="m-4">
      <Terminal className="h-4 w-4" />
      <AlertTitle>Erro ao carregar mídia</AlertTitle>
      <AlertDescription>
        O formato ou link informado não é suportado.
      </AlertDescription>
    </Alert>
  );
}

/* =========================
   Página Dashboard
========================= */

export default function DashboardPage() {
  const [currentSource, setCurrentSource] = useState<string>("");

  const handleEnded = () => {
    console.log("Mídia finalizada → avançar canal");
    // aqui depois ligamos à playlist automática
  };

  return (
    <div className="w-full h-screen bg-black">
      <VideoPlayer source={currentSource} onEnded={handleEnded} />
    </div>
  );
}
