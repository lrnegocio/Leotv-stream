
'use client';

import * as React from "react"
import { Plus, Search, UserCheck, UserX, RefreshCcw, Trash2, Edit, Loader2, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { getRemoteUsers, generateRandomPin, saveUser, removeUser, User, SubscriptionTier } from "@/lib/store"
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
    screens: "1"
  })

  const loadUsers = React.useCallback(async () => {
    setLoading(true)
    try {
      const data = await getRemoteUsers()
      setUsers(data)
    } catch (err) {
      toast({ variant: "destructive", title: "Erro", description: "Falha ao carregar lista." })
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const handleGeneratePin = () => {
    setNewUser(prev => ({ ...prev, pin: generateRandomPin() }))
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
      expiryDate: editingUser?.expiryDate,
      maxScreens: parseInt(newUser.screens),
      activeDevices: editingUser?.activeDevices || [],
      isBlocked: editingUser?.isBlocked || false,
      activatedAt: editingUser?.activatedAt
    }

    const success = await saveUser(userData)
    
    if (success) {
      toast({ title: "PIN Salvo", description: "Atualizado com sucesso." })
      setIsDialogOpen(false)
      setEditingUserId(null)
      setNewUser({ pin: "", tier: "monthly", hours: "6", screens: "1" })
      await loadUsers()
    } else {
      toast({ variant: "destructive", title: "Erro", description: "Falha ao salvar." })
    }
    setIsSaving(false)
  }

  const toggleBlock = async (user: User) => {
    const updated = { ...user, isBlocked: !user.isBlocked }
    const success = await saveUser(updated)
    if (success) {
      toast({ title: updated.isBlocked ? "Acesso Suspenso" : "Acesso Ativo" })
      loadUsers()
    }
  }

  const handleDeleteUser = async (userId: string) => {
    if (confirm("Remover este acesso permanentemente?")) {
      const success = await removeUser(userId)
      if (success) {
        toast({ title: "Removido" })
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
      screens: user.maxScreens.toString()
    })
    setIsDialogOpen(true)
  }

  const filteredUsers = users.filter(u => 
    u.pin.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a,b) => b.id.localeCompare(a.id))

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-headline uppercase">Gerenciar PINs</h1>
          <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest italic text-primary">Controle de Acessos e Testes</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) { setEditingUserId(null); setNewUser({ pin: "", tier: "monthly", hours: "6", screens: "1" }); }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:scale-105 transition-transform font-bold uppercase text-xs" onClick={() => handleGeneratePin()}>
              <Plus className="mr-2 h-4 w-4" /> Novo PIN
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-card border-white/10">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold uppercase italic text-primary">Configurar Acesso</DialogTitle>
              <DialogDescription className="sr-only">Formulário de PIN</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label className="uppercase text-[10px] font-bold opacity-70">Código PIN</Label>
                <div className="flex gap-2">
                  <Input value={newUser.pin} onChange={e => setNewUser({...newUser, pin: e.target.value})} className="bg-black/40 font-black text-xl tracking-[0.3em] text-center border-white/5 h-14" />
                  <Button variant="outline" onClick={handleGeneratePin} className="border-white/10 h-14">
                    <RefreshCcw className="h-4 w-4 text-primary" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="uppercase text-[10px] font-bold opacity-70">Plano</Label>
                  <Select value={newUser.tier} onValueChange={(v: any) => setNewUser({...newUser, tier: v})}>
                    <SelectTrigger className="bg-black/40 border-white/5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="test">Teste Grátis (6h)</SelectItem>
                      <SelectItem value="monthly">Mensal (30 dias)</SelectItem>
                      <SelectItem value="lifetime">Vitalício</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label className="uppercase text-[10px] font-bold opacity-70">Telas</Label>
                  <Input type="number" value={newUser.screens} onChange={e => setNewUser({...newUser, screens: e.target.value})} className="bg-black/40 border-white/5" />
                </div>
              </div>
              {newUser.tier === 'test' && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex gap-3">
                  <ShieldAlert className="h-5 w-5 text-emerald-500 shrink-0" />
                  <p className="text-[9px] font-bold uppercase text-emerald-500">O teste será ativado no 1º login e valerá por 6 horas. Bloqueio automático por aparelho ativado.</p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={handleSaveUser} className="w-full font-black uppercase h-14 bg-primary text-lg" disabled={isSaving}>
                {isSaving ? <Loader2 className="h-6 w-6 animate-spin" /> : 'SALVAR ACESSO'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="BUSCAR PIN..." className="pl-10 bg-card/50 border-white/5 h-12 uppercase font-bold text-xs" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
      ) : (
        <div className="bg-card/30 border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
          <Table>
            <TableHeader className="bg-black/20">
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="uppercase text-[10px] font-black text-primary">PIN</TableHead>
                <TableHead className="uppercase text-[10px] font-black">PLANO</TableHead>
                <TableHead className="uppercase text-[10px] font-black">VENCIMENTO</TableHead>
                <TableHead className="uppercase text-[10px] font-black">STATUS</TableHead>
                <TableHead className="text-right uppercase text-[10px] font-black">AÇÕES</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-10 opacity-30">Vazio.</TableCell></TableRow>
              ) : (
                filteredUsers.map((u) => {
                  const now = new Date();
                  const isExpired = u.expiryDate && new Date(u.expiryDate) < now;
                  
                  return (
                    <TableRow key={u.id} className="border-white/5 hover:bg-white/5 transition-colors">
                      <TableCell className="font-mono font-black text-lg text-primary tracking-widest">{u.pin}</TableCell>
                      <TableCell>
                        <Badge variant={u.subscriptionTier === 'test' ? 'secondary' : 'default'} className="uppercase text-[9px] font-bold">
                          {u.subscriptionTier === 'test' ? 'TESTE 6H' : u.subscriptionTier === 'monthly' ? '30 DIAS' : 'VITALÍCIO'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-[10px] font-bold uppercase opacity-60">
                        {u.expiryDate ? new Date(u.expiryDate).toLocaleString('pt-BR') : 'ESTOQUE'}
                      </TableCell>
                      <TableCell>
                        {u.isBlocked ? (
                          <Badge variant="destructive" className="uppercase text-[9px]">SUSPENSO</Badge>
                        ) : isExpired ? (
                          <Badge variant="destructive" className="uppercase text-[9px] bg-red-600 border-red-600">EXPIRADO</Badge>
                        ) : (
                          <Badge variant="outline" className="text-green-400 border-green-400/30 uppercase text-[9px]">ATIVO</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => toggleBlock(u)}>
                            {u.isBlocked ? <UserCheck className="h-4 w-4 text-green-400" /> : <UserX className="h-4 w-4 text-destructive" />}
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleEditUser(u)} className="text-blue-400"><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(u.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
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
