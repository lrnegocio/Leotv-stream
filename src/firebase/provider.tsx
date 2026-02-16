'use client';
import React from 'react';

interface FirebaseProviderProps {
  firebaseApp: any;
  auth: any;
  firestore: any;
  children: React.ReactNode;
}

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  firebaseApp,
  auth,
  firestore,
  children
}) => {
  // Aqui você pode colocar lógica adicional de contexto se precisar
  return <>{children}</>;
};
