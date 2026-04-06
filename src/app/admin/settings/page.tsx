"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Lock, Save, Loader2, MessageSquare, ShieldCheck, AlertCircle, ListPlus, Terminal, RefreshCcw, Tv } from "lucide-react"
import { getGlobalSettings, updateGlobalSettings, saveContent, ContentType } from "@/lib/store"
import { toast } from "@/hooks/use-toast"

export default function SettingsPage() {
  const [parentalPin, setParentalPin] = React.useState("")
  const [announcement, setAnnouncement] = React.useState("")
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  
  const [listText, setListText] = React.useState("")
  const [isProcessing, setIsProcessing] = React.useState(false)

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

  const restoreMasterChannels = async () => {
    if (!confirm("Mestre, deseja injetar os Sinais Master padrão agora?")) return;
    setIsProcessing(true);
    const defaults = [
      { title: "SIC PORTUGAL", genre: "LÉO TV AO VIVO", streamUrl: "https://sic.pt/direto", imageUrl: "https://www.cxtv.com.br/img/Tvs/Logo/webp-l/bf5a981c80f234b09dae228127d108a1.webp" },
      { title: "TV CULTURA", genre: "LÉO TV AO VIVO", streamUrl: "https://cdn.live.br1.jmvstream.com/w/LVW-10842/LVW10842_513N26MDBL/chunklist.m3u8", imageUrl: "https://www.cxtv.com.br/img/Tvs/Logo/webp-l/ac86ed7edabf2d886a3b8430b4f13c91.webp" },
      { title: "FILME: DONA ARANHA", genre: "LÉO TV DESENHOS", streamUrl: "https://archive.org/download/dona-aranha-musica-infantil-oficial/DONA%20ARANHA%20-%20M%C3%BAsica%20Infantil%20-%20OFICIAL.mp4", imageUrl: "https://picsum.photos/seed/spider/200/300" },
      { title: "SINAL ADULTO TESTE", genre: "LÉO TV ADULTOS", streamUrl: "https://pt.pornhub.com/view_video.php?viewkey=69ccea0dd6223", isRestricted: true, imageUrl: "https://picsum.photos/seed/adult/200/300" }
    ];
    for (const c of defaults) { await saveContent(c as any); }
    setIsProcessing(false);
    toast({ title: "SINAIS MASTER RESTAURADOS!" });
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
            description: "Sinal Master Importado",
            isRestricted: groupMatch?.includes('ADULT') || groupMatch?.includes('XXX') || groupMatch?.includes('adultos') || false
          };
        } else if (line.startsWith('http')) {
          if (currentItem) {
            await saveContent({ ...currentItem, streamUrl: line });
            imported++;
            currentItem = null;
          }
        }
      }
      toast({ title: `IMPORTAÇÃO CONCLUÍDA`, description: `${imported} sinais adicionados ao banco!` });
      setListText("");
    } catch (e) {
      toast({ variant: "destructive", title: "FALHA NO TERMINAL" });
    } finally {
      setIsProcessing(false);
    }
  }

  if (loading) return <div className="flex justify-center py-40"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h1 className="text-3xl font-black uppercase font-headline italic text-primary">Segurança & Gestão Master</h1>
          <p className="text-muted-foreground uppercase text-[10px] tracking-widest font-bold">Configurações de Rede e Recuperação de Dados.</p>
        </div>
        <Button onClick={restoreMasterChannels} variant="outline" className="border-primary/20 text-primary font-black uppercase text-[10px] h-12 rounded-xl hover:bg-primary hover:text-white" disabled={isProcessing}>
          {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />} Restaurar Sinais Padrão
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          <Card className="bg-card/50 border-white/5 shadow-2xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-primary/5 border-b border-white/5 p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-2xl"><MessageSquare className="h-6 w-6 text-primary" /></div>
                <div><CardTitle className="uppercase text-lg font-black italic">Mural de Avisos</CardTitle></div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <Textarea value={announcement} onChange={e => setAnnouncement(e.target.value)} placeholder="Ex: Novos sinais Master online!" className="h-32 bg-black/40 border-white/5 font-bold text-xs rounded-xl" />
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-white/5 shadow-2xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-primary/5 border-b border-white/5 p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-primary/10 rounded-2xl"><Lock className="h-6 w-6 text-primary" /></div>
                <div><CardTitle className="uppercase text-lg font-black italic">Senha Parental Global</CardTitle></div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="flex gap-4">
                <Input value={parentalPin} onChange={(e) => setParentalPin(e.target.value)} className="bg-black/40 text-center font-black tracking-[0.5em] text-3xl h-16 rounded-2xl border-white/10" maxLength={4} />
                <Button onClick={handleSaveSettings} disabled={saving} className="h-16 px-10 bg-primary font-black uppercase rounded-2xl shadow-xl">{saving ? <Loader2 className="animate-spin" /> : <Save />}</Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="bg-card/50 border-white/5 shadow-2xl rounded-[2.5rem] overflow-hidden">
            <CardHeader className="bg-emerald-500/5 border-b border-emerald-500/10 p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-emerald-500/10 rounded-2xl"><Terminal className="h-6 w-6 text-emerald-500" /></div>
                <div><CardTitle className="uppercase text-lg font-black italic text-emerald-500">Terminal de Importação</CardTitle></div>
              </div>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <Textarea value={listText} onChange={e => setListText(e.target.value)} placeholder="#EXTINF:-1,CANAL\nhttp://link..." className="h-[300px] bg-black/60 border-white/5 font-mono text-[9px] rounded-2xl" />
              <Button onClick={handleImportList} disabled={isProcessing || !listText} className="w-full h-16 bg-emerald-500 font-black uppercase rounded-2xl shadow-xl shadow-emerald-500/20">{isProcessing ? <Loader2 className="animate-spin" /> : <><ListPlus className="mr-2 h-6 w-6" /> INJETAR SINAIS</>}</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
