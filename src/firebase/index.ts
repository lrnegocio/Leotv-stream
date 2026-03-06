
'use client';

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';
import { firebaseConfig } from './config';

/**
 * Inicializa o Firebase de forma segura.
 * Se as chaves forem inválidas, retorna null para evitar Internal Server Error.
 */
export function initializeFirebase(): { app: FirebaseApp | null; db: Firestore | null; auth: Auth | null } {
  const isPlaceholder = !firebaseConfig.apiKey || 
                       firebaseConfig.apiKey.includes('COLE_AQUI') || 
                       firebaseConfig.apiKey === "";

  if (isPlaceholder) {
    return { app: null, db: null, auth: null };
  }

  try {
    const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const auth = getAuth(app);
    return { app, db, auth };
  } catch (error) {
    console.error("Erro ao inicializar Firebase:", error);
    return { app: null, db: null, auth: null };
  }
}

export * from './provider';
export * from './client-provider';
