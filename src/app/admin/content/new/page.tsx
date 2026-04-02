
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Loader2, Save, Globe, Lock, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { saveContent, ContentType, cleanName } from "@/lib/store"
import Link from "next/link"
import Image from "next/image"

export default function NewContentPage() {
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)
  
  const [formData, setFormData] = React.useState({
    title: "",
    type: "channel" as ContentType,
    genre: "LÉO TV AO VIVO", 
    description: "",
    streamUrl: "",
    isRestricted: false,
    imageUrl: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title) return;
    setLoading(true)
    
    // BLINDAGEM MESTRE: Somente campos unificados
    const success = await saveContent({
      title: cleanName(formData.title),
      type: formData.type,
      genre: formData.genre.toUpperCase(),
      description: formData.description,
      isRestricted: !!formData.isRestricted,
      streamUrl: formData.streamUrl,
      imageUrl: formData.imageUrl,
      episodes: null,
      seasons: null,
    })

    if (success) {
      toast({ title: "SINAL ADICIONADO A REDE" })
      router.push("/admin/content")
    } else {
      setLoading(false)
      toast({ variant: "destructive", title: "ERRO AO SALVAR - VERIFIQUE O BANCO" })
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/content"><ChevronLeft className="h-5 w-5" /></Link>
        </Button>
        <h1 className="text-3xl font-black font-headline uppercase italic text-primary">Novo Sinal Master</h1>
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
                    <SelectItem value="LÉO TV SERIES">LÉO TV SERIES</SelectItem>
                    <SelectItem value="LÉO TV PIADAS">LÉO TV PIADAS</SelectItem>
                    <SelectItem value="LÉO TV REELS">LÉO TV REELS</SelectItem>
                    <SelectItem value="LÉO TV DORAMAS">LÉO TV DORAMAS</SelectItem>
                    <SelectItem value="LÉO TV NOVELAS">LÉO TV NOVELAS</SelectItem>
                    <SelectItem value="LÉO TV ADULTOS">LÉO TV ADULTOS</SelectItem>
                    <SelectItem value="LÉO TV DESENHOS">LÉO TV DESENHOS</SelectItem>
                    <SelectItem value="LÉO TV VÍDEO CLIPES">LÉO TV VÍDEO CLIPES</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="uppercase text-[10px] font-black opacity-60 tracking-widest">Sinopse do Sinal</Label>
              <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="h-24 bg-black/40 border-white/5 font-bold text-xs" />
            </div>
          </div>

          <div className="grid gap-4 p-6 bg-card/50 border border-white/5 rounded-xl shadow-2xl">
            <div className="space-y-2">
              <h3 className="font-black uppercase text-[10px] flex items-center gap-2 text-primary tracking-widest"><Globe className="h-4 w-4" /> Link Soberano (Web & IPTV)</h3>
              <Input value={formData.streamUrl} onChange={e => setFormData({...formData, streamUrl: e.target.value})} placeholder="Link único para Web e IPTV" className="h-12 bg-black/40 border-white/5 font-mono text-[10px]" />
            </div>
          </div>
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
    </div>
  )
}
