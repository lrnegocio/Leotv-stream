"use client"

import * as React from "react"
import { Plus, Search, Edit2, Trash2, Film, Lock, Globe, PlayCircle, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getRemoteContent, removeContent, ContentItem } from "@/lib/store"
import Link from "next/link"
import { toast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { VideoPlayer } from "@/components/video-player"

export default function ContentManagementPage() {
  const [searchTerm, setSearchTerm] = React.useState("")
  const [items, setItems] = React.useState<ContentItem[]>([])
  const [loading, setLoading] = React.useState(true)

  const loadItems = async () => {
    setLoading(true)
    try {
      const data = await getRemoteContent()
      setItems(data)
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: "Falha ao carregar conteúdos." })
    } finally {
      setLoading(false)
    }
  }

  React.useEffect(() => {
    loadItems()
  }, [])

  const handleDelete = async (id: string) => {
    if (confirm("Deseja realmente excluir este canal?")) {
      await removeContent(id)
      loadItems()
      toast({ title: "Excluído", description: "O canal foi removido com sucesso." })
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
          <h1 className="text-3xl font-bold font-headline uppercase">Sua Biblioteca P2P</h1>
          <p className="text-muted-foreground uppercase text-[10px]">Gerenciamento de Canais e Filmes.</p>
        </div>
        <Button asChild className="bg-primary">
          <Link href="/admin/content/new">
            <Plus className="mr-2 h-4 w-4" /> Novo Conteúdo
          </Link>
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Buscar canal ou categoria..." 
          className="pl-10 bg-card/50 border-white/5" 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-card/10 rounded-xl border border-dashed border-white/10">
              <p className="text-muted-foreground uppercase text-xs font-bold">Nenhum conteúdo cadastrado.</p>
            </div>
          ) : (
            filtered.map((item) => (
              <div key={item.id} className="bg-card border border-white/5 rounded-xl p-5 group hover:border-primary/50 transition-all flex flex-col">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    {item.type === 'channel' ? <Globe className="h-5 w-5 text-primary" /> : <Film className="h-5 w-5 text-secondary" />}
                  </div>
                  {item.isRestricted && <Lock className="h-4 w-4 text-destructive" />}
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-sm uppercase truncate">{item.title}</h3>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{item.genre}</p>
                </div>

                <div className="flex justify-between items-center pt-4 mt-4 border-t border-white/5">
                  <div className="flex gap-1">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="hover:text-primary"><PlayCircle className="h-4 w-4" /></Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl bg-black border-white/10">
                        <DialogHeader>
                          <DialogTitle>{item.title}</DialogTitle>
                        </DialogHeader>
                        <VideoPlayer url={item.streamUrl || ""} title={item.title} />
                      </DialogContent>
                    </Dialog>
                    
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/admin/content/edit/${item.id}`}><Edit2 className="h-4 w-4" /></Link>
                    </Button>
                  </div>
                  
                  <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(item.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}