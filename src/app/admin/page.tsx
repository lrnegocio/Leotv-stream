
'use client';

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Tv, ArrowUpRight, PlayCircle, ShieldCheck, Loader2, Briefcase, Zap, Star, AlertTriangle, RefreshCcw, CreditCard, HardDriveDownload, Cloud } from "lucide-react"
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

  const loadData = React.useCallback(async () => {
    setLoading(true)
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
      
      toast({ title: "NUVEM FIREBASE SINCRONIZADA v385" })
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro na Cloud", description: "Verifique a internet da VPS." })
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => { loadData() }, [loadData])

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
      <Loader2 className="h-12 w-12 animate-spin text-primary" />
      <p className="text-[10px] font-black uppercase tracking-widest text-primary">Sintonizando v385 Cloud...</p>
    </div>
  )

  const stats = [
    { title: "Clientes Cloud", value: users.length.toString(), icon: Users, color: "text-blue-500" },
    { title: "Sinais na Rede", value: totalContent.toLocaleString(), icon: Zap, color: "text-amber-500" },
    { title: "Sinais PPV", value: ppvCount.toLocaleString(), icon: Zap, color: "text-orange-500" },
    { title: "Sinais ALACARTE", value: alacarteCount.toLocaleString(), icon: Star, color: "text-blue-600" },
    { title: "Revendas", value: resellers.length.toString(), icon: Briefcase, color: "text-emerald-500" },
  ]

  return (
    <div className="space-y-8 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black font-headline uppercase italic text-primary">Painel Cloud v385-S</h1>
          <p className="text-muted-foreground uppercase text-[10px] tracking-widest font-bold">Gestão central via Firebase Firestore.</p>
        </div>
        <Button onClick={loadData} variant="outline" className="h-12 w-12 rounded-xl border-primary/20">
           <RefreshCcw className={`h-5 w-5 text-primary`} />
        </Button>
      </div>

      <div className="bg-emerald-500/10 border-2 border-emerald-500/20 p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-6 animate-in slide-in-from-top-4 shadow-2xl">
         <div className="bg-emerald-500 p-4 rounded-3xl shadow-lg">
           <Cloud className="h-8 w-8 text-white" />
         </div>
         <div className="flex-1 text-center md:text-left">
            <p className="text-[12px] font-black uppercase text-emerald-500 tracking-widest mb-1">Status: Conexão Cloud Blindada</p>
            <p className="text-base font-bold leading-relaxed text-foreground">
              Mestre Léo, o sistema agora está operando via Firebase. Seus dados estão salvos nos servidores do Google. O Supabase foi desativado por segurança.
            </p>
         </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        {stats.map((stat) => (
          <Card key={stat.title} className="bg-card border-border rounded-[2rem] hover:border-primary/30 transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">{stat.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-black tracking-tight">{stat.value}</div>
              <p className="text-[9px] text-muted-foreground mt-1 flex items-center uppercase font-bold tracking-widest">
                <ArrowUpRight className={`h-3 w-3 mr-1 text-emerald-500`} />
                Sinal Cloud Ativo
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-card border-border rounded-[2.5rem] overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border p-8 bg-black/5">
          <div>
            <CardTitle className="uppercase text-sm font-black tracking-widest italic text-primary">Monitoramento Master v385-S</CardTitle>
            <p className="text-[9px] text-muted-foreground uppercase font-bold">Status real de acessos por PIN Cloud.</p>
          </div>
          <Button variant="ghost" size="sm" asChild className="uppercase text-[9px] font-black hover:text-primary"><Link href="/admin/users">Ver todos</Link></Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y divide-border">
            {users.slice(0, 5).map((user) => {
              const isExpired = user.expiryDate && new Date(user.expiryDate) < new Date();
              const statusColor = user.isBlocked ? 'text-destructive' : isExpired ? 'text-orange-500' : 'text-emerald-500';
              return (
                <div key={user.id} className="flex items-center gap-6 p-6 hover:bg-muted/50 transition-colors">
                  <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center font-mono font-black text-primary uppercase text-lg">{user.pin.substring(0, 2)}</div>
                  <div className="flex-1">
                    <p className="font-black uppercase tracking-[0.2em] text-sm">{user.pin}</p>
                    <p className="text-[9px] text-muted-foreground uppercase font-bold mt-1">{user.subscriptionTier} • {user.activatedAt ? 'Ativado' : 'Cloud Store'}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-[10px] font-black uppercase ${statusColor}`}>{user.isBlocked ? 'BLOQUEADO' : isExpired ? 'EXPIRADO' : 'ATIVO'}</p>
                  </div>
                </div>
              );
            })}
            {users.length === 0 && <div className="p-10 text-center opacity-30 uppercase font-black text-xs">Aguardando novos dados no Firebase Cloud...</div>}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
