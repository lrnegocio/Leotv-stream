"use client";
import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth, useUser } from "@/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";

// Dummy credentials for the form validation
const ADMIN_USERNAME = "lrnegocio";
const ADMIN_PASSWORD = "135796lR@";

// Firebase admin credentials (should be stored securely in a real app, e.g., env vars)
const FIREBASE_ADMIN_EMAIL = "admin@example.com";
const FIREBASE_ADMIN_PASSWORD = "password123";

export default function AdminLoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();

  // Redirect to dashboard if firebase admin is already logged in
  useEffect(() => {
    if (!isUserLoading && user?.email === FIREBASE_ADMIN_EMAIL) {
      router.replace('/admin/dashboard');
    }
  }, [user, isUserLoading, router]);


  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    // 1. First, validate the local admin credentials
    if (username !== ADMIN_USERNAME || password !== ADMIN_PASSWORD) {
      setError("Credenciais de admin inválidas.");
      return;
    }

    // 2. If local credentials are correct, sign in to Firebase with the admin account
    setIsLoading(true);
    try {
      // Try to sign in
      await signInWithEmailAndPassword(auth, FIREBASE_ADMIN_EMAIL, FIREBASE_ADMIN_PASSWORD);
      // The `onAuthStateChanged` listener in the `useEffect` hook will handle the redirect
    } catch (err: any) {
      // If sign-in fails because the user doesn't exist, create it.
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        try {
          await createUserWithEmailAndPassword(auth, FIREBASE_ADMIN_EMAIL, FIREBASE_ADMIN_PASSWORD);
          // After creating, the onAuthStateChanged listener will pick up the new user and redirect.
        } catch (creationError: any) {
          console.error("Firebase Admin Creation Error:", creationError);
          setError("Falha ao configurar a sessão de admin.");
          setIsLoading(false);
        }
      } else {
        // For other sign-in errors (e.g. wrong password on existing user)
        console.error("Firebase Auth Error:", err);
        setError("Erro de Autenticação do Painel. Verifique a configuração.");
        setIsLoading(false);
      }
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
              disabled={isLoading}
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
              disabled={isLoading}
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="submit" className="w-full bg-gradient-to-r from-[#667eea] to-[#764ba2] hover:opacity-90" disabled={isLoading || isUserLoading}>
            {isLoading ? 'Entrando...' : 'Entrar como Admin'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push('/')} className="w-full mt-2" disabled={isLoading}>
            Voltar
          </Button>
        </form>
      </div>
    </div>
  );
}
