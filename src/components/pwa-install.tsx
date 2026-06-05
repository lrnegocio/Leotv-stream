"use client"

import * as React from "react"
import { Download, Tv, X, Smartphone } from "lucide-react"
import { Button } from "@/components/ui/button"

export function PwaInstall() {
  const [showPrompt, setShowPrompt] = React.useState(false)
  const [deferredPrompt, setDeferredPrompt] = React.useState<any>(null)

  React.useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShowPrompt(true)
    }

    window.addEventListener('beforeinstallprompt', handler)

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!deferredPrompt) return
    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShowPrompt(false)
    }
    setDeferredPrompt(null)
  }

  if (!showPrompt) return null

  return (
    <div className="fixed bottom-6 left-6 right-6 md:left-auto md:right-8 md:w-80 z-[200] animate-in slide-in-from-bottom-10 duration-500">
      <div className="bg-primary p-6 rounded-[2rem] shadow-2xl border border-white/20 relative overflow-hidden">
        {/* Glow effect */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
        
        <button onClick={() => setShowPrompt(false)} className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors">
          <X className="h-4 w-4" />
        </button>

        <div className="flex flex-col items-center text-center gap-4">
          <div className="bg-white/20 p-4 rounded-3xl backdrop-blur-md">
            <Tv className="h-8 w-8 text-white" />
          </div>
          <div className="space-y-1">
            <h3 className="text-white font-black uppercase italic text-sm tracking-tight">Instalar Léo TV</h3>
            <p className="text-white/70 text-[10px] font-bold uppercase leading-tight">Tenha a melhor experiência de streaming direto na sua tela inicial!</p>
          </div>
          <Button onClick={handleInstall} className="w-full bg-white text-primary hover:bg-white/90 font-black uppercase text-[10px] h-12 rounded-2xl shadow-lg">
            INSTALAR APP AGORA
          </Button>
        </div>
      </div>
    </div>
  )
}
