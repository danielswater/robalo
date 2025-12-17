// src/firebase.ts
import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: "AIzaSyDLWg56RGpxQ2eJ1JHUv0fQegDmULmWnUQ",
  authDomain: "comanda-barraca.firebaseapp.com",
  projectId: "comanda-barraca",
  storageBucket: "comanda-barraca.appspot.com",
  messagingSenderId: "768792966844",
  appId: "1:768792966844:web:766be7f836c2ea58f642b9"
};

// 👇 Tem que exportar com esse nome certinho
export const firebaseApp = initializeApp(firebaseConfig);
