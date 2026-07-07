"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { ChevronLeft, Loader2, Save, Plus, Trash2, Play, Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { toast } from "@/hooks/use-toast"
import { getContentById, saveContent, Season, Episode, ContentItem } from "@/lib/store"
import Link from "next/link"
import { Dialog, DialogContent } from "@/components/ui/dialog"

export default function EditContentPage() {
  const params = useParams()
  const id = params?.id as string
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)
  const [fetching, setFetching] = React.useState(true)
  const [testVideo, setTestVideo] = React.useState<{url: string, title: string} | null>(null)
  const [formData, setFormData] = React.useState<ContentItem | null>(null)
  const [seasons, setSeasons] = React.useState<Season[]>([])

  React.useEffect(() => {
    const load = async () => {
      if (!id) return
      try {
        const item = await getContentById(id)
        if (item) {
          setFormData({ ...item, isActive: item.isActive !== false, isRestricted: item.isRestricted === true })
          setSeasons(item.seasons || [])
        }
      } catch (err) { 
        console.error(err) 
      } finally { 
        setFetching(false) 
      }
    }
    load()
  }, [id])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData) return
    setLoading(true)
    try {
      await saveContent({ ...formData, seasons })
      toast({ title: "Sinal salvo no Supabase com sucesso!" })
      router.push("/admin/content")
    } catch (err) { 
      toast({ variant: "destructive", title: "Erro ao salvar." }) 
    } finally { 
      setLoading(false) 
    }
  }

  const addSeason = () => {
    const nextNum = seasons.length + 1
    setSeasons([...seasons, { num: nextNum, name: `Temporada ${nextNum}`, episodes: [] }])
  }

  const addEpisode = (seasonIndex: number) => {
    const updated = [...seasons]
    const nextNum = updated[seasonIndex].episodes.length + 1
    updated[seasonIndex].episodes.push({ num: nextNum, title: `Episódio ${nextNum}`, url: "" })
    setSeasons(updated)
  }

  const updateEpisode = (sIdx: number, epIdx: number, field: keyof Episode, value: any) => {
    const updated = [...seasons]
    updated[sIdx].episodes[epIdx] = { ...updated[sIdx].episodes[epIdx], [field]: value }
    setSeasons(updated)
  }

  const removeEpisode = (sIdx: number, epIdx: number) => {
    const updated = [...seasons]
    updated[sIdx].episodes = updated[sIdx].episodes.filter((_, i) => i !== epIdx)
    setSeasons(updated)
  }

  const obterVideoId = (urlAtual: string) => {
    if (!urlAtual) return ""
    try {
      if (urlAtual.includes("v=")) return urlAtual.split("v=")[1]?.split("&")[0] || ""
      if (urlAtual.includes("youtu.be/")) return urlAtual.split("youtu.be/")[1]?.split("?")[0] || ""
      if (urlAtual.includes("/embed/")) return urlAtual.split("/embed/")[1]?.split("?")[0] || ""
    } catch (e) {
      console.error(e)
    }
    return ""
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
        <form onSubmit={handleSave} className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="space-y-4 md:col-span-2 bg-zinc-900 p-6 rounded-xl border border-zinc-800 shadow-xl">
            <h1 className="text-xl font-bold text-purple-400">Novo Sinal Master v370</h1>
            
            <div className="space-y-2">
              <Label>Nome do Conteúdo</Label>
              <Input value={formData?.title || ""} onChange={(e) => setFormData(formData ? { ...formData, title: e.target.value } : null)} className="bg-zinc-950 border-zinc-800 text-white" required />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Mídia</Label>
                <Select value={formData?.type || "series"} onValueChange={(val) => setFormData(formData ? { ...formData, type: val } : null)}>
                  <SelectTrigger className="bg-zinc-950 border-zinc-800 text-white"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                    <SelectItem value="channel">Canal Aberto/PPV</SelectItem>
                    <SelectItem value="movie">Filme Único</SelectItem>
                    <SelectItem value="series">Série Master (Temporadas)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Pasta / Categoria</Label>
                <Input value={formData?.genre || ""} onChange={(e) => setFormData(formData ? { ...formData, genre: e.target.value } : null)} className="bg-zinc-950 border-zinc-800 text-white" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Sinopse do Sinal</Label>
              <Textarea value={formData?.description || ""} onChange={(e) => setFormData(formData ? { ...formData, description: e.target.value } : null)} className="bg-zinc-950 border-zinc-800 text-white" />
            </div>

            <div className="space-y-4 border-t border-zinc-800 pt-4">
              <div className="flex items-center justify-between">
                <h3 className="text-md font-bold text-zinc-300">Temporadas Master</h3>
                <Button type="button" onClick={addSeason} variant="outline" size="sm" className="border-purple-500/30 text-purple-400 bg-purple-500/10 hover:bg-purple-500/20">
                  <Plus className="mr-1 h-4 w-4" /> Adicionar Temp
                </Button>
              </div>

              {seasons.map((season, sIdx) => (
                <div key={sIdx} className="p-4 bg-zinc-950 border border-zinc-800 rounded-lg space-y-4">
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
                    <span className="font-bold text-purple-400 text-sm">Temp {season.num}</span>
                    <Button type="button" onClick={() => addEpisode(sIdx)} size="sm" className="bg-zinc-900 border border-zinc-800 text-xs text-purple-400 hover:bg-zinc-800">Add Ep na T{season.num}</Button>
                  </div>

                  <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1 lista-episodios">
                    {season.episodes?.map((ep, epIdx) => (
                      <div key={epIdx} className="space-y-2 p-3 bg-zinc-900 rounded border border-zinc-800">
                        <div className="flex gap-2 items-center">
                          <div className="w-12">
                            <Input type="number" value={ep.num} onChange={(e) => updateEpisode(sIdx, epIdx, "num", parseInt(e.target.value))} className="bg-zinc-950 h-8 text-center text-xs" />
                          </div>
                          <Input value={ep.title} onChange={(e) => updateEpisode(sIdx, epIdx, "title", e.target.value)} placeholder="Título" className="bg-zinc-950 h-8 text-xs" />
                          <Input value={ep.url} onChange={(e) => updateEpisode(sIdx, epIdx, "url", e.target.value)} placeholder="Link do Episódio" className="bg-zinc-950 h-8 text-xs" />
                          <Button type="button" onClick={() => setTestVideo({ url: ep.url, title: ep.title })} className="bg-blue-600 h-8 text-xs font-bold px-2">Sintonizar</Button>
                          <Button type="button" variant="destructive" onClick={() => removeEpisode(sIdx, epIdx)} className="h-8 w-8 p-0"><Trash2 className="h-3 w-3" /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4 bg-zinc-900 p-6 rounded-xl border border-zinc-800 shadow-xl h-fit">
            <h3 className="text-md font-bold text-zinc-300 flex items-center"><Wand2 className="mr-2 h-4 w-4 text-purple-400" /> Capa Oficial</h3>
            <Input value={formData?.imageUrl || ""} onChange={(e) => setFormData(formData ? { ...formData, imageUrl: e.target.value } : null)} className="bg-zinc-950 border-zinc-800 text-white" placeholder="URL da Imagem..." />
            
            <div className="border-t border-zinc-800 pt-4 space-y-4">
              <h3 className="text-sm font-bold text-zinc-400">Configurações de Sinal</h3>
              <div className="flex items-center justify-between">
                <Label>Sinal Ativo na Rede</Label>
                <Switch checked={formData?.isActive || false} onCheckedChange={(val) => setFormData(formData ? { ...formData, isActive: val } : null)} />
              </div>
              <div className="flex items-center justify-between">
                <Label>Conteúdo Restrito</Label>
                <Switch checked={formData?.isRestricted || false} onCheckedChange={(val) => setFormData(formData ? { ...formData, isRestricted: val } : null)} />
              </div>
            </div>

            <Button type="submit" disabled={loading} className="w-full bg-purple-600 font-bold hover:bg-purple-700 text-white mt-4 tracking-wider">
              {loading ? <Loader2 className="animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              SALVAR SINAL
