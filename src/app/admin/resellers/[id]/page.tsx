"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { ChevronLeft, Key, Plus, Loader2, Users, ShieldAlert, Timer, Trash2, Mail, Phone, Calendar as CalendarIcon, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getRemoteResellers, saveReseller, saveUser, generateRandomPin, getRemoteUsers, removeReseller, Reseller, User } from "@/lib/store"
import { toast } from "@/hooks/use-toast"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ResellerManagementPage() {
  const { id } = useParams()
  const router = useRouter()
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
    } else {
      toast({ variant: "destructive", title: "Erro", description: "Revendedor não encontrado." })
      router.push("/admin/resellers")
    }
    setLoading(false)
  }, [id, router])

  React.useEffect(() => { loadData() }, [loadData])

  const handleAddCredits = async () => {
    if (!reseller) return
    const updated = { ...reseller, credits: reseller.credits + pinsToAdd }
    await saveReseller(updated)
    setReseller(updated)
    toast({ title: "Estoque de Créditos Atualizado!" })
  }

  const handleDeleteReseller = async () => {
    if (confirm("ATENÇÃO: Deseja realmente remover este parceiro e todo o seu estoque? Esta ação é irreversível.")) {
      const success = await removeReseller(id as string)
      if (success) {
        toast({ title: "Removido", description: "O parceiro foi excluído do sistema." })
        router.push("/admin/resellers")
      } else {
        toast({ variant: "destructive", title: "Erro ao Excluir", description: "Não foi possível remover no Supabase." })
      }
    }
  }

  const handleGeneratePins = async (type: 'monthly' | 'test' = 'monthly') => {
    if (!reseller) return;
    
    if (type === 'monthly' && reseller.credits < 1) {
      toast({ variant: "destructive", title: "SEM CRÉDITOS", description: "Adicione créditos ao estoque do revendedor." })
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
    toast({ title: type === 'test' ? "TESTE 6H GERADO!" : "PIN 30 DIAS GERADO!", description: `CÓDIGO: ${newPin}` })
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
            <h1 className="text-3xl font-black uppercase font-headline italic text-primary">{reseller.name}</h1>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Painel de Controle de Revenda Master</p>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="px-6 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex flex-col items-center">
            <span className="text-[8px] font-black uppercase opacity-60">Créditos em Estoque</span>
            <span className="text-2xl font-black text-emerald-500">{reseller.credits}</span>
          </div>
          <div className="px-6 py-2 bg-primary/10 border border-primary/20 rounded-2xl flex flex-col items-center">
            <span className="text-[8px] font-black uppercase opacity-60">Total Vendido</span>
            <span className="text-2xl font-black text-primary">{reseller.totalSold}</span>
          </div>
          <Button variant="ghost" size="icon" onClick={handleDeleteReseller} className="h-14 w-14 rounded-2xl bg-destructive/10 text-destructive hover:bg-destructive hover:text-white transition-all shadow-lg border border-destructive/20" title="Excluir Revendedor">
            <Trash2 className="h-6 w-6" />
          </Button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="space-y-6">
          <Card className="bg-card/50 border-white/5 shadow-2xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-primary/5 border-b border-white/5 p-6">
              <CardTitle className="text-sm font-black uppercase italic tracking-widest flex items-center gap-2">
                <Plus className="h-4 w-4" /> Abastecer Estoque
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <Input 
                type="number" 
                value={pinsToAdd} 
                onChange={e => setPinsToAdd(parseInt(e.target.value))} 
                className="h-14 bg-black/40 text-center text-xl font-black border-white/5"
              />
              <Button onClick={handleAddCredits} className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 font-black uppercase text-xs">
                ADICIONAR AGORA
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-card/50 border-white/5 shadow-2xl rounded-3xl overflow-hidden">
            <CardHeader className="bg-white/5 border-b border-white/5 p-6">
              <CardTitle className="text-sm font-black uppercase italic tracking-widest flex items-center gap-2">
                <FileText className="h-4 w-4" /> Dados do Parceiro
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3 opacity-60">
                   <Mail className="h-4 w-4 text-primary" />
                   <span className="text-xs font-bold uppercase truncate">{reseller.email}</span>
                </div>
                <div className="flex items-center gap-3 opacity-60">
                   <Phone className="h-4 w-4 text-emerald-500" />
                   <span className="text-xs font-bold uppercase">{reseller.phone}</span>
                </div>
                <div className="flex items-center gap-3 opacity-60">
                   <CalendarIcon className="h-4 w-4 text-blue-400" />
                   <span className="text-xs font-bold uppercase">{reseller.birthDate ? new Date(reseller.birthDate).toLocaleDateString() : 'N/A'}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4">
            <Button onClick={() => handleGeneratePins('monthly')} disabled={isGenerating} className="w-full h-20 bg-primary text-lg font-black uppercase shadow-2xl shadow-primary/20 rounded-3xl transition-transform active:scale-95">
              {isGenerating ? <Loader2 className="h-8 w-8 animate-spin" /> : <><Key className="mr-3 h-8 w-8" /> GERAR PIN (30 DIAS)</>}
            </Button>

            <Button onClick={() => handleGeneratePins('test')} disabled={isGenerating} variant="outline" className="w-full h-16 border-white/10 text-emerald-400 font-black uppercase rounded-3xl hover:bg-emerald-500/10 transition-transform active:scale-95">
              <Timer className="mr-2 h-6 w-6" /> TESTE GRÁTIS (6H)
            </Button>
          </div>
        </div>

        <div className="lg:col-span-2">
          <Card className="bg-card/50 border-white/5 shadow-2xl rounded-3xl overflow-hidden">
            <CardHeader className="border-b border-white/5 flex flex-row items-center justify-between p-6 bg-black/20">
              <CardTitle className="text-sm font-black uppercase italic tracking-widest flex items-center gap-2">
                <Users className="h-4 w-4 text-primary" /> Histórico de Vendas da Revenda
              </CardTitle>
              <span className="text-[10px] font-black opacity-40 uppercase">{users.length} Registros</span>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-white/5 max-h-[500px] overflow-y-auto">
                {users.length === 0 ? (
                  <div className="p-20 text-center opacity-30 uppercase font-black text-xs">Nenhum PIN gerado ainda.</div>
                ) : (
                  users.sort((a,b) => b.id.localeCompare(a.id)).map(u => (
                    <div key={u.id} className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors">
                      <div className="flex items-center gap-6">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg shadow-inner border border-white/5 ${u.subscriptionTier === 'test' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-primary/10 text-primary'}`}>
                          {u.pin.substring(0, 2)}
                        </div>
                        <div>
                          <p className="font-mono font-black text-xl text-primary tracking-[0.2em]">{u.pin}</p>
                          <p className="text-[8px] font-black uppercase opacity-50">
                            {u.subscriptionTier === 'test' ? 'TESTE 6H' : 'PLANO 30 DIAS'} • {u.activatedAt ? `ATIVADO EM: ${new Date(u.activatedAt).toLocaleDateString()}` : 'DISPONÍVEL NO ESTOQUE'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`text-[10px] font-black uppercase ${u.isBlocked ? 'text-destructive' : 'text-emerald-500'}`}>
                          {u.isBlocked ? 'BLOQUEADO/EXPIRADO' : u.expiryDate ? `EXPIRA: ${new Date(u.expiryDate).toLocaleString()}` : 'ESTOQUE'}
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