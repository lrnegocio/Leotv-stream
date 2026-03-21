
"use client"

import * as React from "react"
import { Plus, Briefcase, Search, Edit2, Trash2, Key, Loader2, TrendingUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { getRemoteResellers, removeReseller, Reseller } from "@/lib/store"
import { toast } from "@/hooks/use-toast"
import Link from "next/link"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export default function ResellersPage() {
  const [resellers, setResellers] = React.useState<Reseller[]>([])
  const [loading, setLoading] = React.useState(true)
  const [search, setSearch] = React.useState("")

  const load = React.useCallback(async () => {
    setLoading(true)
    try {
      const data = await getRemoteResellers()
      setResellers(data)
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => { load() }, [load])

  const handleDelete = async (id: string) => {
    if (confirm("Deseja remover este revendedor?")) {
      await removeReseller(id)
      load()
      toast({ title: "Removido" })
    }
  }

  const filtered = resellers.filter(r => r.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold uppercase font-headline">Revendedores</h1>
          <p className="text-[10px] uppercase font-bold text-primary tracking-widest">Gestão de Créditos e Parceiros</p>
        </div>
        <Button asChild className="bg-primary">
          <Link href="/admin/resellers/new"><Plus className="mr-2 h-4 w-4" /> Novo Revendedor</Link>
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="BUSCAR PARCEIRO..." 
          className="pl-10 bg-card/50 border-white/5 h-12 uppercase font-bold text-[10px]" 
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
      ) : (
        <div className="bg-card/30 border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
          <Table>
            <TableHeader className="bg-black/20">
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="uppercase text-[10px] font-black text-primary">NOME</TableHead>
                <TableHead className="uppercase text-[10px] font-black">ESTOQUE (PINS)</TableHead>
                <TableHead className="uppercase text-[10px] font-black">VENDIDOS</TableHead>
                <TableHead className="uppercase text-[10px] font-black">CONTATO</TableHead>
                <TableHead className="text-right uppercase text-[10px] font-black">AÇÕES</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id} className="border-white/5 hover:bg-white/5 transition-colors">
                  <TableCell className="font-bold uppercase text-xs">{r.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 bg-emerald-500/10 rounded-lg flex items-center justify-center font-black text-emerald-500">
                        {r.credits}
                      </div>
                      <span className="text-[10px] font-bold opacity-50 uppercase">Disponíveis</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <span className="font-black text-xs">{r.totalSold || 0}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-[10px] font-bold opacity-60 uppercase">{r.phone}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" asChild>
                        <Link href={`/admin/resellers/${r.id}`}><Key className="h-4 w-4 text-emerald-400" /></Link>
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(r.id)}>
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
