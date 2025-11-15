/**
 * 🔄 SYNC SERVICE
 * 
 * Servicio para sincronización automática con Firebase
 * Procesa la cola de operaciones pendientes cuando hay conexión
 * ✨ INCLUYE SOPORTE COMPLETO PARA PDFs
 */

import {
  addPlant,
  addEquipment,
  updateEquipment,
  uploadImage,
  uploadPDF,
  uploadMultiplePDFs,
} from "./firebaseServices";

import {
  getPendingSyncOperations,
  markAsSynced,
  cleanupSyncedOperations,
  getSyncStats,
  savePlantLocal,
  saveEquipmentLocal,
  getImagesByEquipmentLocal,
  base64ToBlob,
  initDB,
  STORES,
  getPDFsByEquipmentLocal,
  markPDFAsSynced,
  base64ToPDFBlob,
  addToSyncQueue,
} from "./localStorageService";

/**
 * 🔄 SINCRONIZAR TODAS LAS OPERACIONES PENDIENTES
 */
const syncAllPendingOperations = async (onProgress = null) => {
  console.log("\n🔄 ======================================");
  console.log("🔄 INICIANDO SINCRONIZACIÓN AUTOMÁTICA");
  console.log("🔄 ======================================\n");

  try {
    // Verificar si hay conexión
    if (!navigator.onLine) {
      console.log("⏰ Sincronización omitida: sin conexión");
      if (onProgress) {
        onProgress({ 
          success: false, 
          reason: 'offline',
          current: 0,
          total: 0,
          percentage: 0
        });
      }
      return { success: false, reason: 'offline' };
    }

    // Obtener operaciones pendientes
    const result = await getPendingSyncOperations();

    if (!result.success) {
      console.error("❌ Error al obtener operaciones pendientes:", result.error);
      if (onProgress) {
        onProgress({ 
          success: false, 
          error: result.error,
          current: 0,
          total: 0,
          percentage: 0
        });
      }
      return { success: false, error: result.error };
    }

    const operations = result.data;

    if (!operations || operations.length === 0) {
      console.log("✅ No hay operaciones pendientes para sincronizar");
      if (onProgress) {
        onProgress({ 
          success: true, 
          synced: 0, 
          failed: 0,
          current: 0,
          total: 0,
          percentage: 100
        });
      }
      return { success: true, synced: 0, failed: 0 };
    }

    console.log(`📋 Operaciones pendientes encontradas: ${operations.length}`);

    let syncedCount = 0;
    let failedCount = 0;

    // Procesar cada operación
    for (let i = 0; i < operations.length; i++) {
      const operation = operations[i];
      console.log(`\n🔄 [${i + 1}/${operations.length}] Procesando: ${operation.type}`);

      // ========== REPORTAR PROGRESO ========== ✨
      if (onProgress) {
        const percentage = Math.round(((i + 1) / operations.length) * 100);
        onProgress({
          current: i + 1,
          total: operations.length,
          percentage: percentage,
          type: operation.type,
          inProgress: true
        });
      }

      try {
        let syncResult;

        switch (operation.type) {
          case "ADD_PLANT":
            syncResult = await syncAddPlant(operation.data);
            break;

          case "ADD_EQUIPMENT":
            syncResult = await syncAddEquipment(operation.data);
            break;

          case "UPDATE_EQUIPMENT":
            syncResult = await syncUpdateEquipment(operation.data);
            break;

          case "UPLOAD_IMAGE":
            syncResult = await syncUploadImage(operation.data);
            break;

          case "UPLOAD_PDF":
            syncResult = await syncUploadPDF(operation.data);
            break;

          default:
            console.log(`⚠️ Tipo de operación desconocido: ${operation.type}`);
            syncResult = { success: false };
        }

        if (syncResult && syncResult.success) {
          // Marcar como sincronizada
          await markAsSynced(operation.id);
          syncedCount++;
          console.log(`✅ [${i + 1}/${operations.length}] Sincronizado`);
        } else {
          failedCount++;
          console.error(`❌ [${i + 1}/${operations.length}] Error:`, syncResult?.error || "Unknown error");
        }
      } catch (error) {
        failedCount++;
        console.error(`❌ [${i + 1}/${operations.length}] Error:`, error.message);
      }
    }

    // Limpiar operaciones sincronizadas
    await cleanupSyncedOperations();

    console.log("\n🔄 ======================================");
    console.log("🔄 SINCRONIZACIÓN COMPLETADA");
    console.log(`✅ Sincronizadas: ${syncedCount}`);
    console.log(`❌ Fallidas: ${failedCount}`);
    console.log("🔄 ======================================\n");

    // ========== REPORTAR PROGRESO FINAL (100%) ========== ✨
    if (onProgress) {
      onProgress({ 
        success: true, 
        synced: syncedCount, 
        failed: failedCount,
        current: operations.length,
        total: operations.length,
        percentage: 100,
        completed: true
      });
    }

    return { 
      success: true, 
      synced: syncedCount, 
      failed: failedCount 
    };

  } catch (error) {
    console.error("❌ Error en sincronización:", error);
    if (onProgress) {
      onProgress({ 
        success: false, 
        error: error.message,
        current: 0,
        total: 0,
        percentage: 0
      });
    }
    return { success: false, error: error.message };
  }
};

/**
 * 🔄 SINCRONIZAR UNA OPERACIÓN INDIVIDUAL
 */
const syncOperation = async (operation) => {
  console.log(`  🔍 Tipo de operación: ${operation.type}`);

  switch (operation.type) {
    case "ADD_PLANT":
      return await syncAddPlant(operation.data);

    case "ADD_EQUIPMENT":
      return await syncAddEquipment(operation.data);

    case "UPDATE_EQUIPMENT":
      return await syncUpdateEquipment(operation.data);

    case "UPLOAD_IMAGE":
      return await syncUploadImage(operation.data);
    
    case "UPLOAD_PDF":
      return await syncUploadPDF(operation.data);

    default:
      console.warn(`⚠️ Tipo de operación desconocido: ${operation.type}`);
      return {
        success: false,
        error: `Tipo de operación desconocido: ${operation.type}`,
      };
  }
};

/**
 * 🏭 SINCRONIZAR: Agregar Planta
 */
const syncAddPlant = async (plantData) => {
  try {
    console.log("  📤 Sincronizando planta:", plantData.name);

    const result = await addPlant(plantData);

    if (result.success) {
      console.log("  ✅ Planta sincronizada con Firebase");
      
      // Actualizar el ID local con el ID de Firebase
      if (plantData.id.startsWith("local_")) {
        await savePlantLocal({
          ...plantData,
          id: result.id,
          syncStatus: "synced",
        });
      }

      return { success: true, firebaseId: result.id };
    } else {
      console.error("  ❌ Error al sincronizar planta:", result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error("  ❌ Excepción al sincronizar planta:", error);
    return { success: false, error: error.message };
  }
};

/**
 * ⚙️ SINCRONIZAR: Agregar Equipo
 */
const syncAddEquipment = async (equipmentData) => {
  try {
    console.log("  📤 Sincronizando equipo:", equipmentData.name);

    const { plantId, ...equipmentInfo } = equipmentData;

    const result = await addEquipment(plantId, equipmentInfo);

    if (result.success) {
      console.log("  ✅ Equipo sincronizado con Firebase");
      console.log("  📝 ID anterior (local):", equipmentData.id);
      console.log("  📝 ID nuevo (Firebase):", result.id);

      // Actualizar el ID local con el ID de Firebase
      if (equipmentData.id.startsWith("local_")) {
        await saveEquipmentLocal(
          {
            ...equipmentInfo,
            id: result.id,
            syncStatus: "synced",
          },
          plantId
        );

        // ========== ACTUALIZAR IDs EN OPERACIONES DE IMÁGENES Y PDFs PENDIENTES ========== ✨
        console.log("  🔄 Actualizando IDs en operaciones pendientes...");
        
        const pendingOps = await getPendingSyncOperations();
        if (pendingOps.success) {
          const db = await initDB();
          const transaction = db.transaction([STORES.PENDING_SYNC], "readwrite");
          const store = transaction.objectStore(STORES.PENDING_SYNC);

          for (const op of pendingOps.data) {
            // Actualizar operaciones de imágenes
            if (op.type === 'UPLOAD_IMAGE' && op.data.equipmentId === equipmentData.id) {
              console.log(`    🔄 Actualizando operación de imagen ${op.data.category}`);
              op.data.equipmentId = result.id;
              await store.put(op);
            }
            
            // ========== NUEVO: Actualizar operaciones de PDFs ========== ✨
            if (op.type === 'UPLOAD_PDF' && op.data.equipmentId === equipmentData.id) {
              console.log(`    🔄 Actualizando operación de PDF ${op.data.category}`);
              op.data.equipmentId = result.id;
              await store.put(op);
            }
          }
          
          console.log("  ✅ IDs actualizados en operaciones pendientes");
        }
      }

      return { success: true, firebaseId: result.id };
    } else {
      console.error("  ❌ Error al sincronizar equipo:", result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error("  ❌ Excepción al sincronizar equipo:", error);
    return { success: false, error: error.message };
  }
};

/**
 * ✏️ SINCRONIZAR: Actualizar Equipo
 */
const syncUpdateEquipment = async (updateData) => {
  try {
    console.log("  📤 Sincronizando actualización de equipo:", updateData.id);

    const { id, ...equipmentInfo } = updateData;

    const result = await updateEquipment(id, equipmentInfo);

    if (result.success) {
      console.log("  ✅ Equipo actualizado en Firebase");
      return { success: true };
    } else {
      console.error("  ❌ Error al actualizar equipo:", result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error("  ❌ Excepción al actualizar equipo:", error);
    return { success: false, error: error.message };
  }
};

/**
 * 📄 SINCRONIZAR: Subir PDF
 * 
 * Sincroniza un PDF almacenado localmente con Firebase Storage
 * 
 * @param {Object} pdfData - Datos del PDF a sincronizar
 * @returns {Promise<Object>} - Resultado de la sincronización
 */
const syncUploadPDF = async (pdfData) => {
  try {
    console.log(
      `  📄 Sincronizando PDF: ${pdfData.category} para equipo ${pdfData.equipmentId}`
    );

    // Obtener el PDF desde IndexedDB
    const pdfsResult = await getPDFsByEquipmentLocal(pdfData.equipmentId);

    if (!pdfsResult.success) {
      return { success: false, error: "No se pudo obtener el PDF local" };
    }

    const localPDF = pdfsResult.data.find(
      (pdf) =>
        pdf.id === pdfData.pdfId || pdf.category === pdfData.category
    );

    if (!localPDF) {
      return { success: false, error: "PDF no encontrado en IndexedDB" };
    }

    // Convertir Base64 a Blob/File
    const blob = base64ToPDFBlob(localPDF.base64);
    const file = new File([blob], localPDF.fileName, {
      type: localPDF.fileType,
    });

    // Subir a Firebase
    const result = await uploadPDF(
      file,
      pdfData.category,
      pdfData.plantId,
      pdfData.equipmentId
    );

    if (result.success) {
      console.log("  ✅ PDF subido a Firebase:", result.url);
      
      // Marcar como sincronizado en IndexedDB
      await markPDFAsSynced(localPDF.id);
      
      return { success: true, url: result.url, path: result.path };
    } else {
      console.error("  ❌ Error al subir PDF:", result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error("  ❌ Excepción al subir PDF:", error);
    return { success: false, error: error.message };
  }
};

/**
 * 📸 SINCRONIZAR: Subir Imagen
 */
const syncUploadImage = async (imageData) => {
  try {
    console.log(
      `  📤 Sincronizando imagen: ${imageData.category} para equipo ${imageData.equipmentId}`
    );

    // Obtener la imagen desde IndexedDB
    const imagesResult = await getImagesByEquipmentLocal(imageData.equipmentId);

    if (!imagesResult.success) {
      return { success: false, error: "No se pudo obtener la imagen local" };
    }

    const localImage = imagesResult.data.find(
      (img) =>
        img.id === imageData.imageId || img.category === imageData.category
    );

    if (!localImage) {
      return { success: false, error: "Imagen no encontrada en IndexedDB" };
    }

    // Convertir Base64 a Blob/File
    const blob = base64ToBlob(localImage.base64);
    const file = new File([blob], localImage.fileName, {
      type: localImage.fileType,
    });

    // Subir a Firebase
    const result = await uploadImage(
      file,
      imageData.category,
      imageData.plantId,
      imageData.equipmentId
    );

    if (result.success) {
      console.log("  ✅ Imagen subida a Firebase:", result.url);
      return { success: true, url: result.url, path: result.path };
    } else {
      console.error("  ❌ Error al subir imagen:", result.error);
      return { success: false, error: result.error };
    }
  } catch (error) {
    console.error("  ❌ Excepción al subir imagen:", error);
    return { success: false, error: error.message };
  }
};

/**
 * 📋 AGREGAR PDF A LA COLA DE SINCRONIZACIÓN
 * 
 * Función auxiliar para agregar un PDF a la cola de sincronización
 * Útil cuando se guarda un PDF localmente y se necesita sincronizar después
 * 
 * @param {string} plantId - ID de la planta
 * @param {string} equipmentId - ID del equipo
 * @param {string} category - 'factura' o 'pedimento'
 * @param {string} pdfId - ID del PDF en IndexedDB
 * @returns {Promise<Object>} - Resultado de la operación
 */
const addPDFToSyncQueue = async (plantId, equipmentId, category, pdfId) => {
  try {
    const result = await addToSyncQueue("UPLOAD_PDF", {
      plantId: plantId,
      equipmentId: equipmentId,
      category: category,
      pdfId: pdfId,
    });

    if (result.success) {
      console.log(`✅ PDF agregado a cola de sincronización: ${category}`);
    } else {
      console.error(`❌ Error al agregar PDF a cola: ${result.error}`);
    }

    return result;
  } catch (error) {
    console.error("❌ Error en addPDFToSyncQueue:", error);
    return { success: false, error: error.message };
  }
};

/**
 * 📄 SINCRONIZAR TODOS LOS PDFs DE UN EQUIPO
 * 
 * Función auxiliar para sincronizar todos los PDFs pendientes de un equipo
 * Útil para sincronizar múltiples PDFs de una vez
 * 
 * @param {string} plantId - ID de la planta
 * @param {string} equipmentId - ID del equipo
 * @returns {Promise<Object>} - Resultado con estadísticas de sincronización
 */
const syncEquipmentPDFs = async (plantId, equipmentId) => {
  try {
    console.log(`📄 Sincronizando PDFs del equipo ${equipmentId}...`);

    const pdfsResult = await getPDFsByEquipmentLocal(equipmentId);

    if (!pdfsResult.success) {
      return { success: false, error: "Error al obtener PDFs locales" };
    }

    const pendingPDFs = pdfsResult.data.filter(
      pdf => pdf.syncStatus === "pending"
    );

    if (pendingPDFs.length === 0) {
      console.log("✅ No hay PDFs pendientes de sincronizar");
      return { success: true, syncedCount: 0, failedCount: 0 };
    }

    console.log(`📋 PDFs pendientes: ${pendingPDFs.length}`);

    let syncedCount = 0;
    let failedCount = 0;

    for (const pdf of pendingPDFs) {
      const result = await syncUploadPDF({
        plantId: plantId,
        equipmentId: equipmentId,
        category: pdf.category,
        pdfId: pdf.id,
      });

      if (result.success) {
        syncedCount++;
      } else {
        failedCount++;
      }
    }

    console.log(`✅ PDFs sincronizados: ${syncedCount}`);
    if (failedCount > 0) {
      console.error(`❌ PDFs fallidos: ${failedCount}`);
    }

    return {
      success: true,
      syncedCount: syncedCount,
      failedCount: failedCount,
    };
  } catch (error) {
    console.error("❌ Error al sincronizar PDFs:", error);
    return { success: false, error: error.message };
  }
};

/**
 * 📊 OBTENER ESTADO DE SINCRONIZACIÓN
 */
const getSyncStatus = async () => {
  try {
    const statsResult = await getSyncStats();

    if (!statsResult.success) {
      return {
        success: false,
        error: "No se pudieron obtener estadísticas",
      };
    }

    const stats = statsResult.data;

    return {
      success: true,
      hasPending: stats.pending > 0,
      pending: stats.pending,
      total: stats.total,
      synced: stats.synced,
      failed: stats.error,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * 🎯 VERIFICAR SI HAY DATOS PENDIENTES
 */
const hasPendingSync = async () => {
  const status = await getSyncStatus();
  return status.success && status.hasPending;
};

/**
 * ⏰ CONFIGURAR SINCRONIZACIÓN AUTOMÁTICA PERIÓDICA
 */
let syncInterval = null;

const startAutoSync = (intervalMinutes = 5, onProgress) => {
  console.log(
    `⏰ Iniciando sincronización automática cada ${intervalMinutes} minutos`
  );

  // Limpiar intervalo anterior si existe
  if (syncInterval) {
    clearInterval(syncInterval);
  }

  // ========== FUNCIÓN PARA VERIFICAR Y SINCRONIZAR SOLO SI HAY PENDIENTES ========== ✨
  const syncIfNeeded = async () => {
    if (!navigator.onLine) {
      console.log("⏰ Sincronización omitida: sin conexión");
      return;
    }

    try {
      // Verificar si hay operaciones pendientes
      const pendingResult = await getPendingSyncOperations();
      
      if (pendingResult.success && pendingResult.data && pendingResult.data.length > 0) {
        console.log(`⏰ Ejecutando sincronización automática (${pendingResult.data.length} operaciones)...`);
        await syncAllPendingOperations(onProgress);
      } else {
        console.log("⏰ No hay operaciones pendientes, omitiendo sincronización");
      }
    } catch (error) {
      console.error("❌ Error al verificar operaciones pendientes:", error);
    }
  };

  // Ejecutar verificación inicial
  syncIfNeeded();

  // Configurar sincronización periódica
  syncInterval = setInterval(() => {
    syncIfNeeded();
  }, intervalMinutes * 60 * 1000);

  return syncInterval;
};

const stopAutoSync = () => {
  if (syncInterval) {
    clearInterval(syncInterval);
    syncInterval = null;
    console.log("⏰ Sincronización automática detenida");
  }
};

/**
 * 🔄 SINCRONIZAR AL DETECTAR CONEXIÓN
 */
const syncOnConnection = (onProgress) => {
  console.log("🌐 Configurando sincronización al detectar conexión...");

  const handleOnline = async () => {
    console.log("\n🌐 ========================================");
    console.log("🌐 CONEXIÓN DETECTADA - Iniciando sync...");
    console.log("🌐 ========================================\n");

    // Verificar si hay operaciones pendientes
    const pendingResult = await getPendingSyncOperations();

    if (pendingResult.success && pendingResult.data && pendingResult.data.length > 0) {
      console.log(`📋 Hay ${pendingResult.data.length} operaciones pendientes, sincronizando...`);
      
      // ========== PASAR CALLBACK DE PROGRESO CORRECTAMENTE ========== ✨
      await syncAllPendingOperations(onProgress);
    } else {
      console.log("✅ No hay operaciones pendientes");
    }
  };
  
  window.addEventListener("online", handleOnline);

  return () => {
    window.removeEventListener("online", handleOnline);
  };
};

// ========== EXPORTACIONES ========== ✨

export {
  syncAllPendingOperations,
  syncOperation,
  getSyncStatus,
  hasPendingSync,
  startAutoSync,
  stopAutoSync,
  syncOnConnection,
  syncUploadPDF,
  addPDFToSyncQueue,
  syncEquipmentPDFs,
};
