"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { ChevronLeft, Loader2, Save, Plus, Trash2, Play, Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { getContentById, saveContent, Season, Episode, ContentItem } from "@/lib/store"
import Link from "next/link"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

// FUNÇÃO DO PLAYER QUE FAZ OS EPISÓDIOS DO YOUTUBE/EXTERNOS FUNCIONAREM NA VPS
function renderizarPlayerSoberano(urlAtual: string) {
  if (!urlAtual || urlAtual.trim() === "") {
    return <div className="p-4 text-center text-white font-bold">Aguardando sinal ou link indisponível...</div>;
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
        src={`https://youtube.com{videoId}?autoplay=1&rel=0`}
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

export default function EditContentPage() {
  const params = useParams()
  const id = params?.id as string
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)
  const [fetching, setFetching] = React.useState(true)
  const [testVideo, setTestVideo] = React.useState<{url: string, title: string} | null>(null)
  const [formData, setFormData] = React.useState<ContentItem | null>(null)
  const [episodes, setEpisodes] = React.useState<Episode[]>([])
  const [seasons, setSeasons] = React.useState<Season[]>([])

  React.useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        const item = await getContentById(id)
        if (item) {
          setFormData({ ...item, isActive: item.isActive !== false })
          setEpisodes(item.episodes || [])
          setSeasons(item.seasons || [])
        } else {
          toast({ variant: "destructive", title: "Sinal não localizado." })
        }
      } catch (err) { console.error(err) } finally { setFetching(false) }
    }
    load()
  }, [id])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData) return
    setLoading(true)
    try {
      await saveContent({ ...formData, episodes, seasons })
      toast({ title: "Sucesso!", description: "Sinal recalibrado com sucesso." })
      router.push("/admin/content")
    } catch (err) {
      toast({ variant: "destructive", title: "Erro ao salvar alterações." })
    } finally { setLoading(false) }
  }

  const addEpisode = () => {
    const nextNum = episodes.length + 1
    setEpisodes([...episodes, { num: nextNum, title: `Episódio ${nextNum}`, url: "" }])
  }

  const updateEpisode = (index: number, field: keyof Episode, value: any) => {
    const updated = [...episodes]
    updated[index] = { ...updated[index], [field]: value }
    setEpisodes(updated)
  }

  const removeEpisode = (index: number) => {
    setEpisodes(episodes.filter((_, i) => i !== index))
  }

  if (fetching) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950 text-white">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-6 text-zinc-100">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center space-x-2">
            <Link href="/admin/content">
              <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold tracking-tight text-purple-400">Recalibrar Sinal v370</h1>
          </div>
          <Button onClick={handleSave} disabled={loading} className="bg-purple-600 font-bold hover:bg-purple-700 text-white">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Salvar Alterações
          </Button>
        </div>

        <form onSubmit={handleSave} className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="space-y-4 md:col-span-2 bg-zinc-900 p-6 rounded-xl border border-zinc-800 shadow-xl">
            <div className="space-y-2">
              <Label className="text-zinc-300">Nome do Conteúdo</Label>
              <Input
                value={formData?.title || ""}
                onChange={(e) => setFormData(formData ? { ...formData, title: e.target.value } : null)}
                className="bg-zinc-950 border-zinc-800 text-white focus:border-purple-500"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-zinc-300">Tipo de Mídia</Label>
                <Select
                  value={formData?.type || "channel"}
                  onValueChange={(val) => setFormData(formData ? { ...formData, type: val } : null)}
                >
                  <SelectTrigger className="bg-zinc-950 border-zinc-800 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                    <SelectItem value="channel">Canal Aberto/PPV</SelectItem>
                    <SelectItem value="movie">Filme Único</SelectItem>
                    <SelectItem value="series">Série Simples</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-zinc-300">Pasta / Categoria</Label>
                <Input
                  value={formData?.genre || ""}
                  onChange={(e) => setFormData(formData ? { ...formData, genre: e.target.value } : null)}
                  className="bg-zinc-950 border-zinc-800 text-white"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">Sinopse do Sinal</Label>
              <Textarea
                value={formData?.description || ""}
                onChange={(e) => setFormData(formData ? { ...formData, description: e.target.value } : null)}
                className="bg-zinc-950 border-zinc-800 text-white min-h-[80px]"
              />
            </div>

            <div className="space-y-4 border-t border-zinc-800 pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-md font-bold text-zinc-300">Episódios da Série</h3>
                <Button type="button" onClick={addEpisode} variant="outline" size="sm" className="border-purple-500/30 text-purple-400 bg-purple-500/10 hover:bg-purple-500/20">
                  <Plus className="mr-1 h-4 w-4" /> Adicionar Ep
                </Button>
              </div>

              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-2 lista-episodios">
                {episodes.map((ep, index) => (
                  <div key={index} className="flex flex-col gap-3 p-4 bg-zinc-950 border border-zinc-800 rounded-lg card-episodio">
                    <div className="flex items-center justify-between gap-2">
                      <div className="w-16">
                        <Label className="text-xs text-zinc-500">Num</Label>
                        <Input
                          type="number"
                          value={ep.num}
                          onChange={(e) => updateEpisode(index, "num", parseInt(e.target.value))}
                          className="bg-zinc-900 border-zinc-800 text-white h-9"
                        />
                      </div>
                      <div className="flex-1">
                        <Label className="text-xs text-zinc-500">Título do Ep</Label>
                        <Input
                          value={ep.title}
                          onChange={(e) => updateEpisode(index, "title", e.target.value)}
                          className="bg-zinc-900 border-zinc-800 text-white h-9"
                        />
                      </div>
                      <div className="pt-5">
                        <Button type="button" variant="destructive" size="icon" onClick={() => removeEpisode(index)} className="h-9 w-9">
                          <Trash2 className="h-4 w-4" />
                        </Button>
