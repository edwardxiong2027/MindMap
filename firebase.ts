
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Production config for MindMap on Firebase Hosting
const firebaseApiKey = (import.meta as any).env?.VITE_FIREBASE_API_KEY || "";
const firebaseAuthDomain = (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || "";
const firebaseProjectId = (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || "";
const firebaseStorageBucket = (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || "";
const firebaseMessagingSenderId = (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || "";
const firebaseAppId = (import.meta as any).env?.VITE_FIREBASE_APP_ID || "";

const isFirebaseConfigured = Boolean(
  firebaseApiKey &&
  firebaseAuthDomain &&
  firebaseProjectId &&
  firebaseStorageBucket &&
  firebaseMessagingSenderId &&
  firebaseAppId
);

const firebaseConfig = {
  apiKey: firebaseApiKey,
  authDomain: firebaseAuthDomain,
  projectId: firebaseProjectId,
  storageBucket: firebaseStorageBucket,
  messagingSenderId: firebaseMessagingSenderId,
  appId: firebaseAppId
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
