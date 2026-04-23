
"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Lock, Save, Loader2, ListPlus, Sparkles, Zap, Megaphone, Image as ImageIcon, Link as LinkIcon, ShieldCheck, Key, Send, Layers, Film, Tv } from "lucide-react"
import { getGlobalSettings, updateGlobalSettings, saveContent, ContentType, Episode, cleanName } from "@/lib/store"
import { toast } from "@/hooks/use-toast"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function SettingsPage() {
  const [parentalPin, setParentalPin] = React.useState("")
  const [announcement, setAnnouncement] = React.useState("")
  const [bannerUrl, setBannerUrl] = React.useState("")
  const [bannerLink, setBannerLink] = React.useState("")
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [isProcessing, setIsProcessing] = React.useState(false)
  
  // ESTADOS INJEÇÃO EM MASSA
  const [listText, setListText] = React.useState("")
  const [importGenre, setImportGenre] = React.useState("LÉO TV AO VIVO")
  const [importType, setImportType] = React.useState<ContentType>("channel")
  const [seriesTitle, setSeriesTitle] = React.useState("")

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

  const handleImportSmart = async () => {
    if (!listText.trim()) return;
    setIsProcessing(true);
    let imported = 0;
    
    try {
      const lines = listText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
      
      // MODO SÉRIE OU MULTI-SEASON (Tudo em um único item)
      if (importType === 'series' || importType === 'multi-season') {
        if (!seriesTitle) {
          toast({ variant: "destructive", title: "Título Obrigatório", description: "Dê um nome para a Série/Dorama antes de importar." });
          setIsProcessing(false);
          return;
        }

        const episodes: Episode[] = lines.map((url, idx) => ({
          id: 'ep_' + Date.now() + idx,
          title: `Episódio ${idx + 1}`,
          number: idx + 1,
          streamUrl: url
        }));

        const success = await saveContent({
          title: seriesTitle,
          genre: importGenre,
          type: importType,
          description: "Sinal Injetado em Massa",
          isRestricted: importGenre.includes("ADULTO"),
          imageUrl: "", // Admin coloca a foto depois no editar
          episodes: importType === 'series' ? episodes : [],
          seasons: importType === 'multi-season' ? [{ id: 's1', number: 1, episodes }] : []
        });

        if (success) imported = 1;
      } 
      // MODO FILME OU CANAL (Cada linha é um novo item)
      else {
        for (let i = 0; i < lines.length; i++) {
          const line = lines[i];
          if (line.startsWith('http')) {
            await saveContent({
              title: `${importType === 'movie' ? 'FILME' : 'CANAL'} ${Date.now().toString().slice(-4)}`,
              genre: importGenre,
              type: importType,
              streamUrl: line,
              description: "Injetado em Massa",
              isRestricted: importGenre.includes("ADULTO")
            });
            imported++;
          }
        }
      }

      toast({ title: `IMPORTAÇÃO CONCLUÍDA`, description: `${imported} registros criados na rede!` });
      setListText("");
      setSeriesTitle("");
    } catch (e) { 
      toast({ variant: "destructive", title: "FALHA NA INJEÇÃO" });
    } finally { 
      setIsProcessing(false); 
    }
  }

  if (loading) return <div className="flex justify-center py-40"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h1 className="text-3xl font-black uppercase font-headline italic text-primary">Gestão Soberana v347</h1>
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
              <Button onClick={handleSendAnnouncement} disabled={saving || !announcement} className="bg-blue-600 hover:bg-blue-700 h-10 px-4 rounded-xl font-black uppercase text-[10px] shadow-lg shadow-blue-500/20">
                <Send className="mr-2 h-4 w-4" /> DISPARAR AGORA
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
            <CardHeader className="bg-emerald-500/5 border-b border-emerald-500/10 p-6">
              <CardTitle className="uppercase text-sm font-black italic text-emerald-500 flex items-center gap-2"><ListPlus className="h-5 w-5" /> Injeção de Sinais em Massa</CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase opacity-60">1. Categoria</Label>
                    <Select value={importGenre} onValueChange={setImportGenre}>
                       <SelectTrigger className="bg-black/40 h-10 border-white/5 font-bold text-[10px]"><SelectValue /></SelectTrigger>
                       <SelectContent>
                          <SelectItem value="LÉO TV AO VIVO">AO VIVO</SelectItem>
                          <SelectItem value="LÉO TV FILMES">FILMES</SelectItem>
                          <SelectItem value="LÉO TV SÉRIES">SÉRIES/DORAMAS</SelectItem>
                          <SelectItem value="LÉO TV PAY PER VIEW">PPV</SelectItem>
                          <SelectItem value="LÉO TV ALACARTES">ALACARTE</SelectItem>
                          <SelectItem value="LÉO TV ADULTOS">ADULTOS</SelectItem>
                       </SelectContent>
                    </Select>
                 </div>
                 <div className="space-y-2">
                    <Label className="text-[9px] font-black uppercase opacity-60">2. Tipo de Mídia</Label>
                    <Select value={importType} onValueChange={(v: any) => setImportType(v)}>
                       <SelectTrigger className="bg-black/40 h-10 border-white/5 font-bold text-[10px]"><SelectValue /></SelectTrigger>
                       <SelectContent>
                          <SelectItem value="channel">Canal Único</SelectItem>
                          <SelectItem value="movie">Filmes</SelectItem>
                          <SelectItem value="series">Série (Episódios)</SelectItem>
                          <SelectItem value="multi-season">Série (Temporadas)</SelectItem>
                       </SelectContent>
                    </Select>
                 </div>
              </div>

              {(importType === 'series' || importType === 'multi-season') && (
                <div className="space-y-2 animate-in slide-in-from-top-2">
                   <Label className="text-[9px] font-black uppercase text-primary">3. Nome da Série / Dorama</Label>
                   <Input value={seriesTitle} onChange={e => setSeriesTitle(e.target.value)} placeholder="EX: ROUND 6" className="bg-black/40 h-12 border-primary/20 font-black uppercase" />
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-[9px] font-black uppercase opacity-60">Cole os links (Um por linha)</Label>
                <Textarea value={listText} onChange={e => setListText(e.target.value)} placeholder="https://link1.mp4&#10;https://link2.m3u8" className="h-[150px] bg-black/60 border-white/5 font-mono text-[9px] rounded-2xl" />
              </div>

              <Button onClick={handleImportSmart} disabled={isProcessing || !listText} className="w-full h-16 bg-emerald-500 font-black uppercase rounded-2xl shadow-xl shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-95">
                {isProcessing ? <Loader2 className="animate-spin mr-2" /> : <><Sparkles className="mr-2 h-6 w-6" /> INJETAR TUDO NA REDE</>}
              </Button>
              <p className="text-[8px] font-bold uppercase opacity-30 text-center">O sistema irá organizar automaticamente cada link como um item ou episódio.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
