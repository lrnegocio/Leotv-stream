
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Key, Timer, Plus, LogOut, Briefcase, Users, Search, RefreshCcw, Send, Loader2, Zap } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getRemoteUsers, saveUser, saveReseller, generateRandomPin, getBeautifulMessage, renewUserSubscription, Reseller, User } from "@/lib/store"
import { toast } from "@/hooks/use-toast"

export default function ResellerDashboard() {
  const [reseller, setReseller] = React.useState<Reseller | null>(null)
  const [myUsers, setMyUsers] = React.useState<User[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [isGenerating, setIsGenerating] = React.useState(false)
  const [isRenewing, setIsRenewing] = React.useState<string | null>(null)
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
    
    if (type === 'monthly' && reseller.credits < 1) {
      toast({ variant: "destructive", title: "ESTOQUE VAZIO", description: "Compre créditos com o Admin Master." })
      return
    }

    setIsGenerating(true)
    const pin = generateRandomPin()
    
    const newUser: User = {
      id: "user_" + Date.now() + Math.random().toString(36).substring(7),
      pin,
      role: 'user',
      subscriptionTier: type,
      maxScreens: 1,
      activeDevices: [],
      isBlocked: false,
      resellerId: reseller.id
    }

    const success = await saveUser(newUser)
    
    if (success) {
      if (type === 'monthly') {
        const updated = { 
          ...reseller, 
          credits: reseller.credits - 1, 
          totalSold: (reseller.totalSold || 0) + 1 
        }
        await saveReseller(updated)
        setReseller(updated)
        localStorage.setItem("reseller_session", JSON.stringify(updated))
      }
      toast({ title: "PIN GERADO COM SUCESSO!", description: `O código ${pin} já está ativo.` })
      await loadData()
    } else {
      toast({ variant: "destructive", title: "ERRO DE GRAVAÇÃO", description: "Verifique se o Admin criou a coluna resellerId no Supabase." })
    }
    setIsGenerating(false)
  }

  const handleRenew = async (userId: string) => {
    if (!reseller) return
    if (reseller.credits < 1) {
      toast({ variant: "destructive", title: "SEM CRÉDITOS PARA RENOVAR" })
      return
    }

    if (!confirm("Deseja usar 1 crédito para somar +30 dias ao tempo atual do cliente?")) return

    setIsRenewing(userId)
    const result = await renewUserSubscription(userId, reseller.id)
    
    if (result.success) {
      toast({ title: "RENOVAÇÃO MASTER ATIVA!", description: "O tempo foi acumulado com sucesso." })
      if (result.reseller) {
        setReseller(result.reseller)
        localStorage.setItem("reseller_session", JSON.stringify(result.reseller))
      }
      await loadData()
    } else {
      toast({ variant: "destructive", title: "ERRO NA RENOVAÇÃO", description: result.error })
    }
    setIsRenewing(null)
  }

  const sendAccess = (pin: string, tier: string) => {
    const msg = encodeURIComponent(getBeautifulMessage(pin, tier))
    window.open(`https://wa.me/?text=${msg}`, '_blank')
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
        <div className="grid md:grid-cols-2 gap-6">
          <Button onClick={() => handleAction('monthly')} disabled={isGenerating} className="h-24 bg-primary rounded-3xl text-xl font-black uppercase shadow-2xl shadow-primary/20 hover:scale-[1.02] transition-all">
            {isGenerating ? <Loader2 className="animate-spin h-8 w-8" /> : <><Key className="mr-3 h-8 w-8" /> GERAR PIN (30 DIAS)</>}
          </Button>
          <Button onClick={() => handleAction('test')} disabled={isGenerating} variant="outline" className="h-24 border-emerald-500/30 text-emerald-500 rounded-3xl text-xl font-black uppercase hover:bg-emerald-500/10">
            {isGenerating ? <Loader2 className="animate-spin h-8 w-8" /> : <><Timer className="mr-3 h-8 w-8" /> TESTE GRÁTIS (6H)</>}
          </Button>
        </div>

        <Card className="bg-card/40 backdrop-blur-3xl border-white/5 rounded-[2.5rem] shadow-2xl overflow-hidden">
          <CardHeader className="border-b border-white/5 flex flex-row items-center justify-between p-8 bg-black/20">
            <CardTitle className="text-sm font-black uppercase italic tracking-widest flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Meus Clientes & PINs</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Input placeholder="BUSCAR PIN..." className="pl-9 bg-black/40 border-white/5 text-[9px] font-black uppercase h-10 rounded-xl" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-white/5">
              {filteredUsers.map(u => {
                const isExpired = u.expiryDate && new Date(u.expiryDate) < new Date();
                return (
                  <div key={u.id} className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors group">
                    <div className="flex items-center gap-6">
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner border border-white/5 ${u.subscriptionTier === 'test' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-primary/10 text-primary'}`}>
                        {u.pin.substring(0, 2)}
                      </div>
                      <div>
                        <p className="font-black text-2xl tracking-[0.25em] uppercase text-primary">{u.pin}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className={`text-[8px] font-bold uppercase ${isExpired ? 'text-destructive' : 'opacity-40'}`}>
                            {isExpired ? 'SINAL EXPIRADO' : u.subscriptionTier === 'test' ? 'TESTE 6 HORAS' : 'MENSAL 30 DIAS'} 
                          </p>
                          {u.expiryDate && (
                            <span className="text-[8px] font-black opacity-30 uppercase tracking-widest">• EXPIRA EM: {new Date(u.expiryDate).toLocaleString('pt-BR')}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        disabled={isRenewing === u.id}
                        onClick={() => handleRenew(u.id)} 
                        className="h-12 border-primary/20 text-primary text-[9px] font-black uppercase px-6 rounded-2xl hover:bg-primary/10 shadow-lg shadow-primary/5"
                      >
                        {isRenewing === u.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Zap className="mr-2 h-4 w-4" /> RENOVAR</>}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => sendAccess(u.pin, u.subscriptionTier)} className="h-12 border-emerald-500/20 text-emerald-500 text-[9px] font-black uppercase px-6 rounded-2xl hover:bg-emerald-500/10 shadow-lg shadow-emerald-500/5"><Send className="mr-2 h-4 w-4" /> WHATSAPP</Button>
                    </div>
                  </div>
                )
              })}
              {filteredUsers.length === 0 && <div className="p-20 text-center opacity-30 font-black uppercase text-xs">Nenhum PIN localizado na base.</div>}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
