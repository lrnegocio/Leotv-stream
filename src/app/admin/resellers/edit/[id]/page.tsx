
"use client"

import * as React from "react"
import { useParams, useRouter } from "next/navigation"
import { ChevronLeft, Save, Loader2, Lock, User, ShieldAlert } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { saveReseller, getRemoteResellers, Reseller } from "@/lib/store"
import { toast } from "@/hooks/use-toast"
import Link from "next/link"

export default function EditResellerPage() {
  const { id } = useParams()
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)
  const [fetching, setFetching] = React.useState(true)
  const [formData, setFormData] = React.useState<Reseller | null>(null)

  React.useEffect(() => {
    const load = async () => {
      const list = await getRemoteResellers()
      const item = list.find(r => r.id === id)
      if (item) {
        setFormData(item)
      } else {
        toast({ variant: "destructive", title: "Erro", description: "Parceiro não localizado." })
        router.push("/admin/resellers")
      }
      setFetching(false)
    }
    load()
  }, [id, router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData) return
    setLoading(true)
    
    try {
      const success = await saveReseller(formData)
      if (success === true) {
        toast({ title: "DADOS ATUALIZADOS", description: "As credenciais do parceiro foram salvas com sucesso." })
        router.push("/admin/resellers")
      } else {
        toast({ variant: "destructive", title: "ERRO AO SALVAR", description: "Verifique as colunas do banco no Supabase." })
      }
    } catch (err) {
      toast({ variant: "destructive", title: "ERRO FATAL", description: "Falha na conexão com o banco." })
    } finally {
      setLoading(false)
    }
  }

  if (fetching || !formData) return <div className="flex justify-center py-20"><Loader2 className="h-10 w-10 animate-spin text-primary" /></div>

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/resellers"><ChevronLeft className="h-5 w-5" /></Link>
        </Button>
        <h1 className="text-3xl font-black font-headline uppercase italic">Editar Parceiro: {formData.name}</h1>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 p-8 bg-card/50 border border-white/5 rounded-[2.5rem] shadow-2xl">
        <div className="p-4 bg-primary/10 border border-primary/20 rounded-2xl flex gap-3 mb-2">
          <ShieldAlert className="h-5 w-5 text-primary shrink-0" />
          <p className="text-[10px] font-bold uppercase text-primary">Use este formulário para definir ou alterar o USUÁRIO e SENHA de acesso do revendedor.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2 col-span-full">
            <Label className="uppercase text-[10px] font-black opacity-60">Nome Completo</Label>
            <Input 
              value={formData.name} 
              onChange={e => setFormData({...formData, name: e.target.value})} 
              className="h-12 bg-black/40 border-white/5 font-bold uppercase" 
              required 
            />
          </div>

          <div className="space-y-2">
            <Label className="uppercase text-[10px] font-black text-primary flex items-center gap-2">
              <User className="h-3 w-3" /> Usuário de Login
            </Label>
            <Input 
              value={formData.username} 
              onChange={e => setFormData({...formData, username: e.target.value})} 
              className="h-12 bg-primary/5 border-primary/20 font-black text-primary" 
              placeholder="EX: REVENDALEO"
              required 
            />
          </div>

          <div className="space-y-2">
            <Label className="uppercase text-[10px] font-black text-primary flex items-center gap-2">
              <Lock className="h-3 w-3" /> Senha Mestra
            </Label>
            <Input 
              type="text"
              value={formData.password || ""} 
              onChange={e => setFormData({...formData, password: e.target.value})} 
              className="h-12 bg-primary/5 border-primary/20 font-black text-primary" 
              placeholder="DEFINA A SENHA"
              required 
            />
          </div>

          <div className="space-y-2">
            <Label className="uppercase text-[10px] font-black opacity-60">CPF</Label>
            <Input 
              value={formData.cpf} 
              onChange={e => setFormData({...formData, cpf: e.target.value})} 
              className="h-12 bg-black/40 border-white/5 font-bold" 
            />
          </div>

          <div className="space-y-2">
            <Label className="uppercase text-[10px] font-black opacity-60">WhatsApp</Label>
            <Input 
              value={formData.phone} 
              onChange={e => setFormData({...formData, phone: e.target.value})} 
              className="h-12 bg-black/40 border-white/5 font-bold" 
            />
          </div>

          <div className="space-y-2">
            <Label className="uppercase text-[10px] font-black opacity-60">E-mail Oficial</Label>
            <Input 
              type="email"
              value={formData.email} 
              onChange={e => setFormData({...formData, email: e.target.value})} 
              className="h-12 bg-black/40 border-white/5 font-bold" 
            />
          </div>

          <div className="space-y-2">
            <Label className="uppercase text-[10px] font-black opacity-60">Estoque Atual (Créditos)</Label>
            <Input 
              type="number"
              value={formData.credits} 
              onChange={e => setFormData({...formData, credits: parseInt(e.target.value) || 0})} 
              className="h-12 bg-black/40 border-white/5 font-black text-emerald-500" 
            />
          </div>
        </div>

        <Button type="submit" className="h-16 bg-primary text-lg font-black uppercase shadow-2xl shadow-primary/20 rounded-2xl mt-4" disabled={loading}>
          {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Save className="mr-2 h-6 w-6" />}
          SALVAR ALTERAÇÕES
        </Button>
      </form>
    </div>
  )
}
