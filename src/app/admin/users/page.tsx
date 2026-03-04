
"use client"

import * as React from "react"
import { Plus, Search, UserCheck, UserX, RefreshCcw, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { getMockUsers, generateRandomPin, addUser, updateUser, User, SubscriptionTier } from "@/lib/store"
import { toast } from "@/hooks/use-toast"

export default function UserManagementPage() {
  const [searchTerm, setSearchTerm] = React.useState("")
  const [users, setUsers] = React.useState<User[]>([])
  const [isDialogOpen, setIsDialogOpen] = React.useState(false)
  const [newUser, setNewUser] = React.useState({
    pin: "",
    tier: "test" as SubscriptionTier,
    hours: "6",
    screens: "1",
    parentalPin: "0000"
  })

  React.useEffect(() => {
    setUsers(getMockUsers())
  }, [])

  const handleGeneratePin = () => {
    setNewUser({ ...newUser, pin: generateRandomPin() })
  }

  const handleAddUser = () => {
    let expiry = undefined;
    if (newUser.tier === 'test') {
      expiry = new Date(Date.now() + parseInt(newUser.hours) * 60 * 60 * 1000).toISOString();
    } else if (newUser.tier === 'monthly') {
      expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    }

    const createdUser: User = {
      id: Math.random().toString(36).substring(7),
      pin: newUser.pin || generateRandomPin(),
      role: 'user',
      subscriptionTier: newUser.tier,
      expiryDate: expiry,
      maxScreens: parseInt(newUser.screens),
      activeDevices: [],
      isBlocked: false,
      parentalPin: newUser.parentalPin
    }

    const updatedUsers = addUser(createdUser)
    setUsers(updatedUsers)
    setIsDialogOpen(false)
    toast({ title: "PIN Gerado", description: `O código ${createdUser.pin} foi criado com sucesso.` })
  }

  const toggleBlock = (userId: string) => {
    const user = users.find(u => u.id === userId)
    if (user) {
      user.isBlocked = !user.isBlocked
      const updated = updateUser(user)
      setUsers(updated)
      toast({ title: user.isBlocked ? "Bloqueado" : "Desbloqueado", description: "O status do usuário foi alterado." })
    }
  }

  const filteredUsers = users.filter(u => 
    u.pin.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold font-headline uppercase">Gerenciar Acessos</h1>
          <p className="text-muted-foreground">Gere PINs, defina tempos de expiração e controle telas.</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" /> Novo PIN / Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px] bg-card border-white/10">
            <DialogHeader>
              <DialogTitle className="uppercase tracking-tight">Gerar Novo Acesso</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Código PIN (Aleatório)</Label>
                <div className="flex gap-2">
                  <Input value={newUser.pin} readOnly placeholder="Clique em gerar" className="bg-black/20 uppercase font-bold" />
                  <Button variant="outline" onClick={handleGeneratePin}><RefreshCcw className="h-4 w-4" /></Button>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Plano / Tempo</Label>
                  <Select value={newUser.tier} onValueChange={(v: any) => setNewUser({...newUser, tier: v})}>
                    <SelectTrigger className="bg-black/20"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="test">Teste (Horas)</SelectItem>
                      <SelectItem value="monthly">Mensal (30 dias)</SelectItem>
                      <SelectItem value="lifetime">Vitalício</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {newUser.tier === 'test' && (
                  <div className="grid gap-2">
                    <Label>Duração (Horas)</Label>
                    <Input type="number" value={newUser.hours} onChange={e => setNewUser({...newUser, hours: e.target.value})} className="bg-black/20" />
                  </div>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Limite de Telas</Label>
                  <Input type="number" value={newUser.screens} onChange={e => setNewUser({...newUser, screens: e.target.value})} className="bg-black/20" />
                </div>
                <div className="grid gap-2">
                  <Label>Senha Parental</Label>
                  <Input maxLength={4} value={newUser.parentalPin} onChange={e => setNewUser({...newUser, parentalPin: e.target.value})} className="bg-black/20" />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleAddUser} className="w-full font-bold uppercase h-12">Confirmar e Gerar PIN</Button>
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

      <div className="bg-card/50 border border-white/5 rounded-xl overflow-hidden shadow-xl">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="uppercase">PIN / Acesso</TableHead>
              <TableHead className="uppercase">Plano</TableHead>
              <TableHead className="uppercase">Expiração</TableHead>
              <TableHead className="uppercase">Telas</TableHead>
              <TableHead className="uppercase">Status</TableHead>
              <TableHead className="text-right uppercase">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell className="font-mono font-bold uppercase text-primary">{user.pin}</TableCell>
                <TableCell>
                  <Badge variant={user.subscriptionTier === 'lifetime' ? 'default' : 'secondary'}>
                    {user.subscriptionTier === 'test' ? 'Teste' : user.subscriptionTier === 'monthly' ? 'Mensal' : 'Vitalício'}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  {user.expiryDate ? new Date(user.expiryDate).toLocaleString('pt-BR') : 'Sem expiração'}
                </TableCell>
                <TableCell>{user.activeDevices.length} / {user.maxScreens}</TableCell>
                <TableCell>
                  {user.isBlocked ? (
                    <Badge variant="destructive">Bloqueado</Badge>
                  ) : (
                    <Badge variant="outline" className="text-green-400 border-green-400">Ativo</Badge>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button variant="ghost" size="icon" onClick={() => toggleBlock(user.id)} title={user.isBlocked ? "Desbloquear" : "Bloquear"}>
                      {user.isBlocked ? <UserCheck className="h-4 w-4 text-green-400" /> : <UserX className="h-4 w-4 text-destructive" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
