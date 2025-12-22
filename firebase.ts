
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Production config for MindMap on Firebase Hosting
const firebaseConfig = {
  apiKey: "AIzaSyCXEtq0ubgtXIbb7s_JzoWt8daNejKwuLQ",
  authDomain: "mindmap-9f454.firebaseapp.com",
  projectId: "mindmap-9f454",
  storageBucket: "mindmap-9f454.firebasestorage.app",
  messagingSenderId: "582191293462",
  appId: "1:582191293462:web:a0789ceeff4efafa538137"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize services with the explicit app instance
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

export { auth, db, googleProvider };
