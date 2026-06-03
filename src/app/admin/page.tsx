
'use client';

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Tv, ArrowUpRight, PlayCircle, ShieldCheck, Loader2, Briefcase, Zap, Star, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { getRemoteUsers, getRemoteResellers, getTotalContentCount, getCategoryCount, User, Reseller } from "@/lib/store"

export default function AdminDashboard() {
  const [totalContent, setTotalContent] = React.useState(0)
  const [ppvCount, setPpvCount] = React.useState(0)
  const [alacarteCount, setAlacarteCount] = React.useState(0)
  const [users, setUsers] = React.useState<User[]>([])
  const [resellers, setResellers] = React.useState<Reseller[]>([])
  const [loading, setLoading] = React.useState(true)
  const [isDbOffline, setIsDbOffline] = React.useState(false)

  const loadData = React.useCallback(async () => {
    setLoading(true)
    setIsDbOffline(false)
    try {
      const [count, ppv, alacarte, u, r] = await Promise.all([
        getTotalContentCount(),
        getCategoryCount('LÉO TV PAY PER VIEW'),
        getCategoryCount('LÉO TV ALACARTES'),
        getRemoteUsers(),
        getRemoteResellers()
      ])
      
      setTotalContent(count)
      setPpvCount(ppv)
      setAlacarteCount(alacarte)
      setUsers(u)
      setResellers(r)
      
      // Se tudo vier zero mas o sistema está tentando carregar, o banco pode estar offline
      if (count === 0 && u.length === 0) {
        setIsDbOffline(true)
      }
    } catch (err) {
      setIsDbOffline(true)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="text-[10px] font-black uppercase tracking-widest animate-pulse">Sintonizando Banco de Dados...</p>
    </div>
  )

  const stats = [
    { title: "Clientes Ativos", value: users.length.toString(), icon: Users, color: "text-blue-500" },
    { title: "Sinais na Rede", value: totalContent.toLocaleString(), icon: Zap, color: "text-amber-500" },
    { title: "Sinais PPV", value: ppvCount.toLocaleString(), icon: Zap, color: "text-orange-500" },
    { title: "Sinais ALACARTE", value: alacarteCount.toLocaleString(), icon: Star, color: "text-blue-600" },
    { title: "Revendas", value: resellers.length.toString(), icon: Briefcase, color: "text-emerald-500" },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black font-headline uppercase italic text-primary">Painel de Controle v370-S</h1>
          <p className="text-muted-foreground uppercase text-[10px] tracking-widest font-bold">Gerenciamento central da rede StreamSight.</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={loadData} variant="outline" className="h-10 px-4 rounded-xl">
             <Zap className={`h-4 w-4 ${isDbOffline ? 'text-red-500 animate-pulse' : 'text-primary'}`} />
          </Button>
          <Button asChild className="bg-primary hover:bg-primary/90 uppercase font-bold text-[10px] h-10 px-6 rounded-xl shadow-lg shadow-primary/20">
            <Link href="/admin/content/new">
              <PlayCircle className="mr-2 h-4 w-4" /> Novo Conteúdo
            </Link>
          </Button>
        </div>
      </div>

      {isDbOffline && (
        <div className="bg-destructive/10 border-2 border-destructive/20 p-6 rounded-[2rem] flex items-center gap-6 animate-in slide-in-from-top-4 shadow-xl">
           <div className="bg-destructive p-3 rounded-2xl shadow-lg"><AlertTriangle className="h-6 w-6 text-white" /></div>
           <div className="flex-1">
              <p className="text-[10px] font-black uppercase text-destructive tracking-widest mb-1">Aviso: Banco de Dados Offline</p>
              <p className="text-sm font-bold leading-relaxed">Mestre Léo, seu projeto no Supabase está **PAUSADO**. Clique em "Resume Project" no site do Supabase para seus canais voltarem!</p>
           </div>
           <Button variant="outline" className="border-destructive/20 text-destructive font-black text-[10px] uppercase h-10 px-4 rounded-xl" asChild>
             <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer">Ir para o Supabase</a>
           </Button>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => (
          <Card key={stat.title} className="bg-card border-border shadow-sm overflow-hidden relative group rounded-2xl">
            <div className="absolute top-0 right-0 p-4 opacity-5 scale-150 transition-transform group-hover:scale-[1.7]">
              <stat.icon className={`h-12 w-12 ${stat.color}`} />
            </div>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black tracking-tight">{stat.value}</div>
              <p className="text-[9px] text-muted-foreground mt-1 flex items-center uppercase font-bold tracking-widest">
                <ArrowUpRight className={`h-3 w-3 mr-1 ${isDbOffline ? 'text-red-500' : 'text-emerald-500'}`} />
                {isDbOffline ? 'Sinal Offline' : 'Sinal Ativo'}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6">
        <Card className="bg-card border-border shadow-md rounded-2xl overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border p-6">
            <div>
              <CardTitle className="uppercase text-sm font-black tracking-widest italic text-primary">Últimos Acessos por PIN v370</CardTitle>
              <p className="text-[9px] text-muted-foreground uppercase font-bold">Monitoramento em tempo real.</p>
            </div>
            <Button variant="ghost" size="sm" asChild className="uppercase text-[9px] font-black hover:text-primary"><Link href="/admin/users">Ver todos</Link></Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {users.slice(0, 10).map((user) => {
                const isExpired = user.expiryDate && new Date(user.expiryDate) < new Date();
                const statusColor = user.isBlocked ? 'text-destructive' : isExpired ? 'text-orange-500' : 'text-emerald-500';
                const statusText = user.isBlocked ? 'BLOQUEADO' : isExpired ? 'EXPIRADO' : 'ATIVO';

                return (
                  <div key={user.id} className="flex items-center gap-4 p-5 hover:bg-muted transition-colors group">
                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center font-mono font-bold text-primary uppercase text-sm border border-primary/10">
                      {user.pin.substring(0, 2)}
                    </div>
                    <div className="flex-1">
                      <p className="font-black uppercase tracking-widest text-sm text-foreground group-hover:text-primary transition-colors">{user.pin}</p>
                      <p className="text-[9px] text-muted-foreground uppercase font-bold">
                        {user.subscriptionTier === 'test' ? 'Teste' : user.subscriptionTier === 'monthly' ? 'Mensal' : 'Vitalício'} • {user.activatedAt ? 'ATIVO' : 'AGUARDANDO'}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`text-[10px] font-black uppercase ${statusColor}`}>
                        {statusText}
                      </p>
                      <p className="text-[8px] text-muted-foreground uppercase font-bold mt-1">
                        {user.expiryDate ? new Date(user.expiryDate).toLocaleDateString('pt-BR') : 'SEM VALIDADE'}
                      </p>
                    </div>
                  </div>
                );
              })}
              {users.length === 0 && <div className="p-10 text-center opacity-30 font-bold uppercase text-xs">Aguardando retomada do Banco de Dados...</div>}
            </div>
          </CardContent>
        </Card>

        <Card className={`bg-primary/5 border shadow-sm border-l-4 rounded-2xl ${isDbOffline ? 'border-destructive/20 border-l-destructive' : 'border-primary/20 border-l-primary'}`}>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${isDbOffline ? 'bg-destructive/10' : 'bg-primary/10'}`}>
                {isDbOffline ? <AlertTriangle className="h-6 w-6 text-destructive" /> : <ShieldCheck className="h-6 w-6 text-primary" />}
              </div>
              <div>
                <h4 className="font-black text-lg uppercase tracking-tight italic">{isDbOffline ? 'Sinal do Banco Perdido' : 'Status da Rede v370'}</h4>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                  {isDbOffline ? 'O seu Supabase está pausado. Clique em Resume Project no painel deles.' : 'Todos os sinais operando com estabilidade máxima.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
