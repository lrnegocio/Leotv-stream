
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Key, Plus, LogOut, Briefcase, Users, Search, RefreshCcw, Send, Loader2, Zap, Monitor, Lock, Globe, Clock, AlertTriangle, UserCheck, Bell, MessageSquare, Star, Gamepad2, UserX, UserCheck2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { getRemoteUsers, saveUser, saveReseller, generateRandomPin, getBeautifulMessage, Reseller, User } from "@/lib/store"
import { toast } from "@/hooks/use-toast"

export default function ResellerDashboard() {
  const [reseller, setReseller] = React.useState<Reseller | null>(null)
  const [myUsers, setMyUsers] = React.useState<User[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")
  const [isGenerating, setIsGenerating] = React.useState(false)
  const [editingUser, setEditingUser] = React.useState<User | null>(null)
  const [msgInput, setMsgInput] = React.useState("")
  
  const [config, setConfig] = React.useState({
    screens: "1"
  })

  const router = useRouter()

  const loadData = React.useCallback(async () => {
    const session = localStorage.getItem("reseller_session")
    if (!session) { router.push("/login"); return; }
    const sessionData = JSON.parse(session)
    
    setLoading(true)
    try {
      const allUsers = await getRemoteUsers()
      const filtered = allUsers.filter(u => u.resellerId === sessionData.id)
      setMyUsers(filtered)
      
      const { supabase } = await import('@/lib/supabase-client')
      const { data: resData } = await supabase.from('resellers').select('*').eq('id', sessionData.id).single()
      
      if (resData) {
        setReseller(resData)
        localStorage.setItem("reseller_session", JSON.stringify(resData))
      } else {
        setReseller(sessionData)
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Erro ao atualizar dados." })
    } finally {
      setLoading(false)
    }
  }, [router])

  React.useEffect(() => { loadData() }, [loadData])

  const getExpiryStatus = (expiryDate?: string | null, isBlocked?: boolean) => {
    if (isBlocked) return { label: "SINAL BLOQUEADO", color: "bg-destructive text-white", icon: UserX };
    if (!expiryDate) return { label: "AGUARDANDO ATIVAÇÃO", color: "bg-blue-500/10 text-blue-400", icon: Clock };
    
    const now = new Date();
    const exp = new Date(expiryDate);
    
    if (now > exp) return { label: `EXPIRADO EM: ${exp.toLocaleString('pt-BR')}`, color: "bg-destructive text-white", icon: AlertTriangle };
    return { label: `ATIVO ATÉ: ${exp.toLocaleString('pt-BR')}`, color: "bg-emerald-500/10 text-emerald-400", icon: UserCheck };
  };

  const handleGenerate = async (type: 'test' | 'monthly') => {
    if (!reseller) return;
    const screens = parseInt(config.screens);
    
    if (type === 'monthly' && (reseller.credits || 0) < screens) {
      toast({ variant: "destructive", title: "CRÉDITOS INSUFICIENTES", description: `Você precisa de ${screens} crédito(s).` });
      return;
    }

    setIsGenerating(true);
    const pin = generateRandomPin(11);
    
    let expiryDate = null;
    if (type === 'test') {
      const d = new Date();
      d.setHours(d.getHours() + 6);
      expiryDate = d.toISOString();
    }

    const newUser: User = {
      id: "user_" + Date.now() + Math.random().toString(36).substring(7),
      pin,
      role: 'user',
      subscriptionTier: type,
      maxScreens: screens,
      activeDevices: [],
      isBlocked: false,
      isAdultEnabled: false, 
      isGamesEnabled: false,  
      isPpvEnabled: false,    
      isAlacarteEnabled: false, 
      isGamesOnly: false,
      resellerId: reseller.id,
      expiryDate: expiryDate
    };

    try {
      const successUser = await saveUser(newUser);
      if (successUser) {
        if (type === 'monthly') {
          const updatedReseller = { 
            ...reseller, 
            credits: (reseller.credits || 0) - screens, 
            totalSold: (reseller.totalSold || 0) + 1 
          };
          await saveReseller(updatedReseller);
          setReseller(updatedReseller);
          localStorage.setItem("reseller_session", JSON.stringify(updatedReseller));
        }
        toast({ title: "SINAL GERADO v385-S", description: `PIN: ${pin}` });
        await loadData();
      }
    } catch (e) {
      toast({ variant: "destructive", title: "Erro na conexão com Supabase." });
    } finally {
      setIsGenerating(false);
    }
  }

  const toggleClientBlock = async (user: User) => {
    const updated = { ...user, isBlocked: !user.isBlocked };
    if (await saveUser(updated)) {
      toast({ title: updated.isBlocked ? "CLIENTE BLOQUEADO" : "CLIENTE LIBERADO" });
      await loadData();
    }
  };

  const sendAccess = (u: User) => {
    const msg = getBeautifulMessage(u.pin, u.subscriptionTier, window.location.origin, u.maxScreens);
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
  }

  const filtered = myUsers.filter(u => (u.pin || "").includes(search));

  if (loading && !reseller) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin text-primary h-12 w-12" /></div>

  return (
    <div className="min-h-screen bg-background pb-20 select-none">
      <header className="h-24 border-b border-white/5 bg-card/30 backdrop-blur-xl flex items-center justify-between px-8 sticky top-0 z-50">
        <div className="flex items-center gap-5">
          <div className="bg-primary p-3 rounded-2xl shadow-lg shadow-primary/20"><Briefcase className="h-7 w-7 text-white" /></div>
          <div>
            <h1 className="text-2xl font-black uppercase italic text-primary">Painel Revenda Master</h1>
            <p className="text-[10px] font-black opacity-60 uppercase tracking-widest">{reseller?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="bg-emerald-500/10 border border-emerald-500/20 px-8 py-3 rounded-2xl text-center shadow-inner">
            <p className="text-3xl font-black text-emerald-500 leading-none">{reseller?.credits || 0}</p>
            <p className="text-[9px] opacity-60 font-black uppercase mt-1">CRÉDITOS DISPONÍVEIS</p>
          </div>
          <Button variant="ghost" size="icon" onClick={() => { localStorage.removeItem("reseller_session"); router.push("/login"); }} className="text-destructive h-14 w-14 rounded-2xl hover:bg-destructive/10">
            <LogOut className="h-7 w-7" />
          </Button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-8 space-y-8">
        <Card className="bg-primary/5 border border-primary/20 p-10 rounded-[3rem] shadow-2xl">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
             <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase opacity-60 ml-2 tracking-widest">Configuração de Telas</Label>
                  <Select value={config.screens} onValueChange={v => setConfig({...config, screens: v})}>
                    <SelectTrigger className="w-full bg-black/40 h-16 rounded-2xl font-black text-primary border-white/5 text-lg"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Tela (1 CRÉDITO)</SelectItem>
                      <SelectItem value="2">2 Telas (2 CRÉDITOS)</SelectItem>
                      <SelectItem value="3">3 Telas (3 CRÉDITOS)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="p-5 bg-black/40 rounded-2xl border border-white/5 flex items-start gap-3">
                   <AlertTriangle className="h-5 w-5 text-primary shrink-0" />
                   <p className="text-[10px] font-bold uppercase text-primary/80 leading-relaxed italic">
                     Atenção: Ativação de Adulto, Games, PPV e Alacarte é feita EXCLUSIVAMENTE pelo Mestre Léo. Seus clientes devem pagar e solicitar a ele.
                   </p>
                </div>
             </div>
             <div className="grid grid-cols-2 gap-5 h-32">
                <Button onClick={() => handleGenerate('monthly')} disabled={isGenerating} className="h-full bg-primary rounded-[2rem] font-black text-xl uppercase shadow-xl hover:scale-[1.02] active:scale-95 transition-all">
                   {isGenerating ? <Loader2 className="animate-spin" /> : 'GERAR 30 DIAS'}
                </Button>
                <Button onClick={() => handleGenerate('test')} disabled={isGenerating} variant="outline" className="h-full border-emerald-500/20 text-emerald-500 rounded-[2rem] font-black text-xl uppercase hover:bg-emerald-500/5 hover:scale-[1.02] active:scale-95 transition-all">
                   TESTE 6H
                </Button>
             </div>
          </div>
        </Card>

        <div className="relative group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-7 w-7 text-muted-foreground group-focus-within:text-primary transition-colors" />
          <Input placeholder="PESQUISAR PIN DOS MEUS CLIENTES..." className="pl-16 h-20 bg-card/50 border-white/5 rounded-[1.5rem] uppercase font-black text-xl tracking-[0.3em]" value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <Card className="bg-card/40 border-white/5 rounded-[3.5rem] shadow-2xl overflow-hidden">
          <CardHeader className="border-b border-white/5 p-10 bg-black/20 flex flex-row items-center justify-between">
            <div>
               <CardTitle className="text-sm font-black uppercase italic text-primary flex items-center gap-3">
                 <Users className="h-6 w-6"/> Meus Clientes v385-S
               </CardTitle>
            </div>
            <Button onClick={loadData} variant="ghost" size="icon" className="text-primary h-12 w-12 rounded-xl"><RefreshCcw className={`h-6 w-6 ${loading ? 'animate-spin' : ''}`} /></Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-white/5">
              {filtered.length === 0 ? (
                <div className="p-32 text-center opacity-20 font-black uppercase italic tracking-widest">Nenhum cliente sintonizado v385-S.</div>
              ) : (
                filtered.map(u => {
                  const status = getExpiryStatus(u.expiryDate, u.isBlocked);
                  return (
                    <div key={u.id} className="p-10 flex flex-col lg:grid lg:grid-cols-5 items-center hover:bg-white/5 transition-colors gap-8">
                      <div className="flex items-center gap-8 col-span-2">
                        <div className={`w-20 h-20 rounded-3xl flex items-center justify-center font-black text-3xl shadow-2xl border border-white/5 ${u.isBlocked ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'}`}>
                          {u.pin.substring(0,2)}
                        </div>
                        <div>
                          <p className={`font-mono font-black text-3xl tracking-[0.2em] ${u.isBlocked ? 'text-destructive' : 'text-primary'}`}>{u.pin}</p>
                          <div className="flex flex-wrap gap-2 mt-3">
                             <Badge variant="outline" className="text-[8px] font-black uppercase border-primary/20">{u.subscriptionTier}</Badge>
                             <Badge variant="outline" className="text-[8px] font-black uppercase border-primary/20">{u.maxScreens} TELA(S)</Badge>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-center gap-2">
                         <div className={`px-6 py-2.5 rounded-2xl text-[10px] font-black uppercase text-center border border-white/5 shadow-inner ${status.color} flex items-center gap-2`}>
                            <status.icon className="h-4 w-4" />
                            {status.label}
                         </div>
                      </div>

                      <div className="flex flex-wrap gap-2 justify-center">
                         <Badge className={`text-[7px] uppercase font-black ${u.isAdultEnabled ? 'bg-red-500 text-white' : 'bg-muted opacity-20'}`}>Adulto</Badge>
                         <Badge className={`text-[7px] uppercase font-black ${u.isGamesEnabled ? 'bg-emerald-500 text-white' : 'bg-muted opacity-20'}`}>Games</Badge>
                         <Badge className={`text-[7px] uppercase font-black ${u.isPpvEnabled ? 'bg-orange-500 text-white' : 'bg-muted opacity-20'}`}>PPV</Badge>
                      </div>

                      <div className="flex gap-3 justify-end">
                        <Button variant="ghost" size="icon" onClick={() => { setEditingUser(u); setMsgInput(u.individualMessage || ""); }} className="text-primary h-12 w-12 hover:bg-primary/10 rounded-xl" title="Mensagem VIP">
                          <MessageSquare className="h-6 w-6" />
                        </Button>
                        
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => toggleClientBlock(u)} 
                          className={`h-12 w-12 rounded-xl transition-all ${u.isBlocked ? 'bg-green-500/10 text-green-400 hover:bg-green-500/20' : 'bg-destructive/10 text-destructive hover:bg-destructive/20'}`}
                          title={u.isBlocked ? "Desbloquear Sinal" : "Bloquear Sinal"}
                        >
                          {u.isBlocked ? <UserCheck2 className="h-6 w-6" /> : <UserX className="h-6 w-6" />}
                        </Button>

                        <Button variant="outline" onClick={() => sendAccess(u)} className="h-12 border-emerald-500/20 text-emerald-500 font-black uppercase text-[10px] rounded-xl px-8 hover:bg-emerald-500/10 shadow-lg">
                          ENVIAR ACESSO
                        </Button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </CardContent>
        </Card>
      </main>

      <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
        <DialogContent className="bg-card border-white/10 rounded-[3rem] p-10 shadow-2xl">
           <DialogHeader>
             <DialogTitle className="text-2xl font-black uppercase italic text-primary flex items-center gap-3">
               <Bell className="h-6 w-6" /> Mensagem Individual VIP
             </DialogTitle>
           </DialogHeader>
           <div className="py-8 space-y-4">
              <p className="text-[10px] font-bold uppercase opacity-60 italic">Escreva um aviso que aparecerá apenas para este cliente no player.</p>
              <Textarea 
                value={msgInput} 
                onChange={e => setMsgInput(e.target.value)} 
                placeholder="Ex: Sua fatura está pendente. Regularize seu sinal!" 
                className="h-40 bg-black/40 border-white/5 font-bold text-sm rounded-2xl" 
              />
           </div>
           <DialogFooter>
             <Button onClick={() => { if(editingUser) saveUser({...editingUser, individualMessage: msgInput}).then(() => { toast({title: "SALVO v385-S"}); setEditingUser(null); loadData(); }) }} className="w-full h-16 bg-primary font-black uppercase rounded-2xl text-lg shadow-xl shadow-primary/20">
               SALVAR AVISO
             </Button>
           </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
