// firebaseServices.js - Versión 3.1 CORREGIDA
// Fecha: 2025-11-12
// Cambios: 
// - Corregido error al guardar equipos con ID local
// - Agregada función saveEquipment que detecta si es nuevo o actualización
// - Soporte para PDFs (Facturas y Pedimentos)

import { db, storage } from './firebase/firebaseConfig';
import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  deleteDoc,
  updateDoc,
  query,
  where,
  writeBatch,
  serverTimestamp,
} from "firebase/firestore";
import { 
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject, 
  listAll,
  getMetadata,
} from "firebase/storage";
import imageCompression from 'browser-image-compression';

// ============================================
// CONFIGURACIÓN DE COMPRESIÓN DE IMÁGENES
// ============================================

const compressionOptions = {
  maxSizeMB: 0.5,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
  fileType: 'image/webp'
};

// ============================================
// ========== NUEVAS FUNCIONES PARA PDFs ========== ✨
// ============================================

/**
 * 📄 SUBIR PDF (Factura o Pedimento)
 * 
 * @param {File} file - Archivo PDF
 * @param {string} category - 'factura' o 'pedimento'
 * @param {string} plantId - ID de la planta
 * @param {string} equipmentId - ID del equipo
 * @returns {Promise<Object>} - Resultado con URL y metadata del PDF
 */
export const uploadPDF = async (file, category, plantId, equipmentId) => {
  try {
    console.log('📄 Subiendo PDF...', {
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2) + 'MB',
      category: category
    });

    // Validar que sea PDF
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      throw new Error('El archivo debe ser un PDF');
    }

    // Validar tamaño (max 20MB)
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
      throw new Error('El PDF excede el tamaño máximo de 20MB');
    }

    // Generar nombre único para el archivo
    const timestamp = Date.now();
    const sanitizedFileName = file.name
      .replace(/[^a-zA-Z0-9.-]/g, '_')
      .replace(/\s+/g, '_');
    const fileName = `${category}_${timestamp}_${sanitizedFileName}`;
    
    // Ruta en Storage: /plantas/{plantId}/equipos/{equipmentId}/documentos/{category}/{fileName}
    const storagePath = `plantas/${plantId}/equipos/${equipmentId}/documentos/${category}/${fileName}`;
    const storageRef = ref(storage, storagePath);

    // Subir PDF
    console.log('☁️ Subiendo PDF a:', storagePath);
    const snapshot = await uploadBytes(storageRef, file, {
      contentType: 'application/pdf',
      customMetadata: {
        originalName: file.name,
        uploadDate: new Date().toISOString(),
        category: category,
        plantId: plantId,
        equipmentId: equipmentId
      }
    });
    
    // Obtener URL de descarga
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    console.log('✅ PDF subido exitosamente');
    return { 
      success: true, 
      url: downloadURL, 
      path: storagePath,
      fileName: fileName,
      size: file.size,
      category: category
    };
  } catch (error) {
    console.error('❌ Error al subir PDF:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 📄 SUBIR MÚLTIPLES PDFs
 */
export const uploadMultiplePDFs = async (files, category, plantId, equipmentId, onProgress) => {
  const results = [];
  const total = files.length;
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    // Callback de progreso
    if (onProgress) {
      onProgress(i + 1, total);
    }
    
    const result = await uploadPDF(file, category, plantId, equipmentId);
    results.push(result);
  }
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  return {
    success: failed.length === 0,
    uploaded: successful.length,
    failed: failed.length,
    results: successful
  };
};

/**
 * 📄 OBTENER PDFs DE UN EQUIPO
 */
export const getEquipmentPDFs = async (plantId, equipmentId) => {
  try {
    const categories = ['factura', 'pedimento'];
    const pdfs = {
      factura: [],
      pedimento: []
    };
    
    for (const category of categories) {
      const folderPath = `plantas/${plantId}/equipos/${equipmentId}/documentos/${category}`;
      const folderRef = ref(storage, folderPath);
      
      try {
        const listResult = await listAll(folderRef);
        
        for (const itemRef of listResult.items) {
          const url = await getDownloadURL(itemRef);
          const metadata = await getMetadata(itemRef);
          
          pdfs[category].push({
            url: url,
            path: itemRef.fullPath,
            name: metadata.customMetadata?.originalName || itemRef.name,
            fileName: itemRef.name,
            uploadDate: metadata.customMetadata?.uploadDate || metadata.timeCreated,
            size: metadata.size,
            sizeFormatted: formatFileSize(metadata.size),
            category: category
          });
        }
      } catch (error) {
        console.log(`ℹ️ No hay PDFs en categoría: ${category}`);
      }
    }
    
    console.log('✅ PDFs obtenidos:', pdfs);
    return { success: true, pdfs: pdfs };
  } catch (error) {
    console.error('❌ Error al obtener PDFs:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 🗑️ ELIMINAR PDF ESPECÍFICO
 */
export const deletePDF = async (pdfPath) => {
  try {
    console.log(`🗑️ Eliminando PDF: ${pdfPath}`);
    
    const pdfRef = ref(storage, pdfPath);
    await deleteObject(pdfRef);
    
    console.log("✅ PDF eliminado");
    
    return {
      success: true,
      message: "PDF eliminado correctamente",
    };
  } catch (error) {
    console.error("❌ Error al eliminar PDF:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * 🗑️ ELIMINAR TODOS LOS PDFs DE UN EQUIPO
 */
export const deleteEquipmentPDFs = async (plantId, equipmentId) => {
  try {
    const categories = ['factura', 'pedimento'];
    let deletedCount = 0;
    
    for (const category of categories) {
      const folderPath = `plantas/${plantId}/equipos/${equipmentId}/documentos/${category}`;
      const folderRef = ref(storage, folderPath);
      
      try {
        const listResult = await listAll(folderRef);
        
        for (const itemRef of listResult.items) {
          await deleteObject(itemRef);
          deletedCount++;
        }
      } catch (error) {
        console.log(`ℹ️ No hay PDFs para eliminar en: ${category}`);
      }
    }
    
    console.log(`✅ ${deletedCount} PDFs del equipo eliminados`);
    return { success: true, deletedCount: deletedCount };
  } catch (error) {
    console.error('❌ Error al eliminar PDFs del equipo:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 📄 VALIDAR PDF
 */
export const validatePDF = (file) => {
  // Verificar que sea un archivo
  if (!(file instanceof File)) {
    return { valid: false, error: 'No es un archivo válido' };
  }

  // Verificar tipo
  if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
    return { valid: false, error: 'El archivo debe ser un PDF' };
  }

  // Verificar tamaño (máx 20MB)
  const maxSize = 20 * 1024 * 1024;
  if (file.size > maxSize) {
    return { valid: false, error: 'El PDF excede el tamaño máximo de 20MB' };
  }

  return { valid: true };
};

/**
 * 📄 FORMATEAR TAMAÑO DE ARCHIVO
 */
const formatFileSize = (bytes) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
};

// ============================================
// SERVICIOS DE PLANTAS (sin cambios)
// ============================================

export const addPlant = async (plantData) => {
  try {
    const docRef = await addDoc(collection(db, 'plants'), {
      ...plantData,
      equipmentCount: 0,
      createdAt: serverTimestamp(),
      lastAudit: new Date().toISOString().split('T')[0]
    });
    console.log('✅ Planta creada con ID:', docRef.id);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('❌ Error al crear planta:', error);
    return { success: false, error: error.message };
  }
};

export const getPlants = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'plants'));
    const plants = [];
    querySnapshot.forEach((doc) => {
      plants.push({ id: doc.id, ...doc.data() });
    });
    console.log('✅ Plantas obtenidas:', plants.length);
    return { success: true, data: plants };
  } catch (error) {
    console.error('❌ Error al obtener plantas:', error);
    return { success: false, error: error.message };
  }
};

export const updatePlant = async (plantId, plantData) => {
  try {
    const plantRef = doc(db, 'plants', plantId);
    await updateDoc(plantRef, {
      ...plantData,
      updatedAt: serverTimestamp()
    });
    console.log('✅ Planta actualizada:', plantId);
    return { success: true };
  } catch (error) {
    console.error('❌ Error al actualizar planta:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 🗑️ ELIMINAR PLANTA Y TODOS SUS DATOS (INCLUYENDO PDFs)
 */
export const deletePlant = async (plantId) => {
  console.log(`\n🗑️ ======================================`);
  console.log(`🗑️ ELIMINANDO PLANTA: ${plantId}`);
  console.log(`🗑️ ======================================\n`);

  try {
    // 1. Obtener todos los equipos
    console.log("📋 Paso 1: Obteniendo equipos...");
    const equipmentQuery = query(
      collection(db, "equipment"),
      where("plantId", "==", plantId)
    );
    const equipmentSnapshot = await getDocs(equipmentQuery);
    console.log(`✅ Encontrados ${equipmentSnapshot.size} equipos`);

    // 2. Eliminar imágenes Y PDFs de cada equipo
    console.log("\n📋 Paso 2: Eliminando archivos del Storage...");
    let totalImagesDeleted = 0;
    let totalPDFsDeleted = 0;
    
    for (const equipDoc of equipmentSnapshot.docs) {
      const equipmentId = equipDoc.id;
      console.log(`  🗑️ Eliminando archivos del equipo: ${equipmentId}`);
      
      // Eliminar imágenes
      const paths = [
        `equipment_images/${plantId}/${equipmentId}`,
        `plants/${plantId}/equipment/${equipmentId}`
      ];
      
      for (const basePath of paths) {
        try {
          const storageRef = ref(storage, basePath);
          const filesList = await listAll(storageRef);
          
          for (const fileRef of filesList.items) {
            await deleteObject(fileRef);
            totalImagesDeleted++;
          }
          
          for (const folderRef of filesList.prefixes) {
            const subList = await listAll(folderRef);
            for (const fileRef of subList.items) {
              await deleteObject(fileRef);
              totalImagesDeleted++;
            }
          }
        } catch (error) {
          console.log(`    ℹ️ No se encontraron archivos en ${basePath}`);
        }
      }

      // ========== ELIMINAR PDFs ========== ✨
      try {
        const pdfPath = `plantas/${plantId}/equipos/${equipmentId}/documentos`;
        const pdfRef = ref(storage, pdfPath);
        const pdfsList = await listAll(pdfRef);
        
        // Eliminar PDFs en subcarpetas
        for (const folderRef of pdfsList.prefixes) {
          const subList = await listAll(folderRef);
          for (const pdfFileRef of subList.items) {
            await deleteObject(pdfFileRef);
            totalPDFsDeleted++;
            console.log(`    ✅ PDF eliminado: ${pdfFileRef.name}`);
          }
        }
        
        // Eliminar PDFs en raíz
        for (const pdfFileRef of pdfsList.items) {
          await deleteObject(pdfFileRef);
          totalPDFsDeleted++;
          console.log(`    ✅ PDF eliminado: ${pdfFileRef.name}`);
        }
      } catch (error) {
        console.log(`    ℹ️ No se encontraron PDFs`);
      }
    }
    
    console.log(`\n✅ Total archivos eliminados:`);
    console.log(`   📸 Imágenes: ${totalImagesDeleted}`);
    console.log(`   📄 PDFs: ${totalPDFsDeleted}`);

    // 3. Eliminar equipos
    console.log("\n📋 Paso 3: Eliminando equipos de Firestore...");
    if (equipmentSnapshot.size > 0) {
      const batch = writeBatch(db);
      equipmentSnapshot.docs.forEach((equipDoc) => {
        batch.delete(equipDoc.ref);
      });
      await batch.commit();
      console.log(`✅ ${equipmentSnapshot.size} equipos eliminados`);
    }

    // 4. Eliminar la planta
    console.log("\n📋 Paso 4: Eliminando planta...");
    await deleteDoc(doc(db, "plants", plantId));
    console.log("✅ Planta eliminada");

    console.log("\n🗑️ ======================================");
    console.log("🗑️ ELIMINACIÓN COMPLETADA");
    console.log(`🗑️ Imágenes: ${totalImagesDeleted} | PDFs: ${totalPDFsDeleted}`);
    console.log("🗑️ ======================================\n");

    return {
      success: true,
      stats: {
        imagesDeleted: totalImagesDeleted,
        pdfsDeleted: totalPDFsDeleted,
        equipmentDeleted: equipmentSnapshot.size,
      },
    };
  } catch (error) {
    console.error("❌ Error al eliminar planta:", error);
    return { success: false, error: error.message };
  }
};

// ============================================
// SERVICIOS DE EQUIPOS - ⭐ CORREGIDOS ⭐
// ============================================

export const addEquipment = async (plantId, equipmentData) => {
  try {
    const docRef = await addDoc(collection(db, 'equipment'), {
      ...equipmentData,
      plantId: plantId,
      status: 'complete',
      syncStatus: 'synced',
      createdAt: serverTimestamp(),
      auditDate: new Date().toISOString().split('T')[0]
    });

    // Actualizar contador
    const plantRef = doc(db, 'plants', plantId);
    const plantDoc = await getDoc(plantRef);
    if (plantDoc.exists()) {
      const currentCount = plantDoc.data().equipmentCount || 0;
      await updateDoc(plantRef, {
        equipmentCount: currentCount + 1,
        lastAudit: new Date().toISOString().split('T')[0]
      });
    }

    console.log('✅ Equipo creado con ID:', docRef.id);
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('❌ Error al crear equipo:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 💾 GUARDAR EQUIPO (NUEVO O ACTUALIZACIÓN) - ⭐ NUEVA FUNCIÓN ⭐
 * 
 * Esta función detecta automáticamente si el equipo es nuevo (ID local) o existente:
 * - Si tiene ID local (empieza con "local_"), crea un nuevo documento en Firebase
 * - Si tiene ID de Firebase, actualiza el documento existente
 */
export const saveEquipment = async (plantId, equipmentData, equipmentId = null) => {
  try {
    console.log('💾 Guardando equipo...', { plantId, equipmentId });

    // Detectar si es un equipo nuevo con ID local o sin ID
    const isLocalId = equipmentId && equipmentId.startsWith('local_');
    const isNewEquipment = !equipmentId || isLocalId;

    if (isNewEquipment) {
      // ====== CREAR NUEVO EQUIPO ======
      console.log('✨ Creando nuevo equipo en Firebase...');
      
      const docRef = await addDoc(collection(db, 'equipment'), {
        ...equipmentData,
        plantId: plantId,
        status: 'complete',
        syncStatus: 'synced',
        createdAt: serverTimestamp(),
        auditDate: new Date().toISOString().split('T')[0]
      });

      // Actualizar contador de equipos en la planta
      const plantRef = doc(db, 'plants', plantId);
      const plantDoc = await getDoc(plantRef);
      if (plantDoc.exists()) {
        const currentCount = plantDoc.data().equipmentCount || 0;
        await updateDoc(plantRef, {
          equipmentCount: currentCount + 1,
          lastAudit: new Date().toISOString().split('T')[0]
        });
      }

      console.log('✅ Equipo creado con ID:', docRef.id);
      return { success: true, id: docRef.id, isNew: true };

    } else {
      // ====== ACTUALIZAR EQUIPO EXISTENTE ======
      console.log('🔄 Actualizando equipo existente...', equipmentId);
      
      const equipmentRef = doc(db, 'equipment', equipmentId);
      
      // Verificar que el documento existe
      const docSnap = await getDoc(equipmentRef);
      if (!docSnap.exists()) {
        throw new Error(`Equipo con ID ${equipmentId} no existe en Firebase`);
      }

      await updateDoc(equipmentRef, {
        ...equipmentData,
        updatedAt: serverTimestamp()
      });

      console.log('✅ Equipo actualizado:', equipmentId);
      return { success: true, id: equipmentId, isNew: false };
    }

  } catch (error) {
    console.error('❌ Error al guardar equipo:', error);
    return { success: false, error: error.message };
  }
};

export const getEquipmentByPlant = async (plantId) => {
  try {
    const q = query(collection(db, 'equipment'), where('plantId', '==', plantId));
    const querySnapshot = await getDocs(q);
    const equipment = [];
    querySnapshot.forEach((doc) => {
      equipment.push({ id: doc.id, ...doc.data() });
    });
    console.log(`✅ Equipos obtenidos: ${equipment.length}`);
    return { success: true, data: equipment };
  } catch (error) {
    console.error('❌ Error al obtener equipos:', error);
    return { success: false, error: error.message };
  }
};

export const getEquipmentById = async (equipmentId) => {
  try {
    const docRef = doc(db, 'equipment', equipmentId);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      console.log('✅ Equipo obtenido:', equipmentId);
      return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
    } else {
      console.log('❌ Equipo no encontrado');
      return { success: false, error: 'Equipo no encontrado' };
    }
  } catch (error) {
    console.error('❌ Error al obtener equipo:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 🔄 ACTUALIZAR EQUIPO EXISTENTE
 * 
 * ⚠️ IMPORTANTE: Esta función SOLO debe usarse para equipos que YA EXISTEN en Firebase
 * Para equipos nuevos o con ID local, usa saveEquipment() en su lugar
 */
export const updateEquipment = async (equipmentId, equipmentData) => {
  try {
    // Validar que no sea un ID local
    if (equipmentId.startsWith('local_')) {
      throw new Error('No se puede actualizar un equipo con ID local. Usa saveEquipment() en su lugar.');
    }

    const equipmentRef = doc(db, 'equipment', equipmentId);
    
    // Verificar que el documento existe
    const docSnap = await getDoc(equipmentRef);
    if (!docSnap.exists()) {
      throw new Error(`No document to update: projects/auditoria-industrial/databases/(default)/documents/equipment/${equipmentId}`);
    }

    await updateDoc(equipmentRef, {
      ...equipmentData,
      updatedAt: serverTimestamp()
    });
    
    console.log('✅ Equipo actualizado:', equipmentId);
    return { success: true };
  } catch (error) {
    console.error('❌ Error al actualizar equipo:', error);
    return { success: false, error: error.message };
  }
};

/**
 * 🗑️ ELIMINAR EQUIPO (INCLUYENDO PDFs)
 */
export const deleteEquipment = async (plantId, equipmentId) => {
  try {
    console.log(`🗑️ Eliminando equipo: ${equipmentId}`);

    // 1. Eliminar imágenes
    await deleteEquipmentImages(plantId, equipmentId);

    // 2. ========== ELIMINAR PDFs ========== ✨
    await deleteEquipmentPDFs(plantId, equipmentId);

    // 3. Eliminar documento de Firestore
    await deleteDoc(doc(db, 'equipment', equipmentId));

    // 4. Actualizar contador en la planta
    const plantRef = doc(db, 'plants', plantId);
    const plantDoc = await getDoc(plantRef);
    if (plantDoc.exists()) {
      const currentCount = plantDoc.data().equipmentCount || 0;
      await updateDoc(plantRef, {
        equipmentCount: Math.max(0, currentCount - 1)
      });
    }

    console.log('✅ Equipo eliminado completamente');
    return { success: true };
  } catch (error) {
    console.error('❌ Error al eliminar equipo:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// SERVICIOS DE IMÁGENES (sin cambios)
// ============================================

export const uploadImage = async (file, category, plantId, equipmentId) => {
  try {
    console.log('📸 Subiendo imagen...', {
      name: file.name,
      size: (file.size / 1024).toFixed(2) + 'KB',
      category: category
    });

    // Comprimir imagen
    const compressedFile = await imageCompression(file, compressionOptions);
    console.log('✅ Imagen comprimida:', (compressedFile.size / 1024).toFixed(2) + 'KB');
    
    const timestamp = Date.now();
    const fileName = `${category}_${timestamp}.webp`;
    
    const storagePath = `equipment_images/${plantId}/${equipmentId}/${category}/${fileName}`;
    const storageRef = ref(storage, storagePath);

    console.log('☁️ Subiendo imagen a:', storagePath);
    const snapshot = await uploadBytes(storageRef, compressedFile, {
      contentType: 'image/webp',
      customMetadata: {
        originalName: file.name,
        uploadDate: new Date().toISOString(),
        category: category
      }
    });
    
    const downloadURL = await getDownloadURL(snapshot.ref);
    
    console.log('✅ Imagen subida exitosamente');
    return { 
      success: true, 
      url: downloadURL, 
      path: storagePath,
      fileName: fileName,
      size: compressedFile.size
    };
  } catch (error) {
    console.error('❌ Error al subir imagen:', error);
    return { success: false, error: error.message };
  }
};

export const uploadMultipleImages = async (files, category, plantId, equipmentId, onProgress) => {
  const results = [];
  const total = files.length;
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    if (onProgress) {
      onProgress(i + 1, total);
    }
    
    const result = await uploadImage(file, category, plantId, equipmentId);
    results.push(result);
  }
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  return {
    success: failed.length === 0,
    uploaded: successful.length,
    failed: failed.length,
    results: successful
  };
};

export const getEquipmentImages = async (plantId, equipmentId) => {
  try {
    const categories = ['equipment', 'plate', 'invoice', 'customs'];
    const images = {
      equipment: [],
      plate: [],
      invoice: [],
      customs: []
    };
    
    for (const category of categories) {
      const folderPath = `equipment_images/${plantId}/${equipmentId}/${category}`;
      const folderRef = ref(storage, folderPath);
      
      try {
        const listResult = await listAll(folderRef);
        
        for (const itemRef of listResult.items) {
          const url = await getDownloadURL(itemRef);
          const metadata = await getMetadata(itemRef);
          
          images[category].push({
            url: url,
            path: itemRef.fullPath,
            name: itemRef.name,
            uploadDate: metadata.customMetadata?.uploadDate || metadata.timeCreated,
            size: metadata.size
          });
        }
      } catch (error) {
        console.log(`ℹ️ No hay imágenes en: ${category}`);
      }
    }
    
    console.log('✅ Imágenes obtenidas');
    return { success: true, images: images };
  } catch (error) {
    console.error('❌ Error al obtener imágenes:', error);
    return { success: false, error: error.message };
  }
};

export const deleteImage = async (imagePath) => {
  try {
    console.log(`🗑️ Eliminando imagen: ${imagePath}`);
    const imageRef = ref(storage, imagePath);
    await deleteObject(imageRef);
    console.log("✅ Imagen eliminada");
    return { success: true };
  } catch (error) {
    console.error("❌ Error al eliminar imagen:", error);
    return { success: false, error: error.message };
  }
};

export const deleteEquipmentImages = async (plantId, equipmentId) => {
  try {
    const categories = ['equipment', 'plate', 'invoice', 'customs'];
    let deletedCount = 0;
    
    for (const category of categories) {
      const folderPath = `equipment_images/${plantId}/${equipmentId}/${category}`;
      const folderRef = ref(storage, folderPath);
      
      try {
        const listResult = await listAll(folderRef);
        
        for (const itemRef of listResult.items) {
          await deleteObject(itemRef);
          deletedCount++;
        }
      } catch (error) {
        console.log(`ℹ️ No hay imágenes en: ${category}`);
      }
    }
    
    console.log(`✅ ${deletedCount} imágenes eliminadas`);
    return { success: true, deletedCount: deletedCount };
  } catch (error) {
    console.error('❌ Error al eliminar imágenes:', error);
    return { success: false, error: error.message };
  }
};

export const fileToDataURL = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target.result);
    reader.onerror = (e) => reject(e);
    reader.readAsDataURL(file);
  });
};

// ============================================
// SERVICIOS DE EXPORTACIÓN
// ============================================

export const exportToJSON = async () => {
  try {
    const plantsResult = await getPlants();
    const allEquipment = await getDocs(collection(db, 'equipment'));
    
    const equipment = [];
    allEquipment.forEach((doc) => {
      equipment.push({ id: doc.id, ...doc.data() });
    });

    const exportData = {
      exportDate: new Date().toISOString(),
      version: '3.1',
      plants: plantsResult.data,
      equipment: equipment,
      summary: {
        totalPlants: plantsResult.data.length,
        totalEquipment: equipment.length,
        completedEquipment: equipment.filter(e => e.status === 'complete').length
      }
    };

    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `auditoria_v3.1_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
    console.log('✅ Datos exportados a JSON');
    return { success: true };
  } catch (error) {
    console.error('❌ Error al exportar:', error);
    return { success: false, error: error.message };
  }
};

export const exportToCSV = async () => {
  try {
    const allEquipment = await getDocs(collection(db, 'equipment'));
    
    let csvContent = 'ID,Planta ID,Nombre,Ubicación,Número de Serie,Modelo,Fabricante,País,Status Placa,Origen,Fecha Auditoría,Imágenes\n';
    
    allEquipment.forEach((doc) => {
      const data = doc.data();
      const hasImages = data.images ? 'Sí' : 'No';
      csvContent += `${doc.id},${data.plantId},${data.name || ''},${data.location || ''},${data.serialNumber || ''},${data.model || ''},${data.manufacturer || ''},${data.countryOfOrigin || ''},${data.plateStatus || ''},${data.origin || ''},${data.auditDate || ''},${hasImages}\n`;
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `auditoria_v3.1_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    URL.revokeObjectURL(url);
    console.log('✅ Datos exportados a CSV');
    return { success: true };
  } catch (error) {
    console.error('❌ Error al exportar:', error);
    return { success: false, error: error.message };
  }
};