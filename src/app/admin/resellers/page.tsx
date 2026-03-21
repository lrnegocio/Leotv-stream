"use client"

import * as React from "react"
import { Plus, Search, Edit2, Trash2, Key, Loader2, ShieldCheck, ShieldAlert, Briefcase } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getRemoteResellers, removeReseller, saveReseller, Reseller } from "@/lib/store"
import { toast } from "@/hooks/use-toast"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function ResellersPage() {
  const [resellers, setResellers] = React.useState<Reseller[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")

  const load = React.useCallback(async () => {
    setLoading(true)
    const data = await getRemoteResellers()
    setResellers(data)
    setLoading(false)
  }, [])

  React.useEffect(() => { load() }, [load])

  const toggleBlock = async (res: Reseller) => {
    const updated = { ...res, isBlocked: !res.isBlocked }
    await saveReseller(updated)
    toast({ title: updated.isBlocked ? "REVENDA SUSPENSA" : "REVENDA ATIVADA" })
    load()
  }

  const filtered = resellers.filter(r => r.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black uppercase font-headline">Gerenciar Parceiros</h1>
          <p className="text-[10px] uppercase font-bold text-primary tracking-widest">Controle de Estoque e Rede</p>
        </div>
        <Button asChild className="bg-primary h-12 rounded-xl">
          <Link href="/admin/resellers/new"><Plus className="mr-2 h-4 w-4" /> Novo Parceiro</Link>
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="BUSCAR PARCEIRO..." className="pl-12 bg-card/50 border-white/5 h-12 uppercase font-bold text-xs rounded-xl" value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
      ) : (
        <div className="bg-card/30 border border-white/5 rounded-3xl overflow-hidden shadow-2xl">
          <Table>
            <TableHeader className="bg-black/20">
              <TableRow className="border-white/5">
                <TableHead className="uppercase text-[10px] font-black text-primary">NOME</TableHead>
                <TableHead className="uppercase text-[10px] font-black">USUÁRIO</TableHead>
                <TableHead className="uppercase text-[10px] font-black">ESTOQUE</TableHead>
                <TableHead className="uppercase text-[10px] font-black">STATUS</TableHead>
                <TableHead className="text-right uppercase text-[10px] font-black">AÇÕES</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id} className="border-white/5 hover:bg-white/5">
                  <TableCell className="font-bold uppercase text-xs">{r.name}</TableCell>
                  <TableCell className="font-mono text-[10px] opacity-60 uppercase">{r.username}</TableCell>
                  <TableCell>
                    <span className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-lg font-black text-xs">{r.credits}</span>
                  </TableCell>
                  <TableCell>
                    <span className={`text-[10px] font-black uppercase ${r.isBlocked ? 'text-destructive' : 'text-green-400'}`}>
                      {r.isBlocked ? 'BLOQUEADO' : 'ATIVO'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => toggleBlock(r)} className={r.isBlocked ? "text-green-400" : "text-destructive"}>
                        {r.isBlocked ? <ShieldCheck className="h-4 w-4" /> : <ShieldAlert className="h-4 w-4" />}
                      </Button>
                      <Button variant="ghost" size="icon" asChild><Link href={`/admin/resellers/${r.id}`}><Key className="h-4 w-4 text-primary" /></Link></Button>
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