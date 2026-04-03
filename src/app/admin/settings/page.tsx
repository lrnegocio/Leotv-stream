
"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Lock, Save, Loader2, MessageSquare, ShieldCheck } from "lucide-react"
import { getGlobalSettings, updateGlobalSettings } from "@/lib/store"
import { toast } from "@/hooks/use-toast"

export default function SettingsPage() {
  const [parentalPin, setParentalPin] = React.useState("")
  const [announcement, setAnnouncement] = React.useState("")
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)

  React.useEffect(() => {
    const load = async () => {
      try {
        const settings = await getGlobalSettings()
        setParentalPin(settings.parentalPin || "1234")
        setAnnouncement(settings.announcement || "")
      } catch (err) {
        console.error("Erro ao carregar settings:", err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleSaveSettings = async () => {
    if (parentalPin.length < 4) {
      toast({ variant: "destructive", title: "Senha Parental curta", description: "Mestre, use no mínimo 4 dígitos." })
      return
    }
    setSaving(true)
    try {
      const success = await updateGlobalSettings({ parentalPin, announcement })
      if (success) {
        toast({ title: "SENHA E AVISO ATUALIZADOS!" })
      } else {
        toast({ variant: "destructive", title: "ERRO AO SALVAR" })
      }
    } catch (e) {
      toast({ variant: "destructive", title: "ERRO DE CONEXÃO" })
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex justify-center py-40"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="space-y-1">
        <h1 className="text-3xl font-black uppercase font-headline italic text-primary">Segurança & Mural Master</h1>
        <p className="text-muted-foreground uppercase text-[10px] tracking-widest font-bold">Gestão de Rede e Comunicação Blindada.</p>
      </div>

      <div className="grid gap-8">
        <Card className="bg-card/50 border-white/5 shadow-2xl rounded-3xl overflow-hidden">
          <CardHeader className="bg-primary/5 border-b border-white/5 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-2xl"><MessageSquare className="h-6 w-6 text-primary" /></div>
              <div>
                <CardTitle className="uppercase text-lg font-black italic">Mural de Avisos (Mensagem Global)</CardTitle>
                <CardDescription className="text-[10px] uppercase font-bold opacity-60">Esta mensagem aparecerá no topo do app para todos os clientes.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <Textarea 
              value={announcement}
              onChange={e => setAnnouncement(e.target.value)}
              placeholder="Ex: Novos filmes adicionados! Aproveitem o sinal Master Léo TV..."
              className="h-32 bg-black/40 border-white/5 font-bold text-xs rounded-xl"
            />
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-white/5 shadow-2xl rounded-3xl overflow-hidden">
          <CardHeader className="bg-primary/5 border-b border-white/5 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-2xl"><Lock className="h-6 w-6 text-primary" /></div>
              <div>
                <CardTitle className="uppercase text-lg font-black italic">Senha Parental Global</CardTitle>
                <CardDescription className="text-[10px] uppercase font-bold opacity-60">Trava obrigatória para categorias restritas.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="flex gap-4 items-end">
              <div className="space-y-2 flex-1">
                <Input 
                  value={parentalPin} 
                  onChange={(e) => setParentalPin(e.target.value)} 
                  className="bg-black/40 text-center font-black tracking-[0.5em] text-3xl h-16 rounded-2xl focus:border-primary border-white/10 shadow-inner" 
                  maxLength={4} 
                />
              </div>
              <button 
                onClick={handleSaveSettings} 
                disabled={saving}
                className="h-16 px-10 font-black uppercase bg-primary text-white rounded-2xl shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-6 w-6 animate-spin" /> : <><Save className="h-5 w-5 mr-2" /> SALVAR CONFIGS</>}
              </button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-emerald-500/10 border border-emerald-500/20 rounded-[2rem] p-8">
           <div className="flex items-center gap-4">
              <ShieldCheck className="h-10 w-10 text-emerald-500" />
              <div>
                 <h4 className="font-black uppercase text-sm">Escudo Master Ativo</h4>
                 <p className="text-[10px] opacity-60 uppercase font-bold">Proteção anti-propaganda e bloqueio de inspeção de código (F12) habilitados.</p>
              </div>
           </div>
        </Card>
      </div>
    </div>
  )
}
