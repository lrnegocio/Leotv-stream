
"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Lock, Save, Loader2, MessageSquare, RefreshCcw, Terminal, ListPlus } from "lucide-react"
import { getGlobalSettings, updateGlobalSettings, saveContent, ContentType } from "@/lib/store"
import { toast } from "@/hooks/use-toast"

export default function SettingsPage() {
  const [parentalPin, setParentalPin] = React.useState("")
  const [announcement, setAnnouncement] = React.useState("")
  const [loading, setLoading] = React.useState(true)
  const [saving, setSaving] = React.useState(false)
  const [isProcessing, setIsProcessing] = React.useState(false)
  const [listText, setListText] = React.useState("")

  React.useEffect(() => {
    const load = async () => {
      try {
        const settings = await getGlobalSettings()
        setParentalPin(settings.parentalPin || "1234")
        setAnnouncement(settings.announcement || "")
      } catch (err) { } finally { setLoading(false) }
    }
    load()
  }, [])

  const handleSaveSettings = async () => {
    if (!parentalPin || parentalPin.length < 4) {
      toast({ variant: "destructive", title: "Senha Curta", description: "Mestre, use no mínimo 4 dígitos." })
      return
    }
    setSaving(true)
    try {
      if (await updateGlobalSettings({ parentalPin, announcement })) {
        toast({ title: "SENHA E AVISO ATUALIZADOS!" })
      }
    } catch (e) { toast({ variant: "destructive", title: "ERRO DE CONEXÃO" })
    } finally { setSaving(false) }
  }

  const handleImportList = async () => {
    if (!listText.trim()) return;
    setIsProcessing(true);
    let imported = 0;
    
    const fixUrl = (u: string) => {
      if (!u) return "";
      let urlStr = u.trim();
      if (urlStr.toLowerCase().endsWith('.ts')) return urlStr.substring(0, urlStr.length - 3) + '.m3u8';
      if (urlStr.toLowerCase().includes('.ts?')) return urlStr.replace(/\.ts\?/i, '.m3u8?');
      return urlStr;
    };

    try {
      const lines = listText.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
      const seriesMap = new Map<string, any>();
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
          
          if (rawName.includes('http')) {
            rawName = rawName.split('http')[0].trim();
          }

          let targetGenre = "LÉO TV AO VIVO";
          let targetType: ContentType = 'channel';

          if (groupStr.includes('SERIE') || groupStr.includes('TEMPORADA') || groupStr.includes('PAY-PER-VIEW')) {
            targetGenre = "LÉO TV SÉRIES";
            targetType = 'multi-season';
          } else if (groupStr.includes('FILME') || groupStr.includes('CINE') || groupStr.includes('VOD') || groupStr.includes('4K') || groupStr.includes('UHD')) {
            targetGenre = "LÉO TV FILMES";
            targetType = 'movie';
          } else if (groupStr.includes('ESPORTE') || groupStr.includes('SPORT') || groupStr.includes('FUTEBOL')) {
            targetGenre = "LÉO TV ESPORTES";
          } else if (groupStr.includes('PIADA') || groupStr.includes('HUMOR')) {
            targetGenre = "LÉO TV PIADAS";
          } else if (groupStr.includes('REEL') || groupStr.includes('TIKTOK')) {
            targetGenre = "LÉO TV REELS";
          } else if (groupStr.includes('CLIPE') || groupStr.includes('MUSICA') || groupStr.includes('BIS')) {
            targetGenre = "LÉO TV VÍDEO CLIPES";
          } else if (groupStr.includes('ADULT') || groupStr.includes('XXX') || groupStr.includes('18+')) {
            targetGenre = "LÉO TV ADULTOS";
          } else if (groupStr.includes('KIDS') || groupStr.includes('DESENHO') || groupStr.includes('INFANTIL')) {
            targetGenre = "LÉO TV DESENHOS";
          } else if (groupStr.includes('NOVELA')) {
            targetGenre = "LÉO TV NOVELAS";
          } else if (groupStr.includes('DORAMA')) {
            targetGenre = "LÉO TV DORAMAS";
          }

          currentItem = {
            title: rawName,
            imageUrl: logo,
            genre: targetGenre,
            type: targetType,
            description: "Sinal Master Importado",
            isRestricted: targetGenre === "LÉO TV ADULTOS"
          };

          const inlineUrlMatch = line.match(/(https?:\/\/[^\s,]+)$/i);
          if (inlineUrlMatch) {
             const finalUrl = fixUrl(inlineUrlMatch[1]);
             await saveContent({ ...currentItem, streamUrl: finalUrl });
             imported++;
             currentItem = null;
          }
        } else if (line.toLowerCase().startsWith('http')) {
          if (currentItem) {
            const finalUrl = fixUrl(line);

            if (currentItem.type === 'multi-season') {
              const baseTitle = currentItem.title.split(/S\d+|E\d+|\d+ª|T\d+/i)[0].trim();
              const sMatch = currentItem.title.match(/S(\d+)/i) || currentItem.title.match(/(\d+)ª/i) || currentItem.title.match(/T(\d+)/i) || [null, "1"];
              const eMatch = currentItem.title.match(/E(\d+)/i) || currentItem.title.match(/EP(\d+)/i) || [null, "1"];
              
              const sNum = parseInt(sMatch[1] as string) || 1;
              const eNum = parseInt(eMatch[1] as string) || 1;

              if (!seriesMap.has(baseTitle)) {
                seriesMap.set(baseTitle, { ...currentItem, title: baseTitle, seasons: [] });
              }

              const series = seriesMap.get(baseTitle);
              let season = series.seasons.find((s: any) => s.number === sNum);
              if (!season) {
                season = { id: `s_${sNum}_${Date.now()}`, number: sNum, episodes: [] };
                series.seasons.push(season);
              }
              season.episodes.push({ id: `ep_${Date.now()}_${Math.random()}`, title: currentItem.title, number: eNum, streamUrl: finalUrl });
            } else {
              await saveContent({ ...currentItem, streamUrl: finalUrl });
              imported++;
            }
            currentItem = null;
          }
        }
      }

      for (const series of seriesMap.values()) {
        await saveContent(series);
        imported++;
      }

      toast({ title: `IMPORTAÇÃO CONCLUÍDA`, description: `${imported} sinais injetados na rede!` });
      setListText("");
    } catch (e) { 
      toast({ variant: "destructive", title: "FALHA NO TERMINAL", description: "Verifique a formatação da sua lista M3U." });
    } finally { setIsProcessing(false); }
  }

  if (loading) return <div className="flex justify-center py-40"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
          <h1 className="text-3xl font-black uppercase font-headline italic text-primary">Gestão Soberana</h1>
          <p className="text-muted-foreground uppercase text-[10px] tracking-widest font-bold">Configurações de Segurança e Importação.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="space-y-8">
          <Card className="bg-card/50 border-white/5 shadow-2xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-primary/5 border-b border-white/5 p-6">
              <CardTitle className="uppercase text-sm font-black italic">Mural de Avisos</CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <Textarea value={announcement} onChange={e => setAnnouncement(e.target.value)} placeholder="Ex: Novos sinais Master online!" className="h-32 bg-black/40 border-white/5 font-bold text-xs" />
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-white/5 shadow-2xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-primary/5 border-b border-white/5 p-6">
              <CardTitle className="uppercase text-sm font-black italic">Senha Parental Global</CardTitle>
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
              <CardTitle className="uppercase text-sm font-black italic text-emerald-500">Terminal Master Inteligente</CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-6">
              <Textarea value={listText} onChange={e => setListText(e.target.value)} placeholder="Cole aqui sua lista M3U de Canais ou Séries..." className="h-[300px] bg-black/60 border-white/5 font-mono text-[9px] rounded-2xl" />
              <Button onClick={handleImportList} disabled={isProcessing || !listText} className="w-full h-16 bg-emerald-500 font-black uppercase rounded-2xl shadow-xl shadow-emerald-500/20">{isProcessing ? <Loader2 className="animate-spin" /> : <><ListPlus className="mr-2 h-6 w-6" /> INJETAR LISTA NA REDE</>}</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
