"use client"

import * as React from "react"
import { Plus, Search, Edit2, Trash2, Tv, Lock, PlayCircle, Loader2, RefreshCcw, HardDriveDownload, PowerOff, AlertTriangle, CheckSquare, Square, MoreHorizontal, Layers, Power } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getRemoteContent, removeContent, bulkRemoveContent, bulkUpdateContent, ContentItem } from "@/lib/store"
import Link from "next/link"
import { toast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { VideoPlayer } from "@/components/video-player"
import Image from "next/image"
import { Checkbox } from "@/components/ui/checkbox"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

const CATEGORIES_LIST = [
  "LÉO TV AO VIVO", "LÉO TV FILMES", "LÉO TV SÉRIES", "LÉO TV PAY PER VIEW", 
  "LÉO TV ALACARTES", "LÉO TV ESPORTES", "LÉO TV MUSICAS", "LÉO TV VÍDEO CLIPES", 
  "LÉO TV PIADAS", "LÉO TV REELS", "LÉO TV NOVELAS", "LÉO TV DORAMAS", 
  "LÉO TV ADULTOS", "LÉO TV DESENHOS", "LÉO TV RÁDIOS"
];

export default function ContentManagementPage() {
  const [searchTerm, setSearchTerm] = React.useState("")
  const [items, setItems] = React.useState<ContentItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [errorDb, setErrorDb] = React.useState<string | null>(null)
  const [activeEpisode, setActiveEpisode] = React.useState<{url: string, title: string, id: string} | null>(null)
  const [selectedIds, setSelectedIds] = React.useState<string[]>([])

  const loadItems = React.useCallback(async (query = "") => {
    setLoading(true)
    setErrorDb(null)
    try {
      const data = await getRemoteContent(true, query)
      setItems(data)
    } catch (error: any) {
      setErrorDb(error.message || "Falha na conexão.");
      toast({ variant: "destructive", title: "Sinal do Banco Perdido" })
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    const delayDebounceFn = setTimeout(() => { loadItems(searchTerm) }, 500)
    return () => clearTimeout(delayDebounceFn)
  }, [searchTerm, loadItems])

  const handleDownloadBackup = () => {
    if (items.length === 0) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(items, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `leotv_backup_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    toast({ title: "BACKUP SALVO!" });
  }

  const handleDelete = async (id: string) => {
    if (confirm("Mestre, excluir este sinal?")) {
      if (await removeContent(id)) {
        setItems(prev => prev.filter(i => i.id !== id))
        toast({ title: "SINAL EXTERMINADO" })
      }
    }
  }

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  }

  const selectAll = () => {
    if (selectedIds.length === items.length) setSelectedIds([]);
    else setSelectedIds(items.map(i => i.id));
  }

  const handleBulkDelete = async () => {
    if (confirm(`Mestre, excluir os ${selectedIds.length} sinais selecionados?`)) {
      setLoading(true);
      const success = await bulkRemoveContent(selectedIds);
      if (success) {
        toast({ title: "AÇÃO CONCLUÍDA v385-S", description: "Sinais removidos com sucesso." });
        setSelectedIds([]);
        await loadItems(searchTerm);
      }
      setLoading(false);
    }
  }

  const handleBulkStatus = async (active: boolean) => {
    setLoading(true);
    const success = await bulkUpdateContent(selectedIds, { isActive: active });
    if (success) {
      toast({ title: active ? "SINAIS ATIVADOS" : "SINAIS DESATIVADOS" });
      setSelectedIds([]);
      await loadItems(searchTerm);
    }
    setLoading(false);
  }

  const handleBulkCategory = async (category: string) => {
    setLoading(true);
    const success = await bulkUpdateContent(selectedIds, { genre: category });
    if (success) {
      toast({ title: "CATEGORIA ALTERADA v385-S" });
      setSelectedIds([]);
      await loadItems(searchTerm);
    }
    setLoading(false);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black font-headline uppercase italic text-primary">Biblioteca Master v385-S</h1>
          <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-widest">Gestão de Canais e VOD ({items.length}).</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleDownloadBackup} variant="outline" className="h-10 px-4 rounded-xl border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10 text-[9px] font-black uppercase">
            <HardDriveDownload className="mr-2 h-3 w-3" /> Backup
          </Button>
          <Button onClick={() => loadItems(searchTerm)} variant="outline" className="h-10 w-10 rounded-xl border-primary/20">
            <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button asChild className="bg-primary h-10 px-6 rounded-xl text-[9px] font-black uppercase shadow-lg shadow-primary/20">
            <Link href="/admin/content/new"><Plus className="mr-2 h-4 w-4" /> Novo Sinal</Link>
          </Button>
        </div>
      </div>

      {selectedIds.length > 0 && (
        <div className="bg-primary p-4 rounded-2xl flex flex-wrap items-center justify-between gap-4 animate-in slide-in-from-top-4 shadow-2xl">
           <div className="flex items-center gap-4">
              <div className="bg-white/20 p-2 rounded-xl text-white font-black text-xs uppercase">{selectedIds.length} Selecionados</div>
              <Button onClick={selectAll} variant="ghost" className="text-white font-black text-[10px] uppercase hover:bg-white/10">
                {selectedIds.length === items.length ? "Desmarcar Todos" : "Selecionar Todos"}
              </Button>
           </div>
           <div className="flex flex-wrap gap-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="bg-white/10 border-white/20 text-white font-black text-[10px] uppercase h-10 rounded-xl hover:bg-white/20">
                    <Layers className="mr-2 h-3 w-3" /> Mudar Categoria
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-card border-white/10 max-h-[300px] overflow-y-auto custom-scroll">
                  {CATEGORIES_LIST.map(cat => (
                    <DropdownMenuItem key={cat} onClick={() => handleBulkCategory(cat)} className="text-[10px] font-bold uppercase cursor-pointer">{cat}</DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <Button onClick={() => handleBulkStatus(true)} variant="outline" className="bg-emerald-500/20 border-emerald-500/30 text-emerald-400 font-black text-[10px] uppercase h-10 rounded-xl">
                 <Power className="mr-2 h-3 w-3" /> Ativar
              </Button>
              <Button onClick={() => handleBulkStatus(false)} variant="outline" className="bg-zinc-500/20 border-zinc-500/30 text-zinc-400 font-black text-[10px] uppercase h-10 rounded-xl">
                 <PowerOff className="mr-2 h-3 w-3" /> Desativar
              </Button>
              <Button onClick={handleBulkDelete} variant="destructive" className="bg-red-600 font-black text-[10px] uppercase h-10 rounded-xl">
                 <Trash2 className="mr-2 h-3 w-3" /> Excluir Todos
              </Button>
              <Button onClick={() => setSelectedIds([])} variant="ghost" className="text-white h-10 w-10"><X className="h-4 w-4" /></Button>
           </div>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="BUSCAR SINAL POR NOME OU CATEGORIA..." className="pl-12 bg-card/50 border-white/5 h-12 rounded-xl text-xs uppercase font-bold" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      {loading && items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4"><Loader2 className="h-10 w-10 animate-spin text-primary" /><p className="text-[10px] font-black uppercase opacity-40">Sincronizando v385-S...</p></div>
      ) : (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
          {items.map((item) => {
            const isActive = item.isActive !== false;
            const isSelected = selectedIds.includes(item.id);
            return (
              <div key={item.id} className={`bg-card border ${isSelected ? 'border-primary shadow-primary/20' : 'border-white/5'} rounded-xl overflow-hidden relative group transition-all flex flex-col shadow-lg ${!isActive ? 'opacity-50 grayscale' : ''}`}>
                <div className="aspect-[2/3] relative bg-black/40 cursor-pointer" onClick={() => toggleSelect(item.id)}>
                  {item.imageUrl ? <Image src={item.imageUrl} alt={item.title} fill className="object-cover" unoptimized /> : <div className="flex items-center justify-center h-full opacity-20"><Tv className="h-8 w-8" /></div>}
                  
                  <div className="absolute top-2 left-2 z-10">
                    <div className={`h-6 w-6 rounded-md flex items-center justify-center border ${isSelected ? 'bg-primary border-primary' : 'bg-black/60 border-white/20'}`}>
                      {isSelected && <CheckSquare className="h-4 w-4 text-white" />}
                    </div>
                  </div>

                  <div className="absolute top-2 right-2 flex flex-col gap-1 z-10">
                    {item.isRestricted && <Lock className="h-4 w-4 text-primary bg-black/60 p-1 rounded-full" />}
                    {!isActive && <PowerOff className="h-4 w-4 text-red-500 bg-black/60 p-1 rounded-full" />}
                  </div>
                </div>
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-[10px] uppercase truncate text-primary">{item.title}</h3>
                    <p className="text-[8px] font-bold text-muted-foreground uppercase truncate">{item.genre}</p>
                  </div>
                </div>
                <div className="flex justify-between p-2 border-t border-white/5 bg-black/20">
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-primary hover:bg-primary/10" onClick={() => setActiveEpisode({ url: item.streamUrl || "", title: item.title, id: item.id })}>
                      <PlayCircle className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" asChild className="h-8 w-8 text-blue-400 hover:bg-blue-400/10">
                      <Link href={`/admin/content/edit/${item.id}`}><Edit2 className="h-4 w-4" /></Link>
                    </Button>
                  </div>
                  <Button variant="ghost" size="icon" className="text-destructive h-8 w-8 hover:bg-destructive/10" onClick={() => handleDelete(item.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
          {items.length === 0 && !loading && <div className="col-span-full py-20 text-center opacity-30 font-black uppercase text-xs">Nenhum sinal localizado v385-S.</div>}
        </div>
      )}

      <Dialog open={!!activeEpisode} onOpenChange={() => setActiveEpisode(null)}>
        <DialogContent className="max-w-5xl bg-black border-white/10 p-0 overflow-hidden rounded-[2.5rem] shadow-2xl">
          {activeEpisode && <VideoPlayer url={activeEpisode.url} title={activeEpisode.title} id={activeEpisode.id} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}
