"use client"

import * as React from "react"
import { X, Tv, ArrowDownToLine, Monitor, Smartphone, Zap, Share, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export function PwaInstall() {
  const [deferredPrompt, setDeferredPrompt] = React.useState<any>(null)
  const [isVisible, setIsVisible] = React.useState(false)
  const [showGuide, setShowGuide] = React.useState(false)
  const [isIOS, setIsIOS] = React.useState(false)
  const [isHttps, setIsHttps] = React.useState(true)

  React.useEffect(() => {
    // Verifica se estamos em HTTPS para alertar o Mestre
    if (typeof window !== 'undefined') {
      setIsHttps(window.location.protocol === 'https:')
    }

    const ua = navigator.userAgent.toLowerCase()
    const ios = /iphone|ipad|ipod/.test(ua)
    setIsIOS(ios)

    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone
    if (isStandalone) {
      setIsVisible(false)
      return
    }

    const handler = (e: any) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsVisible(true)
    }

    window.addEventListener('beforeinstallprompt', handler)
    
    // Mostra o banner após 3 segundos se não for standalone
    const timer = setTimeout(() => {
      if (!isStandalone) setIsVisible(true)
    }, 3000)

    return () => {
      window.removeEventListener('beforeinstallprompt', handler)
      clearTimeout(timer)
    }
  }, [])

  const handleInstall = async () => {
    if (isIOS) {
      setShowGuide(true)
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
      setShowGuide(true)
    }
  }

  if (!isVisible) return null

  return (
    <>
      <div className="fixed top-28 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-full duration-500 px-4 w-full max-w-sm">
        <div className="bg-primary border-4 border-white/20 p-5 rounded-[2.5rem] shadow-[0_0_50px_rgba(109,45,204,0.5)] flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="bg-white/10 p-3 rounded-2xl"><Tv className="h-6 w-6 text-white" /></div>
            <div>
              <p className="text-white font-black uppercase text-[12px] italic tracking-tighter">LÉO TV MASTER</p>
              <p className="text-white/60 text-[8px] font-black uppercase tracking-widest">{isHttps ? 'APP OFICIAL' : 'MODO ATALHO'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleInstall} className="bg-white text-primary font-black uppercase text-[10px] h-11 px-5 rounded-2xl shadow-lg hover:scale-105 transition-transform">
              <ArrowDownToLine className="h-4 w-4 mr-2" /> INSTALAR
            </Button>
            <button onClick={() => setIsVisible(false)} className="text-white/60 hover:text-white p-1"><X className="h-5 w-5" /></button>
          </div>
        </div>
        {!isHttps && (
          <div className="mt-2 bg-amber-500 text-white text-[8px] font-black uppercase py-1 px-4 rounded-full text-center shadow-lg animate-pulse">
            ⚠️ Mestre: Use um domínio com HTTPS para instalar como App Real!
          </div>
        )}
      </div>

      <Dialog open={showGuide} onOpenChange={setShowGuide}>
        <DialogContent className="max-w-2xl bg-card border-white/10 rounded-[2.5rem] p-10 shadow-2xl overflow-y-auto max-h-[90vh] custom-scroll">
          <DialogHeader>
            <DialogTitle className="uppercase font-black text-primary italic text-2xl flex items-center gap-3">
              {isIOS ? <Smartphone className="h-8 w-8" /> : <Monitor className="h-8 w-8" />} 
              {isIOS ? 'Instalar no iPhone / iPad' : 'Guia de Instalação Master'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-8 py-6">
            {!isHttps && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl flex items-center gap-3">
                <ShieldCheck className="h-6 w-6 text-destructive" />
                <p className="text-[10px] font-black uppercase text-destructive">Atenção: A instalação como "Aplicativo Real" exige o protocolo HTTPS (Cadeado).</p>
              </div>
            )}

            {isIOS ? (
              <div className="space-y-6">
                <div className="p-6 bg-primary/5 rounded-[2rem] border border-primary/20 space-y-4">
                  <p className="text-sm font-bold uppercase text-primary text-center">Siga estes passos para ter o APP REAL:</p>
                  <ol className="text-[11px] space-y-4 opacity-80 font-bold uppercase list-none">
                    <li className="flex items-start gap-4">
                      <div className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center shrink-0">1</div>
                      <p>Clique no botão de <span className="text-primary flex items-center gap-1 inline-flex"><Share className="h-4 w-4" /> Compartilhar</span> na barra de baixo do Safari.</p>
                    </li>
                    <li className="flex items-start gap-4">
                      <div className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center shrink-0">2</div>
                      <p>Role as opções para cima e clique em <span className="text-primary">"Adicionar à Tela de Início"</span>.</p>
                    </li>
                    <li className="flex items-start gap-4">
                      <div className="bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center shrink-0">3</div>
                      <p>Clique em <span className="text-primary">"Adicionar"</span> no canto superior direito.</p>
                    </li>
                  </ol>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="p-6 bg-emerald-500/10 rounded-[2rem] border border-emerald-500/20 space-y-4">
                   <div className="flex items-center gap-3 text-emerald-500 font-black uppercase text-sm">
                     <Zap className="h-5 w-5" /> ANDROID & WINDOWS
                   </div>
                   <p className="text-[11px] font-bold uppercase opacity-80 leading-relaxed">
                     Clique no botão de instalação que apareceu no topo da sua tela. 
                     <br /><br />
                     Se o botão sumiu, clique nos <span className="text-emerald-500">3 pontinhos</span> do seu navegador e escolha <span className="text-emerald-500">"Instalar Aplicativo"</span>.
                   </p>
                </div>
              </div>
            )}

            <Button onClick={() => setShowGuide(false)} className="w-full h-16 bg-primary font-black uppercase text-lg rounded-2xl shadow-xl shadow-primary/20">ENTENDI TUDO, MESTRE!</Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
