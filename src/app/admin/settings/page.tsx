
"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Lock, Save, Loader2, Zap, Trash, MessageSquare } from "lucide-react"
import { getGlobalSettings, updateGlobalSettings, processM3UImport, clearAllM3UContent } from "@/lib/store"
import { toast } from "@/hooks/use-toast"

export default function SettingsPage() {
  const [parentalPin, setParentalPin] = React.useState("")
  const [announcement, setAnnouncement] = React.useState("")
  const [m3uContent, setM3uContent] = React.useState("")
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [importing, setImporting] = React.useState(false)
  const [importMsg, setImportingMsg] = React.useState("")

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

  const handleImportM3U = async () => {
    if (!m3uContent) {
      toast({ variant: "destructive", title: "Cole sua lista M3U." });
      return;
    }
    setImporting(true);
    try {
      const result = await processM3UImport(m3uContent, (msg) => setImportingMsg(msg));
      toast({ title: "M3U IMPORTADO!", description: `${result.success} sinais processados.` });
      setM3uContent("");
    } catch (err) {
      toast({ variant: "destructive", title: "Erro no M3U" });
    } finally {
      setImporting(false);
      setImportingMsg("");
    }
  }

  const handleClearAll = async () => {
    if (confirm("Mestre, deseja apagar TODOS os sinais da rede agora?")) {
      const success = await clearAllM3UContent()
      if (success) {
        toast({ title: "BANCO MASTER RESETADO" })
      }
    }
  }

  if (loading) return <div className="flex justify-center py-40"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="space-y-1">
        <h1 className="text-3xl font-black uppercase font-headline italic text-primary">Segurança & Mural Master</h1>
        <p className="text-muted-foreground uppercase text-[10px] tracking-widest font-bold">Gestão Master de Rede e Comunicação.</p>
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
                <CardDescription className="text-[10px] uppercase font-bold opacity-60">Trava obrigatória para categorias restritas (Adultos, Reels, etc).</CardDescription>
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

        <Card className="bg-card/50 border-white/5 shadow-2xl rounded-3xl overflow-hidden">
          <CardHeader className="bg-emerald-500/5 border-b border-white/5 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-2xl"><Zap className="h-6 w-6 text-emerald-500" /></div>
              <div>
                <CardTitle className="uppercase text-lg font-black italic text-emerald-500">Sincronizador M3U Master</CardTitle>
                <CardDescription className="text-[10px] uppercase font-bold opacity-60">Importe listas gigantes para o banco.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <Textarea 
              value={m3uContent}
              onChange={e => setM3uContent(e.target.value)}
              placeholder="#EXTM3U..."
              className="h-48 bg-black/40 border-white/5 font-mono text-[9px] rounded-xl shadow-inner"
            />
            {importing && <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-center"><p className="text-xs font-black uppercase text-emerald-500">{importMsg}</p></div>}
            <div className="flex gap-4">
              <button 
                onClick={handleImportM3U} 
                disabled={importing} 
                className="flex-1 h-16 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-black uppercase rounded-2xl transition-all shadow-xl shadow-emerald-500/20"
              >
                {importing ? <Loader2 className="mx-auto h-6 w-6 animate-spin" /> : "INICIAR IMPORTAÇÃO M3U"}
              </button>
              <Button onClick={handleClearAll} variant="outline" className="border-destructive/20 text-destructive h-16 px-8 rounded-2xl hover:bg-destructive hover:text-white transition-all">
                <Trash className="h-6 w-6" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
