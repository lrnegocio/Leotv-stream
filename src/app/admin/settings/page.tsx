
"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Lock, Save, Loader2, MessageSquare, ShieldCheck, AlertCircle, ListPlus, Terminal, Trash2 } from "lucide-react"
import { getGlobalSettings, updateGlobalSettings, saveContent, ContentType } from "@/lib/store"
import { toast } from "@/hooks/use-toast"

export default function SettingsPage() {
  const [parentalPin, setParentalPin] = React.useState("")
  const [announcement, setAnnouncement] = React.useState("")
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  
  const [listText, setListText] = React.useState("")
  const [isImporting, setIsProcessing] = React.useState(false)

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
    setError(null);
    if (!parentalPin || parentalPin.length < 4) {
      toast({ variant: "destructive", title: "Senha Curta", description: "Mestre, use no mínimo 4 dígitos." })
      return
    }
    setSaving(true)
    try {
      const success = await updateGlobalSettings({ parentalPin, announcement })
      if (success) {
        toast({ title: "SENHA E AVISO ATUALIZADOS!" })
      } else {
        setError("O Banco de Dados recusou o salvamento.");
        toast({ variant: "destructive", title: "ERRO DE BANCO" })
      }
    } catch (e) {
      toast({ variant: "destructive", title: "ERRO DE CONEXÃO" })
    } finally {
      setSaving(false)
    }
  }

  const handleImportList = async () => {
    if (!listText.trim()) return;
    setIsProcessing(true);
    let imported = 0;
    
    try {
      const lines = listText.split('\n');
      let currentItem: any = null;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        if (line.startsWith('#EXTINF:')) {
          const nameMatch = line.match(/,(.*)$/);
          const logoMatch = line.match(/tvg-logo="(.*?)"/);
          const groupMatch = line.match(/group-title="(.*?)"/);
          
          currentItem = {
            title: nameMatch ? nameMatch[1].trim() : "NOVO CANAL",
            imageUrl: logoMatch ? logoMatch[1] : "",
            genre: groupMatch ? groupMatch[1].toUpperCase() : "LÉO TV AO VIVO",
            type: 'channel' as ContentType,
            description: "Sinal importado via Terminal Master.",
            isRestricted: groupMatch?.includes('ADULT') || groupMatch?.includes('XXX') || groupMatch?.includes('adultos') || false
          };
        } else if (line.startsWith('http')) {
          if (currentItem) {
            // Se for série, organiza por episódios
            if (currentItem.title.toLowerCase().includes(' e') || currentItem.title.toLowerCase().includes(' ep')) {
               currentItem.type = 'series';
            }

            await saveContent({
              ...currentItem,
              streamUrl: line,
              directStreamUrl: line // Dual-Link inicial
            });
            imported++;
            currentItem = null;
          }
        }
      }
      
      toast({ title: `IMPORTAÇÃO CONCLUÍDA`, description: `${imported} sinais adicionados ao banco!` });
      setListText("");
    } catch (e) {
      toast({ variant: "destructive", title: "FALHA NO TERMINAL", description: "Formato de lista inválido." });
    } finally {
      setIsProcessing(false);
    }
  }

  if (loading) return <div className="flex justify-center py-40"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="space-y-1">
        <h1 className="text-3xl font-black uppercase font-headline italic text-primary">Segurança & Importador Master</h1>
        <p className="text-muted-foreground uppercase text-[10px] tracking-widest font-bold">Gestão Central de Rede e Injeção de Dados em Massa.</p>
      </div>

      {error && (
        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl flex items-center gap-3 text-destructive text-xs font-black uppercase">
          <AlertCircle className="h-5 w-5" /> {error}
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          <Card className="bg-card/50 border-white/5 shadow-2xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-primary/5 border-b border-white/5 p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-2xl"><MessageSquare className="h-6 w-6 text-primary" /></div>
                <div>
                  <CardTitle className="uppercase text-lg font-black italic">Mural de Avisos</CardTitle>
                  <CardDescription className="text-[10px] uppercase font-bold opacity-60">Mensagem global exibida no topo do app.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <Textarea 
                value={announcement}
                onChange={e => setAnnouncement(e.target.value)}
                placeholder="Ex: Novos filmes adicionados! Aproveitem o sinal Master..."
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
                  <CardDescription className="text-[10px] uppercase font-bold opacity-60">Trava para Adultos e Arena Games.</CardDescription>
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
                  {saving ? <Loader2 className="h-6 w-6 animate-spin" /> : <Save className="h-5 w-5" />}
                </button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="bg-card/50 border-white/5 shadow-2xl rounded-[2.5rem] overflow-hidden">
            <CardHeader className="bg-emerald-500/5 border-b border-emerald-500/10 p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-500/10 rounded-2xl"><Terminal className="h-6 w-6 text-emerald-500" /></div>
                <div>
                  <CardTitle className="uppercase text-lg font-black italic text-emerald-500">Terminal de Importação</CardTitle>
                  <CardDescription className="text-[10px] uppercase font-bold opacity-60">Cole sua lista M3U aqui para adicionar sinais em massa.</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <Textarea 
                value={listText}
                onChange={e => setListText(e.target.value)}
                placeholder="#EXTINF:-1 tvg-logo='...' group-title='FILMES',NOME\nhttp://sinal..."
                className="h-[300px] bg-black/60 border-white/5 font-mono text-[9px] rounded-2xl custom-scroll"
              />
              <Button 
                onClick={handleImportList} 
                disabled={isImporting || !listText}
                className="w-full h-16 bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase rounded-2xl shadow-xl shadow-emerald-500/20"
              >
                {isImporting ? <Loader2 className="h-6 w-6 animate-spin" /> : <><ListPlus className="mr-2 h-6 w-6" /> INJETAR SINAIS NA REDE</>}
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-emerald-500/10 border border-emerald-500/20 rounded-[2rem] p-8">
             <div className="flex items-center gap-4">
                <ShieldCheck className="h-10 w-10 text-emerald-500" />
                <div>
                   <h4 className="font-black uppercase text-sm">Sincronizador Inteligente</h4>
                   <p className="text-[9px] opacity-60 uppercase font-bold">O sistema detecta automaticamente nomes, logotipos e categorias da sua lista.</p>
                </div>
             </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
