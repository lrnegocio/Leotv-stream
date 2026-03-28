
"use client"

import * as React from "react"
import { Plus, Search, Edit2, Trash2, Film, Lock, Globe, PlayCircle, Loader2, ListOrdered, Layers, Trash, CheckSquare, Square } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getRemoteContent, removeContent, bulkRemoveContent, clearAllM3UContent, ContentItem } from "@/lib/store"
import Link from "next/link"
import { toast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { VideoPlayer } from "@/components/video-player"
import Image from "next/image"
import { Checkbox } from "@/components/ui/checkbox"

export default function ContentManagementPage() {
  const [searchTerm, setSearchTerm] = React.useState("")
  const [items, setItems] = React.useState<ContentItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [previewItem, setPreviewItem] = React.useState<ContentItem | null>(null)
  const [activeEpisode, setActiveEpisode] = React.useState<{url: string, title: string} | null>(null)
  
  // Estados de Seleção Master
  const [selectedIds, setSelectedIds] = React.useState<string[]>([])
  const [isDeleting, setIsDeleting] = React.useState(false)

  const loadItems = React.useCallback(async () => {
    setLoading(true)
    try {
      const data = await getRemoteContent(true)
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
        setItems(prev => prev.filter(i => i.id !== id))
        toast({ title: "Excluído", description: "O canal foi removido com sucesso." })
      }
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    if (confirm(`ATENÇÃO: Deseja excluir os ${selectedIds.length} canais selecionados?`)) {
      setIsDeleting(true)
      const success = await bulkRemoveContent(selectedIds)
      if (success) {
        setItems(prev => prev.filter(i => !selectedIds.includes(i.id)))
        setSelectedIds([])
        toast({ title: "Limpeza Concluída", description: "Canais removidos do banco." })
      }
      setIsDeleting(false)
    }
  }

  const handleClearAllImported = async () => {
    if (confirm("ALERTA MESTRE: Isso vai apagar TODOS os canais que foram importados via lista M3U de uma vez só. Confirmar?")) {
      setIsDeleting(true)
      const success = await clearAllM3UContent()
      if (success) {
        await loadItems()
        toast({ title: "Fábrica Limpa!", description: "Todos os canais M3U foram deletados." })
      }
      setIsDeleting(false)
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(filtered.map(i => i.id))
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
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline uppercase">Sua Biblioteca P2P</h1>
          <p className="text-muted-foreground uppercase text-[10px]">Gerenciamento de {items.length} Canais e Filmes.</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <Button variant="outline" onClick={handleClearAllImported} disabled={isDeleting} className="border-destructive/20 text-destructive hover:bg-destructive/10 uppercase text-[9px] font-black h-10 px-4 rounded-xl">
            <Trash className="mr-2 h-3 w-3" /> Limpar M3U
          </Button>
          {selectedIds.length > 0 && (
            <Button variant="destructive" onClick={handleBulkDelete} disabled={isDeleting} className="uppercase text-[9px] font-black h-10 px-4 rounded-xl shadow-lg shadow-destructive/20">
              <Trash2 className="mr-2 h-3 w-3" /> Excluir ({selectedIds.length})
            </Button>
          )}
          <Button asChild className="bg-primary h-10 px-6 rounded-xl uppercase text-[9px] font-black">
            <Link href="/admin/content/new">
              <Plus className="mr-2 h-4 w-4" /> Novo Conteúdo
            </Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar canal ou categoria..." 
            className="pl-10 bg-card/50 border-white/5 h-12 rounded-xl text-xs uppercase font-bold" 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" onClick={toggleSelectAll} className="h-12 border-white/5 rounded-xl uppercase text-[9px] font-black">
          {selectedIds.length === filtered.length ? <CheckSquare className="mr-2 h-4 w-4" /> : <Square className="mr-2 h-4 w-4" />}
          {selectedIds.length === filtered.length ? "Desmarcar Todos" : "Marcar Todos"}
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
      ) : (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {filtered.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-card/10 rounded-xl border border-dashed border-white/10">
              <p className="text-muted-foreground uppercase text-xs font-bold">Nenhum conteúdo cadastrado.</p>
            </div>
          ) : (
            filtered.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              return (
                <div key={item.id} className={`bg-card border ${isSelected ? 'border-primary' : 'border-white/5'} rounded-xl p-0 group hover:border-primary/50 transition-all flex flex-col overflow-hidden relative`}>
                  <div className="absolute top-2 left-2 z-10">
                    <Checkbox 
                      checked={isSelected} 
                      onCheckedChange={() => toggleSelect(item.id)} 
                      className="bg-black/60 border-white/20 w-5 h-5"
                    />
                  </div>
                  
                  <div className="aspect-[2/3] relative bg-black/40 cursor-pointer" onClick={() => toggleSelect(item.id)}>
                    {item.imageUrl ? (
                      <Image src={item.imageUrl} alt={item.title} fill className="object-cover" unoptimized />
                    ) : (
                      <div className="flex items-center justify-center h-full opacity-20"><Film className="h-10 w-10" /></div>
                    )}
                    <div className="absolute top-3 right-3">
                      {item.isRestricted && <Lock className="h-4 w-4 text-primary bg-black/60 p-1 rounded-full" />}
                    </div>
                  </div>
                  
                  <div className="p-3 flex-1">
                    <div className="flex items-center justify-between mb-1 gap-2">
                      <h3 className="font-bold text-[10px] uppercase truncate text-primary flex-1">{item.title}</h3>
                      <div className="bg-primary/10 px-1.5 py-0.5 rounded text-[7px] font-black uppercase text-primary shrink-0">
                        {item.type === 'channel' ? 'TV' : item.type === 'movie' ? 'FILM' : 'SER'}
                      </div>
                    </div>
                    <p className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest truncate">{item.genre}</p>
                  </div>

                  <div className="flex justify-between items-center p-2 border-t border-white/5 bg-black/20">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="hover:text-primary h-7 w-7" onClick={() => handlePreview(item)}>
                        <PlayCircle className="h-3 w-3" />
                      </Button>
                      <Button variant="ghost" size="icon" asChild className="h-7 w-7">
                        <Link href={`/admin/content/edit/${item.id}`}><Edit2 className="h-3 w-3" /></Link>
                      </Button>
                    </div>
                    
                    <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10 h-7 w-7" onClick={() => handleDelete(item.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })
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
