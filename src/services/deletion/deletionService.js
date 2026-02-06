/**
 * 🗑️ DELETION SERVICE - Sistema Completo de Eliminación
 * 
 * Sistema de eliminación integrado con Firebase y modo OFFLINE
 * Compatible con AuditoriaApp v3.1
 * 
 * @version 1.0.0
 * @date 2025-11-14
 */

import { db, storage } from '../firebase/firebaseConfig';
import {
  doc,
  deleteDoc,
  collection,
  getDocs,
  query,
  where,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import { 
  ref,
  deleteObject,
  listAll 
} from "firebase/storage";

import {
  initDB,
  addToSyncQueue,
} from "../storage/localStorageService";

// ============================================================================
// 🎯 SECCIÓN 1: ELIMINAR PDFs INDIVIDUALES
// ============================================================================

/**
 * 📄 ELIMINAR UN PEDIMENTO ESPECÍFICO
 */
export const deletePedimento = async (equipmentId, pdfData, isOnline = true) => {
  try {
    console.log("🗑️ Eliminando pedimento:", pdfData.fileName || pdfData.name);

    if (isOnline) {
      // MODO ONLINE: Intentar eliminar de Firebase Storage
      try {
        const fileRef = ref(storage, pdfData.path);
        await deleteObject(fileRef);
        console.log("✅ Pedimento eliminado de Storage");
      } catch (storageError) {
        // Si el archivo no existe en Storage, continuar con la eliminación de Firestore
        if (storageError.code === 'storage/object-not-found') {
          console.log("ℹ️ Archivo no encontrado en Storage, continuando con limpieza de Firestore");
        } else {
          throw storageError;
        }
      }

      // Actualizar documento en Firestore (remover del array)
      const equipmentRef = doc(db, "equipment", equipmentId);
      const equipmentDoc = await getDoc(equipmentRef);

      if (equipmentDoc.exists()) {
        const equipmentData = equipmentDoc.data();
        const pdfFileName = pdfData.fileName || pdfData.name;
        const updatedPedimentos = (equipmentData.pdfs?.pedimento || []).filter(
          pdf => (pdf.fileName || pdf.name) !== pdfFileName
        );

        await updateDoc(equipmentRef, {
          'pdfs.pedimento': updatedPedimentos
        });
        console.log("✅ Referencia del pedimento eliminada de Firestore");
      }

      return { success: true, message: "Pedimento eliminado correctamente" };
    } else {
      // MODO OFFLINE: Agregar a cola de sincronización
      await addToSyncQueue("DELETE_PEDIMENTO", {
        equipmentId,
        pdfData,
        timestamp: new Date().toISOString()
      });

      console.log("📦 Eliminación de pedimento programada para sincronización");
      return {
        success: true,
        message: "Pedimento marcado para eliminar. Se sincronizará al conectar",
        offline: true
      };
    }
  } catch (error) {
    console.error("❌ Error al eliminar pedimento:", error);
    return { success: false, error: error.message };
  }
};

/**
 * 📄 ELIMINAR UNA FACTURA ESPECÍFICA
 */
export const deleteFactura = async (equipmentId, pdfData, isOnline = true) => {
  try {
    console.log("🗑️ Eliminando factura:", pdfData.fileName || pdfData.name);

    if (isOnline) {
      // MODO ONLINE: Intentar eliminar de Firebase Storage
      try {
        const fileRef = ref(storage, pdfData.path);
        await deleteObject(fileRef);
        console.log("✅ Factura eliminada de Storage");
      } catch (storageError) {
        // Si el archivo no existe en Storage, continuar con la eliminación de Firestore
        if (storageError.code === 'storage/object-not-found') {
          console.log("ℹ️ Archivo no encontrado en Storage, continuando con limpieza de Firestore");
        } else {
          throw storageError;
        }
      }

      // Actualizar documento en Firestore (remover del array)
      const equipmentRef = doc(db, "equipment", equipmentId);
      const equipmentDoc = await getDoc(equipmentRef);

      if (equipmentDoc.exists()) {
        const equipmentData = equipmentDoc.data();
        const pdfFileName = pdfData.fileName || pdfData.name;
        const updatedFacturas = (equipmentData.pdfs?.factura || []).filter(
          pdf => (pdf.fileName || pdf.name) !== pdfFileName
        );

        await updateDoc(equipmentRef, {
          'pdfs.factura': updatedFacturas
        });
        console.log("✅ Referencia de la factura eliminada de Firestore");
      }

      return { success: true, message: "Factura eliminada correctamente" };
    } else {
      // MODO OFFLINE: Agregar a cola de sincronización
      await addToSyncQueue("DELETE_FACTURA", {
        equipmentId,
        pdfData,
        timestamp: new Date().toISOString()
      });

      console.log("📦 Eliminación de factura programada para sincronización");
      return {
        success: true,
        message: "Factura marcada para eliminar. Se sincronizará al conectar",
        offline: true
      };
    }
  } catch (error) {
    console.error("❌ Error al eliminar factura:", error);
    return { success: false, error: error.message };
  }
};

/**
 * 📄 ELIMINAR UN DOCUMENTO R1 ESPECÍFICO
 */
export const deleteR1 = async (equipmentId, pdfData, isOnline = true) => {
  try {
    console.log("🗑️ Eliminando documento R1:", pdfData.fileName || pdfData.name);

    if (isOnline) {
      // MODO ONLINE: Intentar eliminar de Firebase Storage
      try {
        const fileRef = ref(storage, pdfData.path);
        await deleteObject(fileRef);
        console.log("✅ Documento R1 eliminado de Storage");
      } catch (storageError) {
        // Si el archivo no existe en Storage, continuar con la eliminación de Firestore
        if (storageError.code === 'storage/object-not-found') {
          console.log("ℹ️ Archivo no encontrado en Storage, continuando con limpieza de Firestore");
        } else {
          throw storageError;
        }
      }

      // Actualizar documento en Firestore (remover del array)
      const equipmentRef = doc(db, "equipment", equipmentId);
      const equipmentDoc = await getDoc(equipmentRef);

      if (equipmentDoc.exists()) {
        const equipmentData = equipmentDoc.data();
        const pdfFileName = pdfData.fileName || pdfData.name;
        const updatedR1s = (equipmentData.pdfs?.r1 || []).filter(
          pdf => (pdf.fileName || pdf.name) !== pdfFileName
        );

        await updateDoc(equipmentRef, {
          'pdfs.r1': updatedR1s
        });
        console.log("✅ Referencia del documento R1 eliminada de Firestore");
      }

      return { success: true, message: "Documento R1 eliminado correctamente" };
    } else {
      // MODO OFFLINE: Agregar a cola de sincronización
      await addToSyncQueue("DELETE_R1", {
        equipmentId,
        pdfData,
        timestamp: new Date().toISOString()
      });

      console.log("📦 Eliminación de R1 programada para sincronización");
      return {
        success: true,
        message: "Documento R1 marcado para eliminar. Se sincronizará al conectar",
        offline: true
      };
    }
  } catch (error) {
    console.error("❌ Error al eliminar documento R1:", error);
    return { success: false, error: error.message };
  }
};

// ============================================================================
// 🎯 SECCIÓN 2: ELIMINAR IMÁGENES INDIVIDUALES
// ============================================================================

/**
 * 🖼️ ELIMINAR UNA IMAGEN DE EQUIPO
 */
export const deleteEquipmentImage = async (equipmentId, plantId, imageData, isOnline = true) => {
  try {
    console.log("🗑️ Eliminando imagen de equipo:", imageData.name);

    if (isOnline) {
      // 1. Eliminar de Storage
      const fileRef = ref(storage, imageData.path);
      await deleteObject(fileRef);
      console.log("✅ Imagen eliminada de Storage");

      // 2. Actualizar Firestore
      const equipmentRef = doc(db, "equipment", equipmentId);
      const equipmentDoc = await getDoc(equipmentRef);
      
      if (equipmentDoc.exists()) {
        const equipmentData = equipmentDoc.data();
        const updatedImages = (equipmentData.images?.equipment || []).filter(
          img => img.path !== imageData.path
        );
        
        await updateDoc(equipmentRef, {
          'images.equipment': updatedImages
        });
        console.log("✅ Referencia de imagen eliminada de Firestore");
      }

      return { success: true, message: "Imagen de equipo eliminada correctamente" };
    } else {
      // MODO OFFLINE
      await addToSyncQueue("DELETE_IMAGE", {
        equipmentId,
        plantId,
        imageData,
        category: "equipment",
        timestamp: new Date().toISOString()
      });

      console.log("📦 Eliminación de imagen programada para sincronización");
      return { 
        success: true, 
        message: "Imagen marcada para eliminar. Se sincronizará al conectar",
        offline: true 
      };
    }
  } catch (error) {
    console.error("❌ Error al eliminar imagen de equipo:", error);
    return { success: false, error: error.message };
  }
};

/**
 * 🖼️ ELIMINAR UNA IMAGEN DE PLACA
 */
export const deletePlacaImage = async (equipmentId, plantId, imageData, isOnline = true) => {
  try {
    console.log("🗑️ Eliminando imagen de placa:", imageData.name);

    if (isOnline) {
      // 1. Eliminar de Storage
      const fileRef = ref(storage, imageData.path);
      await deleteObject(fileRef);
      console.log("✅ Imagen de placa eliminada de Storage");

      // 2. Actualizar Firestore
      const equipmentRef = doc(db, "equipment", equipmentId);
      const equipmentDoc = await getDoc(equipmentRef);
      
      if (equipmentDoc.exists()) {
        const equipmentData = equipmentDoc.data();
        const updatedImages = (equipmentData.images?.plate || []).filter(
          img => img.path !== imageData.path
        );
        
        await updateDoc(equipmentRef, {
          'images.plate': updatedImages
        });
        console.log("✅ Referencia de imagen de placa eliminada de Firestore");
      }

      return { success: true, message: "Imagen de placa eliminada correctamente" };
    } else {
      // MODO OFFLINE
      await addToSyncQueue("DELETE_IMAGE", {
        equipmentId,
        plantId,
        imageData,
        category: "plate",
        timestamp: new Date().toISOString()
      });

      console.log("📦 Eliminación de imagen de placa programada");
      return { 
        success: true, 
        message: "Imagen de placa marcada para eliminar",
        offline: true 
      };
    }
  } catch (error) {
    console.error("❌ Error al eliminar imagen de placa:", error);
    return { success: false, error: error.message };
  }
};

// ============================================================================
// 🎯 SECCIÓN 3: ELIMINAR EQUIPO COMPLETO
// ============================================================================

/**
 * 🔧 ELIMINAR EQUIPO COMPLETO CON TODA SU INFORMACIÓN
 */
export const deleteEquipmentComplete = async (equipmentId, plantId, isOnline = true) => {
  try {
    console.log("🗑️ INICIANDO ELIMINACIÓN COMPLETA DEL EQUIPO:", equipmentId);

    if (isOnline) {
      // 1. Obtener datos del equipo
      const equipmentRef = doc(db, "equipment", equipmentId);
      const equipmentSnap = await getDoc(equipmentRef);
      
      if (!equipmentSnap.exists()) {
        return { success: false, error: "Equipo no encontrado" };
      }

      equipmentSnap.data();
      let deletedImages = 0;
      let deletedPDFs = 0;

      // 2. Eliminar TODAS las imágenes de Storage
      const imageCategories = ['equipment', 'plate', 'invoice', 'customs'];
      for (const category of imageCategories) {
        const folderPath = `equipment_images/${plantId}/${equipmentId}/${category}`;
        const folderRef = ref(storage, folderPath);
        
        try {
          const listResult = await listAll(folderRef);
          for (const itemRef of listResult.items) {
            await deleteObject(itemRef);
            deletedImages++;
          }
        } catch (err) {
          console.log(`ℹ️ No hay imágenes en: ${category}`);
        }
      }
      console.log(`✅ ${deletedImages} imágenes eliminadas`);

      // 3. Eliminar TODOS los PDFs de Storage
      const pdfCategories = ['factura', 'pedimento'];
      for (const category of pdfCategories) {
        const folderPath = `plantas/${plantId}/equipos/${equipmentId}/documentos/${category}`;
        const folderRef = ref(storage, folderPath);
        
        try {
          const listResult = await listAll(folderRef);
          for (const itemRef of listResult.items) {
            await deleteObject(itemRef);
            deletedPDFs++;
          }
        } catch (err) {
          console.log(`ℹ️ No hay PDFs en: ${category}`);
        }
      }
      console.log(`✅ ${deletedPDFs} PDFs eliminados`);

      // 4. Eliminar carpeta completa del equipo en Storage
      try {
        const equipmentFolderRef = ref(storage, `plantas/${plantId}/equipos/${equipmentId}`);
        const fileList = await listAll(equipmentFolderRef);
        
        for (const folder of fileList.prefixes) {
          const subFiles = await listAll(folder);
          for (const subItem of subFiles.items) {
            await deleteObject(subItem);
          }
        }
        
        for (const file of fileList.items) {
          await deleteObject(file);
        }
        console.log("✅ Carpeta del equipo limpiada completamente");
      } catch (err) {
        console.warn("⚠️ No se pudo limpiar la carpeta completa:", err);
      }

      // 5. Eliminar documento de Firestore
      await deleteDoc(equipmentRef);
      console.log("✅ Documento del equipo eliminado de Firestore");

      // 6. Actualizar contador en la planta
      const plantRef = doc(db, 'plants', plantId);
      const plantDoc = await getDoc(plantRef);
      if (plantDoc.exists()) {
        const currentCount = plantDoc.data().equipmentCount || 0;
        await updateDoc(plantRef, {
          equipmentCount: Math.max(0, currentCount - 1)
        });
        console.log("✅ Contador de equipos actualizado en la planta");
      }

      return { 
        success: true, 
        message: "Equipo eliminado completamente",
        stats: {
          images: deletedImages,
          pdfs: deletedPDFs
        }
      };

    } else {
      // MODO OFFLINE: Agregar a cola de sincronización
      await addToSyncQueue("DELETE_EQUIPMENT", {
        equipmentId,
        plantId,
        timestamp: new Date().toISOString()
      });

      console.log("📦 Eliminación de equipo programada para sincronización");
      return { 
        success: true, 
        message: "Equipo marcado para eliminar. Se sincronizará al conectar",
        offline: true 
      };
    }
  } catch (error) {
    console.error("❌ ERROR CRÍTICO al eliminar equipo:", error);
    return { success: false, error: error.message };
  }
};

// ============================================================================
// 🎯 SECCIÓN 4: ELIMINAR PLANTA COMPLETA
// ============================================================================

/**
 * 🏭 ELIMINAR PLANTA COMPLETA CON TODOS SUS EQUIPOS
 */
export const deletePlantComplete = async (plantId, isOnline = true, onProgress = null) => {
  try {
    console.log("🗑️ INICIANDO ELIMINACIÓN COMPLETA DE PLANTA:", plantId);

    if (isOnline) {
      // 1. Obtener todos los equipos de la planta
      const equipmentQuery = query(
        collection(db, "equipment"),
        where("plantId", "==", plantId)
      );
      const equipmentSnapshot = await getDocs(equipmentQuery);
      const totalEquipment = equipmentSnapshot.size;
      
      console.log(`📊 Se eliminarán ${totalEquipment} equipos`);
      
      if (onProgress) onProgress({ stage: "equipment", current: 0, total: totalEquipment });

      // 2. Eliminar cada equipo completo
      let deletedCount = 0;
      let totalImages = 0;
      let totalPDFs = 0;

      for (const equipmentDoc of equipmentSnapshot.docs) {
        const equipmentId = equipmentDoc.id;
        console.log(`\n🔧 Eliminando equipo ${deletedCount + 1}/${totalEquipment}: ${equipmentId}`);
        
        const result = await deleteEquipmentComplete(equipmentId, plantId, true);
        
        if (result.success) {
          deletedCount++;
          if (result.stats) {
            totalImages += result.stats.images || 0;
            totalPDFs += result.stats.pdfs || 0;
          }
        }

        if (onProgress) {
          onProgress({ 
            stage: "equipment", 
            current: deletedCount, 
            total: totalEquipment,
            equipmentId 
          });
        }
      }

      console.log(`\n✅ ${deletedCount} equipos eliminados completamente`);
      console.log(`📊 Total: ${totalImages} imágenes, ${totalPDFs} PDFs`);

      // 3. Eliminar carpeta completa de la planta en Storage
      if (onProgress) onProgress({ stage: "storage", message: "Limpiando Storage..." });
      
      try {
        const plantFolderRef = ref(storage, `plantas/${plantId}`);
        const plantFiles = await listAll(plantFolderRef);
        
        for (const folder of plantFiles.prefixes) {
          const subFiles = await listAll(folder);
          for (const subFolder of subFiles.prefixes) {
            const deepFiles = await listAll(subFolder);
            for (const file of deepFiles.items) {
              await deleteObject(file);
            }
          }
          for (const file of subFiles.items) {
            await deleteObject(file);
          }
        }
        
        for (const file of plantFiles.items) {
          await deleteObject(file);
        }
        
        console.log("✅ Carpeta de la planta limpiada completamente en Storage");
      } catch (err) {
        console.warn("⚠️ Error al limpiar carpeta de Storage:", err);
      }

      // 4. Eliminar documento de la planta en Firestore
      if (onProgress) onProgress({ stage: "firestore", message: "Eliminando de Firestore..." });
      
      const plantRef = doc(db, "plants", plantId);
      await deleteDoc(plantRef);
      console.log("✅ Planta eliminada de Firestore");

      if (onProgress) onProgress({ stage: "complete", message: "¡Eliminación completada!" });

      return { 
        success: true, 
        message: "Planta eliminada completamente",
        stats: {
          equipment: deletedCount,
          images: totalImages,
          pdfs: totalPDFs
        }
      };

    } else {
      // MODO OFFLINE
      await addToSyncQueue("DELETE_PLANT", {
        plantId,
        timestamp: new Date().toISOString()
      });

      console.log("📦 Eliminación de planta programada para sincronización");
      return { 
        success: true, 
        message: "Planta marcada para eliminar. Se sincronizará al conectar",
        offline: true 
      };
    }
  } catch (error) {
    console.error("❌ ERROR CRÍTICO al eliminar planta:", error);
    return { success: false, error: error.message };
  }
};

// ============================================================================
// 🎯 SECCIÓN 5: BORRAR BASE DE DATOS COMPLETA
// ============================================================================

/**
 * 💣 BORRAR COMPLETAMENTE LA BASE DE DATOS LOCAL (IndexedDB)
 * ⚠️ PRECAUCIÓN: Esta acción NO SE PUEDE DESHACER
 * ⚠️ Solo elimina datos locales, NO afecta Firebase
 */
export const nukeLocalDatabase = async (confirm = false) => {
  if (!confirm) {
    console.warn("⚠️ Debes confirmar la eliminación de la base de datos");
    return { 
      success: false, 
      error: "Se requiere confirmación explícita para eliminar la BD" 
    };
  }

  try {
    console.log("💣 INICIANDO ELIMINACIÓN COMPLETA DE BASE DE DATOS LOCAL");
    console.log("⚠️ Esta acción eliminará TODOS los datos locales");

    // 1. Cerrar conexión actual a IndexedDB
    const db = await initDB();
    db.close();
    console.log("✅ Conexión a IndexedDB cerrada");

    // 2. Eliminar la base de datos completa
    return new Promise((resolve, reject) => {
      const deleteRequest = indexedDB.deleteDatabase("AuditoriaIndustrialDB");

      deleteRequest.onsuccess = () => {
        console.log("✅ BASE DE DATOS LOCAL ELIMINADA COMPLETAMENTE");
        console.log("ℹ️ La BD se recreará automáticamente en el próximo acceso");
        resolve({ 
          success: true, 
          message: "Base de datos local eliminada. Se recreará al reiniciar la app" 
        });
      };

      deleteRequest.onerror = (event) => {
        console.error("❌ Error al eliminar la base de datos:", event);
        reject({ 
          success: false, 
          error: "No se pudo eliminar la base de datos" 
        });
      };

      deleteRequest.onblocked = () => {
        console.warn("⚠️ Eliminación bloqueada. Cierra todas las pestañas de la app");
        reject({ 
          success: false, 
          error: "Eliminación bloqueada. Cierra todas las pestañas de la aplicación" 
        });
      };
    });
  } catch (error) {
    console.error("❌ ERROR al eliminar base de datos:", error);
    return { success: false, error: error.message };
  }
};

/**
 * 💣 BORRAR TODO - Firebase + IndexedDB
 * ⚠️ PRECAUCIÓN EXTREMA: Elimina TODO de Firebase Y local
 */
export const nukeEverything = async (confirmationText, onProgress = null) => {
  if (confirmationText !== "DELETE_EVERYTHING") {
    return { 
      success: false, 
      error: 'Debes escribir exactamente "DELETE_EVERYTHING" para confirmar' 
    };
  }

  try {
    console.log("💣💣💣 ELIMINACIÓN TOTAL INICIADA 💣💣💣");
    console.log("⚠️ ESTO ELIMINARÁ TODO DE FIREBASE Y LOCAL");

    // 1. Obtener todas las plantas
    if (onProgress) onProgress({ stage: "plants", message: "Obteniendo plantas..." });
    
    const plantsSnapshot = await getDocs(collection(db, "plants"));
    const totalPlants = plantsSnapshot.size;
    
    console.log(`🏭 Se eliminarán ${totalPlants} plantas`);

    // 2. Eliminar cada planta (esto eliminará sus equipos también)
    let deletedPlants = 0;
    let totalStats = { equipment: 0, images: 0, pdfs: 0 };

    for (const plantDoc of plantsSnapshot.docs) {
      const plantId = plantDoc.id;
      const currentCount = deletedPlants;
      console.log(`\n🏭 Eliminando planta ${deletedPlants + 1}/${totalPlants}`);

      const result = await deletePlantComplete(plantId, true, (progress) => {
        if (onProgress) {
          onProgress({
            stage: "plants",
            current: currentCount,
            total: totalPlants,
            plantId,
            subProgress: progress
          });
        }
      });

      if (result.success && result.stats) {
        totalStats.equipment += result.stats.equipment || 0;
        totalStats.images += result.stats.images || 0;
        totalStats.pdfs += result.stats.pdfs || 0;
      }

      deletedPlants++;
    }

    console.log("\n✅ Firebase limpiado completamente");
    console.log(`📊 Eliminados: ${deletedPlants} plantas, ${totalStats.equipment} equipos`);
    console.log(`📊 ${totalStats.images} imágenes, ${totalStats.pdfs} PDFs`);

    // 3. Eliminar base de datos local
    if (onProgress) onProgress({ stage: "local", message: "Eliminando base de datos local..." });
    
    await nukeLocalDatabase(true);

    if (onProgress) onProgress({ 
      stage: "complete", 
      message: "¡TODO ELIMINADO! Recarga la aplicación" 
    });

    return { 
      success: true, 
      message: "TODO eliminado completamente. Recarga la aplicación para empezar de cero",
      stats: {
        plants: deletedPlants,
        ...totalStats
      }
    };

  } catch (error) {
    console.error("❌ ERROR CRÍTICO en eliminación total:", error);
    return { success: false, error: error.message };
  }
};

// ============================================================================
// 🎯 UTILIDADES ADICIONALES
// ============================================================================

/**
 * 📊 OBTENER INFORMACIÓN ANTES DE ELIMINAR
 */
export const getDeleteInfo = async (type, id) => {
  try {
    if (type === "equipment") {
      const equipmentRef = doc(db, "equipment", id);
      const equipmentSnap = await getDoc(equipmentRef);
      
      if (!equipmentSnap.exists()) {
        return { success: false, error: "Equipo no encontrado" };
      }

      const data = equipmentSnap.data();
      const imageCount = 
        (data.images?.equipment?.length || 0) + 
        (data.images?.plate?.length || 0);
      const pdfCount = 
        (data.pdfs?.factura?.length || 0) + 
        (data.pdfs?.pedimento?.length || 0);

      return{
        success: true,
        info: {
          name: data.name || "Sin nombre",
          serialNumber: data.serialNumber || "N/A",
          images: imageCount,
          pdfs: pdfCount,
          hasData: imageCount > 0 || pdfCount > 0
        }
      };
    }

    if (type === "plant") {
      const plantRef = doc(db, "plants", id);
      const plantSnap = await getDoc(plantRef);
      
      if (!plantSnap.exists()) {
        return { success: false, error: "Planta no encontrada" };
      }

      const plantData = plantSnap.data();
      
      // Contar equipos
      const equipmentQuery = query(
        collection(db, "equipment"),
        where("plantId", "==", id)
      );
      const equipmentSnapshot = await getDocs(equipmentQuery);
      
      let totalImages = 0;
      let totalPDFs = 0;
      
      equipmentSnapshot.forEach(doc => {
        const data = doc.data();
        totalImages += 
          (data.images?.equipment?.length || 0) + 
          (data.images?.plate?.length || 0);
        totalPDFs += 
          (data.pdfs?.factura?.length || 0) + 
          (data.pdfs?.pedimento?.length || 0);
      });

      return {
        success: true,
        info: {
          name: plantData.name || "Sin nombre",
          equipment: equipmentSnapshot.size,
          totalImages,
          totalPDFs,
          hasData: equipmentSnapshot.size > 0
        }
      };
    }

    return { success: false, error: "Tipo no soportado" };
  } catch (error) {
    console.error("❌ Error al obtener información:", error);
    return { success: false, error: error.message };
  }
};

/**
 * ✅ EXPORTAR TODAS LAS FUNCIONES
 */
const deletionService = {
  // PDFs
  deletePedimento,
  deleteFactura,
  deleteR1,

  // Imágenes
  deleteEquipmentImage,
  deletePlacaImage,

  // Equipos y Plantas
  deleteEquipmentComplete,
  deletePlantComplete,

  // Base de datos
  nukeLocalDatabase,
  nukeEverything,

  // Utilidades
  getDeleteInfo
};

export default deletionService;
