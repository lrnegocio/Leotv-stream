import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyARD18r8wRDSI2egEnhN3h1qXZfzU6ZQlw",
  authDomain: "studio-1581292746-c0026.firebaseapp.com",
  projectId: "studio-1581292746-c0026",
  storageBucket: "studio-1581292746-c0026.firebasestorage.app",
  messagingSenderId: "986860546066",
  appId: "1:986860546066:web:20584aeacd4cf77a3f90cb"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
