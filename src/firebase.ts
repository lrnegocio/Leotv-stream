"use client";
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore, collection, doc, onSnapshot } from "firebase/firestore";
import { useState, useEffect, useMemo } from "react";

const firebaseConfig = {
  apiKey: "AIzaSyARD18r8wRDSI2egEnhN3h1qXZfzU6ZQlw",
  authDomain: "studio-1581292746-c0026.firebaseapp.com",
  projectId: "studio-1581292746-c0026",
  storageBucket: "studio-1581292746-c0026.firebasestorage.app",
  messagingSenderId: "986860546066",
  appId: "1:986860546066:web:20584aeacd4cf77a3f90cb"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

// --- Hooks e Componentes que estavam faltando ---

export const FirebaseClientProvider = ({ children }: { children: any }) => {
  return children;
};

export const useFirestore = () => db;
export const useAuth = () => auth;

export const useUser = () => {
  const [user, setUser] = useState<any>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  useEffect(() => {
    return auth.onAuthStateChanged((u) => {
      setUser(u);
      setIsUserLoading(false);
    });
  }, []);
  return { user, isUserLoading };
};

// Funções auxiliares para buscar dados (Polyfills)
export const useCollection = (queryRef: any) => {
  const [data, setData] = useState<any[]>([]);
  useEffect(() => {
    if (!queryRef) return;
    const unsub = onSnapshot(queryRef, (snap: any) => {
      setData(snap.docs.map((d: any) => ({ ...d.data(), id: d.id })));
    });
    return () => unsub();
  }, [queryRef]);
  return { data, status: 'success' };
};

export const useDoc = (docRef: any) => {
  const [data, setData] = useState<any>(null);
  useEffect(() => {
    if (!docRef) return;
    const unsub = onSnapshot(docRef, (snap: any) => {
      setData({ ...snap.data(), id: snap.id });
    });
    return () => unsub();
  }, [docRef]);
  return { data, status: 'success' };
};

export const useMemoFirebase = (fn: any) => useMemo(fn, []);

export { app, auth, db };
