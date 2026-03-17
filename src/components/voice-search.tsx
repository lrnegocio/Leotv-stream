"use client"

import * as React from "react"
import { Mic, Search, Loader2, X } from "lucide-react"
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

  // Sincroniza o estado local com a URL
  React.useEffect(() => {
    setQuery(searchParams.get('q') || "")
  }, [searchParams])

  // Busca em tempo real "Live Search"
  const triggerSearch = React.useCallback((value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set('q', value)
    } else {
      params.delete('q')
    }
    router.replace(`?${params.toString()}`, { scroll: false })
  }, [router, searchParams])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    triggerSearch(val)
  }

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      toast({ variant: "destructive", title: "Não suportado", description: "Use o Chrome para voz." })
      return
    }

    const recognition = new (window as any).webkitSpeechRecognition()
    recognition.lang = 'pt-BR'
    recognition.onstart = () => setIsListening(true)
    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript
      setQuery(transcript)
      setIsProcessing(true)
      try {
        const result = await voiceSearchContent({ query: transcript })
        triggerSearch(result.searchTerm)
        toast({ title: "Sinal Sintonizado", description: `Buscando por: ${result.searchTerm}` })
      } catch (e) {
        triggerSearch(transcript)
      } finally {
        setIsProcessing(false)
      }
    }
    recognition.onerror = () => setIsListening(false)
    recognition.onend = () => setIsListening(false)
    recognition.start()
  }

  return (
    <div className="relative flex w-full max-w-md items-center gap-2 group">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors" />
        <Input
          placeholder="Busque canais..."
          className="pl-10 pr-10 bg-card/50 border-white/5 focus:ring-primary rounded-xl h-10 text-[10px] font-bold uppercase tracking-widest"
          value={query}
          onChange={handleInputChange}
        />
        {query && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 opacity-50 hover:opacity-100" 
            onClick={() => {
              setQuery("")
              triggerSearch("")
            }}
          >
            <X className="h-3 w-3" />
          </Button>
        )}
        {isProcessing && (
          <Loader2 className="absolute right-10 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-primary" />
        )}
      </div>
      <Button
        variant={isListening ? "destructive" : "secondary"}
        size="icon"
        className={`rounded-xl shadow-lg transition-all h-10 w-10 border border-white/5 ${isListening ? "animate-pulse scale-110 shadow-destructive/20" : "hover:bg-primary/10"}`}
        onClick={startListening}
      >
        <Mic className={`h-5 w-5 ${isListening ? "text-white" : "text-primary"}`} />
      </Button>
    </div>
  )
}

export function VoiceSearch() {
  return (
    <React.Suspense fallback={<div className="h-10 w-full max-w-md bg-white/5 rounded-xl animate-pulse" />}>
      <VoiceSearchContent />
    </React.Suspense>
  )
}
