// src/firebase.ts
import { getApps, initializeApp } from 'firebase/app';
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
  onAuthStateChanged,
  signInAnonymously,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

const firebaseConfig = {
  apiKey: "AIzaSyDLWg50RGpxQ2eJIJHUv0fQegDmULmWnuQ",
  authDomain: "comanda-barraca.firebaseapp.com",
  projectId: "comanda-barraca",
  storageBucket: "comanda-barraca.firebasestorage.app",
  messagingSenderId: "768792966844",
  appId: "1:768792966844:web:766be7f836c2ea58f642b9"
};

export const firebaseApp = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

let authInstance;

try {
  authInstance = initializeAuth(firebaseApp, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  authInstance = getAuth(firebaseApp);
}

export const firebaseAuth = authInstance;

let authReady: Promise<void> | null = null;

export function ensureAnonAuth() {
  if (authReady) return authReady;

  authReady = new Promise((resolve, reject) => {
    const unsub = onAuthStateChanged(firebaseAuth, async (user) => {
      unsub();
      if (user) return resolve();

      try {
        await signInAnonymously(firebaseAuth);
        resolve();
      } catch (err) {
        authReady = null;
        reject(err);
      }
    });
  });

  return authReady;
}
