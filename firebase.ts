
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Production config for MindMap on Firebase Hosting
const firebaseApiKey = (import.meta as any).env?.VITE_FIREBASE_API_KEY || "";
const isFirebaseConfigured = Boolean(firebaseApiKey);

const firebaseConfig = {
  apiKey: firebaseApiKey,
  authDomain: "mindmap-9f454.firebaseapp.com",
  projectId: "mindmap-9f454",
  storageBucket: "mindmap-9f454.firebasestorage.app",
  messagingSenderId: "582191293462",
  appId: "1:582191293462:web:a0789ceeff4efafa538137"
};

// Initialize Firebase
const app = isFirebaseConfigured
  ? (getApps().length === 0 ? initializeApp(firebaseConfig) : getApp())
  : null;

// Initialize services with the explicit app instance
const auth = app ? getAuth(app) : null;
const db = app ? getFirestore(app) : null;
const googleProvider = app ? new GoogleAuthProvider() : null;

export { auth, db, googleProvider, isFirebaseConfigured };
