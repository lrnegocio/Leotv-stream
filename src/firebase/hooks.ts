'use client';

import { useEffect, useState, useMemo } from 'react';
import { auth, firestore } from './init';
import { onAuthStateChanged, User } from 'firebase/auth';

// Retorna o objeto auth do Firebase
export function useAuth() {
  return auth;
}

// Retorna o objeto firestore do Firebase
export function useFirestore() {
  return firestore;
}

// Retorna o usuário logado (ou null)
export function useUser() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsubscribe();
  }, []);

  return user;
}

// Retorna auth e firestore memoizados
export function useMemoFirebase() {
  return useMemo(() => ({ auth, firestore }), []);
}
