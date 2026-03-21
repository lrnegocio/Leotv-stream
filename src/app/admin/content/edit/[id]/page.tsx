
"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { ChevronLeft, Sparkles, Loader2, Save, Globe, Lock, Trash2, ListOrdered, Link as LinkIcon } from "lucide-react"
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

export default function EditContentPage() {
  const { id } = useParams()
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)
  const [fetching, setFetching] = React.useState(true)
  const [generating, setGenerating] = React.useState(false)
  
  const [formData, setFormData] = React.useState<ContentItem | null>(null)

  React.useEffect(() => {
    const load = async () => {
      const list = await getRemoteContent()
      const item = list.find(c => c.id === id)
      if (item) {
        setFormData(item)
      } else {
        toast({ variant: "destructive", title: "Erro", description: "Conteúdo não encontrado." })
        router.push("/admin/content")
      }
      setFetching(false)
    }
    load()
  }, [id, router])

  if (fetching || !formData) return <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin" /></div>

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
    await saveContent(formData)
    toast({ title: "Atualizado", description: "Conteúdo salvo com sucesso." })
    router.push("/admin/content")
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/content"><ChevronLeft className="h-5 w-5" /></Link>
        </Button>
        <h1 className="text-3xl font-bold font-headline uppercase">Editar Conteúdo</h1>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="grid gap-4 p-6 bg-card/50 border border-white/5 rounded-xl">
            <div className="space-y-2">
              <Label>Título</Label>
              <Input 
                value={formData.title} 
                onChange={e => setFormData({...formData, title: e.target.value})} 
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={formData.type} onValueChange={(val: any) => setFormData({...formData, type: val})}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="channel">Canal ao Vivo</SelectItem>
                    <SelectItem value="movie">Filme Único</SelectItem>
                    <SelectItem value="series">Série</SelectItem>
                    <SelectItem value="multi-season">Série (Temporadas)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Pasta / Categoria</Label>
                <Input value={formData.genre} onChange={e => setFormData({...formData, genre: e.target.value})} />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label>Descrição</Label>
                <Button type="button" variant="outline" size="sm" onClick={generateAI} disabled={generating}>
                  {generating ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Sparkles className="h-3 w-3 mr-2" />} IA
                </Button>
              </div>
              <Textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            </div>
          </div>

          <div className="p-6 bg-card/50 border border-white/5 rounded-xl space-y-4">
            <h3 className="font-semibold flex items-center gap-2"><Globe className="h-4 w-4" /> Link Principal</h3>
            <Input value={formData.streamUrl || ""} onChange={e => setFormData({...formData, streamUrl: e.target.value})} />
          </div>

          <div className="p-6 bg-card/50 border border-white/5 rounded-xl space-y-4">
            <h3 className="font-semibold flex items-center gap-2"><LinkIcon className="h-4 w-4" /> URL da Capa</h3>
            <Input value={formData.imageUrl || ""} onChange={e => setFormData({...formData, imageUrl: e.target.value})} placeholder="https://exemplo.com/imagem.jpg" />
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-6 bg-card/50 border border-white/5 rounded-xl space-y-4">
            <h3 className="font-semibold flex items-center gap-2"><Lock className="h-4 w-4" /> Segurança</h3>
            <div className="flex items-center justify-between">
              <Label>Conteúdo Restrito</Label>
              <Switch checked={formData.isRestricted} onCheckedChange={val => setFormData({...formData, isRestricted: val})} />
            </div>
          </div>
          <Button type="submit" className="w-full h-14 bg-primary font-bold" disabled={loading}>
            {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Save className="h-6 w-6 mr-2" />} SALVAR
          </Button>
        </div>
      </form>
    </div>
  )
}
