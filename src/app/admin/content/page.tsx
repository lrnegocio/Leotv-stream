
"use client"

import * as React from "react"
import { Plus, Search, Edit2, Trash2, Film, Lock, Globe, PlayCircle, Loader2, ListOrdered, Layers } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getRemoteContent, removeContent, ContentItem } from "@/lib/store"
import Link from "next/link"
import { toast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { VideoPlayer } from "@/components/video-player"
import Image from "next/image"

export default function ContentManagementPage() {
  const [searchTerm, setSearchTerm] = React.useState("")
  const [items, setItems] = React.useState<ContentItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [previewItem, setPreviewItem] = React.useState<ContentItem | null>(null)
  const [activeEpisode, setActiveEpisode] = React.useState<{url: string, title: string} | null>(null)

  const loadItems = React.useCallback(async () => {
    setLoading(true)
    try {
      const data = await getRemoteContent()
      setItems(data)
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: "Falha ao carregar conteúdos." })
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadItems()
  }, [loadItems])

  const handleDelete = async (id: string) => {
    if (confirm("Deseja realmente excluir este canal?")) {
      const success = await removeContent(id)
      if (success) {
        loadItems()
        toast({ title: "Excluído", description: "O canal foi removido com sucesso." })
      }
    }
  }

  const filtered = items.filter(i => 
    i.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    i.genre.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handlePreview = (item: ContentItem) => {
    if (item.type === 'series' || item.type === 'multi-season') {
      setPreviewItem(item)
    } else {
      setActiveEpisode({ url: item.streamUrl || "", title: item.title })
    }
  }

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
              <div key={item.id} className="bg-card border border-white/5 rounded-xl p-0 group hover:border-primary/50 transition-all flex flex-col overflow-hidden">
                <div className="aspect-[2/3] relative bg-black/40">
                  {item.imageUrl ? (
                    <Image src={item.imageUrl} alt={item.title} fill className="object-cover" unoptimized />
                  ) : (
                    <div className="flex items-center justify-center h-full opacity-20"><Film className="h-10 w-10" /></div>
                  )}
                  <div className="absolute top-3 right-3">
                    {item.isRestricted && <Lock className="h-4 w-4 text-primary bg-black/60 p-1 rounded-full" />}
                  </div>
                </div>
                
                <div className="p-4 flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-bold text-sm uppercase truncate text-primary">{item.title}</h3>
                    <div className="bg-primary/10 px-2 py-0.5 rounded-md text-[8px] font-black uppercase text-primary">
                      {item.type === 'channel' ? 'TV' : item.type === 'movie' ? 'FILME' : 'SÉRIE'}
                    </div>
                  </div>
                  <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{item.genre}</p>
                  
                  {(item.type === 'series' || item.type === 'multi-season') && (
                    <div className="mt-2 flex items-center gap-2 text-primary opacity-60">
                      <ListOrdered className="h-3 w-3" />
                      <span className="text-[9px] font-black uppercase">
                        {item.type === 'series' ? `${item.episodes?.length || 0} Episódios` : `${item.seasons?.length || 0} Temporadas`}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center p-4 border-t border-white/5 bg-black/20">
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="hover:text-primary h-8 w-8" onClick={() => handlePreview(item)}>
                      <PlayCircle className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" asChild className="h-8 w-8">
                      <Link href={`/admin/content/edit/${item.id}`}><Edit2 className="h-4 w-4" /></Link>
                    </Button>
                  </div>
                  
                  <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 h-8 w-8" onClick={() => handleDelete(item.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Seletor de Episódios para Preview no Admin */}
      <Dialog open={!!previewItem} onOpenChange={() => setPreviewItem(null)}>
        <DialogContent className="max-w-3xl bg-card border-white/10 rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="uppercase font-black italic text-primary">{previewItem?.title}</DialogTitle>
            <DialogDescription className="uppercase text-[10px] font-bold opacity-60">Escolha um episódio para testar o sinal</DialogDescription>
          </DialogHeader>
          <div className="grid sm:grid-cols-2 gap-3 mt-4 max-h-[400px] overflow-y-auto pr-2">
            {previewItem?.type === 'series' && previewItem.episodes?.map((ep, idx) => (
              <Button 
                key={ep.id} 
                variant="outline" 
                onClick={() => { setActiveEpisode({ url: ep.streamUrl, title: `${previewItem.title} - EP ${ep.number}` }); }}
                className="h-14 justify-start bg-black/20 border-white/5 hover:border-primary rounded-xl"
              >
                <ListOrdered className="h-4 w-4 mr-3 text-primary" />
                <span className="font-bold uppercase text-[10px]">EP {ep.number} - {ep.title}</span>
              </Button>
            ))}
            {previewItem?.type === 'multi-season' && previewItem.seasons?.map(s => (
               s.episodes.map(ep => (
                <Button 
                  key={ep.id} 
                  variant="outline" 
                  onClick={() => { setActiveEpisode({ url: ep.streamUrl, title: `${previewItem.title} - T${s.number} EP ${ep.number}` }); }}
                  className="h-14 justify-start bg-black/20 border-white/5 hover:border-primary rounded-xl"
                >
                  <Layers className="h-4 w-4 mr-3 text-secondary" />
                  <span className="font-bold uppercase text-[10px]">T{s.number} - EP {ep.number}</span>
                </Button>
               ))
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Player de Preview Master */}
      <Dialog open={!!activeEpisode} onOpenChange={() => setActiveEpisode(null)}>
        <DialogContent className="max-w-4xl bg-black border-white/10 p-0 overflow-hidden rounded-3xl">
          <DialogHeader className="sr-only">
            <DialogTitle>{activeEpisode?.title}</DialogTitle>
          </DialogHeader>
          {activeEpisode && (
            <div className="p-0">
              <VideoPlayer url={activeEpisode.url} title={activeEpisode.title} />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
