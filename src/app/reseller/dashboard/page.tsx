
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Key, Timer, Plus, LogOut, Briefcase, Users, Search, RefreshCcw, Send, Loader2, Zap, Monitor, Lock, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { getRemoteUsers, saveUser, saveReseller, generateRandomPin, getBeautifulMessage, renewUserSubscription, Reseller, User } from "@/lib/store"
import { toast } from "@/hooks/use-toast"

export default function ResellerDashboard() {
  const [reseller, setReseller] = React.useState<Reseller | null>(null)
  const [myUsers, setMyUsers] = React.useState<User[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [isGenerating, setIsGenerating] = React.useState(false)
  const [numScreens, setNumScreens] = React.useState("1")
  const [isAdultEnabled, setIsAdultEnabled] = React.useState(false)
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
      toast({ variant: "destructive", title: "Erro de rede." })
    } finally {
      setLoading(false)
    }
  }, [router])

  React.useEffect(() => { loadData() }, [loadData])

  const handleGenerate = async (type: 'test' | 'monthly') => {
    if (!reseller) return;
    const screens = parseInt(numScreens);
    if (type === 'monthly' && reseller.credits < screens) {
      toast({ variant: "destructive", title: "CRÉDITOS INSUFICIENTES", description: `Custo: ${screens} créditos.` });
      return;
    }
    setIsGenerating(true);
    const pin = generateRandomPin();
    const newUser: User = {
      id: "user_" + Date.now() + Math.random().toString(36).substring(7),
      pin,
      role: 'user',
      subscriptionTier: type,
      maxScreens: screens,
      activeDevices: [],
      isBlocked: false,
      isAdultEnabled: isAdultEnabled, // Controle do Revendedor
      resellerId: reseller.id
    };
    if (await saveUser(newUser)) {
      if (type === 'monthly') {
        const updated = { ...reseller, credits: reseller.credits - screens, totalSold: reseller.totalSold + 1 };
        await saveReseller(updated);
        setReseller(updated);
        localStorage.setItem("reseller_session", JSON.stringify(updated));
      }
      toast({ title: "PIN GERADO!", description: pin });
      await loadData();
    }
    setIsGenerating(false);
  }

  const sendAccess = (pin: string, tier: string, screens: number) => {
    const msg = getBeautifulMessage(pin, tier, window.location.origin, screens);
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
  }

  if (loading || !reseller) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="h-20 border-b border-white/5 bg-card/30 backdrop-blur-xl flex items-center justify-between px-8 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="bg-primary p-2.5 rounded-xl shadow-lg shadow-primary/20"><Briefcase className="h-6 w-6 text-white" /></div>
          <div><h1 className="text-xl font-black uppercase italic text-primary">Painel Revenda</h1><p className="text-[9px] font-black opacity-40 uppercase">{reseller.name}</p></div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-right"><p className="text-[10px] font-black text-emerald-500">{reseller.credits} CRÉDITOS</p><p className="text-[8px] opacity-40 font-black">ESTOQUE</p></div>
          <Button variant="ghost" onClick={() => { localStorage.removeItem("reseller_session"); router.push("/login"); }} className="text-destructive"><LogOut className="h-6 w-6" /></Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-8 space-y-8">
        <Card className="bg-primary/5 border border-primary/20 p-8 rounded-[2.5rem] flex flex-col md:flex-row items-center gap-8 shadow-2xl">
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Monitor className="h-8 w-8 text-primary" />
              <div>
                <Label className="text-[10px] font-black uppercase opacity-60">Limite de Telas</Label>
                <Select value={numScreens} onValueChange={setNumScreens}>
                  <SelectTrigger className="w-48 bg-black/40 h-12 rounded-xl font-black text-primary"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Tela (1 CRÉD)</SelectItem>
                    <SelectItem value="2">2 Telas (2 CRÉD)</SelectItem>
                    <SelectItem value="3">3 Telas (3 CRÉD)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-3 bg-black/20 p-3 rounded-2xl border border-white/5">
               <Lock className="h-4 w-4 text-primary" />
               <span className="text-[10px] font-black uppercase flex-1">Liberar Adultos</span>
               <Switch checked={isAdultEnabled} onCheckedChange={setIsAdultEnabled} />
            </div>
          </div>
          <div className="flex-1 grid grid-cols-2 gap-4">
            <Button onClick={() => handleGenerate('monthly')} disabled={isGenerating} className="h-20 bg-primary rounded-3xl font-black uppercase shadow-xl">VENDER 30 DIAS</Button>
            <Button onClick={() => handleGenerate('test')} disabled={isGenerating} variant="outline" className="h-20 border-emerald-500/30 text-emerald-500 rounded-3xl font-black uppercase">TESTE GRÁTIS (6H)</Button>
          </div>
        </Card>

        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="BUSCAR PIN..." className="pl-12 h-14 bg-card/50 border-white/5 rounded-2xl uppercase font-bold" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <Card className="bg-card/40 border-white/5 rounded-[2.5rem] shadow-2xl overflow-hidden">
          <CardHeader className="border-b border-white/5 p-8 bg-black/20"><CardTitle className="text-sm font-black uppercase italic text-primary">Meus Clientes Ativos</CardTitle></CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-white/5">
              {myUsers.filter(u => u.pin.includes(search)).map(u => (
                <div key={u.id} className="p-8 flex flex-col md:flex-row items-center justify-between hover:bg-white/5 gap-6">
                  <div className="flex items-center gap-6 flex-1">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center font-black text-xl text-primary border border-primary/20">{u.pin.substring(0,2)}</div>
                    <div>
                      <p className="font-mono font-black text-2xl text-primary tracking-[0.25em]">{u.pin}</p>
                      <div className="flex gap-2 mt-1">
                        <Badge className="text-[8px] uppercase">{u.subscriptionTier}</Badge>
                        <Badge variant="outline" className={`text-[8px] uppercase ${u.isAdultEnabled ? 'text-primary border-primary/30' : 'opacity-20'}`}>ADULTO: {u.isAdultEnabled ? 'SIM' : 'NÃO'}</Badge>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-center gap-1 text-center min-w-[150px]">
                    {u.activeDevices.length > 0 ? (
                      <>
                        <p className="text-[9px] font-black text-emerald-500 flex items-center gap-1"><Globe className="h-3 w-3"/> {u.activeDevices[0].ip}</p>
                        <p className="text-[8px] opacity-40 font-black truncate max-w-[120px]">{u.activeDevices[0].id}</p>
                      </>
                    ) : <span className="text-[8px] opacity-20 font-black">AGUARDANDO ATIVAÇÃO</span>}
                  </div>
                  <Button variant="outline" onClick={() => sendAccess(u.pin, u.subscriptionTier, u.maxScreens)} className="h-12 border-emerald-500/20 text-emerald-500 font-black uppercase text-[10px] rounded-xl"><Send className="h-4 w-4 mr-2" /> ENVIAR</Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
