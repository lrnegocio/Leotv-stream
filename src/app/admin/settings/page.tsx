
"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Lock, Save, ShieldAlert, Loader2, ListPlus, Download, CheckCircle2 } from "lucide-react"
import { getGlobalSettings, updateGlobalSettings, processM3UImport } from "@/lib/store"
import { toast } from "@/hooks/use-toast"

export default function SettingsPage() {
  const [parentalPin, setParentalPin] = React.useState("")
  const [m3uUrl, setM3uUrl] = React.useState("")
  const [m3uContent, setM3uContent] = React.useState("")
  const [loading, setLoading] = React.useState(true)
  const [importing, setImporting] = React.useState(false)

  React.useEffect(() => {
    const load = async () => {
      const settings = await getGlobalSettings()
      setParentalPin(settings.parentalPin)
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
    let contentToProcess = m3uContent;

    if (m3uUrl) {
      setImporting(true);
      try {
        const res = await fetch(m3uUrl);
        contentToProcess = await res.text();
      } catch (e) {
        toast({ variant: "destructive", title: "Erro de Link", description: "Não foi possível baixar a lista. Tente colar o conteúdo abaixo." });
        setImporting(false);
        return;
      }
    }

    if (!contentToProcess) {
      toast({ variant: "destructive", title: "Vazio", description: "Insira um link ou cole o conteúdo M3U." });
      return;
    }

    setImporting(true);
    const result = await processM3UImport(contentToProcess);
    setImporting(false);
    
    if (result.success > 0) {
      toast({ title: "Importação Concluída!", description: `${result.success} canais adicionados à sua biblioteca.` });
      setM3uUrl("");
      setM3uContent("");
    } else {
      toast({ variant: "destructive", title: "Falha na Importação", description: "Verifique o formato da sua lista." });
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
        {/* SENHA PARENTAL */}
        <Card className="bg-card/50 border-white/5 shadow-2xl rounded-3xl overflow-hidden">
          <CardHeader className="bg-primary/5 border-b border-white/5 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-2xl">
                <Lock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <CardTitle className="uppercase text-lg font-black italic">Senha Parental Global</CardTitle>
                <CardDescription className="text-[10px] uppercase font-bold opacity-60 tracking-tighter">Proteção para canais adultos e restritos.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="p-4 bg-destructive/10 rounded-2xl border border-destructive/20 flex gap-4">
              <ShieldAlert className="h-6 w-6 text-destructive shrink-0" />
              <p className="text-[10px] text-muted-foreground uppercase font-black leading-relaxed">
                Esta senha é exigida em todos os dispositivos para abrir canais marcados como "Restritos". Altere com cuidado.
              </p>
            </div>

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
              <Button onClick={handleSave} className="h-16 px-10 font-black uppercase bg-primary hover:scale-105 transition-transform rounded-2xl shadow-xl shadow-primary/20">
                <Save className="mr-2 h-5 w-5" /> SALVAR SENHA
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* IMPORTADOR M3U SUPREMO */}
        <Card className="bg-card/50 border-white/5 shadow-2xl rounded-3xl overflow-hidden">
          <CardHeader className="bg-emerald-500/5 border-b border-white/5 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-2xl">
                <ListPlus className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <CardTitle className="uppercase text-lg font-black italic text-emerald-500">Sincronizador M3U Master</CardTitle>
                <CardDescription className="text-[10px] uppercase font-bold opacity-60 tracking-tighter">Importe milhares de canais instantaneamente.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase opacity-40 px-2 text-emerald-500">Link da Lista M3U (URL)</label>
                <div className="flex gap-2">
                  <Input 
                    value={m3uUrl} 
                    onChange={e => setM3uUrl(e.target.value)}
                    placeholder="http://seu-servidor.com/get.php?username=...&password=..." 
                    className="h-14 bg-black/40 border-white/5 font-mono text-xs rounded-xl"
                  />
                </div>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-white/5"></span></div>
                <div className="relative flex justify-center text-[8px] uppercase font-black"><span className="bg-card px-4 opacity-40">OU COLE O CONTEÚDO ABAIXO</span></div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase opacity-40 px-2">Conteúdo Bruto da Lista</label>
                <Textarea 
                  value={m3uContent}
                  onChange={e => setM3uContent(e.target.value)}
                  placeholder="#EXTM3U&#10;#EXTINF:-1 tvg-logo='...' group-title='CANAL',Nome do Canal&#10;http://link.com"
                  className="h-40 bg-black/40 border-white/5 font-mono text-[10px] rounded-xl"
                />
              </div>

              <Button 
                onClick={handleImportM3U} 
                disabled={importing}
                className="w-full h-16 bg-emerald-500 hover:bg-emerald-600 font-black uppercase text-sm rounded-2xl shadow-xl shadow-emerald-500/10"
              >
                {importing ? (
                  <><Loader2 className="mr-2 h-6 w-6 animate-spin" /> SINCRONIZANDO CANAIS...</>
                ) : (
                  <><Download className="mr-2 h-6 w-6" /> INICIAR IMPORTAÇÃO AGORA</>
                )}
              </Button>
              
              <p className="text-[9px] text-center uppercase font-bold opacity-30">
                O sistema reordenará automaticamente em categorias e adicionará as capas encontradas.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
