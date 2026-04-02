"use client"

import * as React from "react"
import { Gamepad2, Trophy, Users, Play, ShieldCheck, Loader2, Star, Trash2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { getGameRankings, GameRanking } from "@/lib/store"
import { Dialog, DialogContent } from "@/components/ui/dialog"

const ADMIN_GAMES = [
  { name: "Super Mario World", console: "SNES", url: "https://www.retrogames.cc/embed/16847-super-mario-world-usa.html" },
  { name: "Counter-Strike Web", console: "PC", url: "https://v6p9d9t4.ssl.hwcdn.net/html/1671333/index.html" },
  { name: "Mortal Kombat 3", console: "SNES", url: "https://www.retrogames.cc/embed/17161-mortal-kombat-3-usa.html" },
  { name: "Resident Evil 3", console: "PS1", url: "https://www.retrogames.cc/embed/41727-resident-evil-3-nemesis-usa.html" },
  { name: "Chess Master AI", console: "BOARD", url: "https://www.sparkchess.com/play-chess-online.html" }
]

export default function AdminGamesPage() {
  const [rankings, setRankings] = React.useState<GameRanking[]>([])
  const [loading, setLoading] = React.useState(true)
  const [testGame, setTestGame] = React.useState<string | null>(null)

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
          <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-widest">Gestão de Ranking e Teste de Emuladores.</p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 px-6 py-3 rounded-2xl">
           <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-500" />
              <span className="text-xs font-black uppercase italic text-emerald-500 tracking-tighter">Ranking Blindado</span>
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
                <Play className="h-4 w-4 text-emerald-500" /> Teste de Jogos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid gap-3">
                {ADMIN_GAMES.map(game => (
                  <Button key={game.name} variant="outline" onClick={() => setTestGame(game.url)} className="justify-between h-14 bg-white/5 border-white/5 hover:border-emerald-500 group rounded-2xl px-6">
                    <div className="text-left">
                      <p className="text-[10px] font-black uppercase italic group-hover:text-emerald-500">{game.name}</p>
                      <p className="text-[8px] font-bold opacity-40 uppercase">{game.console}</p>
                    </div>
                    <Play className="h-4 w-4 opacity-20 group-hover:opacity-100" />
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-emerald-500/10 border border-emerald-500/20 rounded-[2rem] p-6">
             <div className="flex items-center gap-4">
                <Star className="h-8 w-8 text-emerald-500 animate-pulse" />
                <div>
                   <h4 className="font-black uppercase text-xs">Mestre Léo (Admin)</h4>
                   <p className="text-[10px] opacity-60">Status: Poder Supremo. Pode desafiar qualquer um no ranking.</p>
                </div>
             </div>
          </Card>
        </div>
      </div>

      <Dialog open={!!testGame} onOpenChange={() => setTestGame(null)}>
        <DialogContent className="max-w-5xl h-[80vh] bg-black p-0 border-white/10 rounded-[3rem] overflow-hidden">
          {testGame && <iframe src={testGame} className="w-full h-full border-0" allowFullScreen />}
        </DialogContent>
      </Dialog>
    </div>
  )
}
