
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Tv, Key, Loader2, AlertCircle, Globe } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"
import { validateDeviceLogin } from "@/lib/store"

export default function LoginPage() {
  const [pin, setPin] = React.useState("")
  const [rememberMe, setRememberMe] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [isMounted, setIsMounted] = React.useState(false)
  const router = useRouter()

  React.useEffect(() => {
    setIsMounted(true)
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

    // Gera um ID Único para este aparelho se não houver
    let deviceId = localStorage.getItem("p2p_device_id");
    if (!deviceId) {
      deviceId = "dev_" + Math.random().toString(36).substring(2, 15);
      localStorage.setItem("p2p_device_id", deviceId);
    }

    try {
      const result = await validateDeviceLogin(pin, deviceId);

      if (result.error) {
        setError(result.error);
        setLoading(false);
        return;
      }

      if (result.user) {
        const session = {
          id: result.user.id,
          role: result.user.role,
          pin: result.user.pin,
          deviceId: deviceId
        }
        
        localStorage.setItem("user_session", JSON.stringify(session))
        if (rememberMe) localStorage.setItem("remembered_pin", pin)

        toast({ title: "Sinal Liberado!", description: "Conectado via P2P Mestre." })
        
        if (result.user.role === 'admin') {
          router.push("/admin")
        } else {
          router.push("/user/home")
        }
      }
    } catch (err: any) {
      setError("Erro de conexão com o servidor Master.")
      setLoading(false)
    }
  }

  if (!isMounted) return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/20 via-background to-background">
      <Card className="w-full max-w-md bg-card/40 backdrop-blur-2xl border-white/5 shadow-2xl rounded-3xl overflow-hidden">
        <CardHeader className="text-center space-y-2 pb-8">
          <div className="mx-auto bg-primary w-24 h-24 rounded-3xl flex items-center justify-center mb-4 shadow-2xl shadow-primary/40 border border-white/10">
            <Tv className="h-12 w-12 text-white" />
          </div>
          <CardTitle className="text-5xl font-black tracking-tighter text-primary font-headline italic uppercase">Léo Stream</CardTitle>
          <CardDescription className="uppercase text-[10px] tracking-[0.3em] font-bold text-muted-foreground/60">Sistema P2P de Alta Performance</CardDescription>
        </CardHeader>
        <CardContent className="px-8">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <div className="relative">
                <Key className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/50" />
                <Input 
                  placeholder="DIGITE SEU CÓDIGO" 
                  className="pl-14 h-16 text-center text-2xl tracking-[0.4em] uppercase font-black bg-black/40 border-white/5 rounded-2xl focus:ring-primary focus:border-primary transition-all"
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  autoFocus
                  required
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-3 p-4 bg-destructive/10 border border-destructive/20 rounded-2xl text-destructive text-[10px] font-bold uppercase leading-tight animate-in slide-in-from-top-2">
                <AlertCircle className="h-5 w-5 shrink-0" />
                <span>{error}</span>
              </div>
            )}
            
            <div className="flex items-center space-x-3 bg-white/5 p-4 rounded-2xl border border-white/5 group hover:bg-white/10 transition-colors cursor-pointer" onClick={() => setRememberMe(!rememberMe)}>
              <Checkbox 
                id="remember" 
                checked={rememberMe} 
                onCheckedChange={(val) => setRememberMe(!!val)}
                className="rounded-md border-primary"
              />
              <label htmlFor="remember" className="text-[10px] font-bold cursor-pointer uppercase tracking-widest text-muted-foreground flex-1">Lembrar neste aparelho</label>
            </div>

            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 h-16 text-xl font-black shadow-2xl shadow-primary/20 rounded-2xl group transition-all" disabled={loading}>
              {loading ? <Loader2 className="h-8 w-8 animate-spin" /> : (
                <span className="flex items-center gap-2 group-hover:scale-110 transition-transform">
                  ENTRAR NO SISTEMA <Globe className="h-5 w-5" />
                </span>
              )}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4 border-t border-white/5 pt-6 mt-4 px-8 pb-8">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2 text-[9px] text-green-400 font-bold uppercase tracking-tighter">
              <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" /> Sincronizado Supabase
            </div>
            <div className="text-[9px] text-muted-foreground uppercase font-bold">Léo Tv v5.0</div>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
