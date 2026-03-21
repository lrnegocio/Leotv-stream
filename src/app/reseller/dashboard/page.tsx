"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Key, Timer, Plus, LogOut, Briefcase, Users, Search, RefreshCcw, Send, Loader2, Zap, Tv, Copy, Check, Monitor } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getRemoteUsers, saveUser, saveReseller, generateRandomPin, getBeautifulMessage, renewUserSubscription, Reseller, User } from "@/lib/store"
import { toast } from "@/hooks/use-toast"

export default function ResellerDashboard() {
  const [reseller, setReseller] = React.useState<Reseller | null>(null)
  const [myUsers, setMyUsers] = React.useState<User[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [isGenerating, setIsGenerating] = React.useState(false)
  const [isRenewing, setIsRenewing] = React.useState<string | null>(null)
  const [numScreens, setNumScreens] = React.useState("1")
  const router = useRouter()

  const loadData = React.useCallback(async () => {
    const session = localStorage.getItem("reseller_session")
    if (!session) { router.push("/login"); return; }
    const currentReseller = JSON.parse(session)
    
    try {
      const allUsers = await getRemoteUsers()
      setMyUsers(allUsers.filter(u => u.resellerId === currentReseller.id))
      setReseller(currentReseller)
    } catch (e) {
      toast({ variant: "destructive", title: "Erro de conexão com o núcleo." })
    } finally {
      setLoading(false)
    }
  }, [router])

  React.useEffect(() => { loadData() }, [loadData])

  const handleAction = async (type: 'test' | 'monthly') => {
    if (!reseller) return
    
    const screens = parseInt(numScreens)
    if (type === 'monthly' && reseller.credits < screens) {
      toast({ variant: "destructive", title: "ESTOQUE INSUFICIENTE", description: `Você precisa de ${screens} créditos para ${screens} telas.` })
      return
    }

    setIsGenerating(true)
    const pin = generateRandomPin()
    
    const newUser: User = {
      id: "user_" + Date.now() + Math.random().toString(36).substring(7),
      pin,
      role: 'user',
      subscriptionTier: type,
      maxScreens: screens,
      activeDevices: [],
      isBlocked: false,
      resellerId: reseller.id
    }

    const success = await saveUser(newUser)
    
    if (success) {
      if (type === 'monthly') {
        const updated = { 
          ...reseller, 
          credits: reseller.credits - screens, 
          totalSold: (reseller.totalSold || 0) + 1 
        }
        await saveReseller(updated)
        setReseller(updated)
        localStorage.setItem("reseller_session", JSON.stringify(updated))
      }
      toast({ title: "PIN GERADO COM SUCESSO!", description: `O código ${pin} (${screens} telas) está ativo.` })
      await loadData()
    }
    setIsGenerating(false)
  }

  const handleRenew = async (userId: string) => {
    if (!reseller) return
    const user = myUsers.find(u => u.id === userId)
    if (!user) return

    const cost = user.maxScreens || 1
    if (reseller.credits < cost) {
      toast({ variant: "destructive", title: "ESTOQUE INSUFICIENTE", description: `Necessário ${cost} créditos.` })
      return
    }

    if (!confirm(`Deseja renovar este PIN (${user.maxScreens} telas) por +30 dias? Custo: ${cost} créditos.`)) return

    setIsRenewing(userId)
    const result = await renewUserSubscription(userId, reseller.id)
    
    if (result.success) {
      toast({ title: "RENOVAÇÃO MASTER ATIVA!" })
      if (result.reseller) {
        setReseller(result.reseller)
        localStorage.setItem("reseller_session", JSON.stringify(result.reseller))
      }
      await loadData()
    }
    setIsRenewing(null)
  }

  const sendAccess = (pin: string, tier: string, screens: number) => {
    const baseUrl = window.location.origin;
    const msg = getBeautifulMessage(pin, tier, baseUrl, screens);
    const waUrl = `https://wa.me/?text=${msg}`;
    window.open(waUrl, '_blank');
  }

  if (loading || !reseller) return <div className="min-h-screen bg-background flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>

  const filteredUsers = myUsers.filter(u => u.pin.includes(search)).sort((a,b) => b.id.localeCompare(a.id))

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <header className="h-20 border-b border-white/5 bg-card/30 backdrop-blur-xl flex items-center justify-between px-8 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="bg-primary p-2.5 rounded-xl shadow-lg shadow-primary/20"><Briefcase className="h-6 w-6 text-white" /></div>
          <div>
            <h1 className="text-xl font-black uppercase italic text-primary tracking-tighter">Painel do Parceiro</h1>
            <p className="text-[9px] font-bold uppercase opacity-40">{reseller.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="hidden sm:flex flex-col items-end">
            <span className="text-[10px] font-black uppercase text-emerald-500">{reseller.credits} CRÉDITOS</span>
            <span className="text-[8px] font-bold uppercase opacity-40">ESTOQUE ATUAL</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => { localStorage.removeItem("reseller_session"); router.push("/login"); }} className="text-destructive h-12 w-12 rounded-2xl hover:bg-destructive/10"><LogOut className="h-6 w-6" /></Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-8 space-y-8">
        <Card className="bg-primary/5 border border-primary/20 p-6 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <Monitor className="h-8 w-8 text-primary" />
            <div>
              <p className="text-[10px] font-black uppercase opacity-60">Selecione o limite de Telas</p>
              <Select value={numScreens} onValueChange={setNumScreens}>
                <SelectTrigger className="w-48 bg-black/40 border-white/5 h-12 rounded-xl font-black text-primary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Tela (1 crédito)</SelectItem>
                  <SelectItem value="2">2 Telas (2 créditos)</SelectItem>
                  <SelectItem value="3">3 Telas (3 créditos)</SelectItem>
                  <SelectItem value="4">4 Telas (4 créditos)</SelectItem>
                  <SelectItem value="5">5 Telas (5 créditos)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex-1 grid md:grid-cols-2 gap-4 w-full">
            <Button onClick={() => handleAction('monthly')} disabled={isGenerating} className="h-16 bg-primary rounded-2xl text-sm font-black uppercase shadow-xl">
              {isGenerating ? <Loader2 className="animate-spin h-6 w-6" /> : "GERAR PIN (30 DIAS)"}
            </Button>
            <Button onClick={() => handleAction('test')} disabled={isGenerating} variant="outline" className="h-16 border-emerald-500/30 text-emerald-500 rounded-2xl text-sm font-black uppercase hover:bg-emerald-500/10">
              {isGenerating ? <Loader2 className="animate-spin h-6 w-6" /> : "TESTE GRÁTIS (6H)"}
            </Button>
          </div>
        </Card>

        <Card className="bg-card/40 backdrop-blur-3xl border-white/5 rounded-[2.5rem] shadow-2xl overflow-hidden">
          <CardHeader className="border-b border-white/5 flex flex-row items-center justify-between p-8 bg-black/20">
            <CardTitle className="text-sm font-black uppercase italic tracking-widest flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Meus Clientes</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Input placeholder="BUSCAR PIN..." className="pl-9 bg-black/40 border-white/5 text-[9px] font-black uppercase h-10 rounded-xl" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-white/5">
              {filteredUsers.map(u => {
                const now = new Date();
                const isExpired = u.expiryDate && new Date(u.expiryDate) < now && u.subscriptionTier !== 'lifetime';
                return (
                  <div key={u.id} className="p-6 flex flex-col md:flex-row items-center justify-between hover:bg-white/5 transition-colors gap-6">
                    <div className="flex items-center gap-6 w-full">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner border border-white/5 ${u.subscriptionTier === 'test' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-primary/10 text-primary'}`}>
                        {u.pin.substring(0, 2)}
                      </div>
                      <div className="flex-1">
                        <p className="font-black text-2xl tracking-[0.25em] uppercase text-primary">{u.pin}</p>
                        <div className="flex flex-wrap items-center gap-3 mt-1">
                          <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border ${u.isBlocked ? 'border-destructive text-destructive' : isExpired ? 'border-destructive text-destructive' : 'border-emerald-500/30 text-emerald-500'}`}>
                            {u.isBlocked ? 'ACESSO BLOQUEADO' : isExpired ? 'SINAL EXPIRADO' : 'SINAL ATIVO'}
                          </span>
                          <span className="text-[8px] font-black opacity-40 uppercase tracking-widest">{u.maxScreens} TELAS • {u.subscriptionTier === 'test' ? 'TESTE' : 'MENSAL'}</span>
                          {u.expiryDate && (
                            <span className="text-[8px] font-black opacity-30 uppercase">EXPIRA: {new Date(u.expiryDate).toLocaleString('pt-BR')}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 w-full md:w-auto">
                      <Button variant="outline" size="sm" onClick={() => sendAccess(u.pin, u.subscriptionTier, u.maxScreens)} className="flex-1 md:flex-none h-12 border-emerald-500/20 text-emerald-500 text-[9px] font-black px-4 rounded-2xl hover:bg-emerald-500/10">
                        <Send className="h-4 w-4 mr-2" /> ENVIAR
                      </Button>
                      <Button variant="outline" size="sm" disabled={isRenewing === u.id} onClick={() => handleRenew(u.id)} className="flex-1 md:flex-none h-12 border-primary/20 text-primary text-[9px] font-black px-4 rounded-2xl hover:bg-primary/10">
                        {isRenewing === u.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />} RENOVAR
                      </Button>
                    </div>
                  </div>
                )
              })}
              {filteredUsers.length === 0 && <div className="p-20 text-center opacity-30 font-black uppercase text-xs">Nenhum PIN localizado.</div>}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
