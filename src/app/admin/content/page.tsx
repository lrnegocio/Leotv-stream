
"use client"

import * as React from "react"
import { Plus, Search, Edit2, Trash2, Tv, Film, Lock, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { mockContent, deleteContent } from "@/lib/store"
import Link from "next/link"
import { toast } from "@/hooks/use-toast"

export default function ContentManagementPage() {
  const [searchTerm, setSearchTerm] = React.useState("")
  const [items, setItems] = React.useState(mockContent)

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir?")) {
      deleteContent(id)
      setItems(mockContent)
      toast({ title: "Excluído", description: "Conteúdo removido da biblioteca." })
    }
  }

  const filtered = items.filter(i => i.title.toLowerCase().includes(searchTerm.toLowerCase()))

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-headline">Biblioteca de Conteúdo</h1>
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
          placeholder="Buscar na biblioteca..." 
          className="pl-10 bg-card/50 border-white/5" 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {filtered.map((item) => (
          <div key={item.id} className="bg-card/50 border border-white/5 rounded-xl overflow-hidden group hover:border-primary/50 transition-all shadow-lg">
            <div className="aspect-video relative overflow-hidden">
              <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
              <div className="absolute top-2 left-2 flex gap-1">
                 <div className="bg-black/60 backdrop-blur-md p-1 rounded">
                   {item.type === 'channel' ? <Globe className="h-3 w-3 text-primary" /> : <Film className="h-3 w-3 text-secondary" />}
                 </div>
                 {item.isRestricted && (
                   <div className="bg-destructive/80 p-1 rounded">
                     <Lock className="h-3 w-3 text-white" />
                   </div>
                 )}
              </div>
            </div>
            <div className="p-4 space-y-3">
              <div>
                <h3 className="font-bold truncate">{item.title}</h3>
                <p className="text-xs text-muted-foreground">{item.genre} • {item.type.toUpperCase()}</p>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-white/5">
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/admin/content/edit/${item.id}`}><Edit2 className="h-4 w-4 mr-2" /> Editar</Link>
                </Button>
                <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(item.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
