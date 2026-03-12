
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Sparkles, Loader2, Save, Globe, Plus, Trash2, ListOrdered, Layers, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { autoGenerateContentDescription } from "@/ai/flows/auto-generate-content-description-flow"
import { toast } from "@/hooks/use-toast"
import { saveContent, Season, Episode, ContentType } from "@/lib/store"
import Link from "next/link"

function NewContentForm() {
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)
  const [generating, setGenerating] = React.useState(false)
  
  const [formData, setFormData] = React.useState({
    title: "",
    type: "channel" as ContentType,
    genre: "",
    description: "",
    streamUrl: "",
    isRestricted: false,
  })

  const [episodes, setEpisodes] = React.useState<Episode[]>([])
  const [seasons, setSeasons] = React.useState<Season[]>([])

  const addEpisode = (seasonId?: string) => {
    const newEp: Episode = {
      id: Math.random().toString(36).substring(7),
      title: `Episódio`,
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
      id: Math.random().toString(36).substring(7),
      number: seasons.length + 1,
      episodes: []
    }
    setSeasons([...seasons, newSeason])
  }

  const generateAI = async () => {
    if (!formData.title) {
      toast({ variant: "destructive", title: "Atenção", description: "Insira o título para a IA poder escrever." })
      return
    }
    setGenerating(true)
    try {
      const res = await autoGenerateContentDescription({
        title: formData.title,
        contentType: formData.type === 'channel' ? 'movie' : formData.type as any,
      })
      setFormData(prev => ({ ...prev, description: res.description }))
    } catch (error) {
      toast({ variant: "destructive", title: "Erro de IA", description: "Verifique sua chave de IA." })
    } finally {
      setGenerating(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    await saveContent({
      id: Math.random().toString(36).substring(7),
      ...formData,
      episodes: formData.type === 'series' ? episodes : undefined,
      seasons: formData.type === 'multi-season' ? seasons : undefined,
    })

    toast({ title: "Conteúdo Adicionado", description: "Salvo com sucesso na biblioteca." })
    router.push("/admin/content")
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/content"><ChevronLeft className="h-5 w-5" /></Link>
        </Button>
        <h1 className="text-3xl font-bold font-headline">Novo Conteúdo P2P</h1>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid gap-4 p-6 bg-card/50 border border-white/5 rounded-xl">
            <div className="space-y-2">
              <Label>Nome do Canal, Filme ou Série</Label>
              <Input 
                value={formData.title} 
                onChange={e => setFormData({...formData, title: e.target.value})} 
                placeholder="Ex: HBO Family ou Stranger Things" required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Conteúdo</Label>
                <Select value={formData.type} onValueChange={(val: any) => setFormData({...formData, type: val})}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="channel">Canal ao Vivo</SelectItem>
                    <SelectItem value="movie">Filme Único</SelectItem>
                    <SelectItem value="series">Série (Episódios Diretos)</SelectItem>
                    <SelectItem value="multi-season">Série (Temporadas + Episódios)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Categoria (Pasta)</Label>
                <Input 
                  value={formData.genre} 
                  onChange={e => setFormData({...formData, genre: e.target.value})} 
                  placeholder="Ex: ESPORTES, INFANTIL, 4K"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Descrição</Label>
                <Button type="button" variant="outline" size="sm" onClick={generateAI} disabled={generating}>
                  {generating ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Sparkles className="h-3 w-3 mr-2" />}
                  IA: Gerar Sinopse
                </Button>
              </div>
              <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="h-24" />
            </div>
          </div>

          {formData.type === 'channel' || formData.type === 'movie' ? (
            <div className="p-6 bg-card/50 border border-white/5 rounded-xl space-y-4">
              <h3 className="font-semibold flex items-center gap-2 text-primary"><Globe className="h-4 w-4" /> Link da Stream</h3>
              <Input 
                value={formData.streamUrl} 
                onChange={e => setFormData({...formData, streamUrl: e.target.value})}
                placeholder="https://sua-stream.m3u8" 
                required
              />
            </div>
          ) : formData.type === 'series' ? (
            <div className="p-6 bg-card/50 border border-white/5 rounded-xl space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold flex items-center gap-2"><ListOrdered className="h-4 w-4" /> Lista de Episódios</h3>
                <Button type="button" size="sm" onClick={() => addEpisode()}><Plus className="h-4 w-4 mr-1" /> Adicionar Ep</Button>
              </div>
              <div className="space-y-3">
                {episodes.map((ep, idx) => (
                  <div key={ep.id} className="flex gap-2 items-end bg-black/20 p-3 rounded-lg border border-white/5">
                    <div className="w-16"><Label className="text-xs">Ep Nº</Label><Input type="number" defaultValue={idx+1} /></div>
                    <div className="flex-1"><Label className="text-xs">Título/Link</Label><Input placeholder="URL do Episódio" value={ep.streamUrl} onChange={e => {
                      const newEps = [...episodes];
                      newEps[idx].streamUrl = e.target.value;
                      setEpisodes(newEps);
                    }} /></div>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => setEpisodes(episodes.filter(item => item.id !== ep.id))}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-6 bg-card/50 border border-white/5 rounded-xl space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold flex items-center gap-2"><Layers className="h-4 w-4" /> Temporadas</h3>
                <Button type="button" size="sm" onClick={addSeason}><Plus className="h-4 w-4 mr-1" /> Nova Temp</Button>
              </div>
              {seasons.map((season, sIdx) => (
                <div key={season.id} className="p-4 bg-black/20 rounded-xl border border-white/5 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-bold text-primary">Temporada {season.number}</h4>
                    <Button type="button" variant="outline" size="sm" onClick={() => addEpisode(season.id)}><Plus className="h-3 w-3 mr-1" /> Add Episódio</Button>
                  </div>
                  <div className="space-y-2">
                    {season.episodes.map((ep, eIdx) => (
                      <div key={ep.id} className="flex gap-2">
                        <Input placeholder={`Link Ep ${eIdx + 1}`} value={ep.streamUrl} onChange={e => {
                          const newSeasons = [...seasons];
                          newSeasons[sIdx].episodes[eIdx].streamUrl = e.target.value;
                          setSeasons(newSeasons);
                        }} />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="p-6 bg-card/50 border border-white/5 rounded-xl space-y-4">
            <h3 className="font-semibold flex items-center gap-2"><Lock className="h-4 w-4" /> Segurança</h3>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Conteúdo Restrito</Label>
                <p className="text-xs text-muted-foreground">Bloqueia com senha parental</p>
              </div>
              <Switch 
                checked={formData.isRestricted} 
                onCheckedChange={val => setFormData({...formData, isRestricted: val})} 
              />
            </div>
          </div>

          <Button type="submit" className="w-full h-14 bg-primary text-lg font-bold shadow-lg shadow-primary/20" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <Save className="mr-2 h-6 w-6" />}
            SALVAR NO SISTEMA
          </Button>
        </div>
      </form>
    </div>
  )
}

export default function NewContentPage() {
  return (
    <React.Suspense fallback={<div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>}>
      <NewContentForm />
    </React.Suspense>
  )
}
