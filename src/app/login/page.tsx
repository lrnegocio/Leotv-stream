
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Tv, Key, Loader2, AlertCircle, User } from "lucide-react"
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

  // Carrega PIN salvo ao iniciar (MEMÓRIA MASTER)
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
      // Salva o PIN se o usuário marcou a opção (SEM DICAS DE DIGITOS)
      if (rememberMe) {
        localStorage.setItem("p2p_saved_pin", pin)
      } else {
        localStorage.removeItem("p2p_saved_pin")
      }

      // Gera ou recupera o ID único deste aparelho (VÍNCULO DE HARDWARE)
      let deviceId = localStorage.getItem("p2p_device_id") || "dev_" + Math.random().toString(36).substring(2, 15);
      localStorage.setItem("p2p_device_id", deviceId);
      
      const res = await validateDeviceLogin(pin, deviceId);
      if (res.error) { 
        setError(res.error); 
        setLoading(false); 
        return; 
      }
      
      localStorage.setItem("user_session", JSON.stringify({ ...res.user, deviceId }));
      router.push(res.user?.role === 'admin' ? "/admin" : "/user/home");
    } else {
      const res = await validateResellerLogin(username, password);
      if (res.error) { 
        setError(res.error); 
        setLoading(false); 
        return; 
      }
      
      localStorage.setItem("reseller_session", JSON.stringify(res.reseller));
      router.push("/reseller/dashboard");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background">
      <Card className="w-full max-w-md bg-card/40 backdrop-blur-3xl border-white/5 shadow-2xl rounded-[3.5rem] overflow-hidden">
        <CardHeader className="text-center pb-8 pt-12">
          <div className="mx-auto bg-primary w-24 h-24 rounded-[2rem] flex items-center justify-center mb-6 shadow-2xl shadow-primary/30 border border-white/10 rotate-3">
            <Tv className="h-12 w-12 text-white -rotate-3" />
          </div>
          <CardTitle className="text-5xl font-black text-primary font-headline italic uppercase tracking-tighter">Léo Stream</CardTitle>
          <CardDescription className="text-[10px] uppercase tracking-[0.4em] font-bold opacity-40 mt-3">Sistema de Transmissão Master</CardDescription>
        </CardHeader>

        <CardContent className="px-10">
          <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/5 mb-8">
            <button onClick={() => setLoginType('user')} className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase transition-all ${loginType === 'user' ? 'bg-primary text-white shadow-xl' : 'text-muted-foreground hover:text-white'}`}>Acesso Direto</button>
            <button onClick={() => setLoginType('reseller')} className={`flex-1 py-4 rounded-xl text-[10px] font-black uppercase transition-all ${loginType === 'reseller' ? 'bg-primary text-white shadow-xl' : 'text-muted-foreground hover:text-white'}`}>Revenda Master</button>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {loginType === 'user' ? (
              <div className="space-y-6">
                <div className="relative group">
                  <Key className="absolute left-6 top-1/2 -translate-y-1/2 h-6 w-6 text-primary/40 group-focus-within:text-primary transition-colors" />
                  <Input 
                    placeholder="CÓDIGO DE ACESSO" 
                    className="pl-16 h-20 text-center text-2xl tracking-[0.3em] font-black bg-black/40 border-white/5 rounded-3xl focus:ring-primary focus:border-primary" 
                    value={pin} 
                    onChange={e => setPin(e.target.value)} 
                    required 
                    maxLength={11}
                  />
                </div>
                
                <div className="flex items-center space-x-3 px-2">
                  <div className="flex items-center space-x-2">
                    <input 
                      type="checkbox" 
                      id="remember" 
                      checked={rememberMe} 
                      onChange={e => setRememberMe(e.target.checked)}
                      className="w-5 h-5 rounded border-white/10 bg-black/40 text-primary focus:ring-primary accent-primary"
                    />
                    <Label htmlFor="remember" className="text-[11px] font-black uppercase opacity-60 cursor-pointer hover:opacity-100 transition-opacity">Salvar PIN neste aparelho</Label>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative">
                  <User className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/40" />
                  <Input placeholder="USUÁRIO MESTRE" className="pl-16 h-16 bg-black/40 border-white/5 rounded-2xl font-black uppercase text-xs" value={username} onChange={e => setUsername(e.target.value)} required />
                </div>
                <div className="relative">
                  <Key className="absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/40" />
                  <Input type="password" placeholder="SENHA DE ACESSO" className="pl-16 h-16 bg-black/40 border-white/5 rounded-2xl font-black uppercase text-xs" value={password} onChange={e => setPassword(e.target.value)} required />
                </div>
              </div>
            )}

            {error && (
              <div className="p-5 bg-destructive/10 border border-destructive/20 rounded-3xl text-[10px] font-black uppercase text-destructive flex items-center gap-4 animate-in fade-in slide-in-from-top-4">
                <AlertCircle className="h-5 w-5 shrink-0" /> {error}
              </div>
            )}

            <Button type="submit" className="w-full bg-primary h-20 text-xl font-black rounded-3xl shadow-2xl shadow-primary/30 hover:scale-[1.02] active:scale-95 transition-all" disabled={loading}>
              {loading ? <Loader2 className="h-8 w-8 animate-spin" /> : 'SINTONIZAR AGORA'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="pb-12 pt-6 px-10 flex justify-between items-center opacity-40">
           <div className="flex items-center gap-2 text-[9px] font-black uppercase text-green-400">
             <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.5)]" /> Sinal Blindado
           </div>
           <span className="text-[9px] font-black uppercase italic">Powered by Léo Tech</span>
        </CardFooter>
      </Card>
    </div>
  )
}
