import { initializeApp } from 'firebase/app';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Configuración de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyAIyvItPmRcAqbH1vrHC12AKvRQBUpd0x8",
  authDomain: "auditoria-industrial.firebaseapp.com",
  projectId: "auditoria-industrial",
  storageBucket: "auditoria-industrial.firebasestorage.com",
  messagingSenderId: "813075513107",
  appId: "1:813075513107:web:6ab78fb2776b397c31e4e6"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Firestore
export const db = getFirestore(app);

// Habilitar persistencia offline
enableIndexedDbPersistence(db)
  .then(() => {
    console.log('✅ Persistencia offline habilitada');
  })
  .catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('⚠️ Múltiples pestañas abiertas. Persistencia deshabilitada.');
    } else if (err.code === 'unimplemented') {
      console.warn('⚠️ Navegador no soporta persistencia.');
    }
  });

// Inicializar Storage
export const storage = getStorage(app);

export default app;