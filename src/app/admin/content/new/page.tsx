
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Loader2, Save, Globe, Lock, Image as ImageIcon, Plus, Trash2, Zap, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { saveContent, ContentType, cleanName, Episode, Season, formatMasterLink } from "@/lib/store"
import Link from "next/link"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { VideoPlayer } from "@/components/video-player"

export default function NewContentPage() {
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)
  const [testVideo, setTestVideo] = React.useState<{url: string, title: string} | null>(null)
  
  const [formData, setFormData] = React.useState({
    title: "",
    type: "channel" as ContentType,
    genre: "LÉO TV AO VIVO", 
    description: "",
    streamUrl: "",
    isRestricted: false,
    imageUrl: ""
  })

  const [episodes, setEpisodes] = React.useState<Episode[]>([])
  const [seasons, setSeasons] = React.useState<Season[]>([])

  const addEpisode = () => {
    const newEp: Episode = { id: 'ep_' + Date.now(), title: '', number: episodes.length + 1, streamUrl: '' }
    setEpisodes(prev => [...prev, newEp])
  }

  const removeEpisode = (id: string) => setEpisodes(prev => prev.filter(e => e.id !== id))

  const addSeason = () => {
    const newSeason: Season = { id: 'sea_' + Date.now(), number: seasons.length + 1, episodes: [] }
    setSeasons(prev => [...prev, newSeason])
  }

  const removeSeason = (id: string) => setSeasons(prev => prev.filter(s => s.id !== id))

  const addEpisodeToSeason = (sId: string) => {
    setSeasons(prev => prev.map(s => {
      if (s.id === sId) {
        const newEp: Episode = { id: 'ep_' + Date.now(), title: '', number: s.episodes.length + 1, streamUrl: '' }
        return { ...s, episodes: [...s.episodes, newEp] }
      }
      return s
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title) return;
    setLoading(true)
    
    const isSeriesMode = formData.type === 'series' || formData.type === 'multi-season'
    
    const success = await saveContent({
      title: cleanName(formData.title),
      type: formData.type,
      genre: formData.genre.toUpperCase(),
      description: formData.description,
      isRestricted: !!formData.isRestricted,
      streamUrl: isSeriesMode ? "" : formData.streamUrl,
      imageUrl: formData.imageUrl,
      episodes: formData.type === 'series' ? episodes : [],
      seasons: formData.type === 'multi-season' ? seasons : [],
    })

    if (success) {
      toast({ title: "SINAL ADICIONADO A REDE" })
      router.push("/admin/content")
    } else {
      setLoading(false)
      toast({ variant: "destructive", title: "ERRO AO SALVAR" })
    }
  }

  const isSeriesMode = formData.type === 'series' || formData.type === 'multi-season'

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/content"><ChevronLeft className="h-5 w-5" /></Link>
          </Button>
          <h1 className="text-3xl font-black font-headline uppercase italic text-primary">Novo Sinal Master</h1>
        </div>
        <p className="text-[10px] font-black uppercase text-primary animate-pulse">Sincronização Ativa v304</p>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid gap-4 p-6 bg-card/50 border border-white/5 rounded-xl shadow-2xl">
            <div className="space-y-2">
              <Label className="uppercase text-[10px] font-black opacity-60 tracking-widest">Nome do Conteúdo</Label>
              <Input 
                value={formData.title} 
                onChange={e => setFormData({...formData, title: e.target.value})} 
                required
                className="h-12 bg-black/40 border-white/5 font-bold uppercase"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="uppercase text-[10px] font-black opacity-60 tracking-widest">Tipo de Mídia</Label>
                <Select value={formData.type} onValueChange={(val: any) => setFormData({...formData, type: val})}>
                  <SelectTrigger className="h-12 bg-black/40 border-white/5 font-bold"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="channel">Canal ao Vivo</SelectItem>
                    <SelectItem value="movie">Filme Master</SelectItem>
                    <SelectItem value="series">Série Simples</SelectItem>
                    <SelectItem value="multi-season">Série Master (Temporadas)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="uppercase text-[10px] font-black opacity-60 tracking-widest">Pasta / Categoria</Label>
                <Select value={formData.genre} onValueChange={v => setFormData({...formData, genre: v})}>
                  <SelectTrigger className="h-12 bg-black/40 border-white/5 font-bold"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LÉO TV AO VIVO">LÉO TV AO VIVO</SelectItem>
                    <SelectItem value="LÉO TV FILMES">LÉO TV FILMES</SelectItem>
                    <SelectItem value="LÉO TV SÉRIES">LÉO TV SÉRIES</SelectItem>
                    <SelectItem value="LÉO TV ESPORTES">LÉO TV ESPORTES</SelectItem>
                    <SelectItem value="LÉO TV MUSICAS">LÉO TV MÚSICAS</SelectItem>
                    <SelectItem value="LÉO TV VÍDEO CLIPES">LÉO TV VÍDEO CLIPES</SelectItem>
                    <SelectItem value="LÉO TV PIADAS">LÉO TV PIADAS</SelectItem>
                    <SelectItem value="LÉO TV REELS">LÉO TV REELS</SelectItem>
                    <SelectItem value="LÉO TV NOVELAS">LÉO TV NOVELAS</SelectItem>
                    <SelectItem value="LÉO TV DORAMAS">LÉO TV DORAMAS</SelectItem>
                    <SelectItem value="LÉO TV ADULTOS">LÉO TV ADULTOS</SelectItem>
                    <SelectItem value="LÉO TV DESENHOS">LÉO TV DESENHOS</SelectItem>
                    <SelectItem value="LÉO TV RÁDIOS">LÉO TV RÁDIOS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="uppercase text-[10px] font-black opacity-60 tracking-widest">Sinopse do Sinal</Label>
              <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="h-24 bg-black/40 border-white/5 font-bold text-xs" />
            </div>
          </div>

          {!isSeriesMode ? (
            <div className="grid gap-6 p-6 bg-card/50 border border-white/5 rounded-xl shadow-2xl">
              <div className="space-y-2">
                <h3 className="font-black uppercase text-[10px] flex items-center gap-2 text-primary tracking-widest"><Zap className="h-4 w-4" /> Link Master Soberano</h3>
                <div className="flex gap-2">
                  <Input value={formData.streamUrl} onChange={e => setFormData({...formData, streamUrl: e.target.value})} placeholder="Link do Stream" className="h-12 bg-black/40 border-white/5 font-mono text-[10px] flex-1" />
                  <Button type="button" size="icon" onClick={() => setTestVideo({url: formatMasterLink(formData.streamUrl), title: formData.title || 'Teste de Sinal'})} className="h-12 w-12 bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20"><Play className="h-5 w-5" /></Button>
                </div>
                <p className="text-[8px] font-bold uppercase opacity-40">O teste acima usa o mesmo protocolo do cliente final.</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {formData.type === 'series' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-black uppercase text-xs text-primary italic">Episódios da Série</h3>
                    <Button type="button" size="sm" onClick={addEpisode} className="bg-primary h-8 px-4 rounded-lg font-black uppercase text-[10px]"><Plus className="mr-2 h-3 w-3" /> Adicionar Ep</Button>
                  </div>
                  <div className="grid gap-3">
                    {episodes.map((ep, idx) => (
                      <div key={ep.id} className="p-4 bg-card/50 border border-white/5 rounded-xl space-y-4">
                        <div className="flex gap-4 items-end">
                          <div className="w-12 space-y-2 text-center">
                            <Label className="text-[8px] font-black uppercase opacity-40">Num</Label>
                            <Input type="number" value={ep.number} onChange={e => {
                              const newEps = [...episodes]
                              newEps[idx].number = parseInt(e.target.value) || 0
                              setEpisodes(newEps)
                            }} className="h-10 text-center font-black bg-black/40" />
                          </div>
                          <div className="flex-1 space-y-2">
                            <Label className="text-[8px] font-black uppercase opacity-40">Título do Ep</Label>
                            <Input value={ep.title} onChange={e => {
                              const newEps = [...episodes]
                              newEps[idx].title = e.target.value
                              setEpisodes(newEps)
                            }} className="h-10 bg-black/40" />
                          </div>
                          <Button type="button" variant="destructive" size="icon" onClick={() => removeEpisode(ep.id)} className="h-10 w-10"><Trash2 className="h-4 w-4" /></Button>
                        </div>
                        <div className="space-y-2">
                           <Label className="text-[8px] font-black uppercase opacity-40">Link do Episódio</Label>
                           <div className="flex gap-2">
                             <Input value={ep.streamUrl} placeholder="Link do vídeo" onChange={e => {
                                const newEps = [...episodes]
                                newEps[idx].streamUrl = e.target.value
                                setEpisodes(newEps)
                              }} className="h-10 bg-black/40 font-mono text-[9px] flex-1" />
                             <Button type="button" size="icon" onClick={() => setTestVideo({url: formatMasterLink(ep.streamUrl), title: `EP ${ep.number} - ${ep.title || formData.title}`})} className="h-10 w-10 bg-emerald-500 hover:bg-emerald-600 shadow-md"><Play className="h-4 w-4 text-white" /></Button>
                           </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {formData.type === 'multi-season' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="font-black uppercase text-xs text-primary italic">Temporadas Master</h3>
                    <Button type="button" size="sm" onClick={addSeason} className="bg-primary h-8 px-4 rounded-lg font-black uppercase text-[10px]"><Plus className="mr-2 h-3 w-3" /> Adicionar Temp</Button>
                  </div>
                  <div className="space-y-8">
                    {seasons.map((season, sIdx) => (
                      <div key={season.id} className="p-6 bg-card/50 border border-white/5 rounded-2xl space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <Label className="uppercase text-[10px] font-black">Temp</Label>
                            <Input type="number" value={season.number} onChange={e => {
                              const newSeasons = [...seasons]
                              newSeasons[sIdx].number = parseInt(e.target.value) || 0
                              setSeasons(newSeasons)
                            }} className="w-16 h-10 bg-black/40 text-center font-black" />
                          </div>
                          <div className="flex gap-2">
                             <Button type="button" size="sm" onClick={() => addEpisodeToSeason(season.id)} className="bg-emerald-500 h-8 px-4 rounded-lg font-black uppercase text-[10px]"><Plus className="mr-2 h-3 w-3" /> Add Ep na T{season.number}</Button>
                             <Button type="button" variant="destructive" size="icon" onClick={() => removeSeason(season.id)} className="h-8 w-8"><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </div>
                        <div className="grid gap-3">
                          {season.episodes.map((ep, eIdx) => (
                            <div key={ep.id} className="bg-black/20 p-3 rounded-lg space-y-2">
                               <div className="flex gap-2 items-center">
                                  <Input type="number" value={ep.number} onChange={e => {
                                     const newSeasons = [...seasons]
                                     newSeasons[sIdx].episodes[eIdx].number = parseInt(e.target.value) || 0
                                     setSeasons(newSeasons)
                                  }} className="w-12 h-8 bg-black/40 text-[10px] font-black" />
                                  <Input value={ep.title} placeholder="Título" onChange={e => {
                                     const newSeasons = [...seasons]
                                     newSeasons[sIdx].episodes[eIdx].title = e.target.value
                                     setSeasons(newSeasons)
                                  }} className="flex-1 h-8 bg-black/40 text-[10px]" />
                                  <Button type="button" size="icon" onClick={() => setTestVideo({url: formatMasterLink(ep.streamUrl), title: `T${season.number} EP ${ep.number} - ${ep.title || formData.title}`})} className="h-8 w-8 bg-emerald-500 hover:bg-emerald-600"><Play className="h-3 w-3 text-white" /></Button>
                                  <Button type="button" variant="ghost" size="icon" onClick={() => {
                                    const newSeasons = [...seasons]
                                    newSeasons[sIdx].episodes = newSeasons[sIdx].episodes.filter(i => i.id !== ep.id)
                                    setSeasons(newSeasons)
                                  }} className="h-8 w-8 text-destructive"><Trash2 className="h-3 w-3" /></Button>
                               </div>
                               <div className="space-y-1">
                                  <Input value={ep.streamUrl} placeholder="Link do Episódio" onChange={e => {
                                     const newSeasons = [...seasons]
                                     newSeasons[sIdx].episodes[eIdx].streamUrl = e.target.value
                                     setSeasons(newSeasons)
                                  }} className="h-7 bg-black/40 text-[9px] font-mono" />
                               </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="p-6 bg-card/50 border border-white/5 rounded-xl space-y-4 text-center shadow-2xl">
             <h3 className="font-black uppercase text-[10px] flex items-center justify-center gap-2 text-primary tracking-widest"><ImageIcon className="h-4 w-4" /> Capa Oficial</h3>
             <div className="aspect-[2/3] relative bg-black/40 rounded-2xl overflow-hidden border border-white/5 shadow-inner">
                {formData.imageUrl ? <Image src={formData.imageUrl} alt="Capa" fill className="object-cover" unoptimized /> : <div className="flex items-center justify-center h-full opacity-20 text-[10px] font-black uppercase italic">Sinal sem Capa</div>}
             </div>
             <Input 
              value={formData.imageUrl} 
              onChange={e => setFormData({...formData, imageUrl: e.target.value})} 
              placeholder="URL da Imagem..."
              className="h-10 bg-black/40 border-white/5 text-[10px] font-mono"
            />
          </div>

          <div className="p-6 bg-card/50 border border-white/5 rounded-xl space-y-4 shadow-2xl">
            <h3 className="font-black uppercase text-[10px] flex items-center gap-2 text-primary tracking-widest"><Lock className="h-4 w-4" /> Segurança</h3>
            <div className="flex items-center justify-between">
              <Label className="uppercase text-[10px] font-black tracking-widest italic">Conteúdo Restrito</Label>
              <Switch checked={formData.isRestricted} onCheckedChange={val => setFormData({...formData, isRestricted: val})} />
            </div>
          </div>

          <Button type="submit" className="w-full h-16 bg-primary text-lg font-black uppercase italic shadow-2xl shadow-primary/20 rounded-2xl hover:scale-105 active:scale-95 transition-all" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <Save className="mr-2 h-6 w-6" />} SALVAR SINAL
          </Button>
        </div>
      </form>

      <Dialog open={!!testVideo} onOpenChange={() => setTestVideo(null)}>
        <DialogContent className="max-w-5xl bg-black border-white/10 p-0 overflow-hidden rounded-[3rem] shadow-2xl">
          <DialogHeader className="sr-only"><DialogTitle>Teste de Sinal</DialogTitle></DialogHeader>
          {testVideo && <VideoPlayer url={testVideo.url} title={testVideo.title} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}
