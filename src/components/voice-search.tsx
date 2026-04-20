"use client"

import * as React from "react"
import { Mic, Search, Loader2, X, Volume2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { voiceSearchContent } from "@/ai/flows/voice-search-content-flow"
import { toast } from "@/hooks/use-toast"
import { useRouter, useSearchParams } from "next/navigation"

/**
 * BUSCA MASTER v276 - PERFORMANCE DE VPS
 * Implementação de Debounce para evitar lag ao digitar em conexões remotas.
 */
function VoiceSearchContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [query, setQuery] = React.useState(searchParams.get('q') || "")
  const [isListening, setIsListening] = React.useState(false)
  const [isProcessing, setIsProcessing] = React.useState(false)

  const searchTimeoutRef = React.useRef<NodeJS.Timeout | null>(null)

  // Sincroniza query com a URL
  React.useEffect(() => {
    const q = searchParams.get('q') || "";
    if (q !== query) setQuery(q);
  }, [searchParams]);

  const triggerSearch = React.useCallback((value: string) => {
    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current)
    
    // DEBOUNCE: Só dispara a busca após 400ms de silêncio no teclado
    // Isso é vital para a VPS não travar as letras digitadas.
    searchTimeoutRef.current = setTimeout(() => {
      const params = new URLSearchParams(window.location.search)
      if (value) params.set('q', value)
      else params.delete('q')
      router.replace(`?${params.toString()}`, { scroll: false })
    }, 400)
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
        title: "Microfone não suportado", 
        description: "Seu navegador não possui suporte para reconhecimento de voz."
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
        title: "Escutando...", 
        description: "Fale o nome do canal ou categoria.",
        className: "bg-primary text-white font-bold uppercase"
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
    <div className="relative flex w-full max-w-2xl items-center gap-2 group">
      <div className="relative flex-1">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
        <Input
          placeholder="BUSCAR CANAL OU CATEGORIA..."
          className="pl-12 pr-12 bg-muted/50 border-border focus:border-primary rounded-2xl h-14 text-[10px] font-black uppercase tracking-widest shadow-sm transition-all"
          value={query || ""}
          onChange={handleInputChange}
        />
        {query && (
          <button 
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 opacity-40 hover:opacity-100 flex items-center justify-center hover:bg-muted rounded-full transition-all" 
            onClick={() => { setQuery(""); triggerSearch(""); }}
          >
            <X className="h-4 w-4" />
          </button>
        )}
        {isProcessing && <Loader2 className="absolute right-12 top-1/2 h-5 w-5 -translate-y-1/2 animate-spin text-primary" />}
      </div>
      <Button
        variant={isListening ? "destructive" : "secondary"}
        size="icon"
        className={`rounded-2xl h-14 w-14 shadow-md transition-all ${isListening ? "animate-pulse scale-105" : "hover:bg-primary/10"}`}
        onClick={startListening}
        title="Busca por Voz"
      >
        {isListening ? <Volume2 className="h-6 w-6 text-white" /> : <Mic className={`h-6 w-6 ${isListening ? 'text-white' : 'text-primary'}`} />}
      </Button>
    </div>
  )
}

export function VoiceSearch() {
  return (
    <React.Suspense fallback={<div className="h-14 w-full max-w-2xl bg-muted/50 rounded-2xl animate-pulse" />}>
      <VoiceSearchContent />
    </React.Suspense>
  )
}
