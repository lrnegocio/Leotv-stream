
"use client"

import * as React from "react"
import { Download, X } from "lucide-react"
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

    // Fallback para TVs: Mostrar botão se não estiver em standalone
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    if (!isStandalone) {
      const timer = setTimeout(() => setIsVisible(true), 5000)
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
      }
      setDeferredPrompt(null)
    } else {
      // Instruções para TV se o prompt não for suportado
      alert("Para instalar na sua Smart TV:\n1. Clique no menu do navegador (três pontos)\n2. Selecione 'Instalar App' ou 'Adicionar à tela inicial'")
    }
  }

  if (!isVisible) return null

  return (
    <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-full duration-500 px-4 w-full max-w-md">
      <div className="bg-primary border border-white/20 p-4 rounded-3xl shadow-2xl flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-white/10 p-2 rounded-xl">
            <Download className="h-5 w-5 text-white" />
          </div>
          <div>
            <p className="text-white font-black uppercase text-[10px]">Instalar Léo Tv</p>
            <p className="text-white/60 text-[8px] font-bold uppercase">Mais rápido e sem anúncios</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={handleInstall} className="bg-white text-primary font-black uppercase text-[10px] h-9 px-4 rounded-xl hover:bg-white/90">
            INSTALAR
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setIsVisible(false)} className="text-white hover:bg-white/10 h-8 w-8">
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}
