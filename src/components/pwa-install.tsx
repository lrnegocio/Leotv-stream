
"use client"

import * as React from "react"
import { Download, X, Tv } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"

export function PwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = React.useState<any>(null)
  const [isVisible, setIsVisible] = React.useState(false)

  React.useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsVisible(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setIsVisible(false)
        setDeferredPrompt(null)
      }
    } else {
      toast({ 
        title: "INSTALAÇÃO MASTER", 
        description: "Abra o menu do seu navegador e clique em 'Instalar App' ou 'Adicionar à tela inicial'." 
      });
    }
  }

  if (!isVisible) return null

  return (
    <div className="fixed top-28 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-full duration-500 px-4 w-full max-w-sm">
      <div className="bg-primary border-4 border-white/20 p-5 rounded-[2.5rem] shadow-[0_0_50px_rgba(var(--primary),0.5)] flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-white/10 p-3 rounded-2xl"><Tv className="h-6 w-6 text-white" /></div>
          <div>
            <p className="text-white font-black uppercase text-[12px] italic">Léo TV</p>
            <p className="text-white/60 text-[8px] font-black uppercase tracking-widest">Sinal Oficial</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleInstall} className="bg-white text-primary font-black uppercase text-[10px] h-11 px-5 rounded-2xl shadow-lg">
            INSTALAR AGORA
          </Button>
          <button onClick={() => setIsVisible(false)} className="text-white/60 hover:text-white p-1"><X className="h-5 w-5" /></button>
        </div>
      </div>
    </div>
  )
}
