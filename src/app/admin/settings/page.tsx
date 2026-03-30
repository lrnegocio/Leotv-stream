"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Lock, Save, ShieldAlert, Loader2, ListPlus, Download, Info, Zap, Trophy, RefreshCcw, Database, FileUp, Code } from "lucide-react"
import { getGlobalSettings, updateGlobalSettings, processM3UImport, processHTMLImport } from "@/lib/store"
import { toast } from "@/hooks/use-toast"

export default function SettingsPage() {
  const [parentalPin, setParentalPin] = React.useState("")
  const [m3uContent, setM3uContent] = React.useState("")
  const [htmlContent, setHtmlContent] = React.useState("")
  const [loading, setLoading] = React.useState(true)
  const [importing, setImporting] = React.useState(false)
  const [importingHtml, setImportingHtml] = React.useState(false)
  const [importMsg, setImportingMsg] = React.useState("")

  React.useEffect(() => {
    const load = async () => {
      const settings = await getGlobalSettings()
      setParentalPin(settings.parentalPin || "")
      setLoading(false)
    }
    load()
  }, [])

  const handleSave = async () => {
    if (parentalPin.length < 4) {
      toast({ variant: "destructive", title: "Erro", description: "A senha parental deve ter 4 dígitos." })
      return
    }
    await updateGlobalSettings({ parentalPin })
    toast({ title: "Sucesso", description: "Configurações salvas com sucesso." })
  }

  const handleImportM3U = async () => {
    if (!m3uContent) {
      toast({ variant: "destructive", title: "Vazio", description: "Cole sua lista M3U." });
      return;
    }
    setImporting(true);
    try {
      const result = await processM3UImport(m3uContent, (msg) => setImportingMsg(msg));
      toast({ title: "M3U IMPORTADO!", description: `${result.success} canais processados.` });
      setM3uContent("");
    } catch (err) {
      toast({ variant: "destructive", title: "Erro no M3U" });
    } finally {
      setImporting(false);
      setImportingMsg("");
    }
  }

  const handleImportHTML = async () => {
    if (!htmlContent) {
      toast({ variant: "destructive", title: "Vazio", description: "Cole o código HTML do player." });
      return;
    }
    setImportingHtml(true);
    try {
      const result = await processHTMLImport(htmlContent, (msg) => setImportingMsg(msg));
      toast({ title: "HTML SNIPER ATIVO!", description: `${result.success} sinais extraídos com sucesso.` });
      setHtmlContent("");
    } catch (err) {
      toast({ variant: "destructive", title: "Erro no HTML" });
    } finally {
      setImportingHtml(false);
      setImportingMsg("");
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="space-y-1">
        <h1 className="text-3xl font-black uppercase font-headline italic text-primary">Configurações Master</h1>
        <p className="text-muted-foreground uppercase text-[10px] tracking-widest font-bold">Gerencie 1 Milhão de Sinais com Poder Total.</p>
      </div>

      <div className="grid gap-8">
        {/* IMPORTADOR HTML SNIPER - MESTRE LÉO: COLE SEU CÓDIGO AQUI */}
        <Card className="bg-primary/5 border-primary/20 shadow-2xl rounded-3xl overflow-hidden border-2">
          <CardHeader className="bg-primary/10 border-b border-primary/20 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary rounded-2xl">
                <Code className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="uppercase text-lg font-black italic">Importador HTML Sniper Supremo</CardTitle>
                <CardDescription className="text-[10px] uppercase font-bold opacity-60">Cole o código HTML completo aqui para extrair nomes e capas.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <Textarea 
              value={htmlContent}
              onChange={e => setHtmlContent(e.target.value)}
              placeholder="Cole aqui o código HTML <div class='...'> ou o <html> completo..."
              className="h-48 bg-black/40 border-white/5 font-mono text-[9px] rounded-xl"
            />
            {importingHtml && <div className="p-4 bg-primary/10 border border-primary/20 rounded-2xl text-center animate-pulse"><p className="text-xs font-black uppercase text-primary">{importMsg}</p></div>}
            <Button onClick={handleImportHTML} disabled={importingHtml} className="w-full h-16 bg-primary font-black uppercase rounded-2xl">
              {importingHtml ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : "INICIAR SNIPER HTML"}
            </Button>
          </CardContent>
        </Card>

        {/* IMPORTADOR M3U */}
        <Card className="bg-card/50 border-white/5 shadow-2xl rounded-3xl overflow-hidden">
          <CardHeader className="bg-emerald-500/5 border-b border-white/5 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-2xl">
                <Zap className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <CardTitle className="uppercase text-lg font-black italic text-emerald-500">Sincronizador Massivo M3U</CardTitle>
                <CardDescription className="text-[10px] uppercase font-bold opacity-60">Importe listas gigantes com agrupamento de episódios.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <Textarea 
              value={m3uContent}
              onChange={e => setM3uContent(e.target.value)}
              placeholder="Cole sua lista M3U aqui..."
              className="h-48 bg-black/40 border-white/5 font-mono text-[9px] rounded-xl"
            />
            {importing && <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-center animate-pulse"><p className="text-xs font-black uppercase text-emerald-500">{importMsg}</p></div>}
            <Button onClick={handleImportM3U} disabled={importing} className="w-full h-16 bg-emerald-500 hover:bg-emerald-600 font-black uppercase rounded-2xl">
              {importing ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : "INICIAR IMPORTAÇÃO M3U"}
            </Button>
          </CardContent>
        </Card>

        {/* SENHA PARENTAL */}
        <Card className="bg-card/50 border-white/5 shadow-2xl rounded-3xl overflow-hidden">
          <CardHeader className="bg-primary/5 border-b border-white/5 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-2xl">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="uppercase text-lg font-black italic">Senha Parental Global</CardTitle>
                <CardDescription className="text-[10px] uppercase font-bold opacity-60">Trava obrigatória para categorias restritas.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="flex gap-4 items-end">
              <div className="space-y-2 flex-1">
                <Input value={parentalPin} onChange={(e) => setParentalPin(e.target.value)} className="bg-black/40 text-center font-black tracking-[0.5em] text-3xl h-16 rounded-2xl" maxLength={4} type="password" />
              </div>
              <Button onClick={handleSave} className="h-16 px-10 font-black uppercase bg-primary rounded-2xl">SALVAR SENHA</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
