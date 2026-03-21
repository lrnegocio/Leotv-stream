"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { ChevronLeft, Sparkles, Loader2, Save, Globe, Lock, Trash2, ListOrdered, Link as LinkIcon, Layers, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { autoGenerateContentDescription } from "@/ai/flows/auto-generate-content-description-flow"
import { toast } from "@/hooks/use-toast"
import { getRemoteContent, saveContent, Season, Episode, ContentItem } from "@/lib/store"
import Link from "next/link"
import Image from "next/image"

export default function EditContentPage() {
  const { id } = useParams()
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)
  const [fetching, setFetching] = React.useState(true)
  const [generating, setGenerating] = React.useState(false)
  
  const [formData, setFormData] = React.useState<ContentItem | null>(null)
  const [episodes, setEpisodes] = React.useState<Episode[]>([])
  const [seasons, setSeasons] = React.useState<Season[]>([])

  React.useEffect(() => {
    const load = async () => {
      const list = await getRemoteContent()
      const item = list.find(c => c.id === id)
      if (item) {
        setFormData(item)
        setEpisodes(item.episodes || [])
        setSeasons(item.seasons || [])
      } else {
        toast({ variant: "destructive", title: "Erro", description: "Conteúdo não encontrado." })
        router.push("/admin/content")
      }
      setFetching(false)
    }
    load()
  }, [id, router])

  if (fetching || !formData) return <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>

  const addEpisode = (seasonId?: string) => {
    const newEp: Episode = {
      id: "ep_" + Date.now() + Math.random().toString(36).substring(2, 7),
      title: `Episódio ${episodes.length + 1}`,
      number: episodes.length + 1,
      streamUrl: ""
    }
    
    if (seasonId) {
      setSeasons(seasons.map(s => s.id === seasonId ? { ...s, episodes: [...s.episodes, newEp] } : s))
    } else {
      setEpisodes([...episodes, newEp])
    }
  }

  const addSeason = () => {
    const newSeason: Season = {
      id: "sea_" + Date.now() + Math.random().toString(36).substring(2, 7),
      number: seasons.length + 1,
      episodes: []
    }
    setSeasons([...seasons, newSeason])
  }

  const generateAI = async () => {
    if (!formData.title) return
    setGenerating(true)
    try {
      const res = await autoGenerateContentDescription({
        title: formData.title,
        contentType: formData.type === 'channel' ? 'movie' : formData.type as any,
      })
      setFormData(prev => prev ? ({ ...prev, description: res.description }) : null)
    } catch (error) {
      toast({ variant: "destructive", title: "Erro de IA", description: "Verifique sua chave." })
    } finally {
      setGenerating(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    await saveContent({
      ...formData,
      episodes: formData.type === 'series' ? episodes : undefined,
      seasons: formData.type === 'multi-season' ? seasons : undefined,
    })
    toast({ title: "Atualizado", description: "Conteúdo salvo com sucesso." })
    router.push("/admin/content")
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/content"><ChevronLeft className="h-5 w-5" /></Link>
        </Button>
        <h1 className="text-3xl font-bold font-headline uppercase italic text-primary">Editar Conteúdo Master</h1>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid gap-4 p-6 bg-card/50 border border-white/5 rounded-xl">
            <div className="space-y-2">
              <Label className="uppercase text-[10px] font-black opacity-60">Nome do Conteúdo</Label>
              <Input 
                value={formData.title} 
                onChange={e => setFormData({...formData, title: e.target.value})} 
                required
                className="h-12 bg-black/40 border-white/5 font-bold uppercase"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="uppercase text-[10px] font-black opacity-60">Tipo</Label>
                <Select value={formData.type} onValueChange={(val: any) => setFormData({...formData, type: val})}>
                  <SelectTrigger className="h-12 bg-black/40 border-white/5 font-bold"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="channel">Canal ao Vivo</SelectItem>
                    <SelectItem value="movie">Filme Único</SelectItem>
                    <SelectItem value="series">Série (Episódios Diretos)</SelectItem>
                    <SelectItem value="multi-season">Série (Temporadas + Episódios)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="uppercase text-[10px] font-black opacity-60">Pasta / Categoria</Label>
                <Input value={formData.genre} onChange={e => setFormData({...formData, genre: e.target.value})} className="h-12 bg-black/40 border-white/5 font-bold uppercase" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="uppercase text-[10px] font-black opacity-60">Descrição / Sinopse</Label>
                <Button type="button" variant="outline" size="sm" onClick={generateAI} disabled={generating} className="h-8 border-primary/20 text-primary">
                  {generating ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Sparkles className="h-3 w-3 mr-2" />} IA
                </Button>
              </div>
              <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="h-24 bg-black/40 border-white/5" />
            </div>
          </div>

          <div className="p-6 bg-card/50 border border-white/5 rounded-xl space-y-4">
            <h3 className="font-bold uppercase text-xs flex items-center gap-2 text-primary tracking-widest"><Globe className="h-4 w-4" /> Link Principal (Sinal Direto)</h3>
            <Input 
              value={formData.streamUrl || ""} 
              onChange={e => setFormData({...formData, streamUrl: e.target.value})} 
              className="h-12 bg-black/40 border-white/5 font-mono text-xs"
            />
          </div>

          <div className="p-6 bg-card/50 border border-white/5 rounded-xl space-y-4">
            <h3 className="font-bold uppercase text-xs flex items-center gap-2 text-primary tracking-widest"><LinkIcon className="h-4 w-4" /> URL da Capa</h3>
            <Input value={formData.imageUrl || ""} onChange={e => setFormData({...formData, imageUrl: e.target.value})} placeholder="https://exemplo.com/imagem.jpg" className="h-12 bg-black/40 border-white/5 font-mono text-xs" />
          </div>

          {formData.type === 'series' && (
            <div className="p-6 bg-card/50 border border-white/5 rounded-xl space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold uppercase text-xs flex items-center gap-2"><ListOrdered className="h-4 w-4" /> Episódios da Série</h3>
                <Button type="button" size="sm" onClick={() => addEpisode()} className="bg-primary/10 text-primary"><Plus className="h-4 w-4 mr-1" /> Add Ep</Button>
              </div>
              <div className="space-y-3">
                {episodes.map((ep, idx) => (
                  <div key={ep.id} className="flex gap-2 items-center bg-black/20 p-3 rounded-lg border border-white/5">
                    <span className="text-[10px] opacity-40">EP {idx + 1}</span>
                    <Input placeholder="URL do Episódio" value={ep.streamUrl} onChange={e => {
                      const newEps = [...episodes];
                      newEps[idx].streamUrl = e.target.value;
                      setEpisodes(newEps);
                    }} className="h-9 bg-black/40 border-white/5 font-mono text-xs flex-1" />
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setEpisodes(episodes.filter(item => item.id !== ep.id))}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {formData.type === 'multi-season' && (
            <div className="p-6 bg-card/50 border border-white/5 rounded-xl space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-bold uppercase text-xs flex items-center gap-2"><Layers className="h-4 w-4" /> Gerenciar Temporadas</h3>
                <Button type="button" size="sm" onClick={addSeason} className="bg-primary/10 text-primary"><Plus className="h-4 w-4 mr-1" /> Nova Temporada</Button>
              </div>
              {seasons.map((season, sIdx) => (
                <div key={season.id} className="p-4 bg-black/20 rounded-xl border border-white/5 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-black uppercase text-[10px] text-primary">Temporada {season.number}</h4>
                    <Button type="button" variant="outline" size="sm" onClick={() => addEpisode(season.id)} className="h-7 text-[8px] uppercase font-bold"><Plus className="h-3 w-3 mr-1" /> Add Episódio</Button>
                  </div>
                  <div className="space-y-2">
                    {season.episodes.map((ep, eIdx) => (
                      <div key={ep.id} className="flex gap-2 items-center">
                        <span className="text-[10px] opacity-40">EP {eIdx + 1}</span>
                        <Input placeholder={`Link Ep ${eIdx + 1}`} value={ep.streamUrl} onChange={e => {
                          const newSeasons = [...seasons];
                          newSeasons[sIdx].episodes[eIdx].streamUrl = e.target.value;
                          setSeasons(newSeasons);
                        }} className="h-9 bg-black/40 border-white/5 font-mono text-xs flex-1" />
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => {
                           const newSeasons = [...seasons];
                           newSeasons[sIdx].episodes = newSeasons[sIdx].episodes.filter(item => item.id !== ep.id);
                           setSeasons(newSeasons);
                        }}><Trash2 className="h-3 w-3" /></Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="p-6 bg-card/50 border border-white/5 rounded-xl space-y-4 text-center">
             <h3 className="font-bold uppercase text-xs flex items-center justify-center gap-2 text-primary tracking-widest">Capa Atual</h3>
             <div className="aspect-[2/3] relative bg-black/40 rounded-2xl overflow-hidden border border-white/5">
                {formData.imageUrl ? <Image src={formData.imageUrl} alt="Capa" fill className="object-cover" unoptimized /> : <div className="flex items-center justify-center h-full opacity-20">SEM CAPA</div>}
             </div>
          </div>

          <div className="p-6 bg-card/50 border border-white/5 rounded-xl space-y-4">
            <h3 className="font-bold uppercase text-xs flex items-center gap-2"><Lock className="h-4 w-4" /> Segurança</h3>
            <div className="flex items-center justify-between">
              <Label className="uppercase text-[10px] font-black">Conteúdo Restrito</Label>
              <Switch checked={formData.isRestricted} onCheckedChange={val => setFormData({...formData, isRestricted: val})} />
            </div>
          </div>
          <Button type="submit" className="w-full h-16 bg-primary font-bold text-lg uppercase shadow-2xl shadow-primary/20 rounded-2xl hover:scale-[1.02] transition-transform" disabled={loading}>
            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Save className="h-6 w-6 mr-2" />} ATUALIZAR
          </Button>
        </div>
      </form>
    </div>
  )
}
