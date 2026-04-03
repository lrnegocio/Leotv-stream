
"use client"

import * as React from "react"
import { Gamepad2, Trophy, Users, Play, ShieldCheck, Loader2, Star, Trash2, ChevronDown, ChevronUp } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getGameRankings, GameRanking } from "@/lib/store"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { CONSOLES_LIBRARY } from "@/components/home-content"

export default function AdminGamesPage() {
  const [rankings, setRankings] = React.useState<GameRanking[]>([])
  const [loading, setLoading] = React.useState(true)
  const [testGame, setTestGame] = React.useState<{name: string, url: string} | null>(null)
  const [expandedConsole, setExpandedConsole] = React.useState<string | null>(null)

  React.useEffect(() => {
    const load = async () => {
      const data = await getGameRankings()
      setRankings(data)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="flex justify-center py-40"><Loader2 className="h-12 w-12 animate-spin text-emerald-500" /></div>

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black uppercase font-headline italic text-emerald-500">Arena de Games Master</h1>
          <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-widest">Gestão de Ranking e Teste de Sinais Gaming.</p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 px-6 py-3 rounded-2xl">
           <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
              <span className="text-xs font-black uppercase italic text-emerald-500 tracking-tighter">Sinal de Game Blindado</span>
           </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-card/50 border-white/5 shadow-2xl rounded-[2.5rem] overflow-hidden">
            <CardHeader className="bg-emerald-500/5 border-b border-white/5 p-8">
              <CardTitle className="text-sm font-black uppercase italic tracking-widest flex items-center gap-2 text-emerald-500">
                <Trophy className="h-5 w-5" /> Top 50 Guerreiros Léo TV
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
                      <p className="text-[10px] font-bold uppercase opacity-40">Status: {idx < 3 ? 'Elite Master' : 'Combatente'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black italic text-emerald-500 leading-none">{r.points.toLocaleString()}</p>
                      <p className="text-[8px] font-black uppercase opacity-40 mt-1">Pontos de Arena</p>
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
                <Play className="h-4 w-4 text-emerald-500" /> Teste de Biblioteca Master
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scroll scrollbar-visible">
                {CONSOLES_LIBRARY.map(console => (
                  <div key={console.name} className="space-y-2">
                    <button 
                      onClick={() => setExpandedConsole(expandedConsole === console.name ? null : console.name)}
                      className="w-full flex items-center justify-between p-4 bg-white/5 rounded-2xl hover:bg-emerald-500/10 transition-all border border-white/5 group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{console.icon}</span>
                        <span className="text-[10px] font-black uppercase italic group-hover:text-emerald-500">{console.name}</span>
                      </div>
                      {expandedConsole === console.name ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </button>
                    
                    {expandedConsole === console.name && (
                      <div className="grid gap-2 pl-4 animate-in slide-in-from-top-2 duration-300">
                        {console.games.map(game => (
                          <Button key={game.name} variant="outline" onClick={() => setTestGame(game)} className="justify-between h-12 bg-black/20 border-white/5 hover:border-emerald-500 group rounded-xl px-4">
                            <span className="text-[9px] font-bold uppercase truncate">{game.name}</span>
                            <Play className="h-3 w-3 opacity-20 group-hover:opacity-100" />
                          </Button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-emerald-500/10 border border-emerald-500/20 rounded-[2rem] p-6">
             <div className="flex items-center gap-4">
                <Star className="h-8 w-8 text-emerald-500 animate-pulse" />
                <div>
                   <h4 className="font-black uppercase text-xs">Mestre Léo (Admin)</h4>
                   <p className="text-[10px] opacity-60">Status: Poder Supremo. Testando sinais de todos os consoles.</p>
                </div>
             </div>
          </Card>
        </div>
      </div>

      <Dialog open={!!testGame} onOpenChange={() => setTestGame(null)}>
        <DialogContent className="max-w-5xl h-[80vh] bg-black p-0 border-white/10 rounded-[3rem] overflow-hidden outline-none">
          <div className="absolute top-4 left-4 z-50 bg-black/60 px-4 py-2 rounded-full border border-white/10">
            <span className="text-[10px] font-black uppercase text-emerald-500">TESTANDO: {testGame?.name}</span>
          </div>
          {testGame && <iframe src={testGame.url} className="w-full h-full border-0" allowFullScreen />}
        </DialogContent>
      </Dialog>
    </div>
  )
}
