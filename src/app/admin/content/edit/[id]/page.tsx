"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { ChevronLeft, Loader2, Save, Globe, Lock, Image as ImageIcon, Plus, Trash2, Zap, Play, Wand2, Languages } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { getContentById, saveContent, Season, Episode, ContentItem, formatMasterLink } from "@/lib/store"
import { translateMetadata } from "@/ai/flows/translate-metadata-flow"
import Link from "next/link"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { VideoPlayer } from "@/components/video-player"

export default function EditContentPage() {
  const params = useParams()
  const id = params?.id as string
  const router = useRouter()
  
  const [loading, setLoading] = React.useState(false)
  const [fetching, setFetching] = React.useState(true)
  const [isFixing, setIsFixing] = React.useState(false)
  const [isTranslating, setIsTranslating] = React.useState(false)
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

  const handleTranslate = async () => {
    if (!formData) return;
    setIsTranslating(true);
    try {
      const results = await Promise.all([
        formData.title ? translateMetadata({ text: formData.title, context: 'title' }) : Promise.resolve({ translatedText: "" }),
        formData.description ? translateMetadata({ text: formData.description, context: 'description' }) : Promise.resolve({ translatedText: "" })
      ]);
      
      setFormData(prev => prev ? ({
        ...prev,
        title: results[0].translatedText.toUpperCase() || prev.title,
        description: results[1].translatedText || prev.description
      }) : null);
      toast({ title: "TEXTOS TRADUZIDOS VIA IA!" });
    } catch (e) {
      toast({ variant: "destructive", title: "Falha na IA Tradutora" });
    } finally {
      setIsTranslating(false);
    }
  }

  const runTuner = async (url: string) => {
    if (!url) {
      toast({ variant: "destructive", title: "Cole um link primeiro!" });
      return null;
    }
    
    let currentUrl = url.trim();
    const lowUrl = currentUrl.toLowerCase();
    
    if (lowUrl.includes('rdcanais.com') || lowUrl.includes('streamrdc.xyz')) {
       return `/api/proxy?url=${encodeURIComponent(currentUrl)}`;
    }

    if (lowUrl.includes('xvideos.com/video.')) {
       const match = currentUrl.match(/video\.([a-z0-9]+)/i);
       if (match && match[1]) return `/api/proxy?url=${encodeURIComponent(`https://www.xvideos.com/embedframe/${match[1]}`)}`;
    }

    const isDirect = lowUrl.includes('.m3u8') || lowUrl.includes('.mp4') || lowUrl.includes('.ts') || lowUrl.includes('youtube.com') || lowUrl.includes('youtu.be');
    if (isDirect) {
      toast({ title: "SINAL JÁ É DIRETO!" });
      return null;
    }

    setIsFixing(true);
    try {
      const proxyUrl = `/api/proxy?url=${encodeURIComponent(currentUrl)}&t=${Date.now()}`;
      const res = await fetch(proxyUrl);
      const html = await res.text();
      
      const patterns = [
        /https?:\/\/[^"']+\.(?:m3u8|mp4|ts|mkv)(?:\?[^"']*)?/i,
        /src=["'](https?:\/\/[^"']+)["']/i
      ];

      let found = "";
      for (const pattern of patterns) {
        const matches = html.matchAll(new RegExp(pattern, 'gi'));
        for (const match of matches) {
           const possible = match[1] || match[0];
           if (possible.startsWith('http')) {
              found = possible;
              break;
           }
        }
        if (found) break;
      }
      return found || null;
    } catch (e) {
      return null;
    } finally {
      setIsFixing(false);
    }
  }

  const handleFixMainLink = async () => {
    if (!formData) return;
    const fixed = await runTuner(formData.streamUrl);
    if (fixed) {
      setFormData({ ...formData, streamUrl: fixed });
      toast({ title: "SINAL SINTONIZADO!" });
    } else if (!isFixing) {
      toast({ variant: "destructive", title: "Sintonização Falhou" });
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData) return
    setLoading(true)
    
    const success = await saveContent({
      ...formData,
      episodes: (formData.type === 'series') ? episodes : [],
      seasons: (formData.type === 'multi-season') ? seasons : [],
    })
    
    if (success) {
      toast({ title: "SINAL ATUALIZADO" })
      router.push("/admin/content")
    } else {
      setLoading(false)
      toast({ variant: "destructive", title: "ERRO AO SALVAR" })
    }
  }

  if (fetching) return <div className="flex flex-col items-center justify-center py-40 gap-4"><Loader2 className="h-12 w-12 animate-spin text-primary" /><p className="text-[10px] font-black uppercase italic tracking-widest">Sintonizando v370...</p></div>

  if (!formData) return null;

  const isSeriesMode = formData.type === 'series' || formData.type === 'multi-season';

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/content"><ChevronLeft className="h-5 w-5" /></Link>
        </Button>
        <h1 className="text-3xl font-black font-headline uppercase italic text-primary">Recalibrar Sinal v370</h1>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid gap-4 p-6 bg-card/50 border border-white/5 rounded-xl shadow-2xl">
            <div className="space-y-2">
              <Label className="uppercase text-[10px] font-black opacity-60 tracking-widest">Nome do Conteúdo</Label>
              <Input 
                value={formData.title || ""} 
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
                    <SelectItem value="LÉO TV PAY PER VIEW">LÉO TV PAY PER VIEW</SelectItem>
                    <SelectItem value="LÉO TV ALACARTES">LÉO TV ALACARTES</SelectItem>
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
              <Textarea value={formData.description || ""} onChange={e => setFormData({...formData, description: e.target.value})} className="h-24 bg-black/40 border-white/5 font-bold text-xs" />
            </div>
          </div>

          {!isSeriesMode && (
            <div className="grid gap-6 p-6 bg-card/50 border border-white/5 rounded-xl shadow-2xl">
              <div className="space-y-2">
                <h3 className="font-black uppercase text-[10px] flex items-center justify-between text-primary tracking-widest">
                   <div className="flex items-center gap-2"><Zap className="h-4 w-4" /> Link Master Soberano</div>
                   <div className="flex gap-2">
                     <Button type="button" variant="outline" size="sm" onClick={handleTranslate} disabled={isTranslating} className="h-8 border-emerald-500/20 text-emerald-500 font-black uppercase text-[8px] hover:bg-emerald-500/10">
                        {isTranslating ? <Loader2 className="animate-spin mr-1 h-3 w-3" /> : <Languages className="mr-1 h-3 w-3" />} Traduzir Texto via IA
                     </Button>
                     <Button type="button" variant="outline" size="sm" onClick={handleFixMainLink} disabled={isFixing} className="h-8 border-primary/20 text-primary hover:bg-primary/10 font-black uppercase text-[8px]">
                        {isFixing ? <Loader2 className="animate-spin mr-1 h-3 w-3" /> : <Wand2 className="mr-1 h-3 w-3" />} Sintonizar Canal
                     </Button>
                   </div>
                </h3>
                <div className="flex gap-2">
                  <Input value={formData.streamUrl || ""} onChange={e => setFormData({...formData, streamUrl: e.target.value})} className="h-12 bg-black/40 border-white/5 font-mono text-[10px] flex-1" placeholder="Link único para Web e IPTV" />
                  <Button type="button" size="icon" onClick={() => setTestVideo({url: formatMasterLink(formData.streamUrl || ""), title: formData.title || 'Teste'})} className="h-12 w-12 bg-emerald-500 hover:bg-emerald-600 shadow-lg shadow-emerald-500/20"><Play className="h-5 w-5" /></Button>
                </div>
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
             <Input 
                value={formData.imageUrl || ""} 
                onChange={e => setFormData({...formData, imageUrl: e.target.value})} 
                placeholder="https://..."
                className="h-10 bg-black/40 border-white/5 text-[10px] font-mono"
              />
          </div>
          
          <Button type="submit" className="w-full h-16 bg-primary font-black text-sm uppercase italic shadow-2xl shadow-primary/20 rounded-2xl hover:scale-[1.02] active:scale-95 transition-all" disabled={loading}>
            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Save className="mr-2 h-6 w-6" />} SALVAR RECALIBRAGEM
          </Button>
        </div>
      </form>

      <Dialog open={!!testVideo} onOpenChange={() => setTestVideo(null)}>
        <DialogContent className="max-w-5xl bg-black border-white/10 p-0 overflow-hidden rounded-[2.5rem] shadow-2xl">
          <DialogHeader className="sr-only"><DialogTitle>Teste de Sinal</DialogTitle></DialogHeader>
          {testVideo && <VideoPlayer url={testVideo.url} title={testVideo.title} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}