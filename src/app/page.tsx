
"use client";
import { useState, useEffect } from "react";
import { useRouter } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Download } from "lucide-react";
import { useAuth, useUser } from "@/firebase";
import { signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, query, where, getDocs } from 'firebase/firestore';
import { useFirestore } from '@/firebase';


export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();
  const auth = useAuth();
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();


  useEffect(() => {
    // If user is already logged in, redirect to app
    if (!isUserLoading && user) {
        // router.replace('/app');
    }
  }, [user, isUserLoading, router]);
  
  useEffect(() => {
      // Sign out any lingering user session on page load
      if(auth) {
        signOut(auth);
      }
      if (typeof window !== 'undefined' && localStorage.getItem('rememberMe') === 'true') {
          setUsername(localStorage.getItem('username') || '');
          setRememberMe(true);
      }
  }, [auth]);


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    if (!username || !password) {
      setError("Por favor, insira o usuário e a senha.");
      setIsLoading(false);
      return;
    }
    
    const email = `${username.toLowerCase().replace(/\s/g, '_')}@videoverse.app`;

    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const loggedInUser = userCredential.user;

        const userDocRef = doc(firestore, "users", loggedInUser.uid);
        const userDoc = await getDoc(userDocRef);

        if(!userDoc.exists()) {
            setError("Usuário não encontrado no banco de dados.");
            await signOut(auth);
            setIsLoading(false);
            return;
        }

        const userData = userDoc.data();
        if(userData.isBlocked) {
            setError("Esta conta está bloqueada.");
            await signOut(auth);
            setIsLoading(false);
            return;
        }
        
        if (userData.plan !== 'custom' && userData.planExpiry && new Date(userData.planExpiry) < new Date()) {
            setError("Seu plano expirou. Entre em contato com o suporte.");
            await signOut(auth);
            setIsLoading(false);
            return;
        }

        const sessionsRef = collection(userDocRef, "sessions");
        const q = query(sessionsRef, where("isActive", "==", true));
        const activeSessions = await getDocs(q);

        if(!activeSessions.empty) {
            setError("Este usuário já está conectado em outro dispositivo. Desconectando sessão antiga...");
            for (const sessionDoc of activeSessions.docs) {
                await updateDoc(sessionDoc.ref, { isActive: false });
            }
        }
        
        const newSessionRef = doc(sessionsRef);
        await setDoc(newSessionRef, {
            id: newSessionRef.id,
            isActive: true,
            loginTime: serverTimestamp(),
            deviceInfo: navigator.userAgent
        });
        
        window.addEventListener('beforeunload', () => {
             updateDoc(newSessionRef, { isActive: false });
        });

        if (rememberMe) {
            localStorage.setItem('username', username);
            localStorage.setItem('rememberMe', 'true');
        } else {
            localStorage.removeItem('username');
            localStorage.removeItem('rememberMe');
        }

        router.push('/app');

    } catch(err: any) {
        if(err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
            setError("Usuário ou senha inválidos.");
        } else {
            setError("Ocorreu um erro ao tentar fazer o login.");
            console.error(err);
        }
    } finally {
        setIsLoading(false);
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
              disabled={isLoading || isUserLoading}
            />
          </div>
          <div>
            <Label htmlFor="password">Senha</Label>
            <Input 
              type="password" 
              id="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading || isUserLoading}
            />
          </div>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="rememberMe" 
              checked={rememberMe}
              onCheckedChange={(checked) => setRememberMe(!!checked)}
              disabled={isLoading || isUserLoading}
            />
            <Label htmlFor="rememberMe" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
              Lembrar meu usuário
            </Label>
          </div>
          <Button type="submit" className="w-full bg-gradient-to-r from-[#667eea] to-[#764ba2] hover:opacity-90" disabled={isLoading || isUserLoading}>
            {isLoading ? 'Entrando...' : 'Entrar'}
          </Button>
          <Button type="button" variant="outline" onClick={handleAdminLogin} className="w-full mt-2" disabled={isLoading || isUserLoading}>
            Área Admin
          </Button>
        </form>
      </div>
    </div>
  );
}
