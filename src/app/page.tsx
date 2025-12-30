"use client";
import { useState } from "react";
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Download } from "lucide-react";

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const router = useRouter();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Dummy login logic for now
    if (username && password) {
      // In a real app, you'd verify credentials and then redirect.
      // We'll just redirect to the app page.
      router.push('/app');
    } else {
      alert("Por favor, insira o usuário e a senha.");
    }
  };

  const handleAdminLogin = () => {
    router.push('/admin/login');
  };
  
  const apkUrl = 'http://179.0.178.146/leotv.apk';

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="flex items-center justify-between mb-8">
            <h1 className="login-title m-0">Léo TV</h1>
            <Button
                variant="secondary"
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:opacity-90"
                onClick={() => window.location.href = apkUrl}
                asChild
            >
                <a href={apkUrl} download>
                    <Download className="mr-2 h-4 w-4" /> Baixar APK
                </a>
            </Button>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Label htmlFor="username">Usuário</Label>
            <Input 
              type="text" 
              id="username" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="password">Senha</Label>
            <Input 
              type="password" 
              id="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="rememberMe" 
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(!!checked)}
            />
            <Label htmlFor="rememberMe" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Lembrar meus dados
            </Label>
          </div>
          <Button type="submit" className="w-full bg-gradient-to-r from-[#667eea] to-[#764ba2] hover:opacity-90">
            Entrar
          </Button>
          <Button type="button" variant="outline" onClick={handleAdminLogin} className="w-full mt-2">
            Área Admin
          </Button>
        </form>
      </div>
    </div>
  );
}
