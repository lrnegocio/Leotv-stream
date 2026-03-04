
"use client"

import * as React from "react"
import Link from "next/link"
import { Tv, Play, Lock, Folder, FolderOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { VoiceSearch } from "@/components/voice-search"
import { getMockContent, ContentItem } from "@/lib/store"
import { useSearchParams } from "next/navigation"

export default function UserHomePage() {
  const [activeGenre, setActiveGenre] = React.useState<string | null>(null)
  const [content, setContent] = React.useState<ContentItem[]>([])
  const searchParams = useSearchParams()
  const searchTerm = searchParams.get('q') || ""

  React.useEffect(() => {
    setContent(getMockContent())
  }, [])

  const genres = Array.from(new Set(content.map(c => c.genre)))
  
  const filteredContent = content.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.genre.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesGenre = activeGenre ? item.genre === activeGenre : true
    return matchesSearch && matchesGenre
  })

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="fixed top-0 inset-x-0 h-16 bg-card/80 backdrop-blur-md z-50 flex items-center justify-between px-6 border-b border-white/5">
        <div className="flex items-center gap-8">
          <Link href="/home" className="flex items-center gap-2">
            <Tv className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold font-headline text-primary uppercase tracking-tighter">Léo Tv</span>
          </Link>
          <nav className="hidden md:flex gap-6 text-sm font-medium text-muted-foreground uppercase tracking-widest">
            <Link href="/home" className="text-white hover:text-primary transition-colors">Início</Link>
            <Link href="/home" className="hover:text-primary transition-colors">Pastas</Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <VoiceSearch />
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold border border-primary/20">U</div>
        </div>
      </header>

      <div className="pt-24 px-6 md:px-16 space-y-12 pb-24">
        {/* Pastas de Categorias */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold font-headline flex items-center gap-2 uppercase tracking-tight">
            <Folder className="text-primary" /> Pastas de Categorias
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <Button 
              variant={activeGenre === null ? "default" : "secondary"} 
              className="h-24 flex flex-col items-center justify-center gap-2 rounded-xl border border-white/5 uppercase"
              onClick={() => setActiveGenre(null)}
            >
              <FolderOpen className="h-8 w-8" />
              <span className="text-[10px] font-bold truncate">TODOS</span>
            </Button>
            {genres.map(genre => (
              <Button 
                key={genre}
                variant={activeGenre === genre ? "default" : "secondary"} 
                className="h-24 flex flex-col items-center justify-center gap-2 rounded-xl border border-white/5 uppercase"
                onClick={() => setActiveGenre(genre)}
              >
                <Folder className="h-8 w-8 text-secondary" />
                <span className="text-[10px] font-bold truncate">{genre}</span>
              </Button>
            ))}
          </div>
        </section>

        {/* Listagem de Canais/Conteúdo */}
        <section className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold font-headline uppercase tracking-tight">
              {activeGenre ? `Conteúdo: ${activeGenre}` : 'Todos os Canais'}
            </h2>
            <Badge variant="outline" className="border-primary/20 text-primary">
              {filteredContent.length} ITENS
            </Badge>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredContent.length === 0 ? (
              <div className="col-span-full py-10 text-center">
                <p className="text-muted-foreground uppercase tracking-widest text-xs">Nenhum canal encontrado.</p>
              </div>
            ) : (
              filteredContent.map((item) => (
                <Link key={item.id} href={`/watch/${item.id}`} className="group relative transition-all-smooth bg-card/50 border border-white/5 p-5 rounded-xl flex items-center gap-4 hover:bg-white/5 hover:border-primary/50 shadow-lg">
                  <div className="h-14 w-14 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                    <Play className="h-6 w-6 fill-current" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm truncate uppercase tracking-tighter">{item.title}</h3>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{item.genre}</span>
                      {item.isRestricted && <Lock className="h-3 w-3 text-destructive" />}
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
