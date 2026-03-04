
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Tv, Key, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"
import { getMockUsers } from "@/lib/store"

export default function LoginPage() {
  const [pin, setPin] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const router = useRouter()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Simula delay de verificação
    setTimeout(() => {
      const users = getMockUsers()
      const user = users.find(u => u.pin.toLowerCase() === pin.toLowerCase())

      if (user) {
        if (user.isBlocked) {
          toast({ variant: "destructive", title: "Conta Bloqueada", description: "Seu acesso foi suspenso." })
          setLoading(false)
          return
        }

        if (user.expiryDate && new Date(user.expiryDate) < new Date()) {
          toast({ variant: "destructive", title: "PIN Expirado", description: "Seu acesso expirou. Renove com o suporte." })
          setLoading(false)
          return
        }

        localStorage.setItem("user_session", JSON.stringify({
          id: user.id,
          role: user.role,
          pin: user.pin,
          deviceId: Math.random().toString(36).substring(7)
        }))

        if (user.role === 'admin') {
          toast({ title: "Bem-vindo, Administrador!", description: "Acesso total liberado." })
          router.push("/admin")
        } else {
          toast({ title: "Acesso Liberado!", description: "Bom entretenimento!" })
          router.push("/home")
        }
      } else {
        toast({ variant: "destructive", title: "Erro de Acesso", description: "PIN inválido ou inexistente." })
      }
      setLoading(false)
    }, 800)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-background to-background">
      <Card className="w-full max-w-md bg-card/50 backdrop-blur-xl border-white/5 shadow-2xl">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <Tv className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight text-primary font-headline uppercase">Léo Tv</CardTitle>
          <CardDescription>Insira seu código de acesso</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Seu Código PIN</label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="DIGITE SEU PIN" 
                  className="pl-10 text-center text-lg tracking-widest uppercase font-bold bg-black/20"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 h-12 text-lg font-semibold" disabled={loading}>
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "ENTRAR AGORA"}
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <p className="text-[10px] text-center w-full text-muted-foreground uppercase tracking-widest">
            Sistema P2P Mestre Ultra Rápido
          </p>
        </CardFooter>
      </Card>
    </div>
  )
}
