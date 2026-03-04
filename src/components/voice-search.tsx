
"use client"

import * as React from "react"
import { Mic, Search, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { voiceSearchContent, VoiceSearchContentOutput } from "@/ai/flows/voice-search-content-flow"
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
      const result = await voiceSearchContent({ query: searchTerm })
      router.push(`/search?q=${encodeURIComponent(result.searchTerm)}&category=${result.searchCategory}`)
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Search Error",
        description: "Could not process your voice command."
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      toast({
        variant: "destructive",
        title: "Not Supported",
        description: "Speech recognition is not supported in this browser."
      })
      return
    }

    const recognition = new (window as any).webkitSpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = false
    recognition.lang = 'en-US'

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
        title: "Microphone Error",
        description: "Access to microphone was denied or failed."
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
          placeholder="Search movies, series..."
          className="pl-10 pr-10 bg-card/50 border-none focus:ring-primary"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch(query)}
        />
        {isProcessing && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-primary" />
        )}
      </div>
      <Button
        variant={isListening ? "destructive" : "secondary"}
        size="icon"
        className={`rounded-full shadow-lg transition-all-smooth ${isListening ? "animate-pulse" : ""}`}
        onClick={startListening}
      >
        <Mic className="h-4 w-4" />
      </Button>
    </div>
  )
}
