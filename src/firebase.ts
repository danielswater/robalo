// src/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged, signInAnonymously } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDLWg56RGpxQ2eJ1JHUv0fQegDmULmWnUQ",
  authDomain: "comanda-barraca.firebaseapp.com",
  projectId: "comanda-barraca",
  storageBucket: "comanda-barraca.appspot.com",
  messagingSenderId: "768792966844",
  appId: "1:768792966844:web:766be7f836c2ea58f642b9"
};

export const firebaseApp = initializeApp(firebaseConfig);
export const firebaseAuth = getAuth(firebaseApp);

let authReady: Promise<void> | null = null;

export function ensureAnonAuth() {
  if (authReady) return authReady;

  authReady = new Promise((resolve) => {
    const unsub = onAuthStateChanged(firebaseAuth, async (user) => {
      unsub();
      if (user) return resolve();

      try {
        await signInAnonymously(firebaseAuth);
      } catch {
        // Keep app usable even if auth fails; Firestore rules will block writes.
      } finally {
        resolve();
      }
    });
  });

  return authReady;
}
