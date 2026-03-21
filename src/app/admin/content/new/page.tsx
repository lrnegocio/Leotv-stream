
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Sparkles, Loader2, Save, Globe, Plus, Trash2, ListOrdered, Layers, Lock, Image as ImageIcon, Link as LinkIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { autoGenerateContentDescription } from "@/ai/flows/auto-generate-content-description-flow"
import { generateChannelImage } from "@/ai/flows/generate-channel-image-flow"
import { toast } from "@/hooks/use-toast"
import { saveContent, Season, Episode, ContentType } from "@/lib/store"
import Link from "next/link"
import Image from "next/image"

function NewContentForm() {
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)
  const [generating, setGenerating] = React.useState(false)
  const [generatingImage, setGeneratingImage] = React.useState(false)
  
  const [formData, setFormData] = React.useState({
    title: "",
    type: "channel" as ContentType,
    genre: "",
    description: "",
    streamUrl: "",
    isRestricted: false,
    imageUrl: ""
  })

  const [episodes, setEpisodes] = React.useState<Episode[]>([])
  const [seasons, setSeasons] = React.useState<Season[]>([])

  const addEpisode = (seasonId?: string) => {
    const newEp: Episode = {
      id: "ep_" + Date.now() + Math.random().toString(36).substring(2, 7),
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
      id: "sea_" + Date.now() + Math.random().toString(36).substring(2, 7),
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

  const handleGenerateImage = async () => {
    if (!formData.title || !formData.genre) {
      toast({ variant: "destructive", title: "Atenção", description: "Preencha título e categoria para gerar a imagem." })
      return
    }
    setGeneratingImage(true)
    try {
      const res = await generateChannelImage({
        title: formData.title,
        genre: formData.genre,
      })
      setFormData(prev => ({ ...prev, imageUrl: res.imageUrl }))
      toast({ title: "Imagem Gerada!", description: "A capa foi criada com sucesso pela IA." })
    } catch (error) {
      toast({ variant: "destructive", title: "Erro na IA", description: "Não foi possível gerar a imagem." })
    } finally {
      setGeneratingImage(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const newId = "canal_" + Date.now() + "_" + Math.random().toString(36).substring(2, 12);

    await saveContent({
      id: newId,
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
        <h1 className="text-3xl font-bold font-headline uppercase italic text-primary">Novo Conteúdo Master</h1>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid gap-4 p-6 bg-card/50 border border-white/5 rounded-xl">
            <div className="space-y-2">
              <Label className="uppercase text-[10px] font-black opacity-60">Nome do Canal, Filme ou Série</Label>
              <Input 
                value={formData.title} 
                onChange={e => setFormData({...formData, title: e.target.value})} 
                placeholder="Ex: HBO Family ou Stranger Things" required
                className="h-12 bg-black/40 border-white/5 font-bold uppercase"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="uppercase text-[10px] font-black opacity-60">Tipo de Conteúdo</Label>
                <div className="bg-black/40 rounded-md">
                <Select value={formData.type} onValueChange={(val: any) => setFormData({...formData, type: val})}>
                  <SelectTrigger className="h-12 border-white/5 bg-transparent font-bold"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="channel">Canal ao Vivo</SelectItem>
                    <SelectItem value="movie">Filme Único</SelectItem>
                    <SelectItem value="series">Série (Episódios Diretos)</SelectItem>
                    <SelectItem value="multi-season">Série (Temporadas + Episódios)</SelectItem>
                  </SelectContent>
                </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="uppercase text-[10px] font-black opacity-60">Categoria (Pasta)</Label>
                <Input 
                  value={formData.genre} 
                  onChange={e => setFormData({...formData, genre: e.target.value})} 
                  placeholder="Ex: ESPORTES, INFANTIL, 4K"
                  className="h-12 bg-black/40 border-white/5 font-bold uppercase"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="uppercase text-[10px] font-black opacity-60">Descrição / Sinopse</Label>
                <Button type="button" variant="outline" size="sm" onClick={generateAI} disabled={generating} className="h-8 border-primary/20 text-primary">
                  {generating ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Sparkles className="h-3 w-3 mr-2" />}
                  IA: Gerar Texto
                </Button>
              </div>
              <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="h-24 bg-black/40 border-white/5 font-medium" />
            </div>
          </div>

          <div className="p-6 bg-card/50 border border-white/5 rounded-xl space-y-4">
            <h3 className="font-bold uppercase text-xs flex items-center gap-2 text-primary tracking-widest"><Globe className="h-4 w-4" /> Link da Stream (Sinal Direto)</h3>
            <Input 
              value={formData.streamUrl} 
              onChange={e => setFormData({...formData, streamUrl: e.target.value})}
              placeholder="https://sua-stream.m3u8" 
              required
              className="h-12 bg-black/40 border-white/5 font-mono text-xs"
            />
          </div>

          <div className="p-6 bg-card/50 border border-white/5 rounded-xl space-y-4">
            <h3 className="font-bold uppercase text-xs flex items-center gap-2 text-primary tracking-widest"><LinkIcon className="h-4 w-4" /> URL da Capa (Manual)</h3>
            <Input 
              value={formData.imageUrl} 
              onChange={e => setFormData({...formData, imageUrl: e.target.value})}
              placeholder="https://exemplo.com/capa.jpg" 
              className="h-12 bg-black/40 border-white/5 font-mono text-xs"
            />
            <p className="text-[8px] text-muted-foreground uppercase font-bold italic">Cole aqui o link da imagem se você não quiser usar a IA abaixo.</p>
          </div>

          {formData.type === 'series' ? (
            <div className="p-6 bg-card/50 border border-white/5 rounded-xl space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold uppercase text-xs flex items-center gap-2"><ListOrdered className="h-4 w-4" /> Lista de Episódios</h3>
                <Button type="button" size="sm" onClick={() => addEpisode()} className="bg-primary/10 text-primary hover:bg-primary/20"><Plus className="h-4 w-4 mr-1" /> Add Episódio</Button>
              </div>
              <div className="space-y-3">
                {episodes.map((ep, idx) => (
                  <div key={ep.id} className="flex gap-2 items-end bg-black/20 p-3 rounded-lg border border-white/5">
                    <div className="w-16"><Label className="text-[8px] uppercase font-black opacity-50">Nº</Label><Input type="number" defaultValue={idx+1} className="h-9 bg-black/40 border-white/5" /></div>
                    <div className="flex-1"><Label className="text-[8px] uppercase font-black opacity-50">Link do Episódio</Label><Input placeholder="URL" value={ep.streamUrl} onChange={e => {
                      const newEps = [...episodes];
                      newEps[idx].streamUrl = e.target.value;
                      setEpisodes(newEps);
                    }} className="h-9 bg-black/40 border-white/5 font-mono text-xs" /></div>
                    <Button variant="ghost" size="icon" className="text-destructive h-9" onClick={() => setEpisodes(episodes.filter(item => item.id !== ep.id))}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
              </div>
            </div>
          ) : formData.type === 'multi-season' ? (
            <div className="p-6 bg-card/50 border border-white/5 rounded-xl space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-bold uppercase text-xs flex items-center gap-2"><Layers className="h-4 w-4" /> Temporadas</h3>
                <Button type="button" size="sm" onClick={addSeason} className="bg-primary/10 text-primary"><Plus className="h-4 w-4 mr-1" /> Nova Temp</Button>
              </div>
              {seasons.map((season, sIdx) => (
                <div key={season.id} className="p-4 bg-black/20 rounded-xl border border-white/5 space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="font-black uppercase text-[10px] text-primary">Temporada {season.number}</h4>
                    <Button type="button" variant="outline" size="sm" onClick={() => addEpisode(season.id)} className="h-7 text-[8px] uppercase font-bold"><Plus className="h-3 w-3 mr-1" /> Add Episódio</Button>
                  </div>
                  <div className="space-y-2">
                    {season.episodes.map((ep, eIdx) => (
                      <div key={ep.id} className="flex gap-2">
                        <Input placeholder={`Link Ep ${eIdx + 1}`} value={ep.streamUrl} onChange={e => {
                          const newSeasons = [...seasons];
                          newSeasons[sIdx].episodes[eIdx].streamUrl = e.target.value;
                          setSeasons(newSeasons);
                        }} className="h-9 bg-black/40 border-white/5 font-mono text-xs" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </div>

        <div className="space-y-6">
          <div className="p-6 bg-card/50 border border-white/5 rounded-xl space-y-4">
            <h3 className="font-bold uppercase text-xs flex items-center gap-2 tracking-widest text-primary"><ImageIcon className="h-4 w-4" /> Capa do Conteúdo</h3>
            <div className="aspect-[2/3] relative bg-black/40 rounded-2xl overflow-hidden border border-dashed border-white/10 flex flex-col items-center justify-center group">
              {formData.imageUrl ? (
                <>
                  <Image src={formData.imageUrl} alt="Capa" fill className="object-cover" unoptimized />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Button type="button" variant="outline" size="sm" onClick={handleGenerateImage} disabled={generatingImage}>
                      {generatingImage ? <Loader2 className="animate-spin h-4 w-4" /> : "Gerar com IA"}
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center p-6 space-y-4">
                  <div className="mx-auto w-12 h-12 bg-white/5 rounded-full flex items-center justify-center">
                    <ImageIcon className="h-6 w-6 text-muted-foreground" />
                  </div>
                  <p className="text-[10px] font-bold uppercase opacity-40">Nenhuma capa definida</p>
                  <Button type="button" onClick={handleGenerateImage} disabled={generatingImage} className="w-full bg-primary/20 text-primary hover:bg-primary/30 h-10 uppercase text-[9px] font-black">
                    {generatingImage ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                    IA: Gerar Capa 4K
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="p-6 bg-card/50 border border-white/5 rounded-xl space-y-4">
            <h3 className="font-bold uppercase text-xs flex items-center gap-2"><Lock className="h-4 w-4" /> Segurança</h3>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="uppercase text-[10px] font-black">Conteúdo Restrito</Label>
                <p className="text-[8px] text-muted-foreground uppercase font-bold">Bloqueia com senha parental</p>
              </div>
              <Switch 
                checked={formData.isRestricted} 
                onCheckedChange={val => setFormData({...formData, isRestricted: val})} 
              />
            </div>
          </div>

          <Button type="submit" className="w-full h-16 bg-primary text-lg font-black uppercase shadow-2xl shadow-primary/20 rounded-2xl hover:scale-[1.02] transition-transform" disabled={loading}>
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
