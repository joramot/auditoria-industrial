import { db } from './firebaseConfig';
import { collection, addDoc } from 'firebase/firestore';

export const testFirebaseConnection = async () => {
  try {
    const docRef = await addDoc(collection(db, 'test'), {
      message: 'Firebase conectado correctamente',
      timestamp: new Date()
    });
    console.log('✅ Documento creado con ID:', docRef.id);
    alert('✅ Firebase conectado correctamente!');
    return true;
  } catch (error) {
    console.error('❌ Error al conectar:', error);
    alert('❌ Error: ' + error.message);
    return false;
  }
};