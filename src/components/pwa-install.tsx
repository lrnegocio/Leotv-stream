
"use client"

import * as React from "react"
import { Download, X, Tv } from "lucide-react"
import { Button } from "@/components/ui/button"

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

    // Detecção para Smart TV que não dispara o evento nativo
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    if (!isStandalone) {
      const timer = setTimeout(() => setIsVisible(true), 3000)
      return () => clearTimeout(timer)
    }

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
      // Fallback para TVs: Instrução visual
      alert("INSTALAÇÃO LÉO TV:\n\n1. Use o controle remoto e vá no Menu do Navegador.\n2. Clique em 'Adicionar à Tela Inicial' ou 'Instalar Aplicativo'.\n3. O app aparecerá nos seus aplicativos da Smart TV.")
    }
  }

  if (!isVisible) return null

  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-full duration-500 px-4 w-full max-w-sm">
      <div className="bg-primary border-4 border-white/20 p-5 rounded-[2.5rem] shadow-[0_0_50px_rgba(var(--primary),0.5)] flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-white/10 p-3 rounded-2xl">
            <Tv className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="text-white font-black uppercase text-[12px] italic">Instalar Léo TV</p>
            <p className="text-white/60 text-[8px] font-black uppercase tracking-widest">Acesso Direto P2P</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleInstall} className="bg-white text-primary font-black uppercase text-[10px] h-11 px-5 rounded-2xl hover:bg-white/90 shadow-lg">
            INSTALAR
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setIsVisible(false)} className="text-white hover:bg-white/10 h-10 w-10">
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  )
}
