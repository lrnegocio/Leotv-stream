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
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const handleGeneratePin = () => {
    setNewUser({ ...newUser, pin: generateRandomPin() })
  }

  const handleAddUser = async () => {
    let expiry = undefined
    if (newUser.tier === 'test') {
      expiry = new Date(Date.now() + parseInt(newUser.hours) * 60 * 60 * 1000).toISOString()
    } else if (newUser.tier === 'monthly') {
      expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    }

    const userData: User = {
      id: editingUserId || Math.random().toString(36).substring(7),
      pin: newUser.pin || generateRandomPin(),
      role: 'user',
      subscriptionTier: newUser.tier,
      expiryDate: expiry,
      maxScreens: parseInt(newUser.screens),
      activeDevices: [],
      isBlocked: false
    }

    await saveUser(userData)
    toast({ title: editingUserId ? "PIN Atualizado" : "PIN Gerado", description: `Código: ${userData.pin}` })
    
    setIsDialogOpen(false)
    setEditingUserId(null)
    setNewUser({ pin: "", tier: "test", hours: "6", screens: "1" })
    loadUsers()
  }

  const toggleBlock = async (user: User) => {
    const updated = { ...user, isBlocked: !user.isBlocked }
    await saveUser(updated)
    toast({ title: updated.isBlocked ? "PIN Bloqueado" : "PIN Desbloqueado" })
    loadUsers()
  }

  const handleDeleteUser = async (userId: string) => {
    if (confirm("Deletar este acesso?")) {
      await removeUser(userId)
      toast({ title: "PIN Deletado" })
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
          <h1 className="text-3xl font-bold font-headline uppercase">Gerenciar Acessos</h1>
          <p className="text-muted-foreground text-xs uppercase font-bold opacity-50">Controle de PINs e Tempos.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary">
              <Plus className="mr-2 h-4 w-4" /> Novo PIN
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-card border-white/10">
            <DialogHeader>
              <DialogTitle className="uppercase tracking-tight sr-only">Gerenciar Acesso</DialogTitle>
              <h2 className="text-lg font-bold uppercase">{editingUserId ? 'Editar' : 'Gerar Novo'} Acesso</h2>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>PIN</Label>
                <div className="flex gap-2">
                  <Input value={newUser.pin} readOnly className="bg-black/20 font-bold" />
                  <Button variant="outline" onClick={handleGeneratePin}><RefreshCcw className="h-4 w-4" /></Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Plano</Label>
                  <Select value={newUser.tier} onValueChange={(v: any) => setNewUser({...newUser, tier: v})}>
                    <SelectTrigger className="bg-black/20"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="test">Teste</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                      <SelectItem value="lifetime">Vitalício</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {newUser.tier === 'test' && (
                  <div className="grid gap-2">
                    <Label>Horas</Label>
                    <Input type="number" value={newUser.hours} onChange={e => setNewUser({...newUser, hours: e.target.value})} className="bg-black/20" />
                  </div>
                )}
              </div>
              <div className="grid gap-2">
                <Label>Telas</Label>
                <Input type="number" value={newUser.screens} onChange={e => setNewUser({...newUser, screens: e.target.value})} className="bg-black/20" />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddUser} className="w-full font-bold uppercase h-12">Confirmar PIN</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="Buscar por PIN..." 
          className="pl-10 bg-card/50 border-white/5" 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
      ) : (
        <div className="bg-card/50 border border-white/5 rounded-xl overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PIN</TableHead>
                <TableHead>PLANO</TableHead>
                <TableHead>EXPIRAÇÃO</TableHead>
                <TableHead>TELAS</TableHead>
                <TableHead>STATUS</TableHead>
                <TableHead className="text-right">AÇÕES</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-mono font-bold text-primary">{user.pin}</TableCell>
                  <TableCell>
                    <Badge variant={user.subscriptionTier === 'lifetime' ? 'default' : 'secondary'}>
                      {user.subscriptionTier}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">
                    {user.expiryDate ? new Date(user.expiryDate).toLocaleString('pt-BR') : 'Sem data'}
                  </TableCell>
                  <TableCell>{user.activeDevices?.length || 0} / {user.maxScreens}</TableCell>
                  <TableCell>
                    {user.isBlocked ? (
                      <Badge variant="destructive">Bloqueado</Badge>
                    ) : (
                      <Badge variant="outline" className="text-green-400 border-green-400">Ativo</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => toggleBlock(user)}>
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
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
