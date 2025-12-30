"use client";
import { useState } from "react";
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// These will be securely read from environment variables on the server
const ADMIN_USERNAME = process.env.NEXT_PUBLIC_ADMIN_USERNAME;
const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

export default function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const router = useRouter();

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Dummy credentials for now. In a real app, use environment variables.
    if (username === 'admin' && password === 'password') {
      // In a real app, you'd set a secure, http-only cookie or token.
      // For now, we'll just navigate.
      router.push('/admin/dashboard');
    } else {
      alert("Credenciais de admin inválidas. Por segurança, o login foi desativado temporariamente.");
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <h1 className="login-title">Painel Admin</h1>
        <form onSubmit={handleAdminLogin} className="space-y-4">
          <div>
            <Label htmlFor="adminUser">Usuário Admin</Label>
            <Input 
              type="text" 
              id="adminUser"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required 
            />
          </div>
          <div>
            <Label htmlFor="adminPass">Senha Admin</Label>
            <Input 
              type="password" 
              id="adminPass"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required 
            />
          </div>
          <Button type="submit" className="w-full bg-gradient-to-r from-[#667eea] to-[#764ba2] hover:opacity-90">
            Entrar como Admin
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push('/')} className="w-full mt-2">
            Voltar
          </Button>
        </form>
      </div>
    </div>
  );
}
