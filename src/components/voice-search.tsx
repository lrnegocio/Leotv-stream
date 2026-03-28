
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
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      toast({ 
        variant: "destructive", 
        title: "Microfone não suportado", 
        description: "Certifique-se de estar usando Chrome ou Android TV.",
        className: "bg-destructive text-white rounded-2xl border-none font-bold uppercase text-[10px]"
      })
      return
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = false;
    recognition.interimResults = false;

    // Configuração de sensibilidade para Smart TVs
    recognition.onstart = () => {
      setIsListening(true)
      toast({ 
        title: "Pode falar...", 
        description: "O sinal de voz Léo Tv está ativo.",
        className: "bg-primary text-white rounded-2xl border-none font-bold uppercase text-[10px]"
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

    recognition.onerror = (event: any) => {
      setIsListening(false)
      console.error("Erro no microfone:", event.error);
      if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
        toast({ variant: "destructive", title: "ACESSO NEGADO", description: "Ative o microfone nas configurações da sua TV ou navegador." })
      }
    }

    recognition.onend = () => setIsListening(false)
    
    try {
      recognition.start()
    } catch (e) {
      setIsListening(false)
    }
  }

  return (
    <div className="relative flex w-full max-w-md items-center gap-3 group">
      <div className="relative flex-1">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
        <Input
          placeholder="Busca por voz ou texto..."
          className="pl-12 pr-12 bg-black/40 border-white/5 focus:ring-primary rounded-2xl h-14 text-xs font-bold uppercase tracking-widest shadow-2xl"
          value={query || ""}
          onChange={handleInputChange}
        />
        {query && (
          <button 
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 opacity-50 hover:opacity-100 flex items-center justify-center" 
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
        className={`rounded-2xl h-14 w-14 border-2 border-white/5 shadow-2xl transition-all ${isListening ? "animate-pulse scale-110 bg-destructive text-white border-white/20" : "hover:bg-primary/10 hover:border-primary/20"}`}
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
    <React.Suspense fallback={<div className="h-14 w-full max-w-md bg-white/5 rounded-2xl animate-pulse" />}>
      <VoiceSearchContent />
    </React.Suspense>
  )
}
