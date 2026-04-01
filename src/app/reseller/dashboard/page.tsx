"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Key, Plus, LogOut, Briefcase, Users, Search, RefreshCcw, Send, Loader2, Zap, Monitor, Lock, Globe, Clock, AlertTriangle, UserCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { getRemoteUsers, saveUser, saveReseller, generateRandomPin, getBeautifulMessage, Reseller, User } from "@/lib/store"
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

  const getExpiryStatus = (expiryDate?: string) => {
    if (!expiryDate) return { label: "AGUARDANDO ATIVAÇÃO", color: "text-blue-400", icon: Clock };
    const now = new Date();
    const exp = new Date(expiryDate);
    const diffTime = exp.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffTime < 0) return { label: "PIN EXPIRADO", color: "text-destructive", icon: AlertTriangle };
    if (diffDays <= 3) return { label: `${diffDays} DIA(S) RESTANTE(S)`, color: "text-orange-500", icon: AlertTriangle };
    return { label: `${diffDays} DIA(S) ATIVO`, color: "text-green-400", icon: UserCheck };
  };

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
      isAdultEnabled: isAdultEnabled,
      resellerId: reseller.id
    };
    if (await saveUser(newUser)) {
      if (type === 'monthly') {
        const updated = { ...reseller, credits: reseller.credits - screens, totalSold: (reseller.totalSold || 0) + 1 };
        await saveReseller(updated);
        setReseller(updated);
        localStorage.setItem("reseller_session", JSON.stringify(updated));
      }
      toast({ title: "PIN GERADO COM SUCESSO!", description: `CÓDIGO: ${pin}` });
      await loadData();
    }
    setIsGenerating(false);
  }

  const sendAccess = (pin: string, tier: string, screens: number) => {
    const msg = getBeautifulMessage(pin, tier, window.location.origin, screens);
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
  }

  if (loading || !reseller) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary h-12 w-12" /></div>

  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="h-20 border-b border-white/5 bg-card/30 backdrop-blur-xl flex items-center justify-between px-8 sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div className="bg-primary p-2.5 rounded-xl shadow-lg shadow-primary/20"><Briefcase className="h-6 w-6 text-white" /></div>
          <div><h1 className="text-xl font-black uppercase italic text-primary">Painel Revenda Master</h1><p className="text-[9px] font-black opacity-40 uppercase">{reseller.name}</p></div>
        </div>
        <div className="flex items-center gap-6">
          <div className="bg-emerald-500/10 border border-emerald-500/20 px-6 py-2 rounded-2xl text-center">
            <p className="text-xl font-black text-emerald-500 leading-none">{reseller.credits}</p>
            <p className="text-[8px] opacity-60 font-black uppercase">CRÉDITOS</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => { localStorage.removeItem("reseller_session"); router.push("/login"); }} className="text-destructive h-12 w-12 rounded-xl hover:bg-destructive/10"><LogOut className="h-6 w-6" /></Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-8 space-y-8">
        <Card className="bg-primary/5 border border-primary/20 p-8 rounded-[3rem] flex flex-col md:flex-row items-center gap-8 shadow-2xl shadow-primary/5">
          <div className="space-y-4 min-w-[250px]">
            <div className="space-y-2">
              <Label className="text-[10px] font-black uppercase opacity-60 ml-2">Configuração do PIN</Label>
              <Select value={numScreens} onValueChange={setNumScreens}>
                <SelectTrigger className="w-full bg-black/40 h-14 rounded-2xl font-black text-primary border-white/5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Tela (1 CRÉD)</SelectItem>
                  <SelectItem value="2">2 Telas (2 CRÉD)</SelectItem>
                  <SelectItem value="3">3 Telas (3 CRÉD)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-3 bg-black/20 p-4 rounded-2xl border border-white/5">
               <Lock className="h-5 w-5 text-primary" />
               <span className="text-[10px] font-black uppercase flex-1">Liberar Adultos</span>
               <Switch checked={isAdultEnabled} onCheckedChange={setIsAdultEnabled} />
            </div>
          </div>
          <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
            <Button onClick={() => handleGenerate('monthly')} disabled={isGenerating} className="h-24 bg-primary rounded-[2rem] font-black text-lg uppercase shadow-xl hover:scale-105 active:scale-95 transition-all">GERAR 30 DIAS</Button>
            <Button onClick={() => handleGenerate('test')} disabled={isGenerating} variant="outline" className="h-24 border-emerald-500/20 text-emerald-500 rounded-[2rem] font-black text-lg uppercase hover:bg-emerald-500/10 active:scale-95 transition-all">TESTE GRÁTIS (6H)</Button>
          </div>
        </Card>

        <div className="relative group">
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input placeholder="PESQUISAR PIN PARA VER VALIDADE..." className="pl-14 h-16 bg-card/50 border-white/5 rounded-3xl uppercase font-black text-lg tracking-[0.2em]" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <Card className="bg-card/40 border-white/5 rounded-[3rem] shadow-2xl overflow-hidden">
          <CardHeader className="border-b border-white/5 p-8 bg-black/20 flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-black uppercase italic text-primary flex items-center gap-2"><Users className="h-5 w-5"/> Clientes Gerados</CardTitle>
            <Badge variant="outline" className="font-black opacity-40 uppercase text-[10px] px-4 py-1">{myUsers.length} PINS</Badge>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-white/5">
              {myUsers.filter(u => u.pin.includes(search)).length === 0 ? (
                <div className="p-20 text-center opacity-30 font-black uppercase text-sm">Nenhum PIN localizado na sua rede.</div>
              ) : (
                myUsers.filter(u => u.pin.includes(search)).map(u => {
                  const status = getExpiryStatus(u.expiryDate);
                  return (
                    <div key={u.id} className="p-8 flex flex-col md:flex-row items-center justify-between hover:bg-white/5 gap-8 transition-colors">
                      <div className="flex items-center gap-8 flex-1">
                        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center font-black text-2xl text-primary border border-primary/20 shadow-inner">{u.pin.substring(0,2)}</div>
                        <div>
                          <p className="font-mono font-black text-3xl text-primary tracking-[0.25em]">{u.pin}</p>
                          <div className="flex gap-2 mt-2">
                            <Badge className="text-[9px] font-black uppercase px-3">{u.subscriptionTier}</Badge>
                            <Badge variant="outline" className={`text-[9px] font-black uppercase border-white/5 ${u.isAdultEnabled ? 'text-primary' : 'opacity-20'}`}>{u.isAdultEnabled ? 'ADULTO LIBERADO' : 'ADULTO BLOQUEADO'}</Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-center gap-2 min-w-[200px] text-center bg-black/20 p-4 rounded-[1.5rem] border border-white/5">
                        <p className={`text-[11px] font-black uppercase flex items-center gap-2 ${status.color}`}>
                          <status.icon className="h-4 w-4" /> {status.label}
                        </p>
                        {u.expiryDate && <p className="text-[9px] font-bold opacity-40 uppercase">EXPIRA EM: {new Date(u.expiryDate).toLocaleString()}</p>}
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                          {u.activeDevices.length > 0 ? (
                            <>
                              <p className="text-[9px] font-black text-emerald-500 flex items-center justify-end gap-1"><Globe className="h-3 w-3"/> {u.activeDevices[0].ip}</p>
                              <p className="text-[8px] opacity-40 font-black truncate max-w-[100px]">ID: {u.activeDevices[0].id.substring(0,10)}...</p>
                            </>
                          ) : <span className="text-[8px] opacity-20 font-black">LOGIN PENDENTE</span>}
                        </div>
                        <Button variant="outline" onClick={() => sendAccess(u.pin, u.subscriptionTier, u.maxScreens)} className="h-14 w-14 sm:w-auto sm:px-6 border-emerald-500/20 text-emerald-500 font-black uppercase text-[10px] rounded-2xl hover:bg-emerald-500 hover:text-white transition-all shadow-lg"><Send className="h-5 w-5 sm:mr-2" /> <span className="hidden sm:inline">ENVIAR ACESSO</span></Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
