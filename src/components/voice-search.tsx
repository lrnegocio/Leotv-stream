
"use client"

import * as React from "react"
import { Mic, Search, Loader2, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { voiceSearchContent } from "@/ai/flows/voice-search-content-flow"
import { toast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export function VoiceSearch() {
  const [query, setQuery] = React.useState("")
  const [isListening, setIsListening] = React.useState(false)
  const [isProcessing, setIsProcessing] = React.useState(false)
  const router = useRouter()

  const handleSearch = async (searchTerm: string) => {
    if (!searchTerm) return
    setIsProcessing(true)
    try {
      // O fluxo da IA ajuda a entender se é uma categoria ou nome
      const result = await voiceSearchContent({ query: searchTerm })
      // Redireciona para home com os filtros já pensados
      router.push(`/home?q=${encodeURIComponent(result.searchTerm)}`)
      toast({ title: "Busca Inteligente", description: `Encontrando: ${result.searchTerm}` })
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro na Busca",
        description: "Não foi possível processar o comando de voz."
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      toast({
        variant: "destructive",
        title: "Não Suportado",
        description: "Reconhecimento de voz não disponível neste navegador."
      })
      return
    }

    const recognition = new (window as any).webkitSpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'pt-BR' // Configurado para Português

    recognition.onstart = () => setIsListening(true)
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      setQuery(transcript)
      handleSearch(transcript)
    }
    recognition.onerror = () => {
      setIsListening(false)
      toast({
        variant: "destructive",
        title: "Erro de Microfone",
        description: "Acesso negado ou falhou."
      })
    }
    recognition.onend = () => setIsListening(false)

    recognition.start()
  }

  return (
    <div className="relative flex w-full max-w-md items-center gap-2">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Busque canais, pastas ou filmes..."
          className="pl-10 pr-10 bg-card/50 border-white/5 focus:ring-primary rounded-xl"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
        />
        {query && (
          <Button variant="ghost" size="icon" className="absolute right-10 top-1/2 -translate-y-1/2 h-6 w-6" onClick={() => setQuery("")}>
            <X className="h-3 w-3" />
          </Button>
        )}
        {isProcessing && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-primary" />
        )}
      </div>
      <Button
        variant={isListening ? "destructive" : "secondary"}
        size="icon"
        className={`rounded-xl shadow-lg transition-all-smooth h-10 w-10 ${isListening ? "animate-pulse" : ""}`}
        onClick={startListening}
      >
        <Mic className="h-5 w-5" />
      </Button>
    </div>
  )
}
