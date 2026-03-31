
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Loader2, Save, Globe, Plus, Trash2, ListOrdered, Layers, Lock, Image as ImageIcon, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { saveContent, Season, Episode, ContentType, cleanName } from "@/lib/store"
import Link from "next/link"
import Image from "next/image"

function NewContentForm() {
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)
  
  const [formData, setFormData] = React.useState({
    title: "",
    type: "channel" as ContentType,
    genre: "LÉO TV AO VIVO", 
    description: "",
    streamUrl: "",
    directStreamUrl: "",
    isRestricted: false,
    imageUrl: ""
  })

  const [episodes, setEpisodes] = React.useState<Episode[]>([])
  const [seasons, setSeasons] = React.useState<Season[]>([])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    // DATA DE CRIAÇÃO OBRIGATÓRIA PARA FIXAR O CANAL NO TOPO
    const success = await saveContent({
      id: "", 
      title: cleanName(formData.title),
      type: formData.type,
      genre: formData.genre.toUpperCase(),
      description: formData.description,
      isRestricted: formData.isRestricted,
      streamUrl: formData.streamUrl,
      directStreamUrl: formData.directStreamUrl,
      imageUrl: formData.imageUrl,
      episodes: formData.type === 'series' ? episodes : undefined,
      seasons: formData.type === 'multi-season' ? seasons : undefined,
      created_at: new Date().toISOString()
    })

    if (success) {
      toast({ title: "Conteúdo Adicionado", description: "O sinal foi fixado na sua biblioteca." })
      router.push("/admin/content")
    } else {
      setLoading(false)
      toast({ variant: "destructive", title: "ERRO AO SALVAR", description: "Verifique o banco de dados." })
    }
  }

  const addEpisode = (seasonId?: string) => {
    const nextNum = seasonId ? (seasons.find(s => s.id === seasonId)?.episodes.length || 0) + 1 : episodes.length + 1;
    const newEp: Episode = {
      id: "ep_" + Date.now() + Math.random().toString(36).substring(2, 7),
      title: `Episódio ${nextNum}`,
      number: nextNum,
      streamUrl: "",
      directStreamUrl: ""
    };

    if (seasonId) {
      setSeasons(prev => prev.map(s => s.id === seasonId ? { ...s, episodes: [...s.episodes, newEp] } : s));
    } else {
      setEpisodes(prev => [...prev, newEp]);
    }
  }

  const addSeason = () => {
    const nextNum = seasons.length + 1;
    setSeasons(prev => [...prev, { id: "sea_" + Date.now(), number: nextNum, episodes: [] }]);
  }

  const showMainStreamUrl = formData.type === 'channel' || formData.type === 'movie';

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
              <Label className="uppercase text-[10px] font-black opacity-60">Nome do Conteúdo</Label>
              <Input 
                value={formData.title} 
                onChange={e => setFormData({...formData, title: e.target.value})} 
                placeholder="Ex: HBO Family ou Stranger Things" required
                className="h-12 bg-black/40 border-white/5 font-bold uppercase"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="uppercase text-[10px] font-black opacity-60">Tipo</Label>
                <Select value={formData.type} onValueChange={(val: any) => setFormData({...formData, type: val})}>
                  <SelectTrigger className="h-12 border-white/5 bg-black/40 font-bold"><SelectValue placeholder="Selecione" /></SelectTrigger>
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
                <Select value={formData.genre} onValueChange={v => setFormData({...formData, genre: v})}>
                  <SelectTrigger className="h-12 bg-black/40 border-white/5 font-bold"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LÉO TV AO VIVO">LÉO TV AO VIVO</SelectItem>
                    <SelectItem value="LÉO TV FILMES">LÉO TV FILMES</SelectItem>
                    <SelectItem value="LÉO TV SERIES">LÉO TV SERIES</SelectItem>
                    <SelectItem value="LÉO TV DORAMAS">LÉO TV DORAMAS</SelectItem>
                    <SelectItem value="LÉO TV NOVELAS">LÉO TV NOVELAS</SelectItem>
                    <SelectItem value="LÉO TV ADULTOS">LÉO TV ADULTOS</SelectItem>
                    <SelectItem value="LÉO TV DESENHOS">LÉO TV DESENHOS</SelectItem>
                    <SelectItem value="LÉO TV VÍDEO CLIPES">LÉO TV VÍDEO CLIPES</SelectItem>
                    <SelectItem value="LÉO TV MUSICAS">LÉO TV MUSICAS</SelectItem>
                    <SelectItem value="LÉO TV RÁDIOS">LÉO TV RÁDIOS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="uppercase text-[10px] font-black opacity-60">Descrição</Label>
              <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="h-24 bg-black/40 border-white/5" />
            </div>
          </div>

          {showMainStreamUrl && (
            <div className="grid gap-4 p-6 bg-card/50 border border-white/5 rounded-xl">
              <div className="space-y-2">
                <h3 className="font-bold uppercase text-[10px] flex items-center gap-2 text-primary tracking-widest"><Globe className="h-4 w-4" /> Link Web (Iframe / Sigma)</h3>
                <Input value={formData.streamUrl} onChange={e => setFormData({...formData, streamUrl: e.target.value})} placeholder="https://..." className="h-12 bg-black/40 border-white/5 font-mono text-xs" />
              </div>
              <div className="space-y-2">
                <h3 className="font-bold uppercase text-[10px] flex items-center gap-2 text-emerald-500 tracking-widest"><Zap className="h-4 w-4" /> Link Direto (m3u8 / ts)</h3>
                <Input value={formData.directStreamUrl} onChange={e => setFormData({...formData, directStreamUrl: e.target.value})} placeholder="http://...m3u8" className="h-12 bg-black/40 border-white/5 font-mono text-xs" />
              </div>
            </div>
          )}

          {formData.type === 'series' && (
            <div className="p-6 bg-card/50 border border-white/5 rounded-xl space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="font-bold uppercase text-xs flex items-center gap-2"><ListOrdered className="h-4 w-4" /> Episódios</h3>
                <Button type="button" size="sm" onClick={() => addEpisode()} className="bg-primary/10 text-primary"><Plus className="h-4 w-4 mr-1" /> Add Ep</Button>
              </div>
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scroll scrollbar-visible">
                {episodes.map((ep, idx) => (
                  <div key={ep.id} className="bg-black/20 p-4 rounded-xl border border-white/5 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-primary uppercase">EPISÓDIO {ep.number}</span>
                      <Button variant="ghost" size="icon" className="text-destructive h-8 w-8" onClick={() => setEpisodes(prev => prev.filter(item => item.id !== ep.id))}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                    <Input placeholder="Link Web" value={ep.streamUrl} onChange={e => {
                      const newEps = [...episodes];
                      newEps[idx].streamUrl = e.target.value;
                      setEpisodes(newEps);
                    }} className="h-9 bg-black/40 border-white/5 font-mono text-[10px]" />
                    <Input placeholder="Link Direto" value={ep.directStreamUrl} onChange={e => {
                      const newEps = [...episodes];
                      newEps[idx].directStreamUrl = e.target.value;
                      setEpisodes(newEps);
                    }} className="h-9 bg-emerald-500/5 border-emerald-500/10 font-mono text-[10px]" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {formData.type === 'multi-season' && (
            <div className="p-6 bg-card/50 border border-white/5 rounded-xl space-y-6">
              <div className="flex justify-between items-center">
                <h3 className="font-bold uppercase text-xs flex items-center gap-2"><Layers className="h-4 w-4" /> Temporadas</h3>
                <Button type="button" size="sm" onClick={addSeason} className="bg-primary/10 text-primary"><Plus className="h-4 w-4 mr-1" /> Nova Temp</Button>
              </div>
              <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2 custom-scroll scrollbar-visible">
                {seasons.map((season, sIdx) => (
                  <div key={season.id} className="p-4 bg-black/20 rounded-xl border border-white/5 space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-black uppercase text-[10px] text-primary">Temporada {season.number}</h4>
                      <Button type="button" variant="outline" size="sm" onClick={() => addEpisode(season.id)} className="h-7 text-[8px] uppercase font-bold"><Plus className="h-3 w-3 mr-1" /> Add Ep</Button>
                    </div>
                    <div className="space-y-4">
                      {season.episodes.map((ep, eIdx) => (
                        <div key={ep.id} className="grid gap-2 border-l-2 border-white/5 pl-3">
                          <div className="flex justify-between items-center">
                             <span className="text-[9px] font-bold opacity-40 uppercase">Ep {ep.number}</span>
                             <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => {
                                const newSeasons = [...seasons];
                                newSeasons[sIdx].episodes = newSeasons[sIdx].episodes.filter(item => item.id !== ep.id);
                                setSeasons(newSeasons);
                             }}><Trash2 className="h-3 w-3" /></Button>
                          </div>
                          <Input placeholder="Link Web" value={ep.streamUrl} onChange={e => {
                            const newSeasons = [...seasons];
                            newSeasons[sIdx].episodes[eIdx].streamUrl = e.target.value;
                            setSeasons(newSeasons);
                          }} className="h-8 bg-black/40 text-[9px]" />
                          <Input placeholder="Link Direto" value={ep.directStreamUrl} onChange={e => {
                            const newSeasons = [...seasons];
                            newSeasons[sIdx].episodes[eIdx].directStreamUrl = e.target.value;
                            setSeasons(newSeasons);
                          }} className="h-8 bg-emerald-500/5 text-[9px]" />
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
          <div className="p-6 bg-card/50 border border-white/5 rounded-xl space-y-4">
            <h3 className="font-bold uppercase text-xs flex items-center gap-2 tracking-widest text-primary"><ImageIcon className="h-4 w-4" /> Capa</h3>
            <div className="aspect-[2/3] relative bg-black/40 rounded-2xl overflow-hidden border border-dashed border-white/10 flex items-center justify-center">
              {formData.imageUrl ? <Image src={formData.imageUrl} alt="Capa" fill className="object-cover" unoptimized /> : <div className="text-[8px] font-black uppercase opacity-20">Sem Capa</div>}
            </div>
            <Input 
              value={formData.imageUrl} 
              onChange={e => setFormData({...formData, imageUrl: e.target.value})} 
              placeholder="URL da Imagem..."
              className="h-10 bg-black/40 border-white/5 text-[10px]"
            />
          </div>

          <div className="p-6 bg-card/50 border border-white/5 rounded-xl space-y-4">
            <h3 className="font-bold uppercase text-xs flex items-center gap-2"><Lock className="h-4 w-4" /> Segurança</h3>
            <div className="flex items-center justify-between">
              <Label className="uppercase text-[10px] font-black">Conteúdo Restrito</Label>
              <Switch checked={formData.isRestricted} onCheckedChange={val => setFormData({...formData, isRestricted: val})} />
            </div>
          </div>

          <Button type="submit" className="w-full h-16 bg-primary text-lg font-black uppercase shadow-2xl shadow-primary/20 rounded-2xl" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : <Save className="mr-2 h-6 w-6" />} SALVAR CONTEÚDO
          </Button>
        </div>
      </form>
    </div>
  )
}

export default function NewContentPage() {
  return <NewContentForm />
}
