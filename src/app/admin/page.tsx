
"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Film, Users, Tv, Key, ArrowUpRight, PlayCircle, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { getMockUsers, getMockContent } from "@/lib/store"

export default function AdminDashboard() {
  const [content, setContent] = React.useState<any[]>([])
  const [users, setUsers] = React.useState<any[]>([])

  React.useEffect(() => {
    setContent(getMockContent())
    setUsers(getMockUsers())
  }, [])

  const stats = [
    { title: "Clientes Ativos", value: users.length.toString(), icon: Users, color: "text-blue-400" },
    { title: "Canais P2P", value: content.filter(c => c.type === 'channel').length.toString(), icon: Tv, color: "text-primary" },
    { title: "Filmes/Séries", value: content.filter(c => c.type !== 'channel').length.toString(), icon: Film, color: "text-secondary" },
    { title: "PINs Criados", value: users.length.toString(), icon: Key, color: "text-orange-400" },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight uppercase font-headline">Painel Master Léo Tv</h1>
          <p className="text-muted-foreground uppercase text-[10px] tracking-widest">Controle de acessos e rede P2P.</p>
        </div>
        <div className="flex gap-2">
           <Button asChild variant="outline" className="border-primary/20 uppercase font-bold text-[10px]">
            <Link href="/admin/users">
              <Key className="mr-2 h-4 w-4" /> Gerar PIN
            </Link>
          </Button>
          <Button asChild className="bg-primary hover:bg-primary/90 uppercase font-bold text-[10px]">
            <Link href="/admin/content/new">
              <PlayCircle className="mr-2 h-4 w-4" /> Novo Conteúdo
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="bg-card/50 border-white/5 shadow-lg overflow-hidden relative group">
            <div className="absolute top-0 right-0 p-4 opacity-10 scale-150 transition-transform group-hover:scale-[1.7]">
              <stat.icon className={`h-12 w-12 ${stat.color}`} />
            </div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-xs font-medium uppercase tracking-widest">{stat.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
              <p className="text-[9px] text-muted-foreground mt-1 flex items-center uppercase font-bold tracking-widest">
                <ArrowUpRight className="h-3 w-3 mr-1 text-green-400" />
                Sincronizado
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6">
        <Card className="bg-card/50 border-white/5 shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="uppercase text-lg">Acessos Recentes</CardTitle>
              <p className="text-[10px] text-muted-foreground uppercase">Últimos PINs gerados no sistema.</p>
            </div>
            <Button variant="ghost" size="sm" asChild className="uppercase text-[10px] font-bold"><Link href="/admin/users">Ver todos</Link></Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {users.slice(0, 5).map((user) => (
                <div key={user.id} className="flex items-center gap-4 p-4 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5 group">
                  <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center font-mono font-bold text-primary uppercase text-lg">
                    {user.pin.substring(0, 2)}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold uppercase tracking-widest text-sm text-primary">{user.pin}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-widest">Plano {user.subscriptionTier === 'test' ? 'Teste' : 'Mensal'} • {user.maxScreens} Telas</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-[10px] font-bold tracking-widest uppercase ${user.isBlocked ? 'text-destructive' : 'text-green-400'}`}>
                      {user.isBlocked ? 'BLOQUEADO' : 'SINAL ATIVO'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-white/5 shadow-xl border-l-4 border-l-primary">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/20 rounded-full">
                <ShieldCheck className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h4 className="font-bold text-lg uppercase tracking-tight">Status do Sistema P2P Master</h4>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Sua rede está otimizada para transmissões em tempo real 4K sem travamentos em {users.length} aparelhos ativos.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
