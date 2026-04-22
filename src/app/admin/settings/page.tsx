
"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Lock, Save, Loader2, ListPlus, Sparkles, Zap, Megaphone, Image as ImageIcon, Link as LinkIcon, ShieldCheck, Key, Send } from "lucide-react"
import { getGlobalSettings, updateGlobalSettings, saveContent, ContentType, Episode } from "@/lib/store"
import { toast } from "@/hooks/use-toast"
import { Label } from "@/components/ui/label"

export default function SettingsPage() {
  const [parentalPin, setParentalPin] = React.useState("")
  const [announcement, setAnnouncement] = React.useState("")
  const [bannerUrl, setBannerUrl] = React.useState("")
  const [bannerLink, setBannerLink] = React.useState("")
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [listText, setListText] = React.useState("")

  // ESTADO SEGURANÇA MESTRE
  const [isChangingPin, setIsChangingPin] = React.useState(false)
  const [confirmCurrent, setConfirmCurrent] = React.useState("")
  const [newPin, setNewPin] = React.useState("")
  const [newPinConfirm, setNewPinConfirm] = React.useState("")

  React.useEffect(() => {
    const load = async () => {
      try {
        const settings = await getGlobalSettings()
        setParentalPin(settings.parentalPin || "1234")
        setAnnouncement(settings.announcement || "")
        setBannerUrl(settings.bannerUrl || "")
        setBannerLink(settings.bannerLink || "")
      } catch (err) { } finally { setLoading(false) }
    }
    load()
  }, [])

  const handleSaveSettings = async () => {
    setSaving(true)
    try {
      if (await updateGlobalSettings({ parentalPin, announcement, bannerUrl, bannerLink })) {
        toast({ title: "CONFIGURAÇÕES SINCROZINADAS!" })
      }
    } catch (e) { toast({ variant: "destructive", title: "ERRO DE CONEXÃO" })
    } finally { setSaving(false) }
  }

  const handleSendAnnouncement = async () => {
    setSaving(true)
    try {
      if (await updateGlobalSettings({ parentalPin, announcement, bannerUrl, bannerLink })) {
        toast({ title: "AVISO DISPARADO COM SUCESSO!", description: "Todos os clientes verão esta mensagem no player." })
      }
    } catch (e) { 
      toast({ variant: "destructive", title: "ERRO AO DISPARAR" })
    } finally { setSaving(false) }
  }

  const handleUpdatePin = async () => {
    if (confirmCurrent !== parentalPin) {
      toast({ variant: "destructive", title: "SENHA ATUAL INCORRETA" })
      return
    }
    if (newPin.length < 4 || newPin !== newPinConfirm) {
      toast({ variant: "destructive", title: "SENHAS NÃO CONFEREM OU CURTAS" })
      return
    }
    
    setSaving(true)
    if (await updateGlobalSettings({ parentalPin: newPin, announcement, bannerUrl, bannerLink })) {
      setParentalPin(newPin)
      setConfirmCurrent("")
      setNewPin("")
      setNewPinConfirm("")
      setIsChangingPin(false)
      toast({ title: "SENHA PARENTAL ALTERADA!" })
    }
    setSaving(false)
  }

  const handleImportList = async () => {
    if (!listText.trim()) return;
    setIsProcessing(true);
    let imported = 0;
    try {
      const lines = listText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
      let currentItem: any = null;
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith('#EXTINF:')) {
          const nameMatch = line.match(/,(.*)$/);
          const logoMatch = line.match(/tvg-logo="(.*?)"/);
          const groupMatch = line.match(/group-title="(.*?)"/);
          let rawName = nameMatch ? nameMatch[1].trim() : "NOVO SINAL";
          const logo = logoMatch ? logoMatch[1] : "";
          const groupStr = groupMatch ? String(groupMatch[1]).toUpperCase() : "LÉO TV AO VIVO";
          const inlineUrlMatch = line.match(/(https?:\/\/[^\s,]+)$/i) || rawName.match(/(https?:\/\/[^\s,]+)$/i);
          let extractedUrl = inlineUrlMatch ? inlineUrlMatch[0] : "";
          if (extractedUrl && rawName.includes(extractedUrl)) rawName = rawName.replace(extractedUrl, '').trim();
          let targetGenre = "LÉO TV AO VIVO";
          let targetType: ContentType = 'channel';
          if (groupStr.includes('SERIE') || groupStr.includes('TEMPORADA')) { targetGenre = "LÉO TV SÉRIES"; targetType = 'multi-season'; }
          else if (groupStr.includes('FILME') || groupStr.includes('VOD')) { targetGenre = "LÉO TV FILMES"; targetType = 'movie'; }
          else if (groupStr.includes('ESPORTE')) targetGenre = "LÉO TV ESPORTES";
          else if (groupStr.includes('ADULT')) targetGenre = "LÉO TV ADULTOS";
          else if (groupStr.includes('KIDS')) targetGenre = "LÉO TV DESENHOS";
          else if (groupStr.includes('PPV')) targetGenre = "LÉO TV PAY PER VIEW";
          else if (groupStr.includes('ALACARTE')) targetGenre = "LÉO TV ALACARTES";
          currentItem = { title: rawName, imageUrl: logo, genre: targetGenre, type: targetType, description: "Sinal Master", isRestricted: targetGenre === "LÉO TV ADULTOS" };
          if (extractedUrl) { await saveContent({ ...currentItem, streamUrl: extractedUrl }); imported++; currentItem = null; }
        } else if (line.toLowerCase().startsWith('http') && currentItem) {
          await saveContent({ ...currentItem, streamUrl: line });
          imported++;
          currentItem = null;
        }
      }
      toast({ title: `IMPORTAÇÃO CONCLUÍDA`, description: `${imported} sinais injetados!` });
      setListText("");
    } catch (e) { toast({ variant: "destructive", title: "FALHA NA IMPORTAÇÃO" });
    } finally { setIsProcessing(false); }
  }

  if (loading) return <div className="flex justify-center py-40"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h1 className="text-3xl font-black uppercase font-headline italic text-primary">Gestão Soberana</h1>
          <p className="text-muted-foreground uppercase text-[10px] tracking-widest font-bold">Publicidade e Injeção de Sinais em Massa.</p>
        </div>
        <Button onClick={handleSaveSettings} disabled={saving} className="h-14 px-8 bg-emerald-500 font-black uppercase rounded-2xl shadow-xl shadow-emerald-500/20">
          {saving ? <Loader2 className="animate-spin mr-2" /> : <Save className="mr-2 h-5 w-5" />} SALVAR TUDO
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          <Card className="bg-primary/5 border border-primary/20 shadow-2xl rounded-3xl overflow-hidden">
             <CardHeader className="bg-primary/10 border-b border-primary/10 p-6"><CardTitle className="uppercase text-sm font-black italic text-primary flex items-center gap-2"><Megaphone className="h-5 w-5" /> Publicidade Master</CardTitle></CardHeader>
             <CardContent className="p-8 space-y-4">
                <div className="space-y-2"><Label className="uppercase text-[10px] font-black opacity-60">URL do Banner</Label><Input value={bannerUrl} onChange={e => setBannerUrl(e.target.value)} className="bg-black/40 border-white/5 font-mono text-[10px]" /></div>
                <div className="space-y-2"><Label className="uppercase text-[10px] font-black opacity-60">Link de Destino</Label><Input value={bannerLink} onChange={e => setBannerLink(e.target.value)} className="bg-black/40 border-white/5 font-mono text-[10px]" /></div>
             </CardContent>
          </Card>

          <Card className="bg-card/50 border-white/5 shadow-2xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-primary/5 border-b border-white/5 p-6"><CardTitle className="uppercase text-sm font-black italic">Senha Parental Global</CardTitle></CardHeader>
            <CardContent className="p-8 space-y-6">
              {!isChangingPin ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between bg-black/20 p-6 rounded-2xl border border-white/5">
                    <div className="flex items-center gap-4 text-primary"><ShieldCheck className="h-8 w-8" /><span className="text-xl font-black italic uppercase">Senha Blindada</span></div>
                    <Button onClick={() => setIsChangingPin(true)} className="bg-primary h-12 rounded-xl font-black uppercase text-[10px]">Alterar Senha</Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-6 animate-in fade-in zoom-in-95">
                   <div className="space-y-2">
                     <Label className="uppercase text-[10px] font-black text-primary">Digite a Senha Atual</Label>
                     <Input type="password" value={confirmCurrent} onChange={e => setConfirmCurrent(e.target.value)} className="h-16 text-center text-4xl font-black tracking-[0.5em] bg-black/40" maxLength={4} />
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2"><Label className="uppercase text-[10px] font-black opacity-60">Nova Senha</Label><Input type="password" value={newPin} onChange={e => setNewPin(e.target.value)} className="h-12 text-center text-xl font-black bg-black/40" maxLength={4} /></div>
                      <div className="space-y-2"><Label className="uppercase text-[10px] font-black opacity-60">Confirmar</Label><Input type="password" value={newPinConfirm} onChange={e => setNewPinConfirm(e.target.value)} className="h-12 text-center text-xl font-black bg-black/40" maxLength={4} /></div>
                   </div>
                   <div className="flex gap-2">
                      <Button onClick={() => setIsChangingPin(false)} variant="outline" className="flex-1 h-12 font-black uppercase text-[10px]">Cancelar</Button>
                      <Button onClick={handleUpdatePin} className="flex-1 h-12 bg-emerald-500 font-black uppercase text-[10px]">Confirmar Troca</Button>
                   </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
          <Card className="bg-card/50 border border-primary/20 shadow-2xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-primary/5 border-b border-white/5 p-6 flex flex-row items-center justify-between">
              <CardTitle className="uppercase text-sm font-black italic">Mural de Avisos</CardTitle>
              <Button onClick={handleSendAnnouncement} disabled={saving || !announcement} className="bg-blue-600 hover:bg-blue-700 h-10 px-4 rounded-xl font-black uppercase text-[10px] shadow-lg shadow-blue-500/20 animate-pulse">
                <Send className="mr-2 h-4 w-4" /> ENVIAR AVISO GERAL
              </Button>
            </CardHeader>
            <CardContent className="p-8 space-y-4">
              <p className="text-[9px] font-bold uppercase text-primary/60 italic">A mensagem escrita abaixo aparecerá na tela do player para todos os clientes.</p>
              <Textarea 
                value={announcement} 
                onChange={e => setAnnouncement(e.target.value)} 
                placeholder="Ex: Manutenção no sinal de esportes hoje às 22h..."
                className="h-32 bg-black/40 border-white/5 font-bold text-xs" 
              />
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-white/5 shadow-2xl rounded-[2.5rem] overflow-hidden">
            <CardHeader className="bg-emerald-500/5 border-b border-emerald-500/10 p-6"><CardTitle className="uppercase text-sm font-black italic text-emerald-500">Terminal de Injeção de Sinais</CardTitle></CardHeader>
            <CardContent className="p-8 space-y-6">
              <Textarea value={listText} onChange={e => setListText(e.target.value)} placeholder="Cole sua lista M3U." className="h-[200px] bg-black/60 border-white/5 font-mono text-[9px] rounded-2xl" />
              <Button onClick={handleImportList} disabled={isProcessing || !listText} className="w-full h-16 bg-emerald-500 font-black uppercase rounded-2xl shadow-xl shadow-emerald-500/20">{isProcessing ? <Loader2 className="animate-spin" /> : <><ListPlus className="mr-2 h-6 w-6" /> INJETAR LISTA NA REDE</>}</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
