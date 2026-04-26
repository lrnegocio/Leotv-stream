
"use client"

import * as React from "react"
import { Gamepad2, Trophy, Play, ShieldCheck, Loader2, Star, Trash2, ChevronDown, ChevronUp, Plus, Save, UploadCloud, Globe, Edit2, RefreshCcw, Wand2, AlertTriangle, Code } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getGameRankings, GameRanking, getRemoteGames, saveGame, removeGame, GameItem, formatGameLink } from "@/lib/store"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { toast } from "@/hooks/use-toast"

export default function AdminGamesPage() {
  const [rankings, setGameRankings] = React.useState<GameRanking[]>([])
  const [games, setGames] = React.useState<GameItem[]>([])
  const [loading, setLoading] = React.useState(true)
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [testGame, setTestGame] = React.useState<GameItem | null>(null)
  const [expandedConsole, setExpandedConsole] = React.useState<string | null>(null)
  const [isSaving, setIsSaving] = React.useState(false)
  const [isFixing, setIsFixing] = React.useState(false)
  
  const [gameData, setGameData] = React.useState<Partial<GameItem>>({
    title: "",
    console: "SUPER NINTENDO (SNES)",
    type: "embed",
    url: "",
    emulatorUrl: "",
    imageUrl: ""
  })

  const loadData = React.useCallback(async () => {
    setLoading(true)
    const [r, g] = await Promise.all([getGameRankings(), getRemoteGames()])
    setGameRankings(r)
    setGames(g)
    setLoading(false)
  }, [])

  React.useEffect(() => { loadData() }, [loadData])

  const handleUrlChange = (val: string) => {
    const cleaned = formatGameLink(val);
    setGameData(prev => ({ ...prev, url: cleaned }));
  }

  // SINTONIZADOR MASTER v363: Detecta RetroGames, Roblox e outros automaticamente
  const handleFixLink = async () => {
    if (!gameData.url) {
      toast({ variant: "destructive", title: "Cole um link primeiro!" })
      return;
    }

    setIsFixing(true);
    try {
      const proxyUrl = `/api/proxy?url=${encodeURIComponent(gameData.url)}&t=${Date.now()}`;
      const res = await fetch(proxyUrl);
      const html = await res.text();
      
      // CASO RETROGAMES: Extrai o link de embed
      if (gameData.url.includes('retrogames.cc')) {
        const embedMatch = html.match(/https:\/\/www\.retrogames\.cc\/embed\/(\d+-[^"]+)/);
        if (embedMatch) {
          setGameData(prev => ({ ...prev, url: embedMatch[0] }));
          toast({ title: "MOTOR SINTONIZADO!", description: "Link de emulação extraído." });
        } else {
          toast({ variant: "destructive", title: "Embed não localizado." });
        }
      } 
      // CASO ROBLOX: Extrai o nome do jogo
      else if (gameData.url.includes('roblox.com')) {
        const titleMatch = html.match(/<title>(.*?)<\/title>/i);
        if (titleMatch && titleMatch[1]) {
           const cleanTitle = titleMatch[1].split(' - Roblox')[0].trim();
           setGameData(prev => ({ 
             ...prev, 
             title: cleanTitle.toUpperCase(),
             console: prev.console || "ROBLOX"
           }));
           toast({ title: "ROBLOX RECONHECIDO!", description: `Jogo: ${cleanTitle}` });
        } else {
           toast({ title: "ROBLOX DETECTADO", description: "Link pronto para uso." });
        }
      }
      else {
        toast({ title: "SINAL RECONHECIDO", description: "O link foi processado pelo sistema." });
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Sintonização Falhou" });
    } finally {
      setIsFixing(false);
    }
  }

  const handleSaveGame = async () => {
    if (!gameData.title || !gameData.url) {
      toast({ variant: "destructive", title: "Campos Obrigatórios" })
      return
    }
    setIsSaving(true)
    const success = await saveGame(gameData)
    if (success) {
      toast({ title: gameData.id ? "JOGO ATUALIZADO!" : "JOGO ADICIONADO À ARENA!" })
      setIsDialogOpen(false)
      loadData()
    } else {
      toast({ variant: "destructive", title: "Erro ao Salvar" })
    }
    setIsSaving(false)
  }

  const handleDeleteGame = async (id: string) => {
    if (confirm("Deseja deletar este jogo da arena?")) {
      await removeGame(id)
      loadData()
    }
  }

  const handleEditGame = (game: GameItem) => {
    setGameData(game)
    setIsDialogOpen(true)
  }

  const handleNewGame = () => {
    setGameData({
      title: "",
      console: "SUPER NINTENDO (SNES)",
      type: "embed",
      url: "",
      emulatorUrl: "",
      imageUrl: ""
    })
    setIsDialogOpen(true)
  }

  if (loading) return <div className="flex justify-center py-40"><Loader2 className="h-12 w-12 animate-spin text-emerald-500" /></div>

  const consoles = Array.from(new Set(games.map(g => g.console))).sort()

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black uppercase font-headline italic text-emerald-500">Arena de Games Master</h1>
          <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-widest">Gestão Unificada de Biblioteca v363.</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={handleNewGame} className="bg-emerald-500 h-12 rounded-xl font-black uppercase text-[10px] shadow-lg shadow-emerald-500/20">
            <Plus className="mr-2 h-4 w-4" /> Novo Jogo Master
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-card/50 border-white/5 shadow-2xl rounded-[2.5rem] overflow-hidden">
            <CardHeader className="bg-emerald-500/5 border-b border-white/5 p-8">
              <CardTitle className="text-sm font-black uppercase italic tracking-widest flex items-center gap-2 text-emerald-500">
                <Trophy className="h-5 w-5" /> Ranking Guerreiros Léo TV
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-white/5">
                {rankings.map((r, idx) => (
                  <div key={r.pin} className="flex items-center gap-6 p-6 hover:bg-white/5 transition-colors group">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl italic ${idx < 3 ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-white/5 text-muted-foreground'}`}>
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-mono font-black uppercase text-lg text-emerald-500 tracking-[0.2em]">{r.pin}</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black italic text-emerald-500 leading-none">{r.points.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
                {rankings.length === 0 && <div className="p-20 text-center opacity-20 uppercase font-black">Nenhum combate registrado ainda.</div>}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="bg-card/50 border-white/5 shadow-2xl rounded-[2.5rem] overflow-hidden">
            <CardHeader className="bg-white/5 border-b border-white/5 p-6">
              <CardTitle className="text-sm font-black uppercase italic tracking-widest flex items-center gap-2">
                <Gamepad2 className="h-4 w-4 text-emerald-500" /> Biblioteca de Jogos ({games.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scroll scrollbar-visible">
                {consoles.map(consoleName => (
                  <div key={consoleName} className="space-y-2">
                    <button 
                      onClick={() => setExpandedConsole(expandedConsole === consoleName ? null : consoleName)}
                      className="w-full flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-emerald-500/10 transition-all border border-white/5 group"
                    >
                      <span className="text-[10px] font-black uppercase italic group-hover:text-emerald-500">{consoleName}</span>
                      {expandedConsole === consoleName ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    
                    {expandedConsole === consoleName && (
                      <div className="grid gap-2 pl-4 animate-in slide-in-from-top-2 duration-300">
                        {games.filter(g => g.console === consoleName).map(game => (
                          <div key={game.id} className="flex gap-2">
                            <Button variant="outline" onClick={() => setTestGame(game)} className="flex-1 justify-between h-12 bg-black/20 border-white/5 hover:border-emerald-500 group rounded-xl px-4">
                              <span className="text-[9px] font-bold uppercase truncate">{game.title}</span>
                              <Play className="h-3 w-3 opacity-20 group-hover:opacity-100" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleEditGame(game)} className="h-12 w-12 text-primary hover:bg-primary/10"><Edit2 className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleDeleteGame(game.id)} className="h-12 w-12 text-destructive hover:bg-destructive/10"><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-xl bg-card border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
          <DialogHeader><DialogTitle className="uppercase font-black text-emerald-500 italic">{gameData.id ? 'Editar Jogo Arena' : 'Novo Jogo na Arena'}</DialogTitle></DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="space-y-2">
              <Label className="uppercase text-[10px] font-black opacity-60">Título do Jogo</Label>
              <Input value={gameData.title} onChange={e => setGameData({...gameData, title: e.target.value})} className="bg-black/40 border-white/5 h-12 font-bold uppercase" placeholder="DÊ UM NOME OU USE O SINTONIZADOR" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="uppercase text-[10px] font-black opacity-60">Console / Sistema</Label>
                <Select value={gameData.console} onValueChange={v => setGameData({...gameData, console: v})}>
                  <SelectTrigger className="bg-black/40 border-white/5 h-12 font-bold"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ROBLOX">ROBLOX</SelectItem>
                    <SelectItem value="PLAYSTATION (PS1/PSX/PS2)">PLAYSTATION</SelectItem>
                    <SelectItem value="SUPER NINTENDO (SNES)">SUPER NINTENDO</SelectItem>
                    <SelectItem value="ARCADE / MAME">ARCADE / MAME</SelectItem>
                    <SelectItem value="MEGA DRIVE">MEGA DRIVE</SelectItem>
                    <SelectItem value="NINTENDO 64">NINTENDO 64</SelectItem>
                    <SelectItem value="OUTROS">OUTROS</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button variant="outline" onClick={handleFixLink} disabled={isFixing} className="h-12 w-full border-emerald-500/20 text-emerald-500 hover:bg-emerald-500/10 font-black uppercase text-[9px]">
                  {isFixing ? <Loader2 className="animate-spin mr-2 h-3 w-3" /> : <Wand2 className="mr-2 h-3 w-3" />} Sintonizar Jogo Master
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="uppercase text-[10px] font-black text-emerald-500 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Code className="h-3 w-3" /> Link do Jogo (Roblox, RetroGames, etc)
                </div>
              </Label>
              <div className="flex gap-2">
                <Input 
                  value={gameData.url} 
                  onChange={e => handleUrlChange(e.target.value)} 
                  className="bg-black/40 border-white/5 h-12 font-mono text-[10px] flex-1" 
                  placeholder="Cole o link aqui..." 
                />
              </div>
            </div>

            <Button onClick={handleSaveGame} disabled={isSaving} className="w-full h-16 bg-emerald-500 font-black text-lg uppercase italic mt-4 shadow-xl shadow-emerald-500/20 rounded-2xl">
              {isSaving ? <Loader2 className="h-6 w-6 animate-spin" /> : <Save className="mr-2 h-6 w-6" />} {gameData.id ? 'ATUALIZAR DADOS' : 'INJETAR JOGO NA REDE'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!testGame} onOpenChange={() => setTestGame(null)}>
        <DialogContent className="max-w-5xl h-[80vh] bg-black p-0 border-white/10 rounded-[3rem] overflow-hidden outline-none">
          <div className="absolute top-4 left-4 z-50 bg-black/60 px-4 py-2 rounded-full border border-white/10">
            <span className="text-[10px] font-black uppercase text-emerald-500">TESTANDO: {testGame?.title}</span>
          </div>
          <iframe src={testGame?.url} className="w-full h-full border-0" allowFullScreen />
        </DialogContent>
      </Dialog>
    </div>
  )
}
