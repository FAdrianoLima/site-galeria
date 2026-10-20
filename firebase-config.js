import { initializeApp, getApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, EmailAuthProvider } from "firebase/auth";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: "site-galeria-9a2ee.firebaseapp.com",
  projectId: "site-galeria-9a2ee",
  storageBucket: "site-galeria-9a2ee.firebasestorage.app",
  messagingSenderId: "322643693750",
  appId: "1:322643693750:web:029c16f3e48f59eaa3d617",
};

// Reutiliza o app existente em vez de inicializá-lo novamente.
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);
export const emailProvider = new EmailAuthProvider();
export const storage = getStorage(app);
