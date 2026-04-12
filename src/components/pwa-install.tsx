"use client"

import * as React from "react"
import { X, Tv, ArrowDownToLine, Monitor, Smartphone, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export function PwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = React.useState<any>(null)
  const [isVisible, setIsVisible] = React.useState(false)
  const [showTVGuide, setShowTVGuide] = React.useState(false)

  React.useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsVisible(true)
    }
    window.addEventListener('beforeinstallprompt', handler)
    
    // Verificação de Smart TV simples
    const ua = navigator.userAgent.toLowerCase()
    if (ua.includes('tizen') || ua.includes('webos') || ua.includes('smart-tv') || ua.includes('roku')) {
      setIsVisible(true)
    }

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    const ua = navigator.userAgent.toLowerCase()
    const isTV = ua.includes('tizen') || ua.includes('webos') || ua.includes('smart-tv') || ua.includes('roku')

    if (isTV) {
      setShowTVGuide(true)
      return
    }

    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        setIsVisible(false)
        setDeferredPrompt(null)
      }
    } else {
      toast({ 
        title: "INSTALAÇÃO DIRETA", 
        description: "Mestre, no menu do seu navegador, selecione 'Instalar Aplicativo' ou 'Adicionar à Tela Inicial'." 
      });
    }
  }

  if (!isVisible) return null

  return (
    <>
      <div className="fixed top-28 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-full duration-500 px-4 w-full max-w-sm">
        <div className="bg-primary border-4 border-white/20 p-5 rounded-[2.5rem] shadow-[0_0_50px_rgba(var(--primary),0.5)] flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-white/10 p-3 rounded-2xl"><Tv className="h-6 w-6 text-white" /></div>
            <div>
              <p className="text-white font-black uppercase text-[12px] italic tracking-tighter">LÉO TV MASTER</p>
              <p className="text-white/60 text-[8px] font-black uppercase tracking-widest">SINAL OFICIAL</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleInstall} className="bg-white text-primary font-black uppercase text-[10px] h-11 px-5 rounded-2xl shadow-lg hover:scale-105 transition-transform">
              <ArrowDownToLine className="h-4 w-4 mr-2" /> INSTALAR
            </Button>
            <button onClick={() => setIsVisible(false)} className="text-white/60 hover:text-white p-1"><X className="h-5 w-5" /></button>
          </div>
        </div>
      </div>

      <Dialog open={showTVGuide} onOpenChange={setShowTVGuide}>
        <DialogContent className="max-w-md bg-card border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="uppercase font-black text-primary italic text-xl flex items-center gap-2">
              <Monitor className="h-6 w-6" /> Instalar na Smart TV
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="p-4 bg-muted rounded-2xl border border-border">
              <p className="text-xs font-bold uppercase text-primary mb-2">Para Samsung (Tizen) e LG (webOS):</p>
              <ol className="text-[10px] space-y-2 opacity-80 list-decimal pl-4 font-bold uppercase">
                <li>Abra o navegador da TV e acesse este site.</li>
                <li>Clique no ícone de 3 pontos ou "Menu" no topo.</li>
                <li>Selecione "Adicionar à Tela Inicial" ou "Fixar no Menu".</li>
                <li>O Léo TV agora aparecerá junto com seus Apps (Netflix, YouTube).</li>
              </ol>
            </div>
            <div className="p-4 bg-muted rounded-2xl border border-border">
              <p className="text-xs font-bold uppercase text-emerald-500 mb-2">Para Android TV e Roku:</p>
              <p className="text-[10px] font-bold uppercase opacity-80">No Android TV, use o Google Chrome para instalar diretamente. No Roku, adicione este link como um "Favorito" no navegador.</p>
            </div>
            <Button onClick={() => setShowTVGuide(false)} className="w-full h-14 bg-primary font-black uppercase rounded-xl">ENTENDI, MESTRE!</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}