
"use client"

import * as React from "react"
import { Mic, Search, Loader2, X, Volume2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { voiceSearchContent } from "@/ai/flows/voice-search-content-flow"
import { toast } from "@/hooks/use-toast"
import { useRouter, useSearchParams } from "next/navigation"

function VoiceSearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [query, setQuery] = React.useState(searchParams.get('q') || "")
  const [isListening, setIsListening] = React.useState(false)
  const [isProcessing, setIsProcessing] = React.useState(false)

  const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  React.useEffect(() => {
    setQuery(searchParams.get('q') || "")
  }, [searchParams])

  const triggerSearch = React.useCallback((value: string) => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    
    searchTimeoutRef.current = setTimeout(() => {
      const params = new URLSearchParams(window.location.search)
      if (value) params.set('q', value)
      else params.delete('q')
      router.replace(`?${params.toString()}`, { scroll: false })
    }, 100)
  }, [router])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    triggerSearch(val)
  }

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      toast({ 
        variant: "destructive", 
        title: "Dispositivo não suportado", 
        description: "Use o Google Chrome ou Android TV para comandos de voz."
      })
      return
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      setIsListening(true)
      toast({ 
        title: "Microfone Master Ativo", 
        description: "Fale o canal ou a categoria, Mestre.",
        className: "bg-primary text-white font-black uppercase italic"
      })
    }

    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript
      setQuery(transcript)
      setIsProcessing(true)
      try {
        const result = await voiceSearchContent({ query: transcript })
        triggerSearch(result.searchTerm)
      } catch (e) {
        triggerSearch(transcript)
      } finally {
        setIsProcessing(false)
      }
    }

    recognition.onerror = () => setIsListening(false)
    recognition.onend = () => setIsListening(false)
    
    try {
      recognition.start()
    } catch (e) {
      setIsListening(false)
    }
  }

  return (
    <div className="relative flex w-full max-w-2xl items-center gap-3 group">
      <div className="relative flex-1">
        <Search className="absolute left-5 top-1/2 h-6 w-6 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
        <Input
          placeholder="BUSCAR CANAL OU CATEGORIA..."
          className="pl-14 pr-14 bg-black/60 border-white/10 focus:border-primary rounded-3xl h-16 text-sm font-black uppercase tracking-[0.1em] shadow-2xl transition-all"
          value={query || ""}
          onChange={handleInputChange}
        />
        {query && (
          <button 
            type="button"
            className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 opacity-40 hover:opacity-100 flex items-center justify-center hover:bg-white/5 rounded-full transition-all" 
            onClick={() => { setQuery(""); triggerSearch(""); }}
          >
            <X className="h-5 w-5" />
          </button>
        )}
        {isProcessing && <Loader2 className="absolute right-14 top-1/2 h-6 w-6 -translate-y-1/2 animate-spin text-primary" />}
      </div>
      <Button
        variant={isListening ? "destructive" : "secondary"}
        size="icon"
        className={`rounded-full h-16 w-16 border-4 border-white/5 shadow-2xl transition-all ${isListening ? "animate-pulse scale-110 bg-destructive text-white" : "hover:bg-primary/20 bg-white/5"}`}
        onClick={startListening}
        title="Busca por Voz Master"
      >
        {isListening ? <Volume2 className="h-8 w-8 text-white" /> : <Mic className={`h-8 w-8 ${isListening ? 'text-white' : 'text-primary'}`} />}
      </Button>
    </div>
  )
}

export function VoiceSearch() {
  return (
    <React.Suspense fallback={<div className="h-16 w-full max-w-2xl bg-white/5 rounded-3xl animate-pulse" />}>
      <VoiceSearchContent />
    </React.Suspense>
  )
}
