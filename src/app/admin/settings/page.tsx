
"use client"

import * as React from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Lock, Save, ShieldAlert } from "lucide-react"
import { getGlobalParentalPin, setGlobalParentalPin } from "@/lib/store"
import { toast } from "@/hooks/use-toast"

export default function SettingsPage() {
  const [parentalPin, setParentalPin] = React.useState("")

  React.useEffect(() => {
    setParentalPin(getGlobalParentalPin())
  }, [])

  const handleSave = () => {
    if (parentalPin.length < 4) {
      toast({ 
        variant: "destructive", 
        title: "Erro", 
        description: "A senha parental deve ter 4 dígitos." 
      })
      return
    }
    setGlobalParentalPin(parentalPin)
    toast({ 
      title: "Sucesso", 
      description: "Configurações salvas com sucesso." 
    })
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-bold uppercase font-headline">Configurações do Sistema</h1>
        <p className="text-muted-foreground uppercase text-[10px] tracking-widest">Controle de segurança e senhas mestras.</p>
      </div>

      <Card className="bg-card/50 border-white/5 shadow-xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="uppercase text-lg">Senha Parental (Canais Proibidos)</CardTitle>
              <CardDescription className="text-[10px] uppercase">Esta senha será solicitada para acessar qualquer conteúdo restrito.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20 flex gap-4">
            <ShieldAlert className="h-6 w-6 text-destructive flex-shrink-0" />
            <p className="text-[10px] text-muted-foreground uppercase leading-tight">
              Atenção: Esta senha é global. Ao alterá-la, todos os clientes precisarão usar o novo código para desbloquear canais adultos ou protegidos.
            </p>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-medium uppercase tracking-tighter">Nova Senha Mestra (4 Dígitos)</label>
            <div className="flex gap-4">
              <Input 
                value={parentalPin} 
                onChange={(e) => setParentalPin(e.target.value)} 
                className="bg-background border-white/10 text-center font-bold tracking-widest text-2xl h-14" 
                maxLength={4} 
                type="password"
                placeholder="0000"
              />
              <Button onClick={handleSave} className="h-14 px-8 font-bold uppercase bg-primary hover:bg-primary/90">
                <Save className="mr-2 h-5 w-5" />
                Salvar Alterações
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
