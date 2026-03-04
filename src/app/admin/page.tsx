
"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Film, Users, Tv, Key, ArrowUpRight, PlayCircle, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { mockUsers, mockContent } from "@/lib/store"

export default function AdminDashboard() {
  const stats = [
    { title: "Clientes Ativos", value: mockUsers.length.toString(), icon: Users, color: "text-blue-400" },
    { title: "Canais P2P", value: mockContent.filter(c => c.type === 'channel').length.toString(), icon: Tv, color: "text-primary" },
    { title: "Filmes/Séries", value: mockContent.filter(c => c.type !== 'channel').length.toString(), icon: Film, color: "text-secondary" },
    { title: "PINs Gerados", value: "152", icon: Key, color: "text-orange-400" },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Painel Master Léo Tv</h1>
          <p className="text-muted-foreground">Controle de acessos, canais e faturamento.</p>
        </div>
        <div className="flex gap-2">
           <Button asChild variant="outline" className="border-primary/20">
            <Link href="/admin/users">
              <Key className="mr-2 h-5 w-5" /> Gerar PIN
            </Link>
          </Button>
          <Button asChild className="bg-primary hover:bg-primary/90">
            <Link href="/admin/content/new">
              <PlayCircle className="mr-2 h-5 w-5" /> Novo Conteúdo
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
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1 flex items-center">
                <ArrowUpRight className="h-3 w-3 mr-1 text-green-400" />
                Crescimento constante
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="bg-card/50 border-white/5 shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Últimos Acessos Gerados</CardTitle>
            <Button variant="ghost" size="sm" asChild><Link href="/admin/users text-primary">Ver todos</Link></Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockUsers.slice(0, 5).map((user) => (
                <div key={user.id} className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 transition-colors group">
                  <div className="w-10 h-10 bg-muted rounded flex items-center justify-center font-mono font-bold text-primary">
                    {user.pin.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold uppercase tracking-widest">{user.pin}</p>
                    <p className="text-xs text-muted-foreground">Plano {user.subscriptionTier} • {user.maxScreens} Telas</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-medium">{user.isBlocked ? 'BLOQUEADO' : 'ATIVO'}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card/50 border-white/5 shadow-xl">
          <CardHeader>
            <CardTitle>Configurações Rápidas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-muted/30 rounded-lg border border-white/5">
               <h4 className="font-semibold mb-2 flex items-center gap-2"><ShieldCheck className="h-4 w-4 text-green-400" /> Sistema P2P Master</h4>
               <p className="text-xs text-muted-foreground">Seu sistema está rodando com aceleração PWA e rede P2P otimizada para canais 4K.</p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium">Senha Mestra Parental (Global)</p>
              <div className="flex gap-2">
                <Input defaultValue="1234" className="bg-background border-white/10" maxLength={4} />
                <Button size="sm">Salvar</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
