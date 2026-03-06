
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Tv, Key, Loader2, CheckCircle2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"
import { getRemoteUsers } from "@/lib/store"

export default function LoginPage() {
  const [pin, setPin] = React.useState("")
  const [rememberMe, setRememberMe] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const router = useRouter()

  React.useEffect(() => {
    const savedPin = localStorage.getItem("remembered_pin")
    if (savedPin) {
      setPin(savedPin)
      setRememberMe(true)
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!pin) return

    setLoading(true)
    setError(null)

    try {
      // PIN DE ADMIN MASTER BLINDADO (HARDCODED PARA SEGURANÇA MÁXIMA)
      if (pin.toLowerCase() === 'adm77x2p') {
        const sessionData = {
          id: 'admin-master',
          role: 'admin',
          pin: 'adm77x2p',
          deviceId: Math.random().toString(36).substring(7)
        }
        localStorage.setItem("user_session", JSON.stringify(sessionData))
        if (rememberMe) localStorage.setItem("remembered_pin", pin)
        
        toast({ title: "Bem-vindo, Mestre Léo!", description: "Acesso administrativo vitalício liberado." })
        router.push("/admin")
        return
      }

      // BUSCA OUTROS USUÁRIOS NO BANCO/LOCAL
      const users = await getRemoteUsers()
      const user = users.find(u => u.pin.toLowerCase() === pin.toLowerCase())

      if (!user) {
        setError("PIN inválido ou não cadastrado.")
        toast({ variant: "destructive", title: "Acesso Negado", description: "Verifique seu código." })
        setLoading(false)
        return
      }

      if (user.isBlocked) {
        setError("Este acesso foi bloqueado pelo administrador.")
        toast({ variant: "destructive", title: "Conta Bloqueada" })
        setLoading(false)
        return
      }

      // SUCESSO NO LOGIN DO CLIENTE
      if (rememberMe) {
        localStorage.setItem("remembered_pin", pin)
      } else {
        localStorage.removeItem("remembered_pin")
      }

      localStorage.setItem("user_session", JSON.stringify({
        id: user.id,
        role: user.role,
        pin: user.pin,
        deviceId: Math.random().toString(36).substring(7)
      }))

      if (user.role === 'admin') {
        router.push("/admin")
      } else {
        toast({ title: "Acesso Liberado!", description: "Bom entretenimento!" })
        router.push("/user/home")
      }
    } catch (err: any) {
      console.error("Login fail:", err)
      setError("Erro de conexão. Tente novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md bg-card/50 backdrop-blur-xl border-white/5 shadow-2xl">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mb-4 border border-primary/20">
            <Tv className="h-10 w-10 text-primary" />
          </div>
          <CardTitle className="text-4xl font-bold tracking-tighter text-primary font-headline uppercase italic">Léo Tv</CardTitle>
          <CardDescription className="uppercase text-[10px] tracking-widest font-bold text-muted-foreground">Sistema P2P Mestre Ultra Rápido</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground ml-1">Insira seu código</label>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
                <Input 
                  placeholder="SEU PIN AQUI" 
                  className="pl-12 h-14 text-center text-xl tracking-[0.3em] uppercase font-bold bg-black/40 border-white/10 rounded-xl"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  required
                  autoFocus
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-[10px] font-bold uppercase">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}
            
            <div className="flex items-center space-x-2 bg-white/5 p-3 rounded-lg border border-white/5">
              <Checkbox 
                id="remember" 
                checked={rememberMe} 
                onCheckedChange={(val) => setRememberMe(!!val)}
              />
              <label htmlFor="remember" className="text-[10px] font-bold cursor-pointer uppercase tracking-widest text-muted-foreground flex-1">Salvar este código no aparelho</label>
            </div>

            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 h-14 text-lg font-bold shadow-lg shadow-primary/20 rounded-xl" disabled={loading}>
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : "ENTRAR NO SISTEMA"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 border-t border-white/5 pt-6 mt-4">
          <div className="flex items-center gap-2 text-[9px] text-green-400 font-bold uppercase tracking-tighter">
            <CheckCircle2 className="h-3 w-3" /> Servidores Online (P2P Ativo)
          </div>
          <p className="text-[8px] text-muted-foreground uppercase text-center font-bold">Acesso exclusivo para assinantes autorizados.</p>
        </CardFooter>
      </Card>
    </div>
  )
}
