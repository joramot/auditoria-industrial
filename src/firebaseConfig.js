// firebaseConfig.js - Configuración de Firebase con Authentication
// Versión: 2.0 - Con Firebase Auth habilitado

import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAuth } from 'firebase/auth';

// ============================================
// CONFIGURACIÓN DE FIREBASE
// ============================================
// TODO: Reemplazar con tus credenciales de Firebase
// Se obtienen en: Firebase Console → Project Settings → General → Your apps

const firebaseConfig = {
  apiKey: "AIzaSyAIyvItPmRcAqbH1vrHC12AKvRQBUpd0x8",
  authDomain: "auditoria-industrial.firebaseapp.com",
  projectId: "auditoria-industrial",
  storageBucket: "auditoria-industrial.firebasestorage.app",
  messagingSenderId: "813075513107",
  appId: "1:813075513107:web:6ab78fb2776b397c31e4e6"
};

// ============================================
// INICIALIZAR FIREBASE
// ============================================

// Inicializar la app de Firebase
const app = initializeApp(firebaseConfig);

// Inicializar servicios
export const db = getFirestore(app);
export const storage = getStorage(app);
export const auth = getAuth(app);

// Log de inicialización
console.log('🔥 Firebase inicializado correctamente');
console.log('✅ Firestore:', db ? 'OK' : 'Error');
console.log('✅ Storage:', storage ? 'OK' : 'Error');
console.log('✅ Auth:', auth ? 'OK' : 'Error');

export default app;
