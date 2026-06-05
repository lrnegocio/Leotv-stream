"use client"

import * as React from "react"
import { Smartphone, Monitor, Tv, ChevronLeft, Download, Info, Zap, ShieldCheck, Share2, Chrome } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"

export default function InstallPage() {
  const [host, setHost] = React.useState("")

  React.useEffect(() => {
    setHost(window.location.origin)
  }, [])

  return (
    <div className="min-h-screen bg-background pb-20 p-6">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/user/home"><ChevronLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <h1 className="text-3xl font-black uppercase font-headline italic text-primary">Central de Aplicativos v375</h1>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Leve o sinal do Mestre Léo para qualquer tela.</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* ANDROID APK */}
          <Card className="bg-card/50 border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
            <CardHeader className="bg-primary/10 p-6 flex flex-row items-center gap-4">
              <div className="bg-primary p-3 rounded-2xl"><Smartphone className="h-6 w-6 text-white" /></div>
              <CardTitle className="text-sm font-black uppercase italic">Android & TV Box</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <p className="text-[10px] font-bold opacity-60 uppercase">Para celulares Android, Mi Stick, Fire Stick e TV Boxes.</p>
              <div className="space-y-2">
                <Button className="w-full h-14 bg-primary font-black uppercase text-xs" onClick={() => window.alert("Mestre Léo, você precisa hospedar o arquivo .APK e colocar o link aqui!")}>
                  <Download className="mr-2 h-4 w-4" /> Baixar APK Oficial
                </Button>
                <div className="p-4 bg-muted rounded-2xl border border-border">
                  <p className="text-[9px] font-bold text-primary uppercase flex items-center gap-2">
                    <Chrome className="h-3 w-3" /> Dica PWA (Sem Baixar)
                  </p>
                  <p className="text-[9px] opacity-60 mt-1 uppercase font-bold">Abra este site no Chrome do celular, clique nos 3 pontinhos e selecione "Instalar Aplicativo".</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SMART TV (SAMSUNG / LG) */}
          <Card className="bg-card/50 border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
            <CardHeader className="bg-emerald-500/10 p-6 flex flex-row items-center gap-4">
              <div className="bg-emerald-500 p-3 rounded-2xl"><Tv className="h-6 w-6 text-white" /></div>
              <CardTitle className="text-sm font-black uppercase italic">Samsung & LG TV</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <p className="text-[10px] font-bold opacity-60 uppercase">Acesse diretamente pelo navegador da sua Smart TV.</p>
              <div className="bg-black/20 p-4 rounded-2xl border border-white/5 space-y-3">
                 <div className="flex items-center justify-between">
                    <span className="text-[9px] font-black uppercase text-emerald-500">Endereço da Rede:</span>
                    <span className="text-[10px] font-mono font-black text-white">{host}</span>
                 </div>
                 <p className="text-[9px] font-bold opacity-60 uppercase italic">Digite este endereço no navegador da sua TV e adicione aos favoritos para acesso rápido.</p>
              </div>
              <Button variant="outline" className="w-full h-12 border-emerald-500/20 text-emerald-500 font-black uppercase text-[10px]">
                Tutorial de Instalação TV
              </Button>
            </CardContent>
          </Card>

          {/* ROKU TV */}
          <Card className="bg-card/50 border-white/5 rounded-[2.5rem] overflow-hidden shadow-2xl">
            <CardHeader className="bg-orange-500/10 p-6 flex flex-row items-center gap-4">
              <div className="bg-orange-500 p-3 rounded-2xl"><Monitor className="h-6 w-6 text-white" /></div>
              <CardTitle className="text-sm font-black uppercase italic">Sistema Roku</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <p className="text-[10px] font-bold opacity-60 uppercase italic">O Roku não aceita sites diretos. Use o método "Cast".</p>
              <ol className="text-[9px] font-bold uppercase space-y-2 opacity-80">
                <li className="flex gap-2"><span className="text-orange-500">1.</span> Instale o app "Web Video Caster" no seu celular.</li>
                <li className="flex gap-2"><span className="text-orange-500">2.</span> Abra o site Léo TV dentro desse aplicativo.</li>
                <li className="flex gap-2"><span className="text-orange-500">3.</span> Clique no ícone de transmissão e selecione seu Roku.</li>
              </ol>
            </CardContent>
          </Card>

          {/* SUPORTE MESTRE */}
          <Card className="bg-primary/5 border border-primary/20 rounded-[2.5rem] overflow-hidden shadow-2xl flex flex-col justify-center items-center p-8 text-center">
             <ShieldCheck className="h-12 w-12 text-primary mb-4" />
             <h3 className="text-xl font-black uppercase italic text-primary">Sinal Blindado</h3>
             <p className="text-[10px] font-bold opacity-60 uppercase mt-2">Nossos apps usam tecnologia de túnel para garantir que o sinal nunca caia na sua TV.</p>
             <Button variant="link" className="text-primary font-black uppercase text-[9px] mt-4">
                Preciso de Ajuda Técnica
             </Button>
          </Card>
        </div>
      </div>
    </div>
  )
}
