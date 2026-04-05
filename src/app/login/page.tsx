"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Tv, Key, Loader2, AlertCircle, User, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { validateDeviceLogin, validateResellerLogin } from "@/lib/store"

export default function LoginPage() {
  const [loginType, setLoginType] = React.useState<'user' | 'reseller'>('user')
  const [pin, setPin] = React.useState("")
  const [username, setUsername] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [rememberMe, setRememberMe] = React.useState(true)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const router = useRouter()

  React.useEffect(() => {
    const saved = localStorage.getItem("p2p_saved_pin")
    if (saved) {
      setPin(saved)
    }
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (loginType === 'user') {
      if (rememberMe) {
        localStorage.setItem("p2p_saved_pin", pin)
      } else {
        localStorage.removeItem("p2p_saved_pin")
      }

      let deviceId = localStorage.getItem("p2p_device_id") || "dev_" + Math.random().toString(36).substring(2, 15);
      localStorage.setItem("p2p_device_id", deviceId);
      
      const res = await validateDeviceLogin(pin, deviceId);
      if (res.error) { 
        setError(res.error === "PIN INVÁLIDO" ? "Código PIN incorreto." : res.error); 
        setLoading(false); 
        return; 
      }
      
      localStorage.setItem("user_session", JSON.stringify({ ...res.user, deviceId }));
      router.push(res.user?.role === 'admin' ? "/admin" : "/user/home");
    } else {
      const res = await validateResellerLogin(username, password);
      if (res.error) { 
        setError("Credenciais de revendedor incorretas."); 
        setLoading(false); 
        return; 
      }
      
      localStorage.setItem("reseller_session", JSON.stringify(res.reseller));
      router.push("/reseller/dashboard");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/10 via-background to-background">
      <Card className="w-full max-w-md bg-card border-border shadow-2xl rounded-[2.5rem] overflow-hidden">
        <CardHeader className="text-center pb-8 pt-12">
          <div className="mx-auto bg-primary w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-xl shadow-primary/20 border border-white/10">
            <Tv className="h-10 w-10 text-white" />
          </div>
          <CardTitle className="text-4xl font-black text-primary font-headline uppercase tracking-tight">StreamSight</CardTitle>
          <CardDescription className="text-xs uppercase tracking-widest font-bold opacity-60 mt-2">Tecnologia em Transmissão</CardDescription>
        </CardHeader>

        <CardContent className="px-8">
          <div className="flex bg-muted p-1 rounded-2xl border border-border mb-8">
            <button onClick={() => setLoginType('user')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${loginType === 'user' ? 'bg-primary text-white shadow-md' : 'text-muted-foreground hover:text-primary'}`}>Cliente</button>
            <button onClick={() => setLoginType('reseller')} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${loginType === 'reseller' ? 'bg-primary text-white shadow-md' : 'text-muted-foreground hover:text-primary'}`}>Revendedor</button>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {loginType === 'user' ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Código PIN</Label>
                  <div className="relative group">
                    <Key className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/40 group-focus-within:text-primary transition-colors" />
                    <Input 
                      placeholder="00000000000" 
                      className="pl-14 h-16 text-center text-xl tracking-[0.2em] font-black bg-muted/50 border-border rounded-2xl focus:ring-primary focus:border-primary" 
                      value={pin || ""} 
                      onChange={e => setPin(e.target.value)} 
                      required 
                      maxLength={11}
                    />
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 px-1">
                  <input 
                    type="checkbox" 
                    id="remember" 
                    checked={rememberMe} 
                    onChange={e => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded border-border bg-muted text-primary focus:ring-primary accent-primary"
                  />
                  <Label htmlFor="remember" className="text-[10px] font-bold uppercase text-muted-foreground cursor-pointer hover:text-primary transition-colors">Lembrar neste dispositivo</Label>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Usuário</Label>
                  <div className="relative">
                    <User className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/40" />
                    <Input placeholder="NOME DE USUÁRIO" className="pl-14 h-14 bg-muted/50 border-border rounded-2xl font-bold uppercase text-xs" value={username || ""} onChange={e => setUsername(e.target.value)} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] uppercase font-bold text-muted-foreground ml-1">Senha</Label>
                  <div className="relative">
                    <Key className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/40" />
                    <Input type="password" placeholder="SUA SENHA" className="pl-14 h-14 bg-muted/50 border-border rounded-2xl font-bold uppercase text-xs" value={password || ""} onChange={e => setPassword(e.target.value)} required />
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="p-4 bg-destructive/5 border border-destructive/10 rounded-2xl text-[10px] font-bold uppercase text-destructive flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                <AlertCircle className="h-4 w-4 shrink-0" /> {error}
              </div>
            )}

            <Button type="submit" className="w-full bg-primary h-16 text-sm font-black rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-95 transition-all" disabled={loading}>
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : 'ENTRAR NO SISTEMA'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="pb-10 pt-4 px-8 flex justify-between items-center opacity-60">
           <div className="flex items-center gap-2 text-[9px] font-bold uppercase text-primary">
             <ShieldCheck className="h-3 w-3" /> Acesso Seguro
           </div>
           <span className="text-[9px] font-bold uppercase italic">StreamSight v2.5</span>
        </CardFooter>
      </Card>
    </div>
  )
}