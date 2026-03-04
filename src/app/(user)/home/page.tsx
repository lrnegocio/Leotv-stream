
"use client"

import * as React from "react"
import Link from "next/link"
import { Tv, Play, Info, Lock, ChevronRight, Folder, FolderOpen, Search, Mic } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { VoiceSearch } from "@/components/voice-search"
import { mockContent, ContentItem } from "@/lib/store"

export default function UserHomePage() {
  const [activeGenre, setActiveGenre] = React.useState<string | null>(null)
  const [searchTerm, setSearchTerm] = React.useState("")

  const genres = Array.from(new Set(mockContent.map(c => c.genre)))
  
  const filteredContent = mockContent.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.genre.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesGenre = activeGenre ? item.genre === activeGenre : true
    return matchesSearch && matchesGenre
  })

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="fixed top-0 inset-x-0 h-16 bg-gradient-to-b from-background to-transparent z-50 flex items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link href="/home" className="flex items-center gap-2">
            <Tv className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold font-headline text-primary hidden sm:inline">Léo Tv</span>
          </Link>
          <nav className="hidden md:flex gap-6 text-sm font-medium text-muted-foreground">
            <Link href="/home" className="text-white hover:text-primary transition-colors">Início</Link>
            <Link href="/home" className="hover:text-primary transition-colors">Pastas</Link>
            <Link href="/home" className="hover:text-primary transition-colors">Canais P2P</Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <VoiceSearch />
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold border border-primary/20">U</div>
        </div>
      </header>

      <section className="relative h-[60vh] w-full flex items-end">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://picsum.photos/seed/p2p/1920/1080" 
            alt="Hero" 
            className="w-full h-full object-cover brightness-[0.4]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        </div>
        
        <div className="relative z-10 p-8 md:p-16 max-w-2xl space-y-6 animate-in slide-in-from-bottom duration-700">
          <Badge className="bg-primary text-white mb-2 uppercase tracking-widest">P2P Mestre Ultra Rápido</Badge>
          <h1 className="text-4xl md:text-6xl font-extrabold font-headline leading-tight tracking-tighter uppercase">Navegue pelas Categorias</h1>
          <p className="text-lg text-muted-foreground">Utilize o sistema de busca inteligente ou procure nas pastas abaixo.</p>
        </div>
      </section>

      <div className="px-6 md:px-16 -mt-16 relative z-20 space-y-12 pb-24">
        {/* Pastas de Categorias */}
        <section className="space-y-6">
          <h2 className="text-2xl font-bold font-headline flex items-center gap-2"><Folder className="text-primary" /> Categorias / Pastas</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            <Button 
              variant={activeGenre === null ? "default" : "secondary"} 
              className="h-20 flex flex-col items-center justify-center gap-2 rounded-xl border border-white/5"
              onClick={() => setActiveGenre(null)}
            >
              <FolderOpen className="h-6 w-6" />
              <span className="text-xs font-bold truncate">TODOS</span>
            </Button>
            {genres.map(genre => (
              <Button 
                key={genre}
                variant={activeGenre === genre ? "default" : "secondary"} 
                className="h-20 flex flex-col items-center justify-center gap-2 rounded-xl border border-white/5"
                onClick={() => setActiveGenre(genre)}
              >
                <Folder className="h-6 w-6 text-secondary" />
                <span className="text-xs font-bold truncate uppercase">{genre}</span>
              </Button>
            ))}
          </div>
        </section>

        {/* Listagem de Canais/Conteúdo */}
        <section className="space-y-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold font-headline">
              {activeGenre ? `Conteúdo em ${activeGenre}` : 'Conteúdo Recomendado'}
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {filteredContent.map((item) => (
              <Link key={item.id} href={`/watch/${item.id}`} className="group relative transition-all-smooth bg-card/50 border border-white/5 p-4 rounded-xl flex items-center gap-4 hover:bg-white/5 hover:border-primary/50">
                <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                  <Play className="h-6 w-6 fill-current" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-sm truncate uppercase tracking-tighter">{item.title}</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">{item.genre}</span>
                    {item.isRestricted && <Lock className="h-3 w-3 text-destructive" />}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
