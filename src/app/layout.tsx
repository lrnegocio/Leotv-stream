'use client';

import { FirebaseProvider } from '../firebase/provider';
import firebaseApp, { auth, firestore } from '../firebase/init';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <FirebaseProvider firebaseApp={firebaseApp} auth={auth} firestore={firestore}>
          {children}
        </FirebaseProvider>
      </body>
    </html>
  );
}
