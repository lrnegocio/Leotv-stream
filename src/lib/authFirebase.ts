import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  onAuthStateChanged,
  User 
} from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';

export interface AdminUser {
  uid: string;
  email: string;
  username: string;
  role: 'admin';
}

export interface StreamUser {
  uid: string;
  email: string;
  username: string;
  role: 'user';
  expiryDate: string;
  active: boolean;
}

export const authFirebase = {
  // Registrar Admin
  registerAdmin: async (email: string, password: string, username: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, 'admins', user.uid), {
        uid: user.uid,
        email,
        username,
        role: 'admin',
        createdAt: new Date()
      });

      return { success: true, user };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  // Login Admin
  loginAdmin: async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const adminDoc = await getDoc(doc(db, 'admins', user.uid));
      if (!adminDoc.exists() || adminDoc.data().role !== 'admin') {
        await signOut(auth);
        return { success: false, error: 'Acesso negado' };
      }

      return { success: true, user: adminDoc.data() };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  // Registrar Usuário
  registerUser: async (email: string, password: string, username: string, expiryDate: string) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email,
        username,
        role: 'user',
        expiryDate,
        active: true,
        createdAt: new Date()
      });

      return { success: true, user };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  // Login Usuário
  loginUser: async (email: string, password: string) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (!userDoc.exists()) {
        await signOut(auth);
        return { success: false, error: 'Usuário não encontrado' };
      }

      const userData = userDoc.data();
      if (!userData.active || new Date(userData.expiryDate) < new Date()) {
        await signOut(auth);
        return { success: false, error: 'Conta expirada ou inativa' };
      }

      return { success: true, user: userData };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  // Logout
  logout: async () => {
    try {
      await signOut(auth);
      return { success: true };
    } catch (error) {
      return { success: false, error: (error as Error).message };
    }
  },

  // Auth State
  onAuthStateChanged: (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, callback);
  }
};
