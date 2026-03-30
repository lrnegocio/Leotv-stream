
"use client"

import * as React from "react"
import { Plus, Search, Edit2, Trash2, Film, Lock, Globe, PlayCircle, Loader2, ListOrdered, Layers, Trash, CheckSquare, Square, RefreshCcw } from "lucide-react"
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
  
  const [selectedIds, setSelectedIds] = React.useState<string[]>([])
  const [isDeleting, setIsDeleting] = React.useState(false)

  const loadItems = React.useCallback(async (query = "", force = false) => {
    setLoading(true)
    try {
      const data = await getRemoteContent(force, query)
      setItems(data)
    } catch (error) {
      toast({ variant: "destructive", title: "Erro", description: "Falha ao carregar conteúdos do Império." })
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadItems(searchTerm)
  }, [loadItems, searchTerm])

  const handleDelete = async (id: string) => {
    if (confirm("Deseja realmente excluir este sinal master?")) {
      const success = await removeContent(id)
      if (success) {
        setItems(prev => prev.filter(i => i.id !== id))
        toast({ title: "Excluído", description: "O canal foi removido com sucesso." })
      }
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    if (confirm(`ATENÇÃO MESTRE: Deseja excluir os ${selectedIds.length} sinais selecionados? Esta ação é definitiva.`)) {
      setIsDeleting(true)
      const success = await bulkRemoveContent(selectedIds)
      if (success) {
        setSelectedIds([])
        await loadItems(searchTerm, true)
        toast({ title: "Limpeza Master Concluída", description: "Os sinais foram varridos do banco." })
      } else {
        toast({ variant: "destructive", title: "Erro de Lote", description: "Alguns itens não puderam ser excluídos. Tente novamente." })
        await loadItems(searchTerm, true)
      }
      setIsDeleting(false)
    }
  }

  const handleClearAllImported = async () => {
    if (confirm("ALERTA MESTRE LÉO: Isso vai apagar TODOS os canais M3U do banco. Confirmar?")) {
      setIsDeleting(true)
      const success = await clearAllM3UContent()
      if (success) {
        setSelectedIds([])
        await loadItems("", true)
        toast({ title: "Banco Resetado!", description: "Todos os canais importados foram deletados." })
      }
      setIsDeleting(false)
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === items.length && items.length > 0) {
      setSelectedIds([])
    } else {
      setSelectedIds(items.map(i => i.id))
    }
  }

  const handlePreview = (item: ContentItem) => {
    if (item.type === 'series' || item.type === 'multi-season') {
      setPreviewItem(item)
    } else {
      setActiveEpisode({ url: item.streamUrl || item.directStreamUrl || "", title: item.title })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline uppercase italic text-primary">Sua Biblioteca P2P</h1>
          <p className="text-muted-foreground uppercase text-[10px] font-black tracking-widest">Gestão de 300k+ Sinais com Cache Blindado.</p>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <Button variant="outline" onClick={() => loadItems(searchTerm, true)} className="border-primary/20 text-primary hover:bg-primary/10 uppercase text-[9px] font-black h-10 px-4 rounded-xl">
            <RefreshCcw className="mr-2 h-3 w-3" /> Sincronizar Império
          </Button>
          <Button variant="outline" onClick={handleClearAllImported} disabled={isDeleting} className="border-destructive/20 text-destructive hover:bg-destructive/10 uppercase text-[9px] font-black h-10 px-4 rounded-xl">
            <Trash className="mr-2 h-3 w-3" /> Limpar M3U
          </Button>
          {selectedIds.length > 0 && (
            <Button variant="destructive" onClick={handleBulkDelete} disabled={isDeleting} className="uppercase text-[9px] font-black h-10 px-4 rounded-xl shadow-lg shadow-destructive/20">
              <Trash2 className="mr-2 h-3 w-3" /> Excluir ({selectedIds.length})
            </Button>
          )}
          <Button asChild className="bg-primary h-10 px-6 rounded-xl uppercase text-[9px] font-black shadow-xl shadow-primary/20">
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
            placeholder="BUSCAR NO SEU IMPÉRIO..." 
            className="pl-10 bg-card/50 border-white/5 h-12 rounded-xl text-xs uppercase font-bold" 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" onClick={toggleSelectAll} className="h-12 border-white/5 rounded-xl uppercase text-[9px] font-black">
          {selectedIds.length === items.length && items.length > 0 ? <CheckSquare className="mr-2 h-4 w-4 text-primary" /> : <Square className="mr-2 h-4 w-4" />}
          {selectedIds.length === items.length && items.length > 0 ? "Desmarcar Todos" : "Marcar Todos"}
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-[10px] font-black uppercase opacity-40">Sintonizando Banco de Dados...</p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
          {items.length === 0 ? (
            <div className="col-span-full py-20 text-center bg-card/10 rounded-xl border border-dashed border-white/10">
              <p className="text-muted-foreground uppercase text-xs font-bold">Nenhum canal localizado na faixa visível.</p>
            </div>
          ) : (
            items.map((item) => {
              const isSelected = selectedIds.includes(item.id);
              return (
                <div key={item.id} className={`bg-card border ${isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-white/5'} rounded-xl p-0 group hover:border-primary/50 transition-all flex flex-col overflow-hidden relative shadow-lg`}>
                  <div className="absolute top-2 left-2 z-10">
                    <Checkbox 
                      checked={isSelected} 
                      onCheckedChange={() => toggleSelect(item.id)} 
                      className="bg-black/60 border-white/20 w-5 h-5 data-[state=checked]:bg-primary"
                    />
                  </div>
                  
                  <div className="aspect-[2/3] relative bg-black/40 cursor-pointer" onClick={() => toggleSelect(item.id)}>
                    {item.imageUrl ? (
                      <Image src={item.imageUrl} alt={item.title} fill className="object-cover group-hover:scale-105 transition-transform" unoptimized />
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

      {/* Seletor de Episódios Master - LISTA VERTICAL PURA */}
      <Dialog open={!!previewItem} onOpenChange={() => setPreviewItem(null)}>
        <DialogContent className="max-w-2xl bg-card border-white/10 rounded-[2.5rem] p-8">
          <DialogHeader className="mb-6">
            <DialogTitle className="uppercase font-black italic text-primary text-2xl">{previewItem?.title}</DialogTitle>
            <DialogDescription className="uppercase text-[10px] font-black opacity-60 tracking-widest mt-1">Escolha um episódio para testar o sinal</DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 max-h-[500px] overflow-y-auto pr-4 custom-scroll scrollbar-visible">
            {previewItem?.type === 'series' && previewItem.episodes?.sort((a,b) => a.number - b.number).map((ep) => (
              <Button 
                key={ep.id} 
                variant="outline" 
                onClick={() => { setActiveEpisode({ url: ep.streamUrl || ep.directStreamUrl || "", title: `${previewItem.title} - EP ${ep.number}` }); }}
                className="h-14 justify-start bg-white/5 border-white/5 hover:border-primary hover:bg-primary/10 rounded-2xl px-6 group transition-all"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center font-black text-[10px] text-primary mr-4">{ep.number}</div>
                <span className="font-black uppercase text-xs">EP {ep.number} - {ep.title || `Episódio ${ep.number}`}</span>
                <PlayCircle className="ml-auto h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
              </Button>
            ))}
            {previewItem?.type === 'multi-season' && previewItem.seasons?.sort((a,b) => a.number - b.number).map(s => (
               <div key={s.id} className="space-y-2 mt-4 first:mt-0">
                 <h4 className="text-[10px] font-black uppercase text-primary/60 px-2 tracking-tighter border-l-2 border-primary ml-1 pl-2 mb-3">Temporada {s.number}</h4>
                 {s.episodes.sort((a,b) => a.number - b.number).map(ep => (
                    <Button 
                      key={ep.id} 
                      variant="outline" 
                      onClick={() => { setActiveEpisode({ url: ep.streamUrl || ep.directStreamUrl || "", title: `${previewItem.title} - T${s.number} EP ${ep.number}` }); }}
                      className="h-12 justify-start bg-white/5 border-white/5 hover:border-primary hover:bg-primary/10 rounded-xl px-6 group w-full"
                    >
                      <div className="w-6 h-6 rounded-full bg-primary/5 flex items-center justify-center font-black text-[8px] text-primary mr-4">{ep.number}</div>
                      <span className="font-bold uppercase text-[10px]">EP {ep.number} - {ep.title || `Episódio ${ep.number}`}</span>
                      <PlayCircle className="ml-auto h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
                    </Button>
                 ))}
               </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Player de Preview Master */}
      <Dialog open={!!activeEpisode} onOpenChange={() => setActiveEpisode(null)}>
        <DialogContent className="max-w-5xl bg-black border-white/10 p-0 overflow-hidden rounded-[3rem]">
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
