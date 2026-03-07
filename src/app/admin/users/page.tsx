"use client"

import * as React from "react"
import { Plus, Search, UserCheck, UserX, RefreshCcw, Trash2, Edit, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { getRemoteUsers, generateRandomPin, saveUser, removeUser, User, SubscriptionTier } from "@/lib/store"
import { toast } from "@/hooks/use-toast"

export default function UserManagementPage() {
  const [searchTerm, setSearchTerm] = React.useState("")
  const [users, setUsers] = React.useState<User[]>([])
  const [loading, setLoading] = React.useState(true)
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [editingUserId, setEditingUserId] = React.useState<string | null>(null)
  const [newUser, setNewUser] = React.useState({
    pin: "",
    tier: "test" as SubscriptionTier,
    hours: "6",
    screens: "1"
  })

  const loadUsers = React.useCallback(async () => {
    setLoading(true)
    try {
      const data = await getRemoteUsers()
      setUsers(data)
    } catch (err) {
      toast({ variant: "destructive", title: "Erro Cloud", description: "Falha ao carregar usuários do Supabase." })
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

  const handleAddUser = async () => {
    if (!newUser.pin) {
      toast({ variant: "destructive", title: "Atenção", description: "Gere um PIN antes de salvar." })
      return
    }

    let expiry = undefined
    if (newUser.tier === 'test') {
      expiry = new Date(Date.now() + parseInt(newUser.hours) * 60 * 60 * 1000).toISOString()
    } else if (newUser.tier === 'monthly') {
      expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    }

    const userData: User = {
      id: editingUserId || Math.random().toString(36).substring(7),
      pin: newUser.pin,
      role: 'user',
      subscriptionTier: newUser.tier,
      expiryDate: expiry,
      maxScreens: parseInt(newUser.screens),
      activeDevices: [],
      isBlocked: false
    }

    const success = await saveUser(userData)
    
    if (success) {
      toast({ title: editingUserId ? "Atualizado" : "PIN Gerado", description: `Sincronizado com o Supabase.` })
      setIsDialogOpen(false)
      setEditingUserId(null)
      setNewUser({ pin: "", tier: "test", hours: "6", screens: "1" })
      await loadUsers()
    } else {
      toast({ variant: "destructive", title: "Erro ao Salvar", description: "Verifique se as tabelas existem no Supabase." })
    }
  }

  const toggleBlock = async (user: User) => {
    const updated = { ...user, isBlocked: !user.isBlocked }
    await saveUser(updated)
    toast({ title: updated.isBlocked ? "Acesso Suspenso" : "Acesso Liberado" })
    loadUsers()
  }

  const handleDeleteUser = async (userId: string) => {
    if (confirm("Deletar este acesso permanentemente do Supabase?")) {
      await removeUser(userId)
      toast({ title: "PIN Excluído" })
      loadUsers()
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
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-headline uppercase">Controle de Acessos</h1>
          <p className="text-muted-foreground text-[10px] uppercase font-bold tracking-widest opacity-60">Sincronizado via Supabase Cloud</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) { setEditingUserId(null); setNewUser({ pin: "", tier: "test", hours: "6", screens: "1" }); }
        }}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:scale-105 transition-transform font-bold uppercase text-xs" onClick={() => handleGeneratePin()}>
              <Plus className="mr-2 h-4 w-4" /> Gerar Novo PIN
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-card border-white/10">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold uppercase italic text-primary">
                {editingUserId ? 'Editar' : 'Novo'} PIN de Cliente
              </DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label className="uppercase text-[10px] font-bold">Código PIN Gerado</Label>
                <div className="flex gap-2">
                  <Input value={newUser.pin} readOnly className="bg-black/40 font-black text-xl tracking-[0.3em] text-center border-white/5" />
                  <Button variant="outline" onClick={handleGeneratePin} className="border-white/10 hover:bg-primary/20">
                    <RefreshCcw className="h-4 w-4 text-primary" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label className="uppercase text-[10px] font-bold">Plano</Label>
                  <Select value={newUser.tier} onValueChange={(v: any) => setNewUser({...newUser, tier: v})}>
                    <SelectTrigger className="bg-black/40 border-white/5"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="test">Teste</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                      <SelectItem value="lifetime">Vitalício</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {newUser.tier === 'test' && (
                  <div className="grid gap-2">
                    <Label className="uppercase text-[10px] font-bold">Horas</Label>
                    <Input type="number" value={newUser.hours} onChange={e => setNewUser({...newUser, hours: e.target.value})} className="bg-black/40 border-white/5" />
                  </div>
                )}
              </div>
              <div className="grid gap-2">
                <Label className="uppercase text-[10px] font-bold">Limite de Telas</Label>
                <Input type="number" value={newUser.screens} onChange={e => setNewUser({...newUser, screens: e.target.value})} className="bg-black/40 border-white/5" />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddUser} className="w-full font-black uppercase h-14 bg-primary text-lg shadow-xl shadow-primary/20">
                SALVAR NA NUVEM
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="BUSCAR PIN DO CLIENTE..." 
          className="pl-10 pr-4 bg-card/50 border-white/5 h-12 uppercase font-bold text-xs tracking-widest" 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
      ) : (
        <div className="bg-card/30 border border-white/5 rounded-2xl overflow-hidden backdrop-blur-sm shadow-2xl">
          <Table>
            <TableHeader className="bg-black/20">
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="uppercase text-[10px] font-black tracking-widest text-primary">PIN</TableHead>
                <TableHead className="uppercase text-[10px] font-black tracking-widest">PLANO</TableHead>
                <TableHead className="uppercase text-[10px] font-black tracking-widest">VENCIMENTO</TableHead>
                <TableHead className="uppercase text-[10px] font-black tracking-widest">TELAS</TableHead>
                <TableHead className="uppercase text-[10px] font-black tracking-widest">STATUS</TableHead>
                <TableHead className="text-right uppercase text-[10px] font-black tracking-widest">AÇÕES</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 uppercase text-xs font-bold opacity-30 tracking-[0.2em]">Nenhum acesso sincronizado</TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id} className="border-white/5 hover:bg-white/5 group transition-colors">
                    <TableCell className="font-mono font-black text-lg text-primary tracking-widest">{user.pin}</TableCell>
                    <TableCell>
                      <Badge variant={user.subscriptionTier === 'lifetime' ? 'default' : 'secondary'} className="uppercase text-[9px] font-black">
                        {user.subscriptionTier}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[10px] font-bold uppercase opacity-60">
                      {user.expiryDate ? new Date(user.expiryDate).toLocaleString('pt-BR') : 'VITALÍCIO'}
                    </TableCell>
                    <TableCell className="font-black">{user.activeDevices?.length || 0} / {user.maxScreens}</TableCell>
                    <TableCell>
                      {user.isBlocked ? (
                        <Badge variant="destructive" className="uppercase text-[9px] font-black">SUSPENSO</Badge>
                      ) : (
                        <Badge variant="outline" className="text-green-400 border-green-400/30 bg-green-400/5 uppercase text-[9px] font-black animate-pulse">LIBERADO</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="icon" onClick={() => toggleBlock(user)} title="Bloquear/Desbloquear">
                          {user.isBlocked ? <UserCheck className="h-4 w-4 text-green-400" /> : <UserX className="h-4 w-4 text-destructive" />}
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleEditUser(user)} className="text-blue-400">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => handleDeleteUser(user.id)} className="text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
