
"use client"

import * as React from "react"
import Link from "next/link"
import { Tv, Play, Info, Lock, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { VoiceSearch } from "@/components/voice-search"
import { mockContent } from "@/lib/store"

export default function UserHomePage() {
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Navigation */}
      <header className="fixed top-0 inset-x-0 h-16 bg-gradient-to-b from-background to-transparent z-50 flex items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <Link href="/home" className="flex items-center gap-2">
            <Tv className="h-7 w-7 text-primary" />
            <span className="text-xl font-bold font-headline text-primary hidden sm:inline">Léo Tv</span>
          </Link>
          <nav className="hidden md:flex gap-6 text-sm font-medium text-muted-foreground">
            <Link href="/home" className="text-white hover:text-primary transition-colors">Home</Link>
            <Link href="/movies" className="hover:text-primary transition-colors">Movies</Link>
            <Link href="/series" className="hover:text-primary transition-colors">Series</Link>
            <Link href="/categories" className="hover:text-primary transition-colors">Categories</Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <VoiceSearch />
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-bold border border-primary/20">U</div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative h-[85vh] w-full flex items-end">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://picsum.photos/seed/hero/1920/1080" 
            alt="Hero" 
            className="w-full h-full object-cover brightness-[0.4]"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        </div>
        
        <div className="relative z-10 p-8 md:p-16 max-w-2xl space-y-6 animate-in slide-in-from-bottom duration-700">
          <Badge className="bg-primary text-white mb-2">Editor's Choice</Badge>
          <h1 className="text-5xl md:text-7xl font-extrabold font-headline leading-tight tracking-tighter">NEON SHADOWS</h1>
          <p className="text-lg md:text-xl text-muted-foreground line-clamp-3">
            In a city that never sleeps, detective Elias Vance must navigate the dark alleys of the underground to find a missing soul that might not even be human.
          </p>
          <div className="flex gap-4 pt-4">
            <Button size="lg" className="bg-primary hover:bg-primary/90 text-lg px-8 py-6 rounded-xl shadow-lg shadow-primary/30" asChild>
              <Link href="/watch/m1">
                <Play className="mr-2 h-6 w-6 fill-current" /> Play Now
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6 rounded-xl border-white/20 bg-white/5 backdrop-blur-md">
              <Info className="mr-2 h-6 w-6" /> More Info
            </Button>
          </div>
        </div>
      </section>

      {/* Content Rows */}
      <div className="px-6 md:px-16 -mt-32 relative z-20 space-y-12 pb-24">
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold font-headline">Recently Added</h2>
            <Link href="/categories/new" className="text-sm text-primary flex items-center gap-1 hover:underline">
              View All <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {mockContent.map((item) => (
              <Link key={item.id} href={`/watch/${item.id}`} className="group relative transition-all-smooth hover:scale-105">
                <div className="aspect-[2/3] rounded-lg overflow-hidden bg-muted relative">
                  <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover transition-all duration-500 group-hover:brightness-50" />
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="bg-primary p-3 rounded-full shadow-xl">
                      <Play className="h-6 w-6 fill-current" />
                    </div>
                  </div>
                  {item.isRestricted && (
                    <div className="absolute top-2 right-2 p-1.5 bg-black/60 rounded backdrop-blur-md">
                      <Lock className="h-3 w-3 text-secondary" />
                    </div>
                  )}
                </div>
                <div className="mt-2">
                  <h3 className="font-medium text-sm line-clamp-1">{item.title}</h3>
                  <p className="text-xs text-muted-foreground">{item.genre} • {item.type === 'movie' ? '2h 14m' : 'Season 1'}</p>
                </div>
              </Link>
            ))}
            {[1, 2, 3, 4].map((i) => (
               <div key={i} className="group relative transition-all-smooth hover:scale-105 opacity-80">
                <div className="aspect-[2/3] rounded-lg overflow-hidden bg-muted relative">
                  <img src={`https://picsum.photos/seed/${i + 50}/300/450`} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="mt-2">
                  <h3 className="font-medium text-sm line-clamp-1">Mystery Road {i}</h3>
                  <p className="text-xs text-muted-foreground">Thriller • Movie</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold font-headline">Popular Series</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
               <div key={i} className="group relative overflow-hidden rounded-xl aspect-video transition-all-smooth hover:shadow-2xl hover:shadow-primary/20">
                <img src={`https://picsum.photos/seed/wide${i}/800/450`} alt="" className="w-full h-full object-cover brightness-[0.7] group-hover:scale-110 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent p-4 flex flex-col justify-end">
                   <h3 className="text-xl font-bold">Horizon Zero {i}</h3>
                   <p className="text-xs text-white/60">New Episode Out Now</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
