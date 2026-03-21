"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { ChevronLeft, Key, Plus, Loader2, TrendingUp, Users, ShieldAlert, Timer } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getRemoteResellers, saveReseller, saveUser, generateRandomPin, getRemoteUsers, Reseller, User } from "@/lib/store"
import { toast } from "@/hooks/use-toast"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ResellerManagementPage() {
  const { id } = useParams()
  const [reseller, setReseller] = React.useState<Reseller | null>(null)
  const [users, setUsers] = React.useState<User[]>([])
  const [loading, setLoading] = React.useState(true)
  const [pinsToAdd, setPinsToAdd] = React.useState(1)
  const [isGenerating, setIsGenerating] = React.useState(false)

  const loadData = React.useCallback(async () => {
    setLoading(true)
    const resellers = await getRemoteResellers()
    const r = resellers.find(item => item.id === id)
    if (r) {
      setReseller(r)
      const allUsers = await getRemoteUsers()
      setUsers(allUsers.filter(u => u.resellerId === id))
    }
    setLoading(false)
  }, [id])

  React.useEffect(() => { loadData() }, [loadData])

  const handleAddCredits = async () => {
    if (!reseller) return
    const updated = { ...reseller, credits: reseller.credits + pinsToAdd }
    await saveReseller(updated)
    setReseller(updated)
    toast({ title: "Créditos Adicionados" })
  }

  const handleGeneratePins = async (type: 'monthly' | 'test' = 'monthly') => {
    if (!reseller) return;
    
    if (type === 'monthly' && reseller.credits < 1) {
      toast({ variant: "destructive", title: "Sem Créditos", description: "Adicione créditos primeiro." })
      return
    }

    setIsGenerating(true)
    const newPin = generateRandomPin()
    
    const newUser: User = {
      id: "user_" + Date.now() + Math.random().toString(36).substring(7),
      pin: newPin,
      role: 'user',
      subscriptionTier: type,
      maxScreens: 1,
      activeDevices: [],
      isBlocked: false,
      resellerId: reseller.id as string
    }

    await saveUser(newUser)
    
    if (type === 'monthly') {
      const updatedReseller = { 
        ...reseller, 
        credits: reseller.credits - 1,
        totalSold: (reseller.totalSold || 0) + 1
      }
      await saveReseller(updatedReseller)
      setReseller(updatedReseller)
    }
    
    await loadData()
    setIsGenerating(false)
    toast({ title: type === 'test' ? "TESTE 6H GERADO!" : "PIN GERADO!", description: `Código: ${newPin}` })
  }

  if (loading || !reseller) return <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin" /></div>

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/resellers"><ChevronLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <h1 className="text-3xl font-black uppercase font-headline italic">{reseller.name}</h1>
            <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Painel de Controle da Revenda</p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="px-6 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex flex-col items-center">
            <span className="text-[8px] font-black uppercase opacity-60">Créditos Atuais</span>
            <span className="text-2xl font-black text-emerald-500">{reseller.credits}</span>
          </div>
          <div className="px-6 py-2 bg-primary/10 border border-primary/20 rounded-2xl flex flex-col items-center">
            <span className="text-[8px] font-black uppercase opacity-60">Total Vendido</span>
            <span className="text-2xl font-black text-primary">{reseller.totalSold}</span>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="space-y-6">
          <Card className="bg-card/50 border-white/5 shadow-2xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-primary/5 border-b border-white/5">
              <CardTitle className="text-sm font-black uppercase italic tracking-widest flex items-center gap-2">
                <Plus className="h-4 w-4" /> Adicionar Créditos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <Input 
                type="number" 
                value={pinsToAdd} 
                onChange={e => setPinsToAdd(parseInt(e.target.value))} 
                className="h-14 bg-black/40 text-center text-xl font-black"
              />
              <Button onClick={handleAddCredits} className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 font-black uppercase">
                ADICIONAR AGORA
              </Button>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            <Button onClick={() => handleGeneratePins('monthly')} disabled={isGenerating} className="w-full h-20 bg-primary text-lg font-black uppercase shadow-2xl shadow-primary/20 rounded-3xl transition-transform active:scale-95">
              {isGenerating ? <Loader2 className="h-8 w-8 animate-spin" /> : <><Key className="mr-3 h-8 w-8" /> VENDER PIN (30 DIAS)</>}
            </Button>

            <Button onClick={() => handleGeneratePins('test')} disabled={isGenerating} variant="outline" className="w-full h-16 border-white/10 text-emerald-400 font-black uppercase rounded-3xl hover:bg-emerald-500/10 transition-transform active:scale-95">
              <Timer className="mr-2 h-6 w-6" /> GERAR TESTE GRÁTIS (6H)
            </Button>
          </div>

          <div className="p-6 bg-destructive/10 border border-destructive/20 rounded-3xl flex gap-4">
            <ShieldAlert className="h-6 w-6 text-destructive shrink-0" />
            <p className="text-[10px] font-bold uppercase leading-tight opacity-70">
              O PIN de teste é ilimitado e não consome créditos. O sistema bloqueia automaticamente se o mesmo aparelho tentar usar mais de um teste.
            </p>
          </div>
        </div>

        <div className="lg:col-span-2">
          <Card className="bg-card/50 border-white/5 shadow-2xl rounded-3xl overflow-hidden">
            <CardHeader className="border-b border-white/5 flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-black uppercase italic tracking-widest flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" /> PINs e Testes da Revenda
              </CardTitle>
              <span className="text-[10px] font-black opacity-40 uppercase">{users.length} Registros</span>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto">
                {users.length === 0 ? (
                  <div className="p-10 text-center opacity-30 uppercase font-black text-xs">Nenhum PIN gerado ainda.</div>
                ) : (
                  users.sort((a,b) => b.id.localeCompare(a.id)).map(u => (
                    <div key={u.id} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`w-2 h-2 rounded-full ${u.subscriptionTier === 'test' ? 'bg-emerald-500' : 'bg-primary'}`} />
                        <div>
                          <p className="font-mono font-black text-lg text-primary tracking-[0.2em]">{u.pin}</p>
                          <p className="text-[8px] font-black uppercase opacity-50">
                            {u.subscriptionTier === 'test' ? 'TESTE 6H' : 'PLANO 30 DIAS'} • {u.activatedAt ? `Ativado em: ${new Date(u.activatedAt).toLocaleDateString()}` : 'AGUARDANDO ATIVAÇÃO'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-[10px] font-black uppercase ${u.isBlocked ? 'text-destructive' : 'text-emerald-500'}`}>
                          {u.isBlocked ? 'BLOQUEADO/EXPIRADO' : u.expiryDate ? `Expira em ${new Date(u.expiryDate).toLocaleString()}` : 'DISPONÍVEL'}
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
