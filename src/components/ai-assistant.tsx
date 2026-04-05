"use client"

import * as React from "react"
import { Sparkles, Mic, Send, X, Loader2, Cpu } from "lucide-react"
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
  const [messages, setMessages] = React.useState<{role: 'user' | 'model', text: string}[]>([])
  const [loading, setLoading] = React.useState(false)
  const [isListening, setIsListening] = React.useState(false)
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const router = useRouter()

  React.useEffect(() => {
    const session = localStorage.getItem("user_session");
    const user = session ? JSON.parse(session) : null;
    const initialText = user?.role === 'admin' 
      ? 'Olá Administrador StreamSight. Sistema de IA ativo. Como posso auxiliar na gestão da rede hoje?' 
      : 'Olá! Sou seu assistente StreamSight. O que você gostaria de assistir hoje? Pode falar o nome do canal ou filme!';
    
    setMessages([{ role: 'model', text: initialText }]);
  }, []);

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
      
      if (lower.includes("assistir") || lower.includes("buscar") || lower.includes("canal") || lower.includes("abrir") || lower.includes("procurar") || lower.length < 20) {
        try {
          const searchRes = await voiceSearchContent({ query: text })
          const urlParams = new URLSearchParams(window.location.search);
          urlParams.set('q', searchRes.searchTerm);
          router.replace(`${window.location.pathname}?${urlParams.toString()}`, { scroll: false });
          
          const msg = `Entendido. Iniciando busca por: ${searchRes.searchTerm} na biblioteca.`
          setMessages(prev => [...prev, { role: 'model', text: msg }])
          speak(msg)
          setLoading(false)
          return
        } catch (e) {
          const urlParams = new URLSearchParams(window.location.search);
          urlParams.set('q', text);
          router.replace(`${window.location.pathname}?${urlParams.toString()}`, { scroll: false });
          
          const msg = `Buscando por ${text}.`
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
      setMessages(prev => [...prev, { role: 'model', text: "Houve um erro na conexão com a inteligência artificial. Pode repetir?" }])
    } finally {
      setLoading(false)
    }
  }

  const startListening = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ variant: "destructive", title: "Não suportado", description: "Use o Google Chrome para comandos de voz." })
      return
    }

    const recognition = new SpeechRecognition();
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
        <Button onClick={() => setIsOpen(true)} className="h-16 w-16 rounded-3xl bg-primary shadow-xl shadow-primary/20 hover:scale-110 transition-transform border-4 border-background overflow-hidden relative group">
          <Sparkles className="h-8 w-8 text-white relative z-10" />
        </Button>
      ) : (
        <Card className="w-[380px] h-[550px] flex flex-col bg-card border-border shadow-2xl rounded-[2.5rem] animate-in zoom-in-95 duration-300 overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border pb-6 pt-8 px-6">
            <div className="flex items-center gap-4">
              <div className="bg-primary/10 p-2.5 rounded-2xl"><Cpu className="h-5 w-5 text-primary" /></div>
              <div>
                <CardTitle className="text-sm font-black uppercase italic text-primary tracking-tight">StreamSight IA</CardTitle>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                  <span className="text-[8px] font-black text-muted-foreground uppercase tracking-widest">IA Conectada</span>
                </div>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-muted" onClick={() => { setIsOpen(false); window.speechSynthesis?.cancel(); }}>
              <X className="h-5 w-5" />
            </Button>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden bg-muted/30">
            <ScrollArea className="h-full px-5 pt-5" ref={scrollRef}>
              <div className="space-y-5 pb-5">
                {messages.map((m, i) => (
                  <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[85%] p-4 rounded-3xl text-[12px] font-medium leading-relaxed shadow-sm ${
                      m.role === 'user' ? 'bg-primary text-white rounded-tr-none' : 'bg-card border border-border text-foreground rounded-tl-none'
                    }`}>{m.text}</div>
                  </div>
                ))}
                {loading && (
                  <div className="flex justify-start">
                    <div className="bg-card p-4 rounded-3xl border border-border flex gap-2 items-center">
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
          <CardFooter className="p-5 border-t border-border gap-3 bg-card">
            <Button size="icon" variant={isListening ? "destructive" : "secondary"} className={`rounded-2xl h-12 w-12 transition-all ${isListening ? 'animate-pulse scale-110' : 'hover:bg-primary/10'}`} onClick={startListening}>
              <Mic className={`h-6 w-6 ${isListening ? 'text-white' : 'text-primary'}`} />
            </Button>
            <div className="relative flex-1">
              <Input placeholder="Qual canal deseja ver?" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} className="bg-muted border-border rounded-2xl pr-12 h-12 text-xs font-bold" />
              <Button size="icon" variant="ghost" className="absolute right-1 top-1/2 -translate-y-1/2 h-10 w-10 text-primary hover:bg-transparent" onClick={() => handleSend()}>
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </CardFooter>
        </Card>
      )}
    </div>
  )
}