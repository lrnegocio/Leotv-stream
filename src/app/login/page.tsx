
"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Tv, Lock, User as UserIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"

export default function LoginPage() {
  const [email, setEmail] = React.useState("")
  const [password, setPassword] = React.useState("")
  const [loading, setLoading] = React.useState(false)
  const router = useRouter()

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Simulation of role-based auth
    setTimeout(() => {
      if (email === "admin@leo.tv" && password === "admin123") {
        toast({ title: "Welcome, Admin!", description: "Redirecting to management panel..." })
        router.push("/admin")
      } else if (email === "user@leo.tv" && password === "user123") {
        toast({ title: "Welcome back!", description: "Enjoy your streaming." })
        router.push("/home")
      } else {
        toast({ variant: "destructive", title: "Auth Failed", description: "Invalid credentials." })
      }
      setLoading(false)
    }, 1000)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-primary/20 via-background to-background">
      <Card className="w-full max-w-md bg-card/50 backdrop-blur-xl border-white/5 shadow-2xl">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mb-4">
            <Tv className="h-8 w-8 text-primary" />
          </div>
          <CardTitle className="text-3xl font-bold tracking-tight text-primary font-headline">Léo Tv & Stream</CardTitle>
          <CardDescription>Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Email Address</label>
              <div className="relative">
                <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="email" 
                  placeholder="name@example.com" 
                  className="pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  type="password" 
                  placeholder="••••••••" 
                  className="pl-10"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90 h-12 text-lg font-semibold transition-all-smooth" disabled={loading}>
              {loading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <p className="text-xs text-center text-muted-foreground">
            Don't have an account? Contact your administrator.
          </p>
          <div className="grid grid-cols-2 gap-2 w-full text-[10px] text-muted-foreground/50 border-t pt-4 border-white/5">
            <div>Demo Admin: admin@leo.tv / admin123</div>
            <div>Demo User: user@leo.tv / user123</div>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}
