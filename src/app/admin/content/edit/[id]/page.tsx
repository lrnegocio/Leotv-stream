"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { ChevronLeft, Loader2, Save } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { toast } from "@/hooks/use-toast"
import { getContentById, saveContent, Season, Episode, ContentItem } from "@/lib/store"
import Link from "next/link"

export default function EditContentPage() {
  const params = useParams()
  const id = params?.id as string
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)
  const [fetching, setFetching] = React.useState(true)
  const [formData, setFormData] = React.useState<ContentItem | null>(null)

  React.useEffect(() => {
    const load = async () => {
      if (!id) return
      try {
        const item = await getContentById(id)
        if (item) {
          setFormData({ ...item, isActive: item.isActive !== false })
        } else {
          toast({ variant: "destructive", title: "Sinal não localizado." })
        }
      } catch (err) {
        console.error(err)
      } finally {
        setFetching(false)
      }
    }
    load()
  }, [id])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData) return
    setLoading(true)
    try {
      await saveContent(formData)
      toast({ title: "Sucesso!", description: "Sinal recalibrado com sucesso." })
      router.push("/admin/content")
    } catch (err) {
      toast({ variant: "destructive", title: "Erro ao salvar alterações." })
    } finally {
      setLoading(false)
    }
  }

  if (fetching) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950 text-white">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-6 text-zinc-100">
      <div className="mx-auto max-w-5xl space-y-6">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center space-x-2">
            <Link href="/admin/content">
              <Button variant="ghost" size="icon" className="text-zinc-400 hover:text-white">
                <ChevronLeft className="h-5 w-5" />
              </Button>
            </Link>
            <h1 className="text-xl font-bold tracking-tight text-purple-400">Recalibrar Sinal v370</h1>
          </div>
          <Button onClick={handleSave} disabled={loading} className="bg-purple-600 font-bold hover:bg-purple-700 text-white">
            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Salvar Alterações
          </Button>
        </div>

        <form onSubmit={handleSave} className="space-y-4 bg-zinc-900 p-6 rounded-xl border border-zinc-800 shadow-xl">
          <div className="space-y-2">
            <Label className="text-zinc-300">Nome do Conteúdo</Label>
            <Input
              value={formData?.title || ""}
              onChange={(e) => setFormData(formData ? { ...formData, title: e.target.value } : null)}
              className="bg-zinc-950 border-zinc-800 text-white focus:border-purple-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-zinc-300">Tipo de Mídia</Label>
              <Select
                value={formData?.type || "channel"}
                onValueChange={(val) => setFormData(formData ? { ...formData, type: val } : null)}
              >
                <SelectTrigger className="bg-zinc-950 border-zinc-800 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-white">
                  <SelectItem value="channel">Canal Aberto/PPV</SelectItem>
                  <SelectItem value="movie">Filme Único</SelectItem>
                  <SelectItem value="series">Série Simples</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-zinc-300">Pasta / Categoria</Label>
              <Input
                value={formData?.genre || ""}
                onChange={(e) => setFormData(formData ? { ...formData, genre: e.target.value } : null)}
                className="bg-zinc-950 border-zinc-800 text-white"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-300">URL do Sinal</Label>
            <Input
              value={formData?.streamUrl || ""}
              onChange={(e) => setFormData(formData ? { ...formData, streamUrl: e.target.value } : null)}
              className="bg-zinc-950 border-zinc-800 text-white"
              placeholder="https://..."
            />
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-300">Sinopse do Sinal</Label>
            <Textarea
              value={formData?.description || ""}
              onChange={(e) => setFormData(formData ? { ...formData, description: e.target.value } : null)}
              className="bg-zinc-950 border-zinc-800 text-white min-h-[80px]"
            />
          </div>
        </form>
      </div>
    </div>
  )
}
