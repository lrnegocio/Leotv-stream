
'use client';

import * as React from "react"
import { Plus, Search, UserCheck, UserX, RefreshCcw, Trash2, Edit, Loader2, ShieldAlert, Send, Lock, Monitor, Smartphone, Globe } from "lucide-react"
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
    screens: "1",
    isAdultEnabled: false
  })

  const loadUsers = React.useCallback(async () => {
    setLoading(true)
    try {
      const data = await getRemoteUsers()
      setUsers(data)
    } catch (err) {
      toast({ variant: "destructive", title: "Erro de conexão." })
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => { loadUsers() }, [loadUsers])

  const handleGeneratePin = () => { setNewUser(prev => ({ ...prev, pin: generateRandomPin(11) })) }

  const handleSaveUser = async () => {
    if (!newUser.pin) return;
    setIsSaving(true);
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
    if (await saveUser(userData)) {
      toast({ title: "PIN SALVO!" });
      setIsDialogOpen(false);
      setEditingUserId(null);
      await loadUsers();
    }
    setIsSaving(false);
  }

  const toggleBlock = async (user: User) => {
    const updated = { ...user, isBlocked: !user.isBlocked };
    if (await saveUser(updated)) { loadUsers(); }
  }

  const handleEditUser = (user: User) => {
    setEditingUserId(user.id);
    setNewUser({ pin: user.pin, tier: user.subscriptionTier, screens: user.maxScreens.toString(), isAdultEnabled: user.isAdultEnabled });
    setIsDialogOpen(true);
  }

  const sendWhatsAppAccess = (user: User) => {
    const msg = getBeautifulMessage(user.pin, user.subscriptionTier, window.location.origin, user.maxScreens);
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(msg)}`, '_blank');
  }

  const filteredUsers = users.filter(u => u.pin.includes(searchTerm)).sort((a,b) => b.id.localeCompare(a.id));

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black uppercase font-headline italic text-primary">Gerenciar Clientes</h1>
          <p className="text-muted-foreground text-[10px] font-bold uppercase tracking-widest">Controle de PINs, IP e IDs de Série.</p>
        </div>
        <Button onClick={() => { setIsDialogOpen(true); setNewUser({ pin: generateRandomPin(), tier: 'monthly', screens: '1', isAdultEnabled: false }); }} className="bg-primary font-black uppercase text-xs h-12 rounded-xl">
          <Plus className="mr-2 h-4 w-4" /> NOVO PIN MASTER
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="BUSCAR PIN..." className="pl-12 bg-card/50 border-white/5 h-14 uppercase font-bold text-xs rounded-2xl" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
      ) : (
        <div className="bg-card/30 border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl">
          <Table>
            <TableHeader className="bg-black/20">
              <TableRow className="border-white/5 h-14">
                <TableHead className="uppercase text-[10px] font-black text-primary px-8">PIN / DISPOSITIVO</TableHead>
                <TableHead className="uppercase text-[10px] font-black">PLANO</TableHead>
                <TableHead className="uppercase text-[10px] font-black">ADULTO</TableHead>
                <TableHead className="uppercase text-[10px] font-black">IP / SERIAL</TableHead>
                <TableHead className="text-right uppercase text-[10px] font-black px-8">AÇÕES</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((u) => (
                <TableRow key={u.id} className="border-white/5 hover:bg-white/5 transition-colors h-24">
                  <TableCell className="px-8">
                    <p className="font-mono font-black text-xl text-primary tracking-[0.2em]">{u.pin}</p>
                    <p className="text-[8px] opacity-40 uppercase font-black">{u.maxScreens} TELA(S)</p>
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.subscriptionTier === 'test' ? 'secondary' : 'default'} className="uppercase text-[9px] font-black">{u.subscriptionTier}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={`uppercase text-[8px] font-black ${u.isAdultEnabled ? 'bg-primary/20 text-primary' : 'bg-muted opacity-40'}`}>
                      {u.isAdultEnabled ? 'LIBERADO' : 'OCULTO'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {u.activeDevices.length > 0 ? (
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-emerald-500 uppercase flex items-center gap-1"><Globe className="h-3 w-3"/> {u.activeDevices[0].ip || 'SEM IP'}</p>
                        <p className="text-[8px] font-black opacity-40 uppercase flex items-center gap-1"><Monitor className="h-3 w-3"/> {u.activeDevices[0].id.substring(0,15)}...</p>
                      </div>
                    ) : <span className="text-[8px] opacity-20 font-black">AGUARDANDO LOGIN</span>}
                  </TableCell>
                  <TableCell className="text-right px-8">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => sendWhatsAppAccess(u)} className="text-emerald-500"><Send className="h-5 w-5" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => toggleBlock(u)}>{u.isBlocked ? <UserCheck className="text-green-400" /> : <UserX className="text-destructive" />}</Button>
                      <Button variant="ghost" size="icon" onClick={() => handleEditUser(u)} className="text-blue-400"><Edit className="h-5 w-5" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => removeUser(u.id).then(() => loadUsers())} className="text-destructive"><Trash2 className="h-5 w-5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px] bg-card border-white/10 rounded-3xl p-8">
          <DialogHeader><DialogTitle className="text-xl font-black uppercase italic text-primary">Configurar PIN</DialogTitle></DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="space-y-2">
              <Label className="uppercase text-[10px] font-black opacity-60">Código PIN Master</Label>
              <div className="flex gap-2">
                <Input value={newUser.pin} onChange={e => setNewUser({...newUser, pin: e.target.value})} className="bg-black/40 font-black text-xl tracking-[0.3em] text-center border-white/5 h-14 rounded-xl" />
                <Button variant="outline" onClick={handleGeneratePin} className="h-14"><RefreshCcw className="h-4 w-4 text-primary" /></Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="uppercase text-[10px] font-black opacity-60">Plano</Label>
                <Select value={newUser.tier} onValueChange={(v: any) => setNewUser({...newUser, tier: v})}>
                  <SelectTrigger className="h-12"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="test">6 Horas</SelectItem>
                    <SelectItem value="monthly">30 Dias</SelectItem>
                    <SelectItem value="lifetime">Vitalício</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label className="uppercase text-[10px] font-black opacity-60">Telas</Label>
                <Input type="number" value={newUser.screens} onChange={e => setNewUser({...newUser, screens: e.target.value})} className="h-12 bg-black/40" />
              </div>
            </div>
            <div className="p-4 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-primary" />
                <span className="text-[10px] font-black uppercase">Liberar Adultos</span>
              </div>
              <Switch checked={newUser.isAdultEnabled} onCheckedChange={v => setNewUser({...newUser, isAdultEnabled: v})} />
            </div>
          </div>
          <DialogFooter><Button onClick={handleSaveUser} className="w-full h-16 bg-primary font-black text-lg rounded-2xl" disabled={isSaving}>{isSaving ? <Loader2 className="animate-spin" /> : 'SALVAR ACESSO'}</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
