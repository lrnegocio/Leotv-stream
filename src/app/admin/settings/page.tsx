
"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Lock, Save, ShieldAlert, Loader2, ListPlus, Download, Info, Zap } from "lucide-react"
import { getGlobalSettings, updateGlobalSettings, processM3UImport } from "@/lib/store"
import { toast } from "@/hooks/use-toast"

export default function SettingsPage() {
  const [parentalPin, setParentalPin] = React.useState("")
  const [m3uUrl, setM3uUrl] = React.useState("")
  const [m3uContent, setM3uContent] = React.useState("")
  const [loading, setLoading] = React.useState(true)
  const [importing, setImporting] = React.useState(false)
  const [progress, setProgress] = React.useState(0)

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
    if (!m3uContent || m3uContent.length < 10) {
      toast({ variant: "destructive", title: "Vazio", description: "Cole o conteúdo da sua lista M3U no campo abaixo." });
      return;
    }

    setImporting(true);
    setProgress(0);
    
    try {
      // O processamento agora é feito via store com batching aprimorado
      const result = await processM3UImport(m3uContent);
      
      if (result.success > 0) {
        toast({ 
          title: "IMPORTAÇÃO CONCLUÍDA!", 
          description: `${result.success} novos canais sincronizados com sucesso.` 
        });
        setM3uContent(""); // Limpa para liberar memória
      } else {
        toast({ 
          variant: "destructive", 
          title: "Erro no Formato", 
          description: "Nenhum canal válido encontrado. Certifique-se de colar a lista completa começando com #EXTM3U." 
        });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Erro Fatal", description: "O processamento falhou por falta de memória no navegador. Tente colar partes menores da lista." });
    } finally {
      setImporting(false);
      setProgress(0);
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
                <CardDescription className="text-[10px] uppercase font-bold opacity-60 tracking-tighter">Proteção para canais adultos, terror e restritos.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="p-4 bg-destructive/10 rounded-2xl border border-destructive/20 flex gap-4">
              <ShieldAlert className="h-6 w-6 text-destructive shrink-0" />
              <p className="text-[10px] text-muted-foreground uppercase font-black leading-relaxed">
                Esta senha é exigida em todos os dispositivos para abrir canais marcados como "Restritos".
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

        {/* IMPORTADOR M3U ULTRA-LIGHT */}
        <Card className="bg-card/50 border-white/5 shadow-2xl rounded-3xl overflow-hidden">
          <CardHeader className="bg-emerald-500/5 border-b border-white/5 p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-500/10 rounded-2xl">
                <Zap className="h-6 w-6 text-emerald-500" />
              </div>
              <div>
                <CardTitle className="uppercase text-lg font-black italic text-emerald-500">Sincronizador M3U Ultra-Light</CardTitle>
                <CardDescription className="text-[10px] uppercase font-bold opacity-60 tracking-tighter">Otimizado para listas gigantes (40k+ canais).</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-8 space-y-6">
            <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/20 flex gap-4">
              <Info className="h-6 w-6 text-blue-400 shrink-0" />
              <div className="space-y-1">
                <p className="text-[10px] text-blue-400 uppercase font-black">Dica para Listas Gigantes:</p>
                <p className="text-[9px] text-muted-foreground uppercase font-bold leading-relaxed">
                  Para evitar que seu PC trave, o campo abaixo está em modo "Simples". Cole a lista, aguarde alguns segundos e clique em importar. O sistema processará em segundo plano.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between items-center px-2">
                  <label className="text-[10px] font-black uppercase opacity-40">Conteúdo da Lista (#EXTM3U)</label>
                  {m3uContent.length > 0 && (
                    <span className="text-[8px] font-black text-primary uppercase">
                      {(m3uContent.length / 1024 / 1024).toFixed(2)} MB de dados detectados
                    </span>
                  )}
                </div>
                <Textarea 
                  value={m3uContent}
                  onChange={e => setM3uContent(e.target.value)}
                  placeholder="Cole aqui o conteúdo da lista M3U..."
                  spellCheck={false}
                  autoCorrect="off"
                  autoCapitalize="off"
                  className="h-80 bg-black/40 border-white/5 font-mono text-[9px] rounded-xl leading-tight overflow-y-auto whitespace-pre"
                />
              </div>

              <Button 
                onClick={handleImportM3U} 
                disabled={importing}
                className="w-full h-20 bg-emerald-500 hover:bg-emerald-600 font-black uppercase text-sm rounded-3xl shadow-xl shadow-emerald-500/10 active:scale-95 transition-all"
              >
                {importing ? (
                  <><Loader2 className="mr-3 h-8 w-8 animate-spin" /> PROCESSANDO SINAIS...</>
                ) : (
                  <><Download className="mr-3 h-8 w-8" /> INICIAR IMPORTAÇÃO AGORA</>
                )}
              </Button>
              
              <div className="flex items-center justify-center gap-4 py-2">
                <div className="flex items-center gap-1.5 opacity-40">
                  <div className="w-2 h-2 bg-primary rounded-full" />
                  <span className="text-[8px] font-black uppercase">Auto-Categorias</span>
                </div>
                <div className="flex items-center gap-1.5 opacity-40">
                  <div className="w-2 h-2 bg-secondary rounded-full" />
                  <span className="text-[8px] font-black uppercase">Auto-Capas</span>
                </div>
                <div className="flex items-center gap-1.5 opacity-40">
                  <div className="w-2 h-2 bg-destructive rounded-full" />
                  <span className="text-[8px] font-black uppercase">Trava Parental Auto</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
