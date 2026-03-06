"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Film, Users, Tv, Key, ArrowUpRight, PlayCircle, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { getMockUsers, getMockContent, User, ContentItem } from "@/lib/store"

export default function AdminDashboard() {
  const [content, setContent] = React.useState<ContentItem[]>([])
  const [users, setUsers] = React.useState<User[]>([])

  React.useEffect(() => {
    setContent(getMockContent())
    setUsers(getMockUsers())
  }, [])

  const stats = [
    { title: "Clientes Ativos", value: users.length.toString(), icon: Users, color: "text-blue-400" },
    { title: "Canais P2P", value: content.filter(c => c.type === 'channel').length.toString(), icon: Tv, color: "text-primary" },
    { title: "Filmes/Séries", value: content.filter(c => c.type !== 'channel').length.toString(), icon: Film, color: "text-secondary" },
    { title: "Sinal Online", value: "100%", icon: Key, color: "text-green-400" },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight uppercase font-headline italic text-primary">Painel Master Léo Tv</h1>
          <p className="text-muted-foreground uppercase text-[10px] tracking-widest font-bold">Gestão Central de Rede P2P e Acessos.</p>
        </div>
        <div className="flex gap-3">
          <Button asChild className="bg-primary hover:bg-primary/90 uppercase font-bold text-[10px] h-10 px-6 rounded-xl shadow-lg shadow-primary/20">
            <Link href="/admin/content/new">
              <PlayCircle className="mr-2 h-4 w-4" /> Novo Canal
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="bg-card/50 border-white/5 shadow-xl overflow-hidden relative group rounded-2xl">
            <div className="absolute top-0 right-0 p-4 opacity-10 scale-150 transition-transform group-hover:scale-[1.7]">
              <stat.icon className={`h-12 w-12 ${stat.color}`} />
            </div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{stat.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tighter">{stat.value}</div>
              <p className="text-[9px] text-muted-foreground mt-1 flex items-center uppercase font-bold tracking-widest">
                <ArrowUpRight className="h-3 w-3 mr-1 text-green-400" />
                Sincronizado
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6">
        <Card className="bg-card/50 border-white/5 shadow-2xl rounded-2xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b border-white/5">
            <div>
              <CardTitle className="uppercase text-sm font-bold tracking-widest italic text-primary">Acessos Recentes</CardTitle>
              <p className="text-[9px] text-muted-foreground uppercase font-bold">Últimos códigos criados ou renovados.</p>
            </div>
            <Button variant="ghost" size="sm" asChild className="uppercase text-[9px] font-bold hover:text-primary"><Link href="/admin/users">Ver todos</Link></Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-white/5">
              {users.slice(0, 5).map((user) => (
                <div key={user.id} className="flex items-center gap-4 p-4 hover:bg-white/5 transition-colors group">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center font-mono font-bold text-primary uppercase text-lg border border-primary/20 shadow-inner">
                    {user.pin.substring(0, 2)}
                  </div>
                  <div className="flex-1">
                    <p className="font-black uppercase tracking-[0.2em] text-sm text-primary group-hover:scale-105 origin-left transition-transform">{user.pin}</p>
                    <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-widest">
                      Plano {user.subscriptionTier === 'test' ? 'Teste' : user.subscriptionTier === 'monthly' ? 'Mensal' : 'Vitalício'} • {user.maxScreens} Telas
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`text-[10px] font-bold tracking-widest uppercase ${user.isBlocked ? 'text-destructive' : 'text-green-400'}`}>
                      {user.isBlocked ? 'BLOQUEADO' : 'SINAL ATIVO'}
                    </p>
                    <p className="text-[8px] text-muted-foreground uppercase font-bold mt-1">
                      {user.expiryDate ? new Date(user.expiryDate).toLocaleDateString('pt-BR') : 'ILIMITADO'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-white/5 shadow-xl border-l-4 border-l-primary rounded-2xl">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/20 rounded-full">
                <ShieldCheck className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h4 className="font-bold text-lg uppercase tracking-tight italic">Status do Sistema P2P Master</h4>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Rede otimizada para transmissões em tempo real 4K sem travamentos em {users.length} aparelhos ativos.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
