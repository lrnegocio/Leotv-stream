
'use client';

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Tv, ArrowUpRight, PlayCircle, ShieldCheck, Loader2, Briefcase, Zap, Star, AlertTriangle, RefreshCcw } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { getRemoteUsers, getRemoteResellers, getTotalContentCount, getCategoryCount, User, Reseller } from "@/lib/store"
import { toast } from "@/hooks/use-toast"

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
      // TENTATIVA DE CONEXÃO MASTER v370-S
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
      
      // Detecção de sinal vazio por pausa do Supabase
      if (count === 0 && u.length === 0) {
        setIsDbOffline(true)
      } else {
        toast({ title: "DADOS SINCRONIZADOS v370-S" })
      }
    } catch (err: any) {
      console.error("ERRO DE SINTONIA ADMIN:", err.message);
      setIsDbOffline(true)
      toast({ 
        variant: "destructive", 
        title: "SINAL DO BANCO PERDIDO", 
        description: "Mestre Léo, seu Supabase está dormindo ou offline." 
      })
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadData()
  }, [loadData])

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="text-[10px] font-black uppercase tracking-widest animate-pulse text-primary">Sintonizando Banco de Dados v370-S...</p>
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
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black font-headline uppercase italic text-primary">Painel de Controle v370-S</h1>
          <p className="text-muted-foreground uppercase text-[10px] tracking-widest font-bold">Gestão central da rede StreamSight.</p>
        </div>
        <div className="flex gap-3">
          <Button onClick={loadData} variant="outline" className="h-12 w-12 rounded-xl border-primary/20 hover:bg-primary/5 transition-all">
             <RefreshCcw className={`h-5 w-5 ${isDbOffline ? 'text-red-500' : 'text-primary'}`} />
          </Button>
          <Button asChild className="bg-primary hover:bg-primary/90 uppercase font-black text-[10px] h-12 px-6 rounded-xl shadow-lg shadow-primary/20">
            <Link href="/admin/content/new">
              <PlayCircle className="mr-2 h-4 w-4" /> Novo Conteúdo
            </Link>
          </Button>
        </div>
      </div>

      {isDbOffline && (
        <div className="bg-destructive/10 border-2 border-destructive/20 p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-6 animate-in slide-in-from-top-4 shadow-2xl">
           <div className="bg-destructive p-4 rounded-3xl shadow-lg"><AlertTriangle className="h-8 w-8 text-white" /></div>
           <div className="flex-1 text-center md:text-left">
              <p className="text-[12px] font-black uppercase text-destructive tracking-widest mb-1">Aviso Crítico: Banco de Dados Pausado</p>
              <p className="text-base font-bold leading-relaxed">Mestre Léo, seu projeto no Supabase está **PAUSADO**. Clique no botão verde "Resume Project" no painel do Supabase para seus canais voltarem!</p>
           </div>
           <Button variant="outline" className="border-destructive/30 text-destructive font-black text-[10px] uppercase h-14 px-8 rounded-2xl hover:bg-destructive hover:text-white transition-all" asChild>
             <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer">Retomar no Supabase</a>
           </Button>
        </div>
      )}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => (
          <Card key={stat.title} className="bg-card border-border shadow-sm overflow-hidden relative group rounded-[2rem] hover:border-primary/30 transition-all">
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
        <Card className="bg-card border-border shadow-md rounded-[2.5rem] overflow-hidden border-white/5">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border p-8 bg-black/5">
            <div>
              <CardTitle className="uppercase text-sm font-black tracking-widest italic text-primary">Monitoramento Master v370-S</CardTitle>
              <p className="text-[9px] text-muted-foreground uppercase font-bold">Status real de acessos por PIN.</p>
            </div>
            <Button variant="ghost" size="sm" asChild className="uppercase text-[9px] font-black hover:text-primary"><Link href="/admin/users">Ver todos</Link></Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border">
              {users.slice(0, 8).map((user) => {
                const isExpired = user.expiryDate && new Date(user.expiryDate) < new Date();
                const statusColor = user.isBlocked ? 'text-destructive' : isExpired ? 'text-orange-500' : 'text-emerald-500';
                const statusText = user.isBlocked ? 'BLOQUEADO' : isExpired ? 'EXPIRADO' : 'ATIVO';

                return (
                  <div key={user.id} className="flex items-center gap-6 p-6 hover:bg-muted/50 transition-colors group">
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center font-mono font-black text-primary uppercase text-lg border border-primary/10 group-hover:scale-105 transition-transform">
                      {user.pin.substring(0, 2)}
                    </div>
                    <div className="flex-1">
                      <p className="font-black uppercase tracking-[0.2em] text-sm text-foreground group-hover:text-primary transition-colors">{user.pin}</p>
                      <p className="text-[9px] text-muted-foreground uppercase font-bold mt-1">
                        {user.subscriptionTier === 'test' ? 'Teste' : user.subscriptionTier === 'monthly' ? 'Mensal' : 'Vitalício'} • {user.activatedAt ? 'Ativado' : 'Aguardando'}
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
              {users.length === 0 && (
                <div className="p-20 text-center flex flex-col items-center gap-4 opacity-30">
                   <Ghost className="h-12 w-12" />
                   <p className="font-black uppercase text-xs">{isDbOffline ? 'Sinal do Banco Perdido' : 'Aguardando primeiros clientes...'}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className={`bg-primary/5 border shadow-xl border-l-8 rounded-[2rem] transition-all ${isDbOffline ? 'border-destructive/30 border-l-destructive shadow-destructive/5' : 'border-primary/20 border-l-primary shadow-primary/5'}`}>
          <CardContent className="p-8">
            <div className="flex items-center gap-6">
              <div className={`p-4 rounded-3xl shadow-lg ${isDbOffline ? 'bg-destructive/10' : 'bg-primary/10'}`}>
                {isDbOffline ? <AlertTriangle className="h-8 w-8 text-destructive animate-pulse" /> : <ShieldCheck className="h-8 w-8 text-primary" />}
              </div>
              <div>
                <h4 className="font-black text-2xl uppercase tracking-tight italic text-foreground">{isDbOffline ? 'Sinal do Banco Perdido' : 'Rede Operacional v370-S'}</h4>
                <p className="text-[11px] text-muted-foreground uppercase tracking-widest font-bold mt-1">
                  {isDbOffline ? 'O seu Supabase está pausado. Retome o projeto para restaurar os canais.' : 'Todos os servidores e conexões operando com estabilidade absoluta.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

const Ghost = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" height="24" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg">
    <path d="M9 10h.01"/><path d="M15 10h.01"/><path d="M12 2a8 8 0 0 0-8 8v12l3-3 2.5 2.5L12 19l2.5 2.5L17 19l3 3V10a8 8 0 0 0-8-8z"/>
  </svg>
);
