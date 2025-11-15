// firebaseServices.js - Versión 2.0
// Fecha: 2025-11-10
// Cambios: Sistema completo de imágenes con compresión, vista previa y almacenamiento

import { db, storage } from './firebaseConfig';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  getDocs, 
  getDoc,
  query,
  where,
  serverTimestamp 
} from 'firebase/firestore';
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject,
  listAll
} from 'firebase/storage';
import imageCompression from 'browser-image-compression';

// ============================================
// CONFIGURACIÓN DE COMPRESIÓN DE IMÁGENES
// ============================================

const compressionOptions = {
  maxSizeMB: 0.5,           // 500KB máximo
  maxWidthOrHeight: 1920,   // Resolución máxima
  useWebWorker: true,
  fileType: 'image/webp'    // Formato optimizado
};

// ============================================
// SERVICIOS DE PLANTAS
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

export const deletePlant = async (plantId) => {
  try {
    await deleteDoc(doc(db, 'plants', plantId));
    console.log('✅ Planta eliminada:', plantId);
    return { success: true };
  } catch (error) {
    console.error('❌ Error al eliminar planta:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// SERVICIOS DE EQUIPOS
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
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error('❌ Error al crear equipo:', error);
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
    console.log('✅ Equipos obtenidos para planta:', plantId, equipment.length);
    return { success: true, data: equipment };
  } catch (error) {
    console.error('❌ Error al obtener equipos:', error);
    return { success: false, error: error.message };
  }
};

export const updateEquipment = async (equipmentId, equipmentData) => {
  try {
    const equipmentRef = doc(db, 'equipment', equipmentId);
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

export const deleteEquipment = async (equipmentId, plantId) => {
  try {
    // Eliminar imágenes asociadas
    await deleteEquipmentImages(plantId, equipmentId);
    
    // Eliminar documento
    await deleteDoc(doc(db, 'equipment', equipmentId));

    // Actualizar contador de equipos en la planta
    const plantRef = doc(db, 'plants', plantId);
    const plantDoc = await getDoc(plantRef);
    if (plantDoc.exists()) {
      const currentCount = plantDoc.data().equipmentCount || 0;
      await updateDoc(plantRef, {
        equipmentCount: Math.max(0, currentCount - 1)
      });
    }

    console.log('✅ Equipo eliminado:', equipmentId);
    return { success: true };
  } catch (error) {
    console.error('❌ Error al eliminar equipo:', error);
    return { success: false, error: error.message };
  }
};

// ============================================
// SERVICIOS DE IMÁGENES - NUEVOS V2.0
// ============================================

/**
 * Comprimir imagen antes de subir
 */
const compressImage = async (file) => {
  try {
    console.log('🔄 Comprimiendo imagen:', file.name, 'Tamaño original:', (file.size / 1024).toFixed(2), 'KB');
    const compressedFile = await imageCompression(file, compressionOptions);
    console.log('✅ Imagen comprimida:', (compressedFile.size / 1024).toFixed(2), 'KB');
    return compressedFile;
  } catch (error) {
    console.error('❌ Error al comprimir imagen:', error);
    throw error;
  }
};

/**
 * Subir una imagen a Firebase Storage
 */
export const uploadImage = async (file, category, plantId, equipmentId) => {
  try {
    // Comprimir imagen
    const compressedFile = await compressImage(file);
    
    // Crear nombre único con timestamp
    const timestamp = Date.now();
    const extension = 'webp';
    const fileName = `${timestamp}_${Math.random().toString(36).substring(7)}.${extension}`;
    
    // Ruta en Storage: /equipment_images/{plantId}/{equipmentId}/{category}/{fileName}
    const storagePath = `equipment_images/${plantId}/${equipmentId}/${category}/${fileName}`;
    const storageRef = ref(storage, storagePath);

    // Subir imagen
    console.log('☁️ Subiendo imagen a:', storagePath);
    const snapshot = await uploadBytes(storageRef, compressedFile, {
      contentType: 'image/webp',
      customMetadata: {
        originalName: file.name,
        uploadDate: new Date().toISOString(),
        category: category
      }
    });
    
    // Obtener URL de descarga
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

/**
 * Subir múltiples imágenes
 */
export const uploadMultipleImages = async (files, category, plantId, equipmentId, onProgress) => {
  const results = [];
  const total = files.length;
  
  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    
    // Callback de progreso
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

/**
 * Obtener todas las imágenes de un equipo
 */
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
          const metadata = await itemRef.getMetadata();
          
          images[category].push({
            url: url,
            path: itemRef.fullPath,
            name: itemRef.name,
            uploadDate: metadata.customMetadata?.uploadDate || metadata.timeCreated,
            size: metadata.size
          });
        }
      } catch (error) {
        console.log(`ℹ️ No hay imágenes en categoría: ${category}`);
      }
    }
    
    console.log('✅ Imágenes obtenidas:', images);
    return { success: true, images: images };
  } catch (error) {
    console.error('❌ Error al obtener imágenes:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Eliminar una imagen específica
 */
export const deleteImage = async (imagePath) => {
  try {
    const imageRef = ref(storage, imagePath);
    await deleteObject(imageRef);
    console.log('✅ Imagen eliminada:', imagePath);
    return { success: true };
  } catch (error) {
    console.error('❌ Error al eliminar imagen:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Eliminar todas las imágenes de un equipo
 */
export const deleteEquipmentImages = async (plantId, equipmentId) => {
  try {
    const categories = ['equipment', 'plate', 'invoice', 'customs'];
    
    for (const category of categories) {
      const folderPath = `equipment_images/${plantId}/${equipmentId}/${category}`;
      const folderRef = ref(storage, folderPath);
      
      try {
        const listResult = await listAll(folderRef);
        
        for (const itemRef of listResult.items) {
          await deleteObject(itemRef);
        }
      } catch (error) {
        console.log(`ℹ️ No hay imágenes para eliminar en: ${category}`);
      }
    }
    
    console.log('✅ Todas las imágenes del equipo eliminadas');
    return { success: true };
  } catch (error) {
    console.error('❌ Error al eliminar imágenes del equipo:', error);
    return { success: false, error: error.message };
  }
};

/**
 * Convertir File a Data URL para vista previa
 */
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
      version: '2.0',
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
    link.download = `auditoria_v2_${new Date().toISOString().split('T')[0]}.json`;
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
    link.download = `auditoria_v2_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    URL.revokeObjectURL(url);
    console.log('✅ Datos exportados a CSV');
    return { success: true };
  } catch (error) {
    console.error('❌ Error al exportar:', error);
    return { success: false, error: error.message };
  }
};