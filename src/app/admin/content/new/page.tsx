
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Sparkles, Loader2, Save, Globe, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { autoGenerateContentDescription } from "@/ai/flows/auto-generate-content-description-flow"
import { toast } from "@/hooks/use-toast"
import { addContent } from "@/lib/store"
import Link from "next/link"

export default function NewContentPage() {
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)
  const [generating, setGenerating] = React.useState(false)
  const [formData, setFormData] = React.useState({
    title: "",
    type: "channel" as any,
    genre: "",
    keywords: "",
    description: "",
    streamUrl: "",
    isRestricted: false,
    thumbnail: ""
  })

  const generateAI = async () => {
    if (!formData.title) {
      toast({ variant: "destructive", title: "Atenção", description: "Insira o título para a IA poder escrever." })
      return
    }
    setGenerating(true)
    try {
      const res = await autoGenerateContentDescription({
        title: formData.title,
        contentType: formData.type === 'channel' ? 'movie' : formData.type,
        genre: formData.genre,
        keywords: formData.keywords
      })
      setFormData(prev => ({ ...prev, description: res.description }))
      toast({ title: "Descrição Gerada", description: "O texto foi criado pela IA com sucesso." })
    } catch (error) {
      toast({ variant: "destructive", title: "Erro de IA", description: "Verifique se você inseriu sua GEMINI_API_KEY no arquivo .env." })
    } finally {
      setGenerating(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    addContent({
      id: Math.random().toString(36).substring(7),
      ...formData,
      thumbnail: formData.thumbnail || `https://picsum.photos/seed/${formData.title}/600/900`
    })

    setTimeout(() => {
      toast({ title: "Conteúdo Adicionado", description: "Canal/Filme salvo na biblioteca." })
      router.push("/admin/content")
    }, 1000)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/content"><ChevronLeft className="h-5 w-5" /></Link>
        </Button>
        <h1 className="text-3xl font-bold font-headline">Novo Conteúdo</h1>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-8 md:grid-cols-3">
        <div className="md:col-span-2 space-y-6">
          <div className="grid gap-4 p-6 bg-card/50 border border-white/5 rounded-xl shadow-lg">
            <div className="space-y-2">
              <Label>Nome do Canal ou Filme</Label>
              <Input 
                value={formData.title} 
                onChange={e => setFormData({...formData, title: e.target.value})} 
                placeholder="Ex: HBO Plus HD" required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Conteúdo</Label>
                <Select value={formData.type} onValueChange={(val: any) => setFormData({...formData, type: val})}>
                  <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="channel">Canal ao Vivo (P2P)</SelectItem>
                    <SelectItem value="movie">Filme</SelectItem>
                    <SelectItem value="series">Série</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Categoria / Gênero</Label>
                <Input 
                  value={formData.genre} 
                  onChange={e => setFormData({...formData, genre: e.target.value})} 
                  placeholder="Ex: Esportes, Action"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Descrição / Sinopse</Label>
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className="text-primary border-primary/20 hover:bg-primary/10"
                  onClick={generateAI}
                  disabled={generating}
                >
                  {generating ? <Loader2 className="mr-2 h-3 w-3 animate-spin" /> : <Sparkles className="mr-2 h-3 w-3" />}
                  IA: Escrever Sinopse
                </Button>
              </div>
              <Textarea 
                value={formData.description} 
                onChange={e => setFormData({...formData, description: e.target.value})}
                placeholder="Descreva o conteúdo..." 
                className="h-32" 
              />
            </div>
          </div>

          <div className="grid gap-4 p-6 bg-card/50 border border-white/5 rounded-xl shadow-lg">
            <h3 className="font-semibold flex items-center gap-2"><Globe className="h-4 w-4" /> Fonte da Transmissão</h3>
            <div className="space-y-2">
              <Label>URL da Stream (HLS, MP4, M3U8)</Label>
              <Input 
                value={formData.streamUrl} 
                onChange={e => setFormData({...formData, streamUrl: e.target.value})}
                placeholder="https://sua-stream.xyz/live.m3u8" 
                required
              />
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-6 bg-card/50 border border-white/5 rounded-xl shadow-lg space-y-4">
            <h3 className="font-semibold flex items-center gap-2"><Lock className="h-4 w-4" /> Restrições</h3>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Conteúdo Adulto / Bloqueado</Label>
                <p className="text-xs text-muted-foreground">Exigir senha para assistir</p>
              </div>
              <Switch 
                checked={formData.isRestricted} 
                onCheckedChange={val => setFormData({...formData, isRestricted: val})} 
              />
            </div>
          </div>

          <div className="p-6 bg-card/50 border border-white/5 rounded-xl shadow-lg space-y-4">
            <h3 className="font-semibold">Capa / Thumbnail</h3>
            <Input 
              placeholder="URL da imagem..." 
              value={formData.thumbnail}
              onChange={e => setFormData({...formData, thumbnail: e.target.value})}
              className="mb-2"
            />
            <div className="aspect-[2/3] w-full bg-muted/30 rounded-lg flex items-center justify-center border-2 border-dashed border-white/5 overflow-hidden">
               {formData.thumbnail ? (
                 <img src={formData.thumbnail} className="w-full h-full object-cover" />
               ) : (
                 <p className="text-xs text-muted-foreground">Prévia da Capa</p>
               )}
            </div>
          </div>

          <Button type="submit" className="w-full h-12 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20" disabled={loading}>
            {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Save className="mr-2 h-5 w-5" />}
            Salvar no Sistema
          </Button>
        </div>
      </form>
    </div>
  )
}
