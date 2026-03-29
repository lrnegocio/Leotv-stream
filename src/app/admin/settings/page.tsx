
"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Lock, Save, ShieldAlert, Loader2, ListPlus, Download, Info, Zap, Trophy, RefreshCcw, Database, FileUp } from "lucide-react"
import { getGlobalSettings, updateGlobalSettings, processM3UImport, syncLiveSports, importPremiumBundle } from "@/lib/store"
import { toast } from "@/hooks/use-toast"

export default function SettingsPage() {
  const [parentalPin, setParentalPin] = React.useState("")
  const [m3uContent, setM3uContent] = React.useState("")
  const [loading, setLoading] = React.useState(true)
  const [importing, setImporting] = React.useState(false)
  const [syncingSports, setSyncingSports] = React.useState(false)
  const [importingPremium, setImportingPremium] = React.useState(false)
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
    if (!m3uContent || m3uContent.length < 10) {
      toast({ variant: "destructive", title: "Vazio", description: "Cole o conteúdo da sua lista M3U." });
      return;
    }
    setImporting(true);
    setImportingMsg("Analisando lista...");
    try {
      const result = await processM3UImport(m3uContent, (msg) => setImportingMsg(msg));
      toast({ title: "IMPORTAÇÃO CONCLUÍDA!", description: `${result.success} canais processados.` });
      setM3uContent("");
    } catch (err) {
      toast({ variant: "destructive", title: "Erro Fatal" });
    } finally {
      setImporting(false);
      setImportingMsg("");
    }
  }

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setM3uContent(text);
      toast({ title: "Arquivo Carregado", description: "Clique em Iniciar Importação para salvar no banco." });
    };
    reader.readAsText(file);
  }

  const handleSyncSports = async () => {
    setSyncingSports(true);
    try {
      const result = await syncLiveSports();
      if (result.success > 0) {
        toast({ title: "RADAR ATUALIZADO!", description: `${result.success} jogos ao vivo importados com sucesso.` });
      } else {
        toast({ variant: "destructive", title: "Nada novo", description: result.error });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Erro no Radar" });
    } finally {
      setSyncingSports(false);
    }
  }

  const handleImportPremium = async () => {
    setImportingPremium(true);
    try {
      const result = await importPremiumBundle();
      toast({ title: "PACOTE PREMIUM INSTALADO!", description: `${result.success} canais master adicionados.` });
    } catch (err) {
      toast({ variant: "destructive", title: "Erro no Pacote" });
    } finally {
      setImportingPremium(false);
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <div className="space-y-1">
        <h1 className="text-3xl font-black uppercase font-headline italic text-primary">Configurações Master</h1>
        <p className="text-muted-foreground uppercase text-[10px] tracking-widest font-bold">Controle Central de Segurança e Conteúdo.</p>
      </div>

      <div className="grid gap-8">
        <Card className="bg-emerald-500/10 border-emerald-500/20 shadow-2xl rounded-3xl overflow-hidden border-2">
          <CardHeader className="bg-emerald-500/20 border-b border-emerald-500/20 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500 rounded-2xl shadow-lg shadow-emerald-500/30">
                <Database className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="uppercase text-lg font-black italic">Fábrica de Canais Léo TV</CardTitle>
                <CardDescription className="text-[10px] uppercase font-bold opacity-60 tracking-tighter">Injeta conteúdo de elite sem duplicatas.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <Button 
              onClick={handleImportPremium} 
              disabled={importingPremium}
              className="w-full h-20 bg-emerald-500 hover:bg-emerald-600 font-black uppercase rounded-3xl text-lg shadow-2xl shadow-emerald-500/20 flex items-center justify-center gap-4"
            >
              {importingPremium ? <Loader2 className="h-8 w-8 animate-spin" /> : <><Zap className="h-8 w-8" /> INJETAR CANAIS PREMIUM AGORA</>}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-primary/5 border-primary/20 shadow-2xl rounded-3xl overflow-hidden border-2">
          <CardHeader className="bg-primary/10 border-b border-primary/20 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary rounded-2xl shadow-lg shadow-primary/30">
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <div>
                <CardTitle className="uppercase text-lg font-black italic">Radar de Esportes Master</CardTitle>
                <CardDescription className="text-[10px] uppercase font-bold opacity-60 tracking-tighter">Sincroniza jogos de futebol ao vivo automaticamente.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <Button 
              onClick={handleSyncSports} 
              disabled={syncingSports}
              className="w-full h-20 bg-primary hover:bg-primary/90 font-black uppercase rounded-3xl text-lg shadow-2xl shadow-primary/20 flex items-center justify-center gap-4"
            >
              {syncingSports ? <Loader2 className="h-8 w-8 animate-spin" /> : <><Zap className="h-8 w-8" /> ATUALIZAR JOGOS DE HOJE AGORA</>}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-white/5 shadow-2xl rounded-3xl overflow-hidden">
          <CardHeader className="bg-emerald-500/5 border-b border-white/5 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-2xl">
                <Zap className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <CardTitle className="uppercase text-lg font-black italic text-emerald-500">Sincronizador Massivo M3U (1M+)</CardTitle>
                <CardDescription className="text-[10px] uppercase font-bold opacity-60 tracking-tighter">Importe listas gigantescas sem travar seu PC.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="grid gap-4">
              <div className="p-6 border-2 border-dashed border-white/10 rounded-3xl text-center bg-black/20 hover:border-emerald-500/50 transition-colors">
                <input type="file" id="m3u-file" accept=".m3u,.m3u8" className="hidden" onChange={handleFileUpload} />
                <label htmlFor="m3u-file" className="cursor-pointer flex flex-col items-center gap-2">
                  <FileUp className="h-10 w-10 text-emerald-500" />
                  <span className="text-xs font-black uppercase">Carregar Arquivo .M3U</span>
                </label>
              </div>
              <p className="text-center text-[10px] uppercase font-bold opacity-40">OU COLE O CONTEÚDO ABAIXO</p>
              <Textarea 
                value={m3uContent}
                onChange={e => setM3uContent(e.target.value)}
                placeholder="Cole aqui o conteúdo da lista M3U..."
                className="h-48 bg-black/40 border-white/5 font-mono text-[9px] rounded-xl"
              />
            </div>
            
            {importing && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-center animate-pulse">
                <p className="text-xs font-black uppercase text-emerald-500">{importMsg}</p>
              </div>
            )}

            <Button 
              onClick={handleImportM3U} 
              disabled={importing}
              className="w-full h-16 bg-emerald-500 hover:bg-emerald-600 font-black uppercase rounded-2xl"
            >
              {importing ? <Loader2 className="mr-2 h-6 w-6 animate-spin" /> : "INICIAR IMPORTAÇÃO MASSIVA"}
            </Button>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-white/5 shadow-2xl rounded-3xl overflow-hidden">
          <CardHeader className="bg-primary/5 border-b border-white/5 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-2xl">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="uppercase text-lg font-black italic">Senha Parental Global</CardTitle>
                <CardDescription className="text-[10px] uppercase font-bold opacity-60 tracking-tighter">Proteção para Terror e Adultos.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="space-y-2 flex-1">
                <label className="text-[10px] font-black uppercase opacity-40 px-2">Nova Senha (4 Dígitos)</label>
                <Input 
                  value={parentalPin} 
                  onChange={(e) => setParentalPin(e.target.value)} 
                  className="bg-black/40 border-white/5 text-center font-black tracking-[0.5em] text-3xl h-16 rounded-2xl focus:ring-primary" 
                  maxLength={4} 
                  type="password"
                  placeholder="0000"
                />
              </div>
              <Button onClick={handleSave} className="h-16 px-10 font-black uppercase bg-primary rounded-2xl">
                <Save className="mr-2 h-5 w-5" /> SALVAR SENHA
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
