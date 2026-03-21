"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Tv, Key, Loader2, AlertCircle, Globe, Briefcase, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"
import { validateDeviceLogin, validateResellerLogin } from "@/lib/store"

export default function LoginPage() {
  const [loginType, setLoginType] = React.useState<'user' | 'reseller'>('user')
  const [pin, setPin] = React.useState("")
  const [username, setUsername] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (loginType === 'user') {
      let deviceId = localStorage.getItem("p2p_device_id") || "dev_" + Math.random().toString(36).substring(2, 15);
      localStorage.setItem("p2p_device_id", deviceId);
      
      const res = await validateDeviceLogin(pin, deviceId);
      if (res.error) { setError(res.error); setLoading(false); return; }
      
      localStorage.setItem("user_session", JSON.stringify({ ...res.user, deviceId }));
      router.push(res.user?.role === 'admin' ? "/admin" : "/user/home");
    } else {
      const res = await validateResellerLogin(username, password);
      if (res.error) { setError(res.error); setLoading(false); return; }
      
      localStorage.setItem("reseller_session", JSON.stringify(res.reseller));
      router.push("/reseller/dashboard");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background">
      <Card className="w-full max-w-md bg-card/40 backdrop-blur-3xl border-white/5 shadow-2xl rounded-[3rem] overflow-hidden">
        <CardHeader className="text-center pb-8 pt-10">
          <div className="mx-auto bg-primary w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-2xl shadow-primary/30 border border-white/10">
            <Tv className="h-10 w-10 text-white" />
          </div>
          <CardTitle className="text-4xl font-black text-primary font-headline italic uppercase tracking-tighter">Léo Stream</CardTitle>
          <CardDescription className="text-[9px] uppercase tracking-[0.4em] font-bold opacity-40 mt-2">Tecnologia P2P de Alta Velocidade</CardDescription>
        </CardHeader>

        <CardContent className="px-8">
          <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5 mb-8">
            <button onClick={() => setLoginType('user')} className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase transition-all ${loginType === 'user' ? 'bg-primary text-white shadow-lg' : 'text-muted-foreground'}`}>Acesso Direto</button>
            <button onClick={() => setLoginType('reseller')} className={`flex-1 py-3 rounded-xl text-[10px] font-bold uppercase transition-all ${loginType === 'reseller' ? 'bg-primary text-white shadow-lg' : 'text-muted-foreground'}`}>Sou Revendedor</button>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {loginType === 'user' ? (
              <div className="relative">
                <Key className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/40" />
                <Input placeholder="DIGITE SEU CÓDIGO" className="pl-14 h-16 text-center text-2xl tracking-[0.4em] font-black bg-black/40 border-white/5 rounded-2xl" value={pin} onChange={e => setPin(e.target.value)} required />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <User className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/40" />
                  <Input placeholder="USUÁRIO" className="pl-14 h-14 bg-black/40 border-white/5 rounded-xl font-bold uppercase text-xs" value={username} onChange={e => setUsername(e.target.value)} required />
                </div>
                <div className="relative">
                  <Key className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/40" />
                  <Input type="password" placeholder="SENHA MESTRE" className="pl-14 h-14 bg-black/40 border-white/5 rounded-xl font-bold uppercase text-xs" value={password} onChange={e => setPassword(e.target.value)} required />
                </div>
              </div>
            )}

            {error && <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl text-[10px] font-bold uppercase text-destructive flex items-center gap-3"><AlertCircle className="h-4 w-4" /> {error}</div>}

            <Button type="submit" className="w-full bg-primary h-16 text-lg font-black rounded-2xl shadow-2xl shadow-primary/20 hover:scale-[1.02] transition-transform" disabled={loading}>
              {loading ? <Loader2 className="h-6 w-6 animate-spin" /> : 'ENTRAR NO SISTEMA'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="pb-10 pt-4 px-8 flex justify-between items-center opacity-40">
           <div className="flex items-center gap-2 text-[8px] font-bold uppercase text-green-400">
             <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" /> Sinal Blindado
           </div>
           <span className="text-[8px] font-bold uppercase">Versão 50.0 Master</span>
        </CardFooter>
      </Card>
    </div>
  )
}