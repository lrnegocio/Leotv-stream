
"use client"

import * as React from "react"
import { X, Tv, ArrowDownToLine, Monitor, Smartphone, Settings, ShieldCheck, Zap } from "lucide-react"
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
        <DialogContent className="max-w-2xl bg-card border-white/10 rounded-[2.5rem] p-10 shadow-2xl overflow-y-auto max-h-[90vh] custom-scroll">
          <DialogHeader>
            <DialogTitle className="uppercase font-black text-primary italic text-2xl flex items-center gap-3">
              <Monitor className="h-8 w-8" /> Guia de Sistemas Léo TV
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-8 py-6">
            
            <div className="p-6 bg-primary/5 rounded-[2rem] border border-primary/20 space-y-4">
              <div className="flex items-center gap-3 text-primary font-black uppercase text-sm">
                <ShieldCheck className="h-5 w-5" /> 1. O SEGREDO DO BRAVE (BLOQUEIO TOTAL)
              </div>
              <p className="text-[11px] font-bold uppercase opacity-80 leading-relaxed">
                O Navegador Brave só pode ser instalado em:
                <br /><span className="text-primary">• ANDROID TV (Sony, TCL, Philips)</span>
                <br /><span className="text-primary">• FIRE TV STICK (Amazon)</span>
                <br /><span className="text-primary">• TV BOXES ANDROID</span>
                <br /><br />
                <span className="text-emerald-500">DICA MESTRE:</span> Se a sua TV for Samsung ou LG, nosso sistema já vem com um "Bloqueador Brave" interno (CSS) que mata os anúncios no navegador padrão da TV!
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-5 bg-muted rounded-2xl border border-border">
                <p className="text-xs font-black uppercase text-primary mb-3">SAMSUNG & LG</p>
                <ol className="text-[10px] space-y-2 opacity-80 list-decimal pl-4 font-bold uppercase">
                  <li>Abra o Navegador da TV.</li>
                  <li>Acesse o link do painel.</li>
                  <li>Menu > "Fixar na Home".</li>
                  <li>Use o sinal livre de abas!</li>
                </ol>
              </div>
              <div className="p-5 bg-muted rounded-2xl border border-border">
                <p className="text-xs font-black uppercase text-orange-500 mb-3">ROKU & OUTRAS</p>
                <p className="text-[10px] font-bold uppercase opacity-80">
                  O sistema Roku não permite instalação de navegadores. 
                  <br /><br />
                  <span className="text-primary">SOLUÇÃO:</span> Use o espelhamento de tela (Cast) do seu celular ou conecte um Fire Stick para ter o sinal Master.
                </p>
              </div>
            </div>

            <div className="p-6 bg-emerald-500/10 rounded-[2rem] border border-emerald-500/20">
               <div className="flex items-center gap-3 text-emerald-500 font-black uppercase text-sm mb-2">
                 <Zap className="h-5 w-5" /> RECOMENDAÇÃO DO MESTRE
               </div>
               <p className="text-[10px] font-bold uppercase opacity-80">
                 Para a melhor experiência sem travamentos e com 100% de bloqueio de anúncios, utilize uma **TV BOX ANDROID** ou **FIRE STICK** e instale o navegador Brave por lá.
               </p>
            </div>

            <Button onClick={() => setShowTVGuide(false)} className="w-full h-16 bg-primary font-black uppercase text-lg rounded-2xl shadow-xl shadow-primary/20">ENTENDI TUDO, MESTRE!</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
