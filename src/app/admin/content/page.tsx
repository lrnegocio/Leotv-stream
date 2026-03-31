
"use client"

import * as React from "react"
import { Plus, Search, Edit2, Trash2, Film, Lock, PlayCircle, Loader2, RefreshCcw, Trash, CheckSquare, Square, Tv } from "lucide-react"
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
      toast({ variant: "destructive", title: "Erro", description: "Falha ao carregar conteúdos." })
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      loadItems(searchTerm)
    }, 500)
    return () => clearTimeout(delayDebounceFn)
  }, [searchTerm, loadItems])

  const handleDelete = async (id: string) => {
    if (confirm("Excluir este sinal?")) {
      const success = await removeContent(id)
      if (success) {
        setItems(prev => prev.filter(i => i.id !== id))
        toast({ title: "Removido" })
      }
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    if (confirm(`Excluir ${selectedIds.length} sinais?`)) {
      setIsDeleting(true)
      const success = await bulkRemoveContent(selectedIds)
      if (success) {
        setSelectedIds([])
        await loadItems(searchTerm, true)
        toast({ title: "Limpeza Concluída" })
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
          <h1 className="text-3xl font-black font-headline uppercase italic text-primary">Sua Biblioteca</h1>
          <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-widest">Gestão de 1 Milhão de Sinais.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => loadItems(searchTerm, true)} className="border-primary/20 text-primary h-10 px-4 rounded-xl text-[9px] font-black uppercase">
            <RefreshCcw className="mr-2 h-3 w-3" /> Sincronizar
          </Button>
          {selectedIds.length > 0 && (
            <Button variant="destructive" onClick={handleBulkDelete} disabled={isDeleting} className="h-10 px-4 rounded-xl text-[9px] font-black uppercase">
              <Trash2 className="mr-2 h-3 w-3" /> Excluir ({selectedIds.length})
            </Button>
          )}
          <Button asChild className="bg-primary h-10 px-6 rounded-xl text-[9px] font-black uppercase shadow-xl shadow-primary/20">
            <Link href="/admin/content/new"><Plus className="mr-2 h-4 w-4" /> Novo Conteúdo</Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="BUSCAR..." 
            className="pl-10 bg-card/50 border-white/5 h-12 rounded-xl text-xs uppercase font-bold" 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" onClick={toggleSelectAll} className="h-12 border-white/5 rounded-xl uppercase text-[9px] font-black">
          {selectedIds.length === items.length && items.length > 0 ? <CheckSquare className="mr-2 h-4 w-4 text-primary" /> : <Square className="mr-2 h-4 w-4" />}
          Marcar Todos
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-[10px] font-black uppercase opacity-40">Sincronizando Banco Master...</p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
          {items.map((item) => {
            const isSelected = selectedIds.includes(item.id);
            const isSeries = item.type === 'series' || item.type === 'multi-season';
            const epCount = isSeries ? (item.episodes?.length || 0) : null;
            
            return (
              <div key={item.id} className={`bg-card border ${isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-white/5'} rounded-xl overflow-hidden relative group transition-all flex flex-col shadow-lg`}>
                <div className="absolute top-2 left-2 z-10">
                  <Checkbox checked={isSelected} onCheckedChange={() => toggleSelect(item.id)} className="bg-black/60 border-white/20" />
                </div>
                <div className="aspect-[2/3] relative bg-black/40 cursor-pointer" onClick={() => toggleSelect(item.id)}>
                  {item.imageUrl ? <Image src={item.imageUrl} alt={item.title} fill className="object-cover" unoptimized /> : <div className="flex items-center justify-center h-full opacity-20"><Tv className="h-8 w-8" /></div>}
                  <div className="absolute top-3 right-3">{item.isRestricted && <Lock className="h-4 w-4 text-primary bg-black/60 p-1 rounded-full" />}</div>
                </div>
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-[10px] uppercase truncate text-primary">{item.title}</h3>
                    <p className="text-[8px] font-bold text-muted-foreground uppercase truncate">{item.genre}</p>
                  </div>
                  {isSeries && epCount !== null && (
                    <p className="text-[8px] font-black text-primary uppercase mt-1 opacity-60">{epCount} EPISÓDIOS</p>
                  )}
                </div>
                <div className="flex justify-between p-2 border-t border-white/5 bg-black/20">
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handlePreview(item)}><PlayCircle className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="icon" asChild className="h-7 w-7"><Link href={`/admin/content/edit/${item.id}`}><Edit2 className="h-3 w-3" /></Link></Button>
                  </div>
                  <Button variant="ghost" size="icon" className="text-destructive h-7 w-7" onClick={() => handleDelete(item.id)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!previewItem} onOpenChange={() => setPreviewItem(null)}>
        <DialogContent className="max-w-xl bg-card border-white/10 rounded-[2.5rem] p-8">
          <DialogHeader>
            <DialogTitle className="uppercase font-black text-primary">{previewItem?.title}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-2 custom-scroll scrollbar-visible">
            {previewItem?.episodes?.sort((a,b) => a.number - b.number).map((ep) => (
              <Button key={ep.id} variant="outline" onClick={() => setActiveEpisode({ url: ep.streamUrl || ep.directStreamUrl || "", title: `${previewItem.title} - EP ${ep.number}` })} className="h-12 justify-start bg-white/5 rounded-xl border-white/5 hover:border-primary">
                <span className="font-black uppercase text-[10px]">EP {ep.number} - {ep.title}</span>
                <PlayCircle className="ml-auto h-4 w-4 text-primary" />
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!activeEpisode} onOpenChange={() => setActiveEpisode(null)}>
        <DialogContent className="max-w-4xl bg-black border-white/10 p-0 overflow-hidden rounded-[2.5rem]">
          {activeEpisode && <VideoPlayer url={activeEpisode.url} title={activeEpisode.title} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}
