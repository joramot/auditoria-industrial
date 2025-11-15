/**
 * 🗄️ LOCAL STORAGE SERVICE - VERSIÓN COMPLETA
 * 
 * Servicio para almacenamiento local usando IndexedDB
 * Permite trabajar offline y sincronizar cuando hay conexión
 * ✨ INCLUYE: Plantas + Equipos + Imágenes + PDFs + Sincronización
 */

const DB_NAME = "AuditoriaIndustrialDB";
const DB_VERSION = 2; // ✨ Actualizado a v2 para soportar PDFs

// Nombres de las stores (tablas)
const STORES = {
  PLANTS: "plants",
  EQUIPMENT: "equipment",
  PENDING_SYNC: "pendingSync",
  IMAGES: "images",
  PDFS: "pdfs", // ✨ NUEVO
};

/**
 * Inicializar la base de datos IndexedDB
 */
const initDB = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error("❌ Error al abrir IndexedDB:", request.error);
      reject(request.error);
    };

    request.onsuccess = () => {
      console.log("✅ IndexedDB abierta correctamente");
      resolve(request.result);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      console.log("🔧 Creando/Actualizando estructura de IndexedDB...");

      // Store para Plantas
      if (!db.objectStoreNames.contains(STORES.PLANTS)) {
        const plantStore = db.createObjectStore(STORES.PLANTS, {
          keyPath: "id",
        });
        plantStore.createIndex("name", "name", { unique: false });
        plantStore.createIndex("syncStatus", "syncStatus", { unique: false });
        console.log("✅ Store 'plants' creado");
      }

      // Store para Equipos
      if (!db.objectStoreNames.contains(STORES.EQUIPMENT)) {
        const equipmentStore = db.createObjectStore(STORES.EQUIPMENT, {
          keyPath: "id",
        });
        equipmentStore.createIndex("plantId", "plantId", { unique: false });
        equipmentStore.createIndex("syncStatus", "syncStatus", {
          unique: false,
        });
        console.log("✅ Store 'equipment' creado");
      }

      // Store para Operaciones Pendientes de Sincronización
      if (!db.objectStoreNames.contains(STORES.PENDING_SYNC)) {
        const syncStore = db.createObjectStore(STORES.PENDING_SYNC, {
          keyPath: "id",
          autoIncrement: true,
        });
        syncStore.createIndex("type", "type", { unique: false });
        syncStore.createIndex("timestamp", "timestamp", { unique: false });
        syncStore.createIndex("status", "status", { unique: false });
        console.log("✅ Store 'pendingSync' creado");
      }

      // Store para Imágenes (Base64)
      if (!db.objectStoreNames.contains(STORES.IMAGES)) {
        const imageStore = db.createObjectStore(STORES.IMAGES, {
          keyPath: "id",
        });
        imageStore.createIndex("equipmentId", "equipmentId", { unique: false });
        imageStore.createIndex("category", "category", { unique: false });
        imageStore.createIndex("syncStatus", "syncStatus", { unique: false });
        console.log("✅ Store 'images' creado");
      }

      // ========== NUEVO: Store para PDFs (Base64) ========== ✨
      if (!db.objectStoreNames.contains(STORES.PDFS)) {
        const pdfStore = db.createObjectStore(STORES.PDFS, {
          keyPath: "id",
        });
        pdfStore.createIndex("equipmentId", "equipmentId", { unique: false });
        pdfStore.createIndex("category", "category", { unique: false });
        pdfStore.createIndex("syncStatus", "syncStatus", { unique: false });
        console.log("✅ Store 'pdfs' creado");
      }
    };
  });
};

/**
 * 💾 GUARDAR PLANTA LOCAL
 */
const savePlantLocal = async (plantData) => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORES.PLANTS], "readwrite");
    const store = transaction.objectStore(STORES.PLANTS);

    // Generar ID si no existe
    const plantId = plantData.id || `local_plant_${Date.now()}`;

    const plantWithSync = {
      ...plantData,
      id: plantId,
      syncStatus: "pending", // pending, synced, error
      createdAt: plantData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      localOnly: plantId.startsWith("local_"), // true si aún no está en Firebase
    };

    await store.put(plantWithSync);
    console.log("✅ Planta guardada localmente:", plantWithSync.id);

    return { success: true, data: plantWithSync };
  } catch (error) {
    console.error("❌ Error al guardar planta local:", error);
    return { success: false, error: error.message };
  }
};

/**
 * 💾 GUARDAR EQUIPO LOCAL
 */
const saveEquipmentLocal = async (equipmentData, plantId) => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORES.EQUIPMENT], "readwrite");
    const store = transaction.objectStore(STORES.EQUIPMENT);

    // Generar ID si no existe
    const equipmentId = equipmentData.id || `local_equipment_${Date.now()}`;

    const equipmentWithSync = {
      ...equipmentData,
      id: equipmentId,
      plantId: plantId,
      syncStatus: "pending",
      createdAt: equipmentData.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      localOnly: equipmentId.startsWith("local_"),
    };

    await store.put(equipmentWithSync);
    console.log("✅ Equipo guardado localmente:", equipmentWithSync.id);

    return { success: true, data: equipmentWithSync };
  } catch (error) {
    console.error("❌ Error al guardar equipo local:", error);
    return { success: false, error: error.message };
  }
};

/**
 * 💾 GUARDAR IMAGEN LOCAL (Base64)
 */
const saveImageLocal = async (imageFile, category, equipmentId) => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORES.IMAGES], "readwrite");
    const store = transaction.objectStore(STORES.IMAGES);

    // Convertir archivo a Base64
    const base64 = await fileToBase64(imageFile);

    const imageData = {
      id: `local_image_${category}_${Date.now()}_${Math.random()}`,
      equipmentId: equipmentId,
      category: category,
      base64: base64,
      fileName: imageFile.name,
      fileType: imageFile.type,
      fileSize: imageFile.size,
      syncStatus: "pending",
      createdAt: new Date().toISOString(),
    };

    await store.put(imageData);
    console.log("✅ Imagen guardada localmente:", imageData.id);

    return { success: true, data: imageData };
  } catch (error) {
    console.error("❌ Error al guardar imagen local:", error);
    return { success: false, error: error.message };
  }
};

/**
 * 📄 GUARDAR PDF LOCAL (Base64) ✨ NUEVO
 */
const savePDFLocal = async (pdfFile, category, equipmentId) => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORES.PDFS], "readwrite");
    const store = transaction.objectStore(STORES.PDFS);

    // Convertir archivo a Base64
    const base64 = await fileToBase64(pdfFile);

    const pdfData = {
      id: `local_pdf_${category}_${Date.now()}_${Math.random()}`,
      equipmentId: equipmentId,
      category: category,
      base64: base64,
      fileName: pdfFile.name,
      fileType: pdfFile.type,
      fileSize: pdfFile.size,
      syncStatus: "pending",
      createdAt: new Date().toISOString(),
    };

    await store.put(pdfData);
    console.log("✅ PDF guardado localmente:", pdfData.id);

    return { success: true, data: pdfData };
  } catch (error) {
    console.error("❌ Error al guardar PDF local:", error);
    return { success: false, error: error.message };
  }
};

/**
 * 🔥 OBTENER TODAS LAS PLANTAS LOCALES
 */
const getPlantsLocal = async () => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORES.PLANTS], "readonly");
    const store = transaction.objectStore(STORES.PLANTS);

    return new Promise((resolve, reject) => {
      const request = store.getAll();

      request.onsuccess = () => {
        console.log("✅ Plantas locales obtenidas:", request.result.length);
        resolve({ success: true, data: request.result });
      };

      request.onerror = () => {
        console.error("❌ Error al obtener plantas locales");
        reject({ success: false, error: request.error });
      };
    });
  } catch (error) {
    console.error("❌ Error al acceder a plantas locales:", error);
    return { success: false, error: error.message };
  }
};

/**
 * 🔥 OBTENER EQUIPOS DE UNA PLANTA LOCAL
 */
const getEquipmentByPlantLocal = async (plantId) => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORES.EQUIPMENT], "readonly");
    const store = transaction.objectStore(STORES.EQUIPMENT);
    const index = store.index("plantId");

    return new Promise((resolve, reject) => {
      const request = index.getAll(plantId);

      request.onsuccess = () => {
        console.log(
          `✅ Equipos locales de planta ${plantId}:`,
          request.result.length
        );
        resolve({ success: true, data: request.result });
      };

      request.onerror = () => {
        console.error("❌ Error al obtener equipos locales");
        reject({ success: false, error: request.error });
      };
    });
  } catch (error) {
    console.error("❌ Error al acceder a equipos locales:", error);
    return { success: false, error: error.message };
  }
};

/**
 * 🔥 OBTENER IMÁGENES DE UN EQUIPO LOCAL
 */
const getImagesByEquipmentLocal = async (equipmentId) => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORES.IMAGES], "readonly");
    const store = transaction.objectStore(STORES.IMAGES);
    const index = store.index("equipmentId");

    return new Promise((resolve, reject) => {
      const request = index.getAll(equipmentId);

      request.onsuccess = () => {
        console.log(
          `✅ Imágenes locales de equipo ${equipmentId}:`,
          request.result.length
        );
        resolve({ success: true, data: request.result });
      };

      request.onerror = () => {
        reject({ success: false, error: request.error });
      };
    });
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * 📄 OBTENER PDFs DE UN EQUIPO LOCAL ✨ NUEVO
 */
const getPDFsByEquipmentLocal = async (equipmentId) => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORES.PDFS], "readonly");
    const store = transaction.objectStore(STORES.PDFS);
    const index = store.index("equipmentId");

    return new Promise((resolve, reject) => {
      const request = index.getAll(equipmentId);

      request.onsuccess = () => {
        console.log(
          `✅ PDFs locales de equipo ${equipmentId}:`,
          request.result.length
        );
        resolve({ success: true, data: request.result });
      };

      request.onerror = () => {
        reject({ success: false, error: request.error });
      };
    });
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * 📄 OBTENER PDFs POR CATEGORÍA ✨ NUEVO
 */
const getPDFsByCategoryLocal = async (equipmentId, category) => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORES.PDFS], "readonly");
    const store = transaction.objectStore(STORES.PDFS);
    const index = store.index("category");

    return new Promise((resolve, reject) => {
      const request = index.getAll(category);

      request.onsuccess = () => {
        const filtered = request.result.filter(pdf => pdf.equipmentId === equipmentId);
        console.log(`✅ PDFs de ${category} para equipo ${equipmentId}:`, filtered.length);
        resolve({ success: true, data: filtered });
      };

      request.onerror = () => {
        reject({ success: false, error: request.error });
      };
    });
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * 🔄 AGREGAR OPERACIÓN A COLA DE SINCRONIZACIÓN
 */
const addToSyncQueue = async (operationType, data) => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORES.PENDING_SYNC], "readwrite");
    const store = transaction.objectStore(STORES.PENDING_SYNC);

    const syncItem = {
      type: operationType, // 'ADD_PLANT', 'ADD_EQUIPMENT', 'UPDATE_EQUIPMENT', 'UPLOAD_IMAGE', 'UPLOAD_PDF'
      data: data,
      timestamp: new Date().toISOString(),
      status: "pending", // pending, syncing, synced, error
      retryCount: 0,
    };

    return new Promise((resolve, reject) => {
      const request = store.add(syncItem);

      request.onsuccess = () => {
        console.log("✅ Operación agregada a cola de sincronización:", operationType);
        resolve({ success: true, id: request.result });
      };

      request.onerror = () => {
        console.error("❌ Error al agregar a cola de sincronización");
        reject({ success: false, error: request.error });
      };
    });
  } catch (error) {
    console.error("❌ Error en addToSyncQueue:", error);
    return { success: false, error: error.message };
  }
};

/**
 * 🔋 OBTENER TODAS LAS OPERACIONES PENDIENTES
 */
const getPendingSyncOperations = async () => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORES.PENDING_SYNC], "readonly");
    const store = transaction.objectStore(STORES.PENDING_SYNC);
    const index = store.index("status");

    return new Promise((resolve, reject) => {
      const request = index.getAll("pending");

      request.onsuccess = () => {
        console.log("✅ Operaciones pendientes:", request.result.length);
        resolve({ success: true, data: request.result });
      };

      request.onerror = () => {
        reject({ success: false, error: request.error });
      };
    });
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * ✅ MARCAR OPERACIÓN COMO SINCRONIZADA
 */
const markAsSynced = async (syncId) => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORES.PENDING_SYNC], "readwrite");
    const store = transaction.objectStore(STORES.PENDING_SYNC);

    return new Promise((resolve, reject) => {
      const getRequest = store.get(syncId);

      getRequest.onsuccess = () => {
        const syncItem = getRequest.result;
        if (syncItem) {
          syncItem.status = "synced";
          syncItem.syncedAt = new Date().toISOString();

          const updateRequest = store.put(syncItem);

          updateRequest.onsuccess = () => {
            console.log("✅ Operación marcada como sincronizada:", syncId);
            resolve({ success: true });
          };

          updateRequest.onerror = () => {
            reject({ success: false, error: updateRequest.error });
          };
        } else {
          reject({ success: false, error: "Sync item not found" });
        }
      };

      getRequest.onerror = () => {
        reject({ success: false, error: getRequest.error });
      };
    });
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * 📄 MARCAR PDF COMO SINCRONIZADO ✨ NUEVO
 */
const markPDFAsSynced = async (pdfId) => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORES.PDFS], "readwrite");
    const store = transaction.objectStore(STORES.PDFS);

    return new Promise((resolve, reject) => {
      const getRequest = store.get(pdfId);

      getRequest.onsuccess = () => {
        const pdfItem = getRequest.result;
        if (pdfItem) {
          pdfItem.syncStatus = "synced";
          pdfItem.syncedAt = new Date().toISOString();

          const updateRequest = store.put(pdfItem);

          updateRequest.onsuccess = () => {
            console.log("✅ PDF marcado como sincronizado:", pdfId);
            resolve({ success: true });
          };

          updateRequest.onerror = () => {
            reject({ success: false, error: updateRequest.error });
          };
        } else {
          reject({ success: false, error: "PDF not found" });
        }
      };

      getRequest.onerror = () => {
        reject({ success: false, error: getRequest.error });
      };
    });
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * 🗑️ ELIMINAR PDF LOCAL ✨ NUEVO
 */
const deletePDFLocal = async (pdfId) => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORES.PDFS], "readwrite");
    const store = transaction.objectStore(STORES.PDFS);

    return new Promise((resolve, reject) => {
      const request = store.delete(pdfId);

      request.onsuccess = () => {
        console.log("✅ PDF eliminado localmente:", pdfId);
        resolve({ success: true });
      };

      request.onerror = () => {
        reject({ success: false, error: request.error });
      };
    });
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * 🗑️ ELIMINAR TODOS LOS PDFs DE UN EQUIPO ✨ NUEVO
 */
const deleteEquipmentPDFsLocal = async (equipmentId) => {
  try {
    const pdfsResult = await getPDFsByEquipmentLocal(equipmentId);

    if (!pdfsResult.success) {
      return { success: false, error: "No se pudieron obtener los PDFs" };
    }

    const db = await initDB();
    const transaction = db.transaction([STORES.PDFS], "readwrite");
    const store = transaction.objectStore(STORES.PDFS);

    let deletedCount = 0;
    
    for (const pdf of pdfsResult.data) {
      await store.delete(pdf.id);
      deletedCount++;
    }

    console.log(`✅ ${deletedCount} PDFs eliminados del equipo ${equipmentId}`);
    return { success: true, deletedCount };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * 📊 OBTENER ESTADÍSTICAS DE PDFs ✨ NUEVO
 */
const getPDFStats = async () => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORES.PDFS], "readonly");
    const store = transaction.objectStore(STORES.PDFS);

    return new Promise((resolve, reject) => {
      const request = store.getAll();

      request.onsuccess = () => {
        const pdfs = request.result;
        const stats = {
          total: pdfs.length,
          pending: pdfs.filter(p => p.syncStatus === "pending").length,
          synced: pdfs.filter(p => p.syncStatus === "synced").length,
          byCategory: {
            factura: pdfs.filter(p => p.category === "factura").length,
            pedimento: pdfs.filter(p => p.category === "pedimento").length,
          },
        };

        resolve({ success: true, data: stats });
      };

      request.onerror = () => {
        reject({ success: false, error: request.error });
      };
    });
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * 🗑️ LIMPIAR OPERACIONES SINCRONIZADAS
 */
const cleanupSyncedOperations = async () => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORES.PENDING_SYNC], "readwrite");
    const store = transaction.objectStore(STORES.PENDING_SYNC);
    const index = store.index("status");

    return new Promise((resolve, reject) => {
      const request = index.openCursor(IDBKeyRange.only("synced"));

      request.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          console.log("✅ Operaciones sincronizadas limpiadas");
          resolve({ success: true });
        }
      };

      request.onerror = () => {
        reject({ success: false, error: request.error });
      };
    });
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * 📊 OBTENER ESTADÍSTICAS DE SINCRONIZACIÓN
 */
const getSyncStats = async () => {
  try {
    const db = await initDB();
    const transaction = db.transaction([STORES.PENDING_SYNC], "readonly");
    const store = transaction.objectStore(STORES.PENDING_SYNC);

    return new Promise((resolve, reject) => {
      const request = store.getAll();

      request.onsuccess = () => {
        const operations = request.result;
        const stats = {
          total: operations.length,
          pending: operations.filter((op) => op.status === "pending").length,
          syncing: operations.filter((op) => op.status === "syncing").length,
          synced: operations.filter((op) => op.status === "synced").length,
          error: operations.filter((op) => op.status === "error").length,
        };

        resolve({ success: true, data: stats });
      };

      request.onerror = () => {
        reject({ success: false, error: request.error });
      };
    });
  } catch (error) {
    return { success: false, error: error.message };
  }
};

/**
 * 🔧 UTILIDADES
 */

// Convertir archivo a Base64
const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = (error) => reject(error);
  });
};

// Convertir Base64 a Blob (para imágenes)
const base64ToBlob = (base64) => {
  const parts = base64.split(";base64,");
  const contentType = parts[0].split(":")[1];
  const raw = window.atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);

  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }

  return new Blob([uInt8Array], { type: contentType });
};

/**
 * 📄 CONVERTIR BASE64 A PDF BLOB ✨ NUEVO
 */
const base64ToPDFBlob = (base64) => {
  const parts = base64.split(";base64,");
  const contentType = parts[0].split(":")[1] || "application/pdf";
  const raw = window.atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);

  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }

  return new Blob([uInt8Array], { type: contentType });
};

/**
 * 🧹 LIMPIAR TODA LA BASE DE DATOS (usar con precaución)
 */
const clearAllLocalData = async () => {
  try {
    const db = await initDB();
    const storeNames = [
      STORES.PLANTS,
      STORES.EQUIPMENT,
      STORES.PENDING_SYNC,
      STORES.IMAGES,
      STORES.PDFS,
    ];

    for (const storeName of storeNames) {
      const transaction = db.transaction([storeName], "readwrite");
      const store = transaction.objectStore(storeName);
      await store.clear();
      console.log(`✅ Store '${storeName}' limpiado`);
    }

    return { success: true };
  } catch (error) {
    console.error("❌ Error al limpiar base de datos:", error);
    return { success: false, error: error.message };
  }
};

// ========== EXPORTAR TODAS LAS FUNCIONES ========== ✨

export {
  // Base de datos
  initDB,
  STORES,
  DB_VERSION,
  
  // Plantas
  savePlantLocal,
  getPlantsLocal,
  
  // Equipos
  saveEquipmentLocal,
  getEquipmentByPlantLocal,
  
  // Imágenes
  saveImageLocal,
  getImagesByEquipmentLocal,
  
  // PDFs ✨ NUEVAS
  savePDFLocal,
  getPDFsByEquipmentLocal,
  getPDFsByCategoryLocal,
  markPDFAsSynced,
  deletePDFLocal,
  deleteEquipmentPDFsLocal,
  getPDFStats,
  
  // Sincronización
  addToSyncQueue,
  getPendingSyncOperations,
  markAsSynced,
  cleanupSyncedOperations,
  getSyncStats,
  
  // Utilidades
  fileToBase64,
  base64ToBlob,
  base64ToPDFBlob,
  clearAllLocalData,
};
