
"use client"

import * as React from "react"
import { Plus, Search, Edit2, Trash2, Film, Lock, PlayCircle, Loader2, Tv, Square, CheckSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getRemoteContent, removeContent, bulkRemoveContent, ContentItem } from "@/lib/store"
import Link from "next/link"
import { toast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
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

  const loadItems = React.useCallback(async (query = "") => {
    setLoading(true)
    try {
      // SORENARÍA ALFABÉTICA v38: O store.ts já retorna ordenado de A-Z
      const data = await getRemoteContent(false, query)
      setItems(data)
    } catch (error) {
      toast({ variant: "destructive", title: "Erro de Conexão Master" })
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    const delayDebounceFn = setTimeout(() => { loadItems(searchTerm) }, 500)
    return () => clearTimeout(delayDebounceFn)
  }, [searchTerm, loadItems])

  const handleDelete = async (id: string) => {
    if (confirm("Mestre, deseja realmente excluir este sinal da rede?")) {
      if (await removeContent(id)) {
        setItems(prev => prev.filter(i => i.id !== id))
        toast({ title: "SINAL EXTERMINADO" })
      }
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    if (confirm(`Mestre, deseja deletar ${selectedIds.length} sinais em massa?`)) {
      setIsDeleting(true)
      if (await bulkRemoveContent(selectedIds)) {
        setSelectedIds([])
        await loadItems(searchTerm)
        toast({ title: "LIMPEZA CONCLUÍDA" })
      }
      setIsDeleting(false)
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === items.length && items.length > 0) setSelectedIds([])
    else setSelectedIds(items.map(i => i.id))
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black font-headline uppercase italic text-primary">Biblioteca Master</h1>
          <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-widest">Gestão Total de Canais e VOD (A-Z).</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {selectedIds.length > 0 && (
            <Button variant="destructive" onClick={handleBulkDelete} disabled={isDeleting} className="h-10 px-4 rounded-xl text-[9px] font-black uppercase">
              <Trash2 className="mr-2 h-3 w-3" /> Excluir ({selectedIds.length})
            </Button>
          )}
          <Button asChild className="bg-primary h-10 px-6 rounded-xl text-[9px] font-black uppercase shadow-lg shadow-primary/20">
            <Link href="/admin/content/new"><Plus className="mr-2 h-4 w-4" /> Novo Conteúdo</Link>
          </Button>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="BUSCAR SINAL NO BANCO..." className="pl-12 bg-card/50 border-white/5 h-12 rounded-xl text-xs uppercase font-bold" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        </div>
        <Button variant="outline" onClick={toggleSelectAll} className="h-12 border-white/5 rounded-xl uppercase text-[9px] font-black hover:bg-white/5">
          {selectedIds.length === items.length && items.length > 0 ? <CheckSquare className="mr-2 h-4 w-4 text-primary" /> : <Square className="mr-2 h-4 w-4" />}
          Marcar Todos
        </Button>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4"><Loader2 className="h-10 w-10 animate-spin text-primary" /><p className="text-[10px] font-black uppercase opacity-40">Sincronizando Lista Alfabética...</p></div>
      ) : (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
          {items.map((item) => {
            const isSelected = selectedIds.includes(item.id);
            const isSeries = item.type === 'series' || item.type === 'multi-season';
            const epCount = isSeries ? (item.episodes?.length || item.seasons?.reduce((acc, s) => acc + (s.episodes?.length || 0), 0) || 0) : 0;
            
            return (
              <div key={item.id} className={`bg-card border ${isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-white/5'} rounded-xl overflow-hidden relative group transition-all flex flex-col shadow-lg`}>
                <div className="absolute top-2 left-2 z-10">
                  <Checkbox checked={isSelected} onCheckedChange={() => toggleSelect(item.id)} className="bg-black/60 border-white/20" />
                </div>
                <div className="aspect-[2/3] relative bg-black/40 cursor-pointer" onClick={() => toggleSelect(item.id)}>
                  {item.imageUrl ? <Image src={item.imageUrl} alt={item.title} fill className="object-cover" unoptimized /> : <div className="flex items-center justify-center h-full opacity-20"><Tv className="h-8 w-8" /></div>}
                  <div className="absolute top-3 right-3">{item.isRestricted && <Lock className="h-4 w-4 text-primary bg-black/60 p-1 rounded-full shadow-lg" />}</div>
                </div>
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-[10px] uppercase truncate text-primary">{item.title}</h3>
                    <p className="text-[8px] font-bold text-muted-foreground uppercase truncate">{item.genre}</p>
                  </div>
                  {isSeries && epCount > 0 && (
                    <p className="text-[8px] font-black text-primary uppercase mt-1 opacity-60">{epCount} EPISÓDIOS</p>
                  )}
                </div>
                <div className="flex justify-between p-2 border-t border-white/5 bg-black/20">
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-primary/20" onClick={() => {
                      if (isSeries) setPreviewItem(item);
                      else setActiveEpisode({ url: item.directStreamUrl || item.streamUrl || "", title: item.title });
                    }}><PlayCircle className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="icon" asChild className="h-7 w-7"><Link href={`/admin/content/edit/${item.id}`}><Edit2 className="h-3 w-3" /></Link></Button>
                  </div>
                  <Button variant="ghost" size="icon" className="text-destructive h-7 w-7 hover:bg-destructive/10" onClick={() => handleDelete(item.id)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={!!previewItem} onOpenChange={() => setPreviewItem(null)}>
        <DialogContent className="max-w-xl bg-card border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
          <DialogHeader><DialogTitle className="uppercase font-black text-primary italic text-xl">Episódios: {previewItem?.title}</DialogTitle></DialogHeader>
          <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-2 custom-scroll scrollbar-visible">
            {previewItem?.episodes?.sort((a,b) => a.number - b.number).map((ep) => (
              <Button key={ep.id} variant="outline" onClick={() => setActiveEpisode({ url: ep.directStreamUrl || ep.streamUrl || "", title: `${previewItem.title} - EP ${ep.number}` })} className="h-12 justify-start bg-white/5 rounded-xl border-white/5 hover:border-primary px-6">
                <span className="font-black uppercase text-[10px]">EP {ep.number} - {ep.title}</span>
                <PlayCircle className="ml-auto h-4 w-4 text-primary" />
              </Button>
            ))}
            {previewItem?.seasons?.sort((a,b) => a.number - b.number).map(season => (
              <div key={season.id} className="space-y-2 mb-4">
                <p className="text-[10px] font-black text-primary uppercase pl-2 border-l-2 border-primary ml-2">Temporada {season.number}</p>
                {season.episodes.sort((a,b) => a.number - b.number).map(ep => (
                  <Button key={ep.id} variant="outline" onClick={() => setActiveEpisode({ url: ep.directStreamUrl || ep.streamUrl || "", title: `${previewItem.title} - T${season.number} EP ${ep.number}` })} className="w-full h-10 justify-start bg-white/5 border-white/5 hover:border-primary px-6 rounded-lg">
                    <span className="font-bold uppercase text-[9px]">EP {ep.number} - {ep.title}</span>
                    <PlayCircle className="ml-auto h-3 w-3 text-primary" />
                  </Button>
                ))}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!activeEpisode} onOpenChange={() => setActiveEpisode(null)}>
        <DialogContent className="max-w-6xl bg-black border-white/10 p-0 overflow-hidden rounded-[2.5rem] shadow-2xl">
          {activeEpisode && <VideoPlayer url={activeEpisode.url} title={activeEpisode.title} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}
