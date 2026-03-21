"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, Save, Loader2, Lock, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { saveReseller, Reseller } from "@/lib/store"
import { toast } from "@/hooks/use-toast"
import Link from "next/link"

export default function NewResellerPage() {
  const router = useRouter()
  const [loading, setLoading] = React.useState(false)
  const [formData, setFormData] = React.useState({
    name: "",
    username: "",
    password: "",
    cpf: "",
    birthDate: "",
    phone: "",
    email: "",
    credits: 0
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    
    const newReseller: Reseller = {
      id: "rev_" + Date.now() + Math.random().toString(36).substring(7),
      ...formData,
      totalSold: 0,
      isBlocked: false
    }

    try {
      const success = await saveReseller(newReseller)
      if (success) {
        toast({ title: "PARCEIRO CADASTRADO", description: "O revendedor foi salvo e as credenciais liberadas." })
        router.push("/admin/resellers")
      } else {
        toast({ variant: "destructive", title: "ERRO DE SISTEMA", description: "Verifique o banco de dados." })
      }
    } catch (err) {
      toast({ variant: "destructive", title: "ERRO FATAL", description: "Falha na conexão." })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-20">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/resellers"><ChevronLeft className="h-5 w-5" /></Link>
        </Button>
        <h1 className="text-3xl font-black font-headline uppercase italic">Cadastrar Novo Parceiro</h1>
      </div>

      <form onSubmit={handleSubmit} className="grid gap-6 p-8 bg-card/50 border border-white/5 rounded-[2.5rem] shadow-2xl">
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
              value={formData.password} 
              onChange={e => setFormData({...formData, password: e.target.value})} 
              className="h-12 bg-primary/5 border-primary/20 font-black text-primary" 
              placeholder="SENHA PARA O PAINEL"
              required 
            />
          </div>

          <div className="space-y-2">
            <Label className="uppercase text-[10px] font-black opacity-60">CPF</Label>
            <Input 
              value={formData.cpf} 
              onChange={e => setFormData({...formData, cpf: e.target.value})} 
              className="h-12 bg-black/40 border-white/5 font-bold" 
              placeholder="000.000.000-00"
              required 
            />
          </div>

          <div className="space-y-2">
            <Label className="uppercase text-[10px] font-black opacity-60">Data Nascimento</Label>
            <Input 
              type="date"
              value={formData.birthDate} 
              onChange={e => setFormData({...formData, birthDate: e.target.value})} 
              className="h-12 bg-black/40 border-white/5 font-bold" 
              required 
            />
          </div>

          <div className="space-y-2">
            <Label className="uppercase text-[10px] font-black opacity-60">WhatsApp</Label>
            <Input 
              value={formData.phone} 
              onChange={e => setFormData({...formData, phone: e.target.value})} 
              className="h-12 bg-black/40 border-white/5 font-bold" 
              placeholder="(00) 00000-0000"
              required 
            />
          </div>

          <div className="space-y-2">
            <Label className="uppercase text-[10px] font-black opacity-60">E-mail Oficial</Label>
            <Input 
              type="email"
              value={formData.email} 
              onChange={e => setFormData({...formData, email: e.target.value})} 
              className="h-12 bg-black/40 border-white/5 font-bold" 
              required 
            />
          </div>

          <div className="space-y-2 col-span-full">
            <Label className="uppercase text-[10px] font-black text-primary">Carga Inicial de PINs (Créditos)</Label>
            <Input 
              type="number"
              value={formData.credits} 
              onChange={e => setFormData({...formData, credits: parseInt(e.target.value) || 0})} 
              className="h-16 bg-primary/10 border-primary/20 text-center text-3xl font-black text-primary" 
              required 
            />
            <p className="text-[9px] font-bold uppercase opacity-40 text-center">Os créditos nunca expiram enquanto não forem ativados.</p>
          </div>
        </div>

        <Button type="submit" className="h-16 bg-primary text-lg font-black uppercase shadow-2xl shadow-primary/20 rounded-2xl mt-4" disabled={loading}>
          {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : <Save className="mr-2 h-6 w-6" />}
          FINALIZAR CADASTRO E LIBERAR PAINEL
        </Button>
      </form>
    </div>
  )
}
