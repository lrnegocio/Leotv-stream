
"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { ChevronLeft, Sparkles, Loader2, Save, Globe, Lock, Trash2, ListOrdered, Layers, Plus, Zap, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { autoGenerateContentDescription } from "@/ai/flows/auto-generate-content-description-flow"
import { toast } from "@/hooks/use-toast"
import { getContentById, saveContent, Season, Episode, ContentItem } from "@/lib/store"
import Link from "next/link"
import Image from "next/image"

export default function EditContentPage() {
  const params = useParams()
  const id = params?.id as string
  const router = useRouter()
  
  const [loading, setLoading] = React.useState(false)
  const [fetching, setFetching] = React.useState(true)
  const [generating, setGenerating] = React.useState(false)
  
  const [formData, setFormData] = React.useState<ContentItem | null>(null)
  const [episodes, setEpisodes] = React.useState<Episode[]>([])
  const [seasons, setSeasons] = React.useState<Season[]>([])

  React.useEffect(() => {
    const load = async () => {
      if (!id) return;
      try {
        const item = await getContentById(id)
        if (item) {
          setFormData(item)
          setEpisodes(item.episodes || [])
          setSeasons(item.seasons || [])
        } else {
          toast({ variant: "destructive", title: "Sinal não localizado." })
          router.push("/admin/content")
        }
      } catch (err) {
        toast({ variant: "destructive", title: "Erro de conexão." })
      } finally {
        setFetching(false)
      }
    }
    load()
  }, [id, router])

  if (fetching) return <div className="flex flex-col items-center justify-center py-40 gap-4"><Loader2 className="h-12 w-12 animate-spin text-primary" /><p className="text-[10px] font-black uppercase opacity-40 italic tracking-widest">Sintonizando Banco Master Léo TV...</p></div>

  if (!formData) return null;

  const addEpisode = (seasonId?: string) => {
    if (seasonId) {
      setSeasons(prev => prev.map(s => {
        if (s.id === seasonId) {
          const nextNum = s.episodes.length + 1;
          const newEp: Episode = {
            id: "ep_" + Date.now() + Math.random().toString(36).substring(2, 7),
            title: `Episódio ${nextNum}`,
            number: nextNum,
            streamUrl: "",
            directStreamUrl: ""
          };
          return { ...s, episodes: [...s.episodes, newEp] };
        }
        return s;
      }));
    } else {
      const nextNum = episodes.length + 1;
      const newEp: Episode = {
        id: "ep_" + Date.now() + Math.random().toString(36).substring(2, 7),
        title: `Episódio ${nextNum}`,
        number: nextNum,
        streamUrl: "",
        directStreamUrl: ""
      }
      setEpisodes(prev => [...prev, newEp]);
    }
  }

  const addSeason = () => {
    const nextNum = seasons.length + 1;
    const newSeason: Season = {
      id: "sea_" + Date.now() + Math.random().toString(36).substring(2, 7),
      number: nextNum,
      episodes: []
    }
    setSeasons(prev => [...prev, newSeason])
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
      toast({ variant: "destructive", title: "Erro de IA" })
    } finally {
      setGenerating(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const success = await saveContent({
      ...formData,
      episodes: formData.type === 'series' ? episodes : undefined,
      seasons: formData.type === 'multi-season' ? seasons : undefined,
    })
    
    if (success) {
      toast({ title: "SINAL RECALIBRADO" })
      router.push("/admin/content")
    } else {
      setLoading(false)
      toast({ variant: "destructive", title: "ERRO AO SALVAR" })
    }
  }

  const showMainStreamUrl = formData.type === 'channel' || formData.type === 'movie';

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/content"><ChevronLeft className="h-5 w-5" /></Link>
        </Button>
        <h1 className="text-3xl font-black font-headline uppercase italic text-primary">Recalibrar Sinal Master</h1>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid gap-4 p-6 bg-card/50 border border-white/5 rounded-xl shadow-2xl">
            <div className="space-y-2">
              <Label className="uppercase text-[10px] font-black opacity-60 tracking-widest">Nome Oficial do Canal</Label>
              <Input 
                value={formData.title || ""} 
                onChange={e => setFormData({...formData, title: e.target.value})} 
                required
                className="h-12 bg-black/40 border-white/5 font-bold uppercase tracking-widest focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="uppercase text-[10px] font-black opacity-60 tracking-widest">Tipo de Mídia</Label>
                <Select value={formData.type} onValueChange={(val: any) => setFormData({...formData, type: val})}>
                  <SelectTrigger className="h-12 bg-black/40 border-white/5 font-bold uppercase tracking-widest"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="channel">Canal ao Vivo</SelectItem>
                    <SelectItem value="movie">Filme Master</SelectItem>
                    <SelectItem value="series">Série Simples</SelectItem>
                    <SelectItem value="multi-season">Série Master (Temporadas)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="uppercase text-[10px] font-black opacity-60 tracking-widest">Categoria Master</Label>
                <Input value={formData.genre || ""} onChange={e => setFormData({...formData, genre: e.target.value})} className="h-12 bg-black/40 border-white/5 font-bold uppercase tracking-widest" />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="uppercase text-[10px] font-black opacity-60 tracking-widest">Sinopse do Sinal</Label>
                <Button type="button" variant="outline" size="sm" onClick={generateAI} disabled={generating} className="h-8 border-primary/20 text-primary uppercase text-[8px] font-black">
                  {generating ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Sparkles className="h-3 w-3 mr-2" />} IA MASTER
                </Button>
              </div>
              <Textarea value={formData.description || ""} onChange={e => setFormData({...formData, description: e.target.value})} className="h-24 bg-black/40 border-white/5 font-bold text-xs" />
            </div>
          </div>

          <div className="grid gap-4 p-6 bg-card/50 border border-white/5 rounded-xl shadow-2xl">
            <div className="space-y-2">
              <h3 className="font-black uppercase text-[10px] flex items-center gap-2 text-primary tracking-widest"><Globe className="h-4 w-4" /> Link Web Principal</h3>
              <Input value={formData.streamUrl || ""} onChange={e => setFormData({...formData, streamUrl: e.target.value})} className="h-12 bg-black/40 border-white/5 font-mono text-[10px]" />
            </div>
            <div className="space-y-2">
              <h3 className="font-black uppercase text-[10px] flex items-center gap-2 text-emerald-500 tracking-widest"><Zap className="h-4 w-4" /> Link Secundário (Direto IPTV)</h3>
              <Input value={formData.directStreamUrl || ""} onChange={e => setFormData({...formData, directStreamUrl: e.target.value})} className="h-12 bg-black/40 border-white/5 font-mono text-[10px]" placeholder="Link .m3u8, .ts ou .mp4" />
            </div>
          </div>

          {formData.type === 'series' && (
            <div className="p-6 bg-card/50 border border-white/5 rounded-xl space-y-4 shadow-2xl">
              <div className="flex justify-between items-center">
                <h3 className="font-black uppercase text-[10px] flex items-center gap-2 text-primary tracking-widest"><ListOrdered className="h-4 w-4" /> Episódios Master</h3>
                <Button type="button" size="sm" onClick={() => addEpisode()} className="bg-primary text-white h-8 uppercase text-[8px] font-black rounded-lg"><Plus className="h-4 w-4 mr-1" /> ADICIONAR EP</Button>
              </div>
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-4 custom-scroll scrollbar-visible">
                {episodes.sort((a,b) => a.number - b.number).map((ep, idx) => (
                  <div key={ep.id} className="bg-black/20 p-4 rounded-xl border border-white/5 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-primary uppercase italic">EPISÓDIO {ep.number}</span>
                      <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => setEpisodes(prev => prev.filter(item => item.id !== ep.id))}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                    <Input placeholder="Link Web Principal" value={ep.streamUrl || ""} onChange={e => {
                      const newEps = [...episodes];
                      newEps[idx].streamUrl = e.target.value;
                      setEpisodes(newEps);
                    }} className="h-10 bg-black/40 border-white/5 font-mono text-[10px]" />
                    <Input placeholder="Link Secundário (IPTV)" value={ep.directStreamUrl || ""} onChange={e => {
                      const newEps = [...episodes];
                      newEps[idx].directStreamUrl = e.target.value;
                      setEpisodes(newEps);
                    }} className="h-10 bg-emerald-500/5 border-emerald-500/10 font-mono text-[10px]" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {formData.type === 'multi-season' && (
            <div className="p-6 bg-card/50 border border-white/5 rounded-xl space-y-6 shadow-2xl">
              <div className="flex justify-between items-center">
                <h3 className="font-black uppercase text-[10px] flex items-center gap-2 text-primary tracking-widest"><Layers className="h-4 w-4" /> Temporadas Master</h3>
                <Button type="button" size="sm" onClick={addSeason} className="bg-primary text-white h-8 uppercase text-[8px] font-black rounded-lg"><Plus className="h-4 w-4 mr-1" /> NOVA TEMP</Button>
              </div>
              <div className="space-y-6 max-h-[600px] overflow-y-auto pr-4 custom-scroll scrollbar-visible">
                {seasons.sort((a,b) => a.number - b.number).map((season, sIdx) => (
                  <div key={season.id} className="p-4 bg-black/20 rounded-xl border border-white/5 space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-black uppercase text-[10px] text-primary italic">Temporada {season.number}</h4>
                      <Button type="button" variant="outline" size="sm" onClick={() => addEpisode(season.id)} className="h-7 text-[8px] uppercase font-black border-primary/20 text-primary"><Plus className="h-3 w-3 mr-1" /> ADD EP</Button>
                    </div>
                    <div className="space-y-4">
                      {season.episodes.sort((a,b) => a.number - b.number).map((ep, eIdx) => (
                        <div key={ep.id} className="grid gap-2 border-l-2 border-primary/20 pl-3">
                          <div className="flex justify-between items-center">
                             <span className="text-[9px] font-black opacity-40 uppercase italic">Episódio {ep.number}</span>
                             <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => {
                                const newSeasons = [...seasons];
                                newSeasons[sIdx].episodes = newSeasons[sIdx].episodes.filter(item => item.id !== ep.id);
                                setSeasons(newSeasons);
                             }}><Trash2 className="h-3 w-3" /></Button>
                          </div>
                          <Input placeholder="Link Web Principal" value={ep.streamUrl || ""} onChange={e => {
                            const newSeasons = [...seasons];
                            newSeasons[sIdx].episodes[eIdx].streamUrl = e.target.value;
                            setSeasons(newSeasons);
                          }} className="h-9 bg-black/40 text-[9px] font-mono" />
                          <Input placeholder="Link Secundário (IPTV)" value={ep.directStreamUrl || ""} onChange={e => {
                            const newSeasons = [...seasons];
                            newSeasons[sIdx].episodes[eIdx].directStreamUrl = e.target.value;
                            setSeasons(newSeasons);
                          }} className="h-9 bg-emerald-500/5 text-[9px] font-mono" />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="p-6 bg-card/50 border border-white/5 rounded-xl space-y-4 text-center shadow-2xl">
             <h3 className="font-black uppercase text-[10px] flex items-center justify-center gap-2 text-primary tracking-widest"><ImageIcon className="h-4 w-4" /> Capa Oficial</h3>
             <div className="aspect-[2/3] relative bg-black/40 rounded-2xl overflow-hidden border border-white/5 shadow-inner">
                {formData.imageUrl ? <Image src={formData.imageUrl} alt="Capa" fill className="object-cover" unoptimized /> : <div className="flex items-center justify-center h-full opacity-20 text-[10px] font-black uppercase italic">Sinal sem Capa</div>}
             </div>
             <div className="space-y-2 mt-4 text-left">
                <Label className="uppercase text-[10px] font-black opacity-60 tracking-widest">URL do Poster</Label>
                <Input 
                  value={formData.imageUrl || ""} 
                  onChange={e => setFormData({...formData, imageUrl: e.target.value})} 
                  placeholder="https://..."
                  className="h-10 bg-black/40 border-white/5 text-[10px] font-mono"
                />
             </div>
          </div>

          <div className="p-6 bg-card/50 border border-white/5 rounded-xl space-y-4 shadow-2xl">
            <h3 className="font-black uppercase text-[10px] flex items-center gap-2 text-primary tracking-widest"><Lock className="h-4 w-4" /> Controle de Sinal</h3>
            <div className="flex items-center justify-between">
              <Label className="uppercase text-[10px] font-black tracking-widest italic">Conteúdo Adulto</Label>
              <Switch checked={formData.isRestricted} onCheckedChange={val => setFormData({...formData, isRestricted: val})} />
            </div>
          </div>
          
          <Button type="submit" className="w-full h-16 bg-primary font-black text-lg uppercase italic shadow-2xl shadow-primary/20 rounded-2xl hover:scale-[1.02] active:scale-95 transition-all" disabled={loading}>
            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Save className="mr-2 h-6 w-6" />} SALVAR RECALIBRAGEM
          </Button>
        </div>
      </form>
    </div>
  )
}
