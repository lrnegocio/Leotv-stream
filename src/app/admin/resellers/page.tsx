
"use client"

import * as React from "react"
import { Plus, Search, Key, Loader2, ShieldCheck, ShieldAlert, User, Trash2, Edit } from "lucide-react"
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
    try {
      const data = await getRemoteResellers()
      setResellers(data)
    } catch (err) {
      toast({ variant: "destructive", title: "Erro de Conexão", description: "Verifique o Supabase." })
    } finally {
      setLoading(false)
    }
  }, [])

  React.useEffect(() => { load() }, [load])

  const toggleBlock = async (res: Reseller) => {
    const updated: Reseller = { 
      ...res, 
      isBlocked: !res.isBlocked 
    }
    
    const result = await saveReseller(updated)
    
    if (result === true) {
      toast({ title: updated.isBlocked ? "REVENDA SUSPENSA" : "REVENDA ATIVADA" })
      await load()
    } else {
      // O erro detalhado já é disparado pelo store.ts via alert
      toast({ variant: "destructive", title: "Erro", description: "Falha ao alterar status no banco." })
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("ATENÇÃO: Deseja realmente excluir este revendedor? Todos os créditos e acessos dele serão removidos permanentemente.")) {
      const success = await removeReseller(id)
      if (success) {
        toast({ title: "Excluído", description: "O revendedor foi removido do banco de dados." })
        await load()
      } else {
        toast({ variant: "destructive", title: "Erro na Exclusão", description: "Falha ao remover no Supabase." })
      }
    }
  }

  const filtered = resellers.filter(r => r.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black uppercase font-headline">Gestão de Parceiros</h1>
          <p className="text-[10px] uppercase font-bold text-primary tracking-widest italic">Controle Central de Rede & Estoque</p>
        </div>
        <Button asChild className="bg-primary h-12 rounded-xl font-bold uppercase text-[10px]">
          <Link href="/admin/resellers/new"><Plus className="mr-2 h-4 w-4" /> Novo Parceiro</Link>
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input 
          placeholder="BUSCAR PARCEIRO..." 
          className="pl-12 bg-card/50 border-white/5 h-12 uppercase font-bold text-xs rounded-xl" 
          value={search} 
          onChange={e => setSearch(e.target.value)} 
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>
      ) : (
        <div className="bg-card/30 border border-white/5 rounded-[2rem] overflow-hidden shadow-2xl">
          <Table>
            <TableHeader className="bg-black/20">
              <TableRow className="border-white/5 hover:bg-transparent">
                <TableHead className="uppercase text-[10px] font-black text-primary">NOME DO PARCEIRO</TableHead>
                <TableHead className="uppercase text-[10px] font-black">USUÁRIO</TableHead>
                <TableHead className="uppercase text-[10px] font-black text-center">ESTOQUE</TableHead>
                <TableHead className="uppercase text-[10px] font-black">STATUS</TableHead>
                <TableHead className="text-right uppercase text-[10px] font-black">AÇÕES</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.id} className="border-white/5 hover:bg-white/5 transition-colors">
                  <TableCell className="font-bold uppercase text-xs">{r.name}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 font-mono text-[10px] opacity-60 uppercase bg-black/20 px-3 py-1 rounded-md w-fit">
                      <User className="h-3 w-3 text-primary" /> {r.username || 'NÃO DEFINIDO'}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="bg-emerald-500/10 text-emerald-500 px-4 py-1.5 rounded-full font-black text-xs border border-emerald-500/20">{r.credits}</span>
                  </TableCell>
                  <TableCell>
                    <span className={`text-[10px] font-black uppercase ${r.isBlocked ? 'text-destructive' : 'text-green-400'}`}>
                      {r.isBlocked ? 'SUSPENSO' : 'SINAL ATIVO'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => toggleBlock(r)} title={r.isBlocked ? "Ativar Revenda" : "Bloquear Revenda"}>
                        {r.isBlocked ? <ShieldCheck className="h-4 w-4 text-green-400" /> : <ShieldAlert className="h-4 w-4 text-destructive" />}
                      </Button>
                      <Button variant="ghost" size="icon" asChild title="Editar Parceiro" className="text-primary">
                        <Link href={`/admin/resellers/edit/${r.id}`}><Edit className="h-4 w-4" /></Link>
                      </Button>
                      <Button variant="ghost" size="icon" asChild title="Ver Painel Master">
                        <Link href={`/admin/resellers/${r.id}`}><Key className="h-4 w-4 text-blue-400" /></Link>
                      </Button>
                      <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(r.id)} title="Excluir Revendedor">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-20 opacity-30 font-black uppercase text-xs">Nenhum parceiro localizado.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
