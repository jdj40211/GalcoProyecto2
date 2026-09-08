import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const hasFirebaseConfig = Boolean(import.meta.env.VITE_FIREBASE_API_KEY);
let firebaseAuth = null;

if (hasFirebaseConfig) {
  const app = initializeApp({
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
  });
  firebaseAuth = getAuth(app);
}

export const isFirebaseConfigured = hasFirebaseConfig;
export const auth = firebaseAuth;
