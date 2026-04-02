
"use client"

import * as React from "react"
import { BarChart3, TrendingUp, Tv, Film, Layers, PlayCircle, Loader2 } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getTopContent, ContentItem } from "@/lib/store"
import Image from "next/image"

export default function StatsPage() {
  const [topContent, setTopContent] = React.useState<ContentItem[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    const load = async () => {
      const data = await getTopContent(10)
      setTopContent(data)
      setLoading(false)
    }
    load()
  }, [])

  if (loading) return <div className="flex justify-center py-40"><Loader2 className="h-12 w-12 animate-spin text-primary" /></div>

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black font-headline uppercase italic text-primary">Inteligência de Rede</h1>
          <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-widest">Monitoramento Real de Sinais Mais Assistidos.</p>
        </div>
        <div className="bg-primary/10 border border-primary/20 px-6 py-3 rounded-2xl shadow-inner">
           <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span className="text-xs font-black uppercase italic tracking-tighter text-primary">Tráfego Soberano</span>
           </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <Card className="bg-card/50 border-white/5 shadow-2xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-primary/5 border-b border-white/5 p-8">
            <CardTitle className="text-sm font-black uppercase italic tracking-widest flex items-center gap-2 text-primary">
              <BarChart3 className="h-5 w-5" /> Ranking Top 5 Sinais
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-white/5">
              {topContent.slice(0, 5).map((item, idx) => (
                <div key={item.id} className="flex items-center gap-6 p-6 hover:bg-white/5 transition-colors group">
                  <div className="w-12 h-12 bg-primary flex items-center justify-center font-black text-xl italic text-white rounded-2xl shadow-xl shadow-primary/20 group-hover:scale-110 transition-transform">
                    {idx + 1}
                  </div>
                  <div className="w-16 h-24 relative bg-black/40 rounded-xl overflow-hidden border border-white/5 shrink-0">
                     {item.imageUrl ? <Image src={item.imageUrl} alt={item.title} fill className="object-cover" unoptimized /> : <Tv className="absolute inset-0 m-auto h-6 w-6 opacity-20" />}
                  </div>
                  <div className="flex-1">
                    <h3 className="font-black uppercase text-sm italic text-primary truncate max-w-[200px]">{item.title}</h3>
                    <p className="text-[10px] font-bold uppercase opacity-40">{item.genre}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black italic text-primary leading-none">{item.views?.toLocaleString() || 0}</p>
                    <p className="text-[8px] font-black uppercase opacity-40 mt-1">Sintonizações</p>
                  </div>
                </div>
              ))}
              {topContent.length === 0 && (
                <div className="p-20 text-center opacity-20 font-black uppercase text-xs">Nenhum dado de audiência ainda.</div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-white/5 shadow-2xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="bg-secondary/5 border-b border-white/5 p-8">
            <CardTitle className="text-sm font-black uppercase italic tracking-widest flex items-center gap-2 text-secondary">
              <PlayCircle className="h-5 w-5" /> Top 6-10 em Audiência
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
             <div className="divide-y divide-white/5">
              {topContent.slice(5, 10).map((item, idx) => (
                <div key={item.id} className="flex items-center gap-4 p-5 hover:bg-white/5 transition-colors group">
                   <div className="text-lg font-black italic opacity-20 w-8 text-center">{idx + 6}</div>
                   <div className="flex-1">
                      <h4 className="font-bold uppercase text-xs truncate">{item.title}</h4>
                      <p className="text-[9px] font-black uppercase text-secondary/60">{item.views?.toLocaleString() || 0} Acessos</p>
                   </div>
                   <div className="bg-secondary/10 px-3 py-1 rounded-full border border-secondary/20">
                      <span className="text-[8px] font-black text-secondary uppercase">{item.type}</span>
                   </div>
                </div>
              ))}
              {topContent.length < 6 && (
                <div className="p-20 text-center opacity-20 font-black uppercase text-xs">Aguardando mais dados...</div>
              )}
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
