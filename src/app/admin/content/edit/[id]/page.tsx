"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import { Loader2, Play } from "lucide-react"
import { getContentById, Episode, ContentItem } from "@/lib/store"

function renderizarPlayerUsuario(urlAtual: string) {
  if (!urlAtual || urlAtual.trim() === "") {
    return <div className="p-4 text-center text-white font-bold">Aguardando sinal...</div>;
  }
  if (urlAtual.includes("youtube.com") || urlAtual.includes("youtu.be")) {
    let videoId = "";
    try {
      if (urlAtual.includes("v=")) {
        videoId = urlAtual.split("v=")[1]?.split("&")[0] || "";
      } else if (urlAtual.includes("youtu.be/")) {
        videoId = urlAtual.split("youtu.be/")[1]?.split("?")[0] || "";
      } else if (urlAtual.includes("/embed/")) {
        videoId = urlAtual.split("/embed/")[1]?.split("?")[0] || "";
      }
    } catch (e) { console.error(e); }
    return (
      <iframe
        src={`https://youtube.com{videoId}?autoplay=1&rel=0&modestbranding=1`}
        className="w-full h-full aspect-video border-0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      ></iframe>
    );
  }
  if (urlAtual.includes("redecanais") || urlAtual.includes("rdcanais") || urlAtual.includes("ch.php") || urlAtual.includes(".html") || urlAtual.includes("/player")) {
    return (
      <iframe
        src={urlAtual}
        className="w-full h-full aspect-video border-0"
        allow="autoplay; fullscreen; encrypted-media"
        allowFullScreen
        sandbox="allow-scripts allow-same-origin allow-forms allow-presentation"
      ></iframe>
    );
  }
  return <video src={urlAtual} controls autoPlay className="w-full h-full aspect-video" />;
}

export default function UserSeriesPlayerPage() {
  const params = useParams()
  const id = params?.id as string
  const [fetching, setFetching] = React.useState(true)
  const [formData, setFormData] = React.useState<ContentItem | null>(null)
  const [episodes, setEpisodes] = React.useState<Episode[]>([])
  const [currentEp, setCurrentEp] = React.useState<Episode | null>(null)

  React.useEffect(() => {
    const load = async () => {
      if (!id) return
      try {
        const item = await getContentById(id)
        if (item) {
          setFormData(item)
          const eps = item.episodes || []
          setEpisodes(eps)
          if (eps.length > 0) setCurrentEp(eps[0])
        }
      } catch (err) { console.error(err) } finally { setFetching(false) }
    }
    load()
  }, [id])

  if (fetching) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950 text-white">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-4 text-white flex flex-col items-center">
      <h1 className="text-xl font-bold mb-4 text-purple-400 text-center">{formData?.title} - {currentEp?.title}</h1>
      <div className="w-full max-w-4xl aspect-video bg-black rounded-lg overflow-hidden border border-zinc-800 shadow-2xl">
        {currentEp?.url ? renderizarPlayerUsuario(currentEp.url) : <div className="p-4 text-center">Nenhum sinal selecionado</div>}
      </div>
      <div className="w-full max-w-4xl mt-6">
        <h3 className="text-md font-bold mb-3 text-zinc-400">Lista de Episódios</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 max-h-[200px] overflow-y-auto lista-episodios pr-2">
          {episodes.map((ep, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentEp(ep)}
              className={`p-3 rounded-lg border text-left flex items-center justify-between card-episodio transition-all ${
                currentEp?.num === ep.num ? "bg-purple-600 border-purple-500 text-white" : "bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800"
              }`}
            >
              <span className="truncate text-xs font-bold">{ep.title}</span>
              <Play className="h-3 w-3 flex-shrink-0 ml-1" />
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
