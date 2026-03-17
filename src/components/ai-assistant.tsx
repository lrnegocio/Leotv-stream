
"use client"

import * as React from "react"
import { Sparkles, Mic, Send, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { adminAssistant } from "@/ai/flows/admin-assistant-flow"
import { voiceSearchContent } from "@/ai/flows/voice-search-content-flow"
import { ScrollArea } from "@/components/ui/scroll-area"
import { toast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

export function AiAssistant() {
  const [isOpen, setIsOpen] = React.useState(false)
  const [input, setInput] = React.useState("")
  const [messages, setMessages] = React.useState<{role: 'user' | 'model', text: string}[]>([
    { role: 'model', text: 'Oi Mestre Léo! Léo IA ativa. O que vamos assistir?' }
  ])
  const [loading, setLoading] = React.useState(false)
  const [isListening, setIsListening] = React.useState(false)
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const router = useRouter()

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages])

  const speak = (text: string) => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'pt-BR'
    utterance.rate = 1.1
    utterance.pitch = 1.0
    window.speechSynthesis.speak(utterance)
  }

  const handleSend = async (textOverride?: string) => {
    const text = textOverride || input
    if (!text.trim()) return

    setMessages(prev => [...prev, { role: 'user', text }])
    setInput("")
    setLoading(true)

    try {
      const lower = text.toLowerCase()
      
      // Busca Inteligente Master via Voz
      if (lower.includes("assistir") || lower.includes("buscar") || lower.includes("canal") || lower.includes("abrir") || lower.includes("procurar")) {
        try {
          const searchRes = await voiceSearchContent({ query: text })
          const urlParams = new URLSearchParams(window.location.search);
          urlParams.set('q', searchRes.searchTerm);
          router.replace(`${window.location.pathname}?${urlParams.toString()}`, { scroll: false });
          
          const msg = `Certo, Mestre! Sintonizando agora: ${searchRes.searchTerm}.`
          setMessages(prev => [...prev, { role: 'model', text: msg }])
          speak(msg)
          setLoading(false)
          return
        } catch (e) {
          const urlParams = new URLSearchParams(window.location.search);
          urlParams.set('q', text);
          router.replace(`${window.location.pathname}?${urlParams.toString()}`, { scroll: false });
          
          const msg = `Buscando sinal de ${text} para você.`
          setMessages(prev => [...prev, { role: 'model', text: msg }])
          speak(msg)
          setLoading(false)
          return
        }
      }

      const history = messages.map(m => ({
        role: m.role,
        content: [{ text: m.text }]
      }))

      const result = await adminAssistant({ message: text, history })
      setMessages(prev => [...prev, { role: 'model', text: result.response }])
      speak(result.response)

    } catch (error) {
      setMessages(prev => [...prev, { role: 'model', text: "Sinal instável. Pode repetir o comando, Mestre?" }])
    } finally {
      setLoading(false)
    }
  }

  const startListening = () => {
    if (!('webkitSpeechRecognition' in window)) {
      toast({ variant: "destructive", title: "Não suportado", description: "Use o Google Chrome." })
      return
    }

    const recognition = new (window as any).webkitSpeechRecognition()
    recognition.lang = 'pt-BR'
    recognition.continuous = false
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
    <div className="fixed bottom-8 right-8 z-[100]">
      {!isOpen ? (
        <Button onClick={() => setIsOpen(true)} className="h-16 w-16 rounded-full bg-primary shadow-[0_0_30px_rgba(var(--primary),0.4)] hover:scale-110 transition-transform border-4 border-background overflow-hidden relative group">
          <div className="absolute inset-0 bg-primary animate-pulse opacity-20" />
          <Sparkles className="h-8 w-8 text-white relative z-10" />
        </Button>
      ) : (
        <Card className="w-[380px] h-[550px] flex flex-col bg-card/95 backdrop-blur-3xl border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] rounded-[2rem] animate-in zoom-in-95 duration-300">
          <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 pb-6">
            <div className="flex items-center gap-4">
              <div className="bg-primary p-2.5 rounded-2xl shadow-xl shadow-primary/20"><Sparkles className="h-5 w-5 text-white" /></div>
              <div>
                <CardTitle className="text-sm font-black uppercase italic text-primary tracking-tighter">Léo IA Assistente</CardTitle>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">Sinal Master Ativo</span>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/5" onClick={() => { setIsOpen(false); window.speechSynthesis?.cancel(); }}>
              <X className="h-5 w-5" />
            </Button>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden">
            <ScrollArea className="h-full px-5 pt-5" ref={scrollRef}>
              <div className="space-y-5 pb-5">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-4 rounded-3xl text-[12px] font-bold leading-relaxed shadow-lg ${
                      m.role === 'user' ? 'bg-primary text-white rounded-tr-none' : 'bg-white/5 border border-white/5 text-foreground rounded-tl-none'
                    }`}>{m.text}</div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-white/5 p-4 rounded-3xl border border-white/5 flex gap-2 items-center">
                      <div className="flex gap-1.5">
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.2s]" />
                        <div className="w-2 h-2 bg-primary rounded-full animate-bounce [animation-delay:0.4s]" />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
          <CardFooter className="p-5 border-t border-white/5 gap-3">
            <Button size="icon" variant={isListening ? "destructive" : "secondary"} className={`rounded-2xl h-12 w-12 transition-all shadow-xl ${isListening ? 'animate-pulse scale-110 shadow-destructive/30' : 'hover:bg-primary/10'}`} onClick={startListening}>
              <Mic className={`h-6 w-6 ${isListening ? 'text-white' : 'text-primary'}`} />
            </Button>
            <div className="relative flex-1">
              <Input placeholder="Fale com a Léo IA..." value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} className="bg-black/40 border-white/5 rounded-2xl pr-12 h-12 text-xs font-bold" />
              <Button size="icon" variant="ghost" className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 text-primary hover:bg-transparent" onClick={() => handleSend()}>
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}
