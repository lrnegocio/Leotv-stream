
"use client"

import * as React from "react"
import { Plus, Search, Edit2, Trash2, Tv, Lock, PlayCircle, Loader2, RefreshCcw, HardDriveDownload, PowerOff, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getRemoteContent, removeContent, bulkRemoveContent, bulkUpdateContent, ContentItem } from "@/lib/store"
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
  const [errorDb, setErrorDb] = React.useState<string | null>(null)
  const [previewItem, setPreviewItem] = React.useState<ContentItem | null>(null)
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
      toast({ variant: "destructive", title: "Sinal do Banco Perdido", description: "Verifique se o seu Supabase está ATIVO." })
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
    toast({ title: "BACKUP SALVO!", description: "Sua lista de canais está segura." });
  }

  const handleDelete = async (id: string) => {
    if (confirm("Mestre, excluir este sinal da rede?")) {
      if (await removeContent(id)) {
        setItems(prev => prev.filter(i => i.id !== id))
        toast({ title: "SINAL EXTERMINADO" })
      }
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black font-headline uppercase italic text-primary">Biblioteca v370-S</h1>
          <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-widest">Gestão Total de Canais e VOD.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button onClick={handleDownloadBackup} variant="outline" className="h-10 px-4 rounded-xl border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10 text-[9px] font-black uppercase">
            <HardDriveDownload className="mr-2 h-3 w-3" /> Exportar Biblioteca
          </Button>
          <Button onClick={() => loadItems(searchTerm)} variant="outline" className="h-10 w-10 rounded-xl border-primary/20">
            <RefreshCcw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
          <Button asChild className="bg-primary h-10 px-6 rounded-xl text-[9px] font-black uppercase shadow-lg shadow-primary/20">
            <Link href="/admin/content/new"><Plus className="mr-2 h-4 w-4" /> Novo Conteúdo</Link>
          </Button>
        </div>
      </div>

      {errorDb && (
        <div className="bg-destructive/10 border-2 border-destructive/20 p-6 rounded-[2rem] flex items-center gap-6 animate-in slide-in-from-top-4 shadow-xl">
           <AlertTriangle className="h-6 w-6 text-destructive" />
           <div className="flex-1">
              <p className="text-[10px] font-black uppercase text-destructive tracking-widest mb-1">Banco de Dados Offline</p>
              <p className="text-sm font-bold">Mestre, o Supabase bloqueou o sinal ou está pausado. Retome o projeto para ver os canais.</p>
           </div>
           <Button variant="outline" className="border-destructive/30 text-destructive font-black text-[9px] uppercase h-10 px-4 rounded-xl" asChild>
             <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer">Ir para o Supabase</a>
           </Button>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="BUSCAR SINAL NO BANCO..." className="pl-12 bg-card/50 border-white/5 h-12 rounded-xl text-xs uppercase font-bold" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4"><Loader2 className="h-10 w-10 animate-spin text-primary" /><p className="text-[10px] font-black uppercase opacity-40">Sincronizando v370-S...</p></div>
      ) : (
        <div className="grid gap-4 grid-cols-2 md:grid-cols-4 lg:grid-cols-6">
          {items.map((item) => {
            const isActive = item.isActive !== false;
            return (
              <div key={item.id} className={`bg-card border border-white/5 rounded-xl overflow-hidden relative group transition-all flex flex-col shadow-lg ${!isActive ? 'opacity-50 grayscale' : ''}`}>
                <div className="aspect-[2/3] relative bg-black/40">
                  {item.imageUrl ? <Image src={item.imageUrl} alt={item.title} fill className="object-cover" unoptimized /> : <div className="flex items-center justify-center h-full opacity-20"><Tv className="h-8 w-8" /></div>}
                  <div className="absolute top-3 right-3 flex flex-col gap-1">
                    {item.isRestricted && <Lock className="h-4 w-4 text-primary bg-black/60 p-1 rounded-full" />}
                    {!isActive && <PowerOff className="h-4 w-4 text-red-500 bg-black/60 p-1 rounded-full" />}
                  </div>
                </div>
                <div className="p-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-[10px] uppercase truncate text-primary">{item.title}</h3>
                    <p className="text-[8px] font-bold text-muted-foreground uppercase truncate">{item.genre}</p>
                  </div>
                  <span className={`text-[7px] font-black px-2 py-0.5 rounded-full w-fit mt-2 ${isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'}`}>
                    {isActive ? 'ATIVO' : 'OFFLINE'}
                  </span>
                </div>
                <div className="flex justify-between p-2 border-t border-white/5 bg-black/20">
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                      if (item.type === 'series' || item.type === 'multi-season') setPreviewItem(item);
                      else setActiveEpisode({ url: item.streamUrl || "", title: item.title, id: item.id });
                    }}><PlayCircle className="h-3 w-3" /></Button>
                    <Button variant="ghost" size="icon" asChild className="h-7 w-7"><Link href={`/admin/content/edit/${item.id}`}><Edit2 className="h-3 w-3" /></Link></Button>
                  </div>
                  <Button variant="ghost" size="icon" className="text-destructive h-7 w-7 hover:bg-destructive/10" onClick={() => handleDelete(item.id)}><Trash2 className="h-3 w-3" /></Button>
                </div>
              </div>
            );
          })}
          {items.length === 0 && !loading && <div className="col-span-full py-20 text-center opacity-30 font-black uppercase text-xs">Nenhum sinal localizado v370-S.</div>}
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
