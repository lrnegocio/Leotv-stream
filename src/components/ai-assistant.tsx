
"use client"

import * as React from "react"
import { Sparkles, Mic, Send, X, Loader2, Volume2, VolumeX } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { adminAssistant } from "@/ai/flows/admin-assistant-flow"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "@/hooks/use-toast"
import { voiceSearchContent } from "@/ai/flows/voice-search-content-flow"
import { useRouter } from "next/navigation"

export function AiAssistant() {
  const [isOpen, setIsOpen] = React.useState(false)
  const [input, setInput] = React.useState("")
  const [messages, setMessages] = React.useState<{role: 'user' | 'model', text: string}[]>([
    { role: 'model', text: 'Olá Mestre Léo! Sou sua assistente inteligente. Como posso ajudar com sua rede ou busca de canais hoje?' }
  ])
  const [loading, setLoading] = React.useState(false)
  const [isListening, setIsListening] = React.useState(false)
  const [isSpeaking, setIsSpeaking] = React.useState(false)
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const router = useRouter()

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const handleSend = async (textOverride?: string) => {
    const text = textOverride || input
    if (!text.trim()) return

    const userMessage = { role: 'user' as const, text }
    setMessages(prev => [...prev, userMessage])
    setInput("")
    setLoading(true)

    try {
      // 1. Checar se é um comando de busca de canal
      if (text.toLowerCase().includes("assistir") || text.toLowerCase().includes("buscar") || text.toLowerCase().includes("procurar")) {
        const searchRes = await voiceSearchContent({ query: text })
        router.push(`/user/home?q=${searchRes.searchTerm}`)
        const msg = `Sintonizando agora o canal: ${searchRes.searchTerm}. Aproveite, Mestre!`
        setMessages(prev => [...prev, { role: 'model', text: msg }])
        speak(msg)
        setLoading(false)
        return
      }

      // 2. Senão, responde perguntas gerais via Gemini (Alexa Style)
      const history = messages.map(m => ({
        role: m.role,
        content: [{ text: m.text }]
      }))

      const result = await adminAssistant({ message: text, history })
      const modelMessage = { role: 'model' as const, text: result.response }
      setMessages(prev => [...prev, modelMessage])
      speak(result.response)

    } catch (error) {
      toast({ variant: "destructive", title: "Erro na IA", description: "Sinal instável, tente novamente." })
    } finally {
      setLoading(false)
    }
  }

  const speak = (text: string) => {
    if (!window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'pt-BR'
    utterance.rate = 1.1
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    window.speechSynthesis.speak(utterance)
  }

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      toast({ title: "Não suportado", description: "Seu navegador não suporta voz." })
      return
    }

    const SpeechRecognition = (window as any).webkitSpeechRecognition
    const recognition = new SpeechRecognition()
    recognition.lang = 'pt-BR'
    recognition.onstart = () => setIsListening(true)
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript
      handleSend(transcript)
    }
    recognition.onerror = () => setIsListening(false)
    recognition.onend = () => setIsListening(false)
    recognition.start()
  }

  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      {!isOpen ? (
        <Button 
          onClick={() => setIsOpen(true)}
          className="h-16 w-16 rounded-full bg-primary shadow-2xl hover:scale-110 transition-transform group border-4 border-background"
        >
          <Sparkles className="h-8 w-8 text-white group-hover:animate-pulse" />
        </Button>
      ) : (
        <Card className="w-[350px] sm:w-[400px] h-[500px] flex flex-col bg-card/90 backdrop-blur-2xl border-white/10 shadow-3xl rounded-3xl animate-in zoom-in-95 duration-300">
          <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 pb-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary p-2 rounded-xl shadow-lg shadow-primary/20">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-sm font-black uppercase italic tracking-tighter text-primary">Léo IA Assistente</CardTitle>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[8px] font-bold text-muted-foreground uppercase tracking-widest">Alexa P2P Ativa</span>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => {
              setIsOpen(false)
              window.speechSynthesis.cancel()
            }} className="rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive">
              <X className="h-5 w-5" />
            </Button>
          </CardHeader>

          <CardContent className="flex-1 p-0">
            <ScrollArea className="h-full px-4 pt-4" ref={scrollRef}>
              <div className="space-y-4 pb-4">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-3 rounded-2xl text-xs font-medium leading-relaxed shadow-sm ${
                      m.role === 'user' 
                      ? 'bg-primary text-white rounded-tr-none' 
                      : 'bg-white/5 border border-white/5 text-foreground rounded-tl-none'
                    }`}>
                      {m.text}
                    </div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-white/5 p-3 rounded-2xl rounded-tl-none border border-white/5">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>

          <CardFooter className="p-4 border-t border-white/5 gap-2">
            <Button 
              size="icon" 
              variant={isListening ? "destructive" : "secondary"} 
              className={`rounded-xl transition-all ${isListening ? 'animate-pulse scale-110' : ''}`}
              onClick={startListening}
            >
              <Mic className="h-5 w-5" />
            </Button>
            <div className="relative flex-1">
              <Input 
                placeholder="Pergunte à Léo IA..." 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                className="bg-black/20 border-white/5 rounded-xl pr-10 h-10 text-xs font-bold"
              />
              <Button 
                size="icon" 
                variant="ghost" 
                className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 text-primary hover:bg-transparent"
                onClick={() => handleSend()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
