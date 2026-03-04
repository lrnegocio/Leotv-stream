
"use client"

import * as React from "react"
import { Plus, Search, Edit2, Trash2, Tv, Film, Lock, Globe, PlayCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getMockContent, deleteContent, ContentItem } from "@/lib/store"
import Link from "next/link"
import { toast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { VideoPlayer } from "@/components/video-player"

export default function ContentManagementPage() {
  const [searchTerm, setSearchTerm] = React.useState("")
  const [items, setItems] = React.useState<ContentItem[]>([])
  const [previewItem, setPreviewItem] = React.useState<ContentItem | null>(null)

  React.useEffect(() => {
    setItems(getMockContent())
  }, [])

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este conteúdo?")) {
      const updated = deleteContent(id)
      setItems(updated)
      toast({ title: "Excluído", description: "Conteúdo removido da biblioteca." })
    }
  }

  const filtered = items.filter(i => 
    i.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    i.genre.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-headline uppercase">Biblioteca de Canais</h1>
          <p className="text-muted-foreground">Gerencie seus canais P2P, Filmes e Séries.</p>
        </div>
        <Button asChild className="bg-primary hover:bg-primary/90">
          <Link href="/admin/content/new">
            <Plus className="mr-2 h-4 w-4" /> Novo Canal / Filme
          </Link>
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Buscar por nome ou categoria..." 
          className="pl-10 bg-card/50 border-white/5" 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-card/20 rounded-xl border border-dashed border-white/10">
            <p className="text-muted-foreground">Nenhum conteúdo cadastrado ainda.</p>
          </div>
        ) : (
          filtered.map((item) => (
            <div key={item.id} className="bg-card border border-white/5 rounded-xl p-5 group hover:border-primary/50 transition-all shadow-lg flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    {item.type === 'channel' ? <Globe className="h-5 w-5 text-primary" /> : <Film className="h-5 w-5 text-secondary" />}
                  </div>
                  {item.isRestricted && <Lock className="h-4 w-4 text-destructive" />}
                </div>
                <div>
                  <h3 className="font-bold text-lg uppercase truncate">{item.title}</h3>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{item.genre}</p>
                </div>
              </div>

              <div className="flex justify-between items-center pt-4 mt-4 border-t border-white/5">
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="hover:text-primary" title="Testar Sinal">
                        <PlayCircle className="h-5 w-5" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-4xl bg-black border-white/10">
                      <DialogHeader>
                        <DialogTitle className="uppercase">{item.title} - TESTE DE SINAL</DialogTitle>
                      </DialogHeader>
                      <VideoPlayer url={item.streamUrl || ""} title={item.title} />
                    </DialogContent>
                  </Dialog>
                  
                  <Button variant="ghost" size="icon" asChild>
                    <Link href={`/admin/content/edit/${item.id}`}><Edit2 className="h-5 w-5" /></Link>
                  </Button>
                </div>
                
                <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(item.id)}>
                  <Trash2 className="h-5 w-5" />
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
}
