'use client';

export const dynamic = 'force-dynamic';

import { useAuth, useFirestore, useUser, useMemoFirebase } from '@/firebase/hooks';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';


// Ícones
import { Trash2, Edit, PlusCircle, Play, Upload, Plus, XCircle } from 'lucide-react';

// Firestore
import { collection, doc, serverTimestamp, setDoc, updateDoc, getDocs, query, orderBy, writeBatch } from 'firebase/firestore';

// Componentes Dialog
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';

export default function DashboardPage() {
  const router = useRouter();

  // Exemplo de hooks do Firebase
  const { user, loading } = useUser();
  const auth = useAuth();
  const firestore = useFirestore();
  const memoFirebase = useMemoFirebase();

  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    async function fetchData() {
      const q = query(collection(firestore, 'exampleCollection'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const docs = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setData(docs);
    }

    fetchData();
  }, [firestore]);

  if (loading) return <p>Carregando...</p>;
  if (!user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <Button onClick={() => router.push('/admin/users')}>Gerenciar Usuários</Button>

      <div className="mt-6">
        {data.map(item => (
          <div key={item.id} className="border p-2 mb-2 flex justify-between items-center">
            <span>{item.name}</span>
            <div className="flex gap-2">
              <Button variant="destructive"><Trash2 size={16} /></Button>
              <Button><Edit size={16} /></Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
