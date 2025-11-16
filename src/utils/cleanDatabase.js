/**
 * 🧹 SCRIPT DE LIMPIEZA COMPLETA DE BASE DE DATOS
 * 
 * Este script elimina TODOS los datos de Firebase y IndexedDB
 * ⚠️ USAR CON PRECAUCIÓN - NO HAY VUELTA ATRÁS
 * 
 * USO:
 * 1. Copiar este archivo a src/utils/cleanDatabase.js
 * 2. Importar en AuditoriaApp.jsx
 * 3. Crear botón de "Reinicializar BD" en settings
 * 4. Ejecutar cleanEverything()
 */

import { db } from '../firebase/firebaseConfig';
import { 
  collection, 
  getDocs, 
  doc, 
  deleteDoc,
  writeBatch
} from 'firebase/firestore';

/**
 * 🔥 PASO 1: LIMPIAR FIREBASE COMPLETAMENTE
 */
export const cleanFirebase = async () => {
  console.log("\n🔥 ========================================");
  console.log("🔥 LIMPIANDO FIREBASE");
  console.log("🔥 ========================================\n");
  
  try {
    let totalDeleted = 0;
    
    // 1. Eliminar todas las plantas
    console.log("🗑️  Eliminando plantas...");
    const plantsSnapshot = await getDocs(collection(db, 'plants'));
    const plantBatch = writeBatch(db);
    let plantCount = 0;
    
    plantsSnapshot.forEach((docSnapshot) => {
      plantBatch.delete(doc(db, 'plants', docSnapshot.id));
      plantCount++;
    });
    
    if (plantCount > 0) {
      await plantBatch.commit();
      console.log(`   ✅ ${plantCount} plantas eliminadas`);
      totalDeleted += plantCount;
    } else {
      console.log(`   ℹ️  No había plantas`);
    }
    
    // 2. Eliminar todos los equipos
    console.log("🗑️  Eliminando equipos...");
    const equipmentSnapshot = await getDocs(collection(db, 'equipment'));
    const equipmentBatch = writeBatch(db);
    let equipmentCount = 0;
    
    equipmentSnapshot.forEach((docSnapshot) => {
      equipmentBatch.delete(doc(db, 'equipment', docSnapshot.id));
      equipmentCount++;
    });
    
    if (equipmentCount > 0) {
      await equipmentBatch.commit();
      console.log(`   ✅ ${equipmentCount} equipos eliminados`);
      totalDeleted += equipmentCount;
    } else {
      console.log(`   ℹ️  No había equipos`);
    }
    
    console.log("\n✅ Firebase limpio");
    console.log(`📊 Total documentos eliminados: ${totalDeleted}`);
    
    return { 
      success: true, 
      plantsDeleted: plantCount,
      equipmentDeleted: equipmentCount,
      totalDeleted: totalDeleted
    };
  } catch (error) {
    console.error("\n❌ ERROR al limpiar Firebase:", error);
    return { success: false, error: error.message };
  }
};

/**
 * 💾 PASO 2: LIMPIAR INDEXEDDB LOCAL
 */
export const cleanIndexedDB = async () => {
  console.log("\n💾 ========================================");
  console.log("💾 LIMPIANDO INDEXEDDB LOCAL");
  console.log("💾 ========================================\n");
  
  try {
    // Eliminar la base de datos completa
    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase('AuditoriaIndustrialDB');
      
      request.onsuccess = () => {
        console.log("✅ IndexedDB eliminada completamente");
        resolve({ success: true });
      };
      
      request.onerror = () => {
        console.error("❌ Error al eliminar IndexedDB:", request.error);
        reject({ success: false, error: request.error });
      };
      
      request.onblocked = () => {
        console.warn("⚠️  IndexedDB bloqueada - cierra todas las pestañas de la app");
        reject({ success: false, error: "Database blocked" });
      };
    });
  } catch (error) {
    console.error("\n❌ ERROR al limpiar IndexedDB:", error);
    return { success: false, error: error.message };
  }
};

/**
 * 🌐 PASO 3: LIMPIAR FIREBASE STORAGE (Imágenes y PDFs)
 */
export const cleanFirebaseStorage = async () => {
  console.log("\n🌐 ========================================");
  console.log("🌐 LIMPIANDO FIREBASE STORAGE");
  console.log("🌐 ========================================\n");
  
  // NOTA: Firebase Storage no permite listar archivos desde el cliente
  // Esta limpieza debe hacerse desde Firebase Console manualmente
  // O desde Cloud Functions en el backend
  
  console.log("⚠️  IMPORTANTE:");
  console.log("Firebase Storage debe limpiarse manualmente desde Firebase Console:");
  console.log("1. Ve a: https://console.firebase.google.com");
  console.log("2. Selecciona tu proyecto");
  console.log("3. Ve a Storage");
  console.log("4. Elimina las carpetas: /plants/ y /equipment/");
  
  return { 
    success: true, 
    message: "Limpieza manual requerida en Firebase Console" 
  };
};

/**
 * 🧹 EJECUTAR LIMPIEZA COMPLETA
 */
export const cleanEverything = async () => {
  console.log("\n🧹 ==========================================");
  console.log("🧹 LIMPIEZA COMPLETA INICIADA");
  console.log("🧹 ==========================================\n");
  
  const results = {
    firebase: null,
    indexedDB: null,
    storage: null
  };
  
  try {
    // 1. Limpiar Firebase
    console.log("📍 PASO 1/3: Limpiando Firebase...");
    results.firebase = await cleanFirebase();
    
    if (!results.firebase.success) {
      throw new Error("Error al limpiar Firebase");
    }
    
    // 2. Limpiar IndexedDB
    console.log("\n📍 PASO 2/3: Limpiando IndexedDB...");
    results.indexedDB = await cleanIndexedDB();
    
    if (!results.indexedDB.success) {
      throw new Error("Error al limpiar IndexedDB");
    }
    
    // 3. Instrucciones para Storage
    console.log("\n📍 PASO 3/3: Instrucciones para Storage...");
    results.storage = await cleanFirebaseStorage();
    
    console.log("\n🧹 ==========================================");
    console.log("🧹 LIMPIEZA COMPLETADA");
    console.log("🧹 ==========================================");
    console.log("\n✅ Firebase limpio");
    console.log("✅ IndexedDB limpio");
    console.log("⚠️  Storage requiere limpieza manual\n");
    
    return { success: true, results };
  } catch (error) {
    console.error("\n❌ ERROR en limpieza completa:", error);
    return { success: false, error: error.message, results };
  }
};

/**
 * 🔍 VERIFICAR DUPLICADOS EN FIREBASE
 */
export const findDuplicates = async () => {
  console.log("\n🔍 ========================================");
  console.log("🔍 BUSCANDO DUPLICADOS EN FIREBASE");
  console.log("🔍 ========================================\n");
  
  try {
    const plantsSnapshot = await getDocs(collection(db, 'plants'));
    
    // Agrupar por campo 'id' interno
    const plantsByInternalId = {};
    
    plantsSnapshot.forEach((docSnapshot) => {
      const plantData = docSnapshot.data();
      const internalId = plantData.id;
      const firestoreId = docSnapshot.id;
      
      if (!plantsByInternalId[internalId]) {
        plantsByInternalId[internalId] = [];
      }
      
      plantsByInternalId[internalId].push({
        firestoreId: firestoreId,
        internalId: internalId,
        name: plantData.name,
        location: plantData.location
      });
    });
    
    // Encontrar duplicados
    const duplicates = [];
    
    Object.keys(plantsByInternalId).forEach(internalId => {
      const plants = plantsByInternalId[internalId];
      if (plants.length > 1) {
        duplicates.push({
          internalId: internalId,
          count: plants.length,
          plants: plants
        });
      }
    });
    
    if (duplicates.length === 0) {
      console.log("✅ No se encontraron duplicados");
      return { success: true, duplicates: [] };
    }
    
    console.log(`⚠️  Se encontraron ${duplicates.length} duplicados:\n`);
    
    duplicates.forEach((dup, index) => {
      console.log(`${index + 1}. ID interno: ${dup.internalId}`);
      console.log(`   Aparece ${dup.count} veces:`);
      dup.plants.forEach((plant, i) => {
        console.log(`   ${i + 1}. Firestore ID: ${plant.firestoreId}`);
        console.log(`      Nombre: ${plant.name}`);
        console.log(`      Location: ${plant.location}`);
      });
      console.log("");
    });
    
    return { success: true, duplicates: duplicates };
  } catch (error) {
    console.error("\n❌ ERROR al buscar duplicados:", error);
    return { success: false, error: error.message };
  }
};

/**
 * 🗑️ ELIMINAR DUPLICADOS (Mantiene el más antiguo)
 */
export const removeDuplicates = async () => {
  console.log("\n🗑️  ========================================");
  console.log("🗑️  ELIMINANDO DUPLICADOS");
  console.log("🗑️  ========================================\n");
  
  try {
    // Primero encontrar duplicados
    const result = await findDuplicates();
    
    if (!result.success || result.duplicates.length === 0) {
      console.log("ℹ️  No hay duplicados para eliminar");
      return { success: true, removed: 0 };
    }
    
    let removedCount = 0;
    
    // Eliminar duplicados (mantener el primero, eliminar los demás)
    for (const dup of result.duplicates) {
      console.log(`🗑️  Procesando duplicados de: ${dup.internalId}`);
      
      // Mantener el primero (más antiguo)
      const toKeep = dup.plants[0];
      console.log(`   ✅ Manteniendo: ${toKeep.firestoreId}`);
      
      // Eliminar los demás
      for (let i = 1; i < dup.plants.length; i++) {
        const toDelete = dup.plants[i];
        console.log(`   🗑️  Eliminando: ${toDelete.firestoreId}`);
        
        await deleteDoc(doc(db, 'plants', toDelete.firestoreId));
        removedCount++;
      }
      
      console.log("");
    }
    
    console.log(`✅ Duplicados eliminados: ${removedCount}\n`);
    
    return { success: true, removed: removedCount };
  } catch (error) {
    console.error("\n❌ ERROR al eliminar duplicados:", error);
    return { success: false, error: error.message };
  }
};

// Exportar todas las funciones
export default {
  cleanFirebase,
  cleanIndexedDB,
  cleanFirebaseStorage,
  cleanEverything,
  findDuplicates,
  removeDuplicates
};
