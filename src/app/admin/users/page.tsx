
'use client';

import * as React from "react"
import { Plus, Search, UserCheck, UserX, RefreshCcw, Trash2, Edit, Loader2, ShieldAlert, Send, Lock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { getRemoteUsers, generateRandomPin, saveUser, removeUser, User, SubscriptionTier, getBeautifulMessage } from "@/lib/store"
import { toast } from "@/hooks/use-toast"

export default function UserManagementPage() {
  const [searchTerm, setSearchTerm] = React.useState("")
  const [users, setUsers] = React.useState<User[]>([])
  const [loading, setLoading] = React.useState(true)
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  const [editingUserId, setEditingUserId] = React.useState<string | null>(null)
  
  const [newUser, setNewUser] = React.useState({
    pin: "",
    tier: "monthly" as SubscriptionTier,
    hours: "6",
    screens: "1",
    isAdultEnabled: true
  })

  const loadUsers = React.useCallback(async () => {
    setLoading(true)
    try {
      const data = await getRemoteUsers()
      setUsers(data)
    } catch (err) {
      toast({ variant: "destructive", title: "Erro", description: "Falha ao carregar lista de acessos." })
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const handleGeneratePin = () => {
    setNewUser(prev => ({ ...prev, pin: generateRandomPin(11) }))
  }

  const handleSaveUser = async () => {
    if (!newUser.pin) {
      toast({ variant: "destructive", title: "Erro", description: "O código é obrigatório." })
      return
    }

    setIsSaving(true)
    
    const editingUser = users.find(u => u.id === editingUserId);

    const userData: User = {
      id: editingUserId || "user_" + Date.now() + Math.random().toString(36).substring(7),
      pin: newUser.pin,
      role: 'user',
      subscriptionTier: newUser.tier,
      expiryDate: editingUser?.expiryDate || "",
      maxScreens: parseInt(newUser.screens) || 1,
      activeDevices: editingUser?.activeDevices || [],
      isBlocked: editingUser?.isBlocked || false,
      isAdultEnabled: newUser.isAdultEnabled,
      activatedAt: editingUser?.activatedAt || ""
    }

    const success = await saveUser(userData)
    
    if (success) {
      toast({ title: "PIN SALVO", description: "Configurações aplicadas com sucesso." })
      setIsDialogOpen(false)
      setEditingUserId(null)
      setNewUser({ pin: "", tier: "monthly", hours: "6", screens: "1", isAdultEnabled: true })
      await loadUsers()
    } else {
      toast({ variant: "destructive", title: "Erro de Gravação" })
    }
    setIsSaving(false)
  }

  const toggleBlock = async (user: User) => {
    const updated = { ...user, isBlocked: !user.isBlocked }
    const success = await saveUser(updated)
    if (success) {
      toast({ title: updated.isBlocked ? "Acesso Suspenso" : "Acesso Reativado" })
      loadUsers()
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (confirm("ATENÇÃO: Deseja realmente excluir este acesso?")) {
      const success = await removeUser(userId)
      if (success) {
        toast({ title: "Excluído com Sucesso" })
        loadUsers()
      }
    }
  }

  const handleEditUser = (user: User) => {
    setEditingUserId(user.id)
    setNewUser({
      pin: user.pin,
      tier: user.subscriptionTier,
      hours: "6",
      screens: user.maxScreens.toString(),
      isAdultEnabled: user.isAdultEnabled ?? true
    })
    setIsDialogOpen(true)
  }

  const sendWhatsAppAccess = (user: User) => {
    const baseUrl = window.location.origin;
    const msg = getBeautifulMessage(user.pin, user.subscriptionTier, baseUrl, user.maxScreens);
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`;
    window.open(waUrl, '_blank');
  }

  const filteredUsers = users.filter(u => 
    u.pin.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a,b) => b.id.localeCompare(a.id))

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-headline uppercase italic text-primary tracking-tighter">Gerenciar Clientes</h1>
          <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest italic">Controle de PINs e Ativações Master</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) { setEditingUserId(null); setNewUser({ pin: "", tier: "monthly", hours: "6", screens: "1", isAdultEnabled: true }); }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:scale-105 transition-transform font-bold uppercase text-xs h-12 rounded-xl px-6">
              <Plus className="mr-2 h-4 w-4" /> Gerar Novo PIN
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-card border-white/10 rounded-3xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold uppercase italic text-primary">Configuração de Acesso</DialogTitle>
              <DialogDescription className="sr-only">Formulário de PIN</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label className="uppercase text-[10px] font-bold opacity-70">Código PIN Master</Label>
                <div className="flex gap-2">
                  <Input value={newUser.pin} onChange={e => setNewUser({...newUser, pin: e.target.value})} className="bg-black/40 font-black text-xl tracking-[0.3em] text-center border-white/5 h-14 rounded-xl" />
                  <Button variant="outline" onClick={handleGeneratePin} className="border-white/10 h-14 rounded-xl">
                    <RefreshCcw className="h-4 w-4 text-primary" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="uppercase text-[10px] font-bold opacity-70">Tipo de Plano</Label>
                  <Select value={newUser.tier} onValueChange={(v: any) => setNewUser({...newUser, tier: v})}>
                    <SelectTrigger className="bg-black/40 border-white/5 h-12 rounded-xl"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="test">Teste Grátis (6h)</SelectItem>
                      <SelectItem value="monthly">Mensal (30 dias)</SelectItem>
                      <SelectItem value="lifetime">Vitalício (Eterno)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label className="uppercase text-[10px] font-bold opacity-70">Telas Simultâneas</Label>
                  <Input type="number" value={newUser.screens} onChange={e => setNewUser({...newUser, screens: e.target.value})} className="bg-black/40 border-white/5 h-12 rounded-xl" />
                </div>
              </div>

              <div className="p-4 bg-primary/5 border border-white/5 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-primary" />
                  <Label className="uppercase text-[10px] font-black">Liberar Adultos</Label>
                </div>
                <Switch checked={newUser.isAdultEnabled} onCheckedChange={v => setNewUser({...newUser, isAdultEnabled: v})} />
              </div>

              {newUser.tier === 'test' && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex gap-3">
                  <ShieldAlert className="h-5 w-5 text-emerald-500 shrink-0" />
                  <p className="text-[9px] font-bold uppercase text-emerald-500">O teste ativa no 1º login e dura 6 horas. Bloqueio automático por aparelho.</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={handleSaveUser} className="w-full font-black uppercase h-14 bg-primary text-lg rounded-2xl" disabled={isSaving}>
                {isSaving ? <Loader2 className="h-6 w-6 animate-spin" /> : 'CONFIRMAR E SALVAR'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative group">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
        <Input placeholder="BUSCAR PIN POR CÓDIGO..." className="pl-12 bg-card/50 border-white/5 h-14 uppercase font-bold text-xs rounded-2xl" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
      ) : (
        <div className="bg-card/30 border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl">
          <Table>
            <TableHeader className="bg-black/20">
              <TableRow className="border-white/5 hover:bg-transparent h-14">
                <TableHead className="uppercase text-[10px] font-black text-primary px-8">CÓDIGO PIN</TableHead>
                <TableHead className="uppercase text-[10px] font-black">PLANO</TableHead>
                <TableHead className="uppercase text-[10px] font-black">ADULTO</TableHead>
                <TableHead className="uppercase text-[10px] font-black">STATUS</TableHead>
                <TableHead className="text-right uppercase text-[10px] font-black px-8">AÇÕES</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-20 opacity-30 font-black uppercase text-xs">Nenhum cliente localizado.</TableCell></TableRow>
              ) : (
                filteredUsers.map((u) => {
                  const now = new Date();
                  const isExpired = u.expiryDate && new Date(u.expiryDate) < now && u.subscriptionTier !== 'lifetime';
                  
                  return (
                    <TableRow key={u.id} className="border-white/5 hover:bg-white/5 transition-colors h-20">
                      <TableCell className="font-mono font-black text-xl text-primary tracking-[0.2em] px-8">{u.pin}</TableCell>
                      <TableCell>
                        <Badge variant={u.subscriptionTier === 'test' ? 'secondary' : 'default'} className="uppercase text-[9px] font-black px-3 py-1 rounded-full">
                          {u.subscriptionTier === 'test' ? 'TESTE' : u.subscriptionTier === 'monthly' ? 'MENSAL' : 'VITALÍCIO'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={`uppercase text-[8px] font-black ${u.isAdultEnabled ? 'bg-primary/20 text-primary' : 'bg-muted opacity-40'}`}>
                          {u.isAdultEnabled ? 'LIBERADO' : 'BLOQUEADO'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {u.isBlocked ? (
                          <Badge variant="destructive" className="uppercase text-[9px] font-black">SUSPENSO</Badge>
                        ) : isExpired ? (
                          <Badge variant="destructive" className="uppercase text-[9px] font-black bg-orange-600 border-orange-600">EXPIRADO</Badge>
                        ) : (
                          <Badge variant="outline" className="text-green-400 border-green-400/30 uppercase text-[9px] font-black">ATIVO</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right px-8">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => sendWhatsAppAccess(u)} className="text-emerald-500 hover:bg-emerald-500/10">
                             <Send className="h-5 w-5" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => toggleBlock(u)}>
                            {u.isBlocked ? <UserCheck className="h-5 w-5 text-green-400" /> : <UserX className="h-5 w-5 text-destructive" />}
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleEditUser(u)} className="text-blue-400 hover:bg-blue-400/10"><Edit className="h-5 w-5" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(u.id)} className="text-destructive hover:bg-destructive/10"><Trash2 className="h-5 w-5" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
