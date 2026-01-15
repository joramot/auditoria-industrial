// useEquipment.js - Hook personalizado para gestión de equipos
// Versión: 1.0
// Fecha: 2025-11-23
// Descripción: Maneja el estado y lógica de equipos en el sistema de auditoría
// Extrae: estados, funciones de carga, creación y guardado de equipos

import { useState } from 'react';
import {
  getEquipmentByPlant,
  updateEquipment,
  saveEquipment,
  uploadImage,
  uploadPDF,
} from '../services/firebase/firebaseServices';

import {
  saveEquipmentLocal,
  saveImageLocal,
  savePDFLocal,
  getEquipmentByPlantLocal,
  addToSyncQueue,
} from '../services/storage/localStorageService';

/**
 * 🎣 Hook personalizado para gestión de equipos
 * 
 * @param {Object} selectedPlant - Planta actualmente seleccionada
 * @param {boolean} isOffline - Estado de conexión
 * @param {Function} setCurrentView - Función para cambiar la vista actual
 * @param {Function} setSuccessMessage - Función para mostrar mensajes de éxito
 * @param {Function} setShowSuccessMessage - Función para controlar visibilidad del mensaje
 * @param {Function} updateSyncStats - Función para actualizar estadísticas de sincronización
 * 
 * @returns {Object} Estado y funciones para manejo de equipos
 */
export const useEquipment = (
  selectedPlant,
  isOffline,
  setCurrentView,
  setSuccessMessage,
  setShowSuccessMessage,
  updateSyncStats
) => {
  
  // ============================================
  // 📦 ESTADOS DE EQUIPOS
  // ============================================
  
  const [equipment, setEquipment] = useState([]);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    equipmentName: "",
    locationInPlant: "",
    serialNumber: "",
    model: "",
    manufacturer: "",
    countryOfOrigin: "",
    plateStatus: "OK",
    plateNotes: "",
    origin: "NACIONAL",
    actionsDescription: "",
    observations: "",
    invoiceNumber: "",
    customsNumber: "",
  });
  
  // Estados de imágenes capturadas
  const [capturedImages, setCapturedImages] = useState({
    equipment: [],
    plate: [],
  });
  
  // Estados de PDFs capturados
  const [capturedPDFs, setCapturedPDFs] = useState({
    factura: [],
    pedimento: [],
  });

  // ============================================
  // 📋 CARGAR EQUIPOS DE UNA PLANTA
  // ============================================
  
  const loadEquipment = async (plantId) => {
    // console.log("\n🏭 RECARGANDO EQUIPOS de planta:", plantId);
    setIsLoading(true);
    
    try {
      const result = await getEquipmentByPlant(plantId);
      
      if (result.success) {
        // Eliminar duplicados basándose en el ID
        const uniqueEquipment = result.data.reduce((acc, current) => {
          const existingIndex = acc.findIndex(item => item.id === current.id);
          
          if (existingIndex === -1) {
            // No existe, agregarlo
            acc.push(current);
          } else {
            // Ya existe, mantener el que tenga syncStatus 'synced' o el más reciente
            const existing = acc[existingIndex];
            
            if (current.syncStatus === 'synced' && existing.syncStatus !== 'synced') {
              // Reemplazar con la versión sincronizada
              acc[existingIndex] = current;
            } else if (current.updatedAt > existing.updatedAt) {
              // Reemplazar con la versión más reciente
              acc[existingIndex] = current;
            }
          }
          
          return acc;
        }, []);
        
        // console.log("✅ Equipos cargados:", uniqueEquipment.length);
        // console.log(`🗑️ Duplicados eliminados: ${result.data.length - uniqueEquipment.length}`);
        
        setEquipment(uniqueEquipment);
      } else {
        console.error("❌ Error al cargar equipos:", result.error);
        alert("❌ Error al cargar equipos: " + result.error);
        setEquipment([]);
      }
    } catch (error) {
      console.error("❌ Excepción al cargar equipos:", error);
      alert("❌ Error inesperado al cargar equipos: " + error.message);
      setEquipment([]);
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // ➕ NUEVO EQUIPO
  // ============================================
  
  const handleNewEquipment = () => {
    // console.log("\n➕ ABRIENDO FORMULARIO DE NUEVO EQUIPO");

    setSelectedEquipment(null);

    setFormData({
      equipmentName: "",
      locationInPlant: "",
      serialNumber: "",
      model: "",
      manufacturer: "",
      countryOfOrigin: "",
      plateStatus: "OK",
      plateNotes: "",
      origin: "NACIONAL",
      actionsDescription: "",
      observations: "",
      invoiceNumber: "",
      customsNumber: "",
    });
    
    setCapturedImages({
      equipment: [],
      plate: [],
    });

    setCapturedPDFs({
      factura: [],
      pedimento: [],
    });
    
    setCurrentView("form");
    
    // console.log("✅ Formulario limpio y listo para nuevo equipo");
  };

  // ============================================
  // ❌ CANCELAR EDICIÓN/CREACIÓN
  // ============================================
  
  const handleCancelEquipment = () => {
    // console.log("\n❌ CANCELANDO EDICIÓN/CREACIÓN DE EQUIPO");

    setSelectedEquipment(null);

    setFormData({
      equipmentName: "",
      locationInPlant: "",
      serialNumber: "",
      model: "",
      manufacturer: "",
      countryOfOrigin: "",
      plateStatus: "OK",
      plateNotes: "",
      origin: "NACIONAL",
      actionsDescription: "",
      observations: "",
      invoiceNumber: "",
      customsNumber: "",
    });
    
    setCapturedImages({
      equipment: [],
      plate: [],
    });

    setCapturedPDFs({
      factura: [],
      pedimento: [],
    });
    
    setCurrentView("equipment");
    
    // console.log("✅ Formulario limpiado, volviendo a lista de equipos");
  };

  // ============================================
  // 💾 GUARDAR EQUIPO (NUEVO O ACTUALIZACIÓN)
  // ============================================
  
  const handleSaveEquipment = async () => {
    // Validar campos obligatorios
    if (
      !formData.equipmentName ||
      !formData.locationInPlant ||
      !formData.serialNumber
    ) {
      alert(
        "⚠️ Por favor completa los campos obligatorios:\n- Nombre del Equipo\n- Localización en Planta\n- Número de Serie"
      );
      return;
    }

    setIsLoading(true);

    try {
      // Preparar datos del equipo
      const equipmentData = {
        name: formData.equipmentName,
        location: formData.locationInPlant,
        serialNumber: formData.serialNumber,
        model: formData.model,
        manufacturer: formData.manufacturer,
        countryOfOrigin: formData.countryOfOrigin,
        plateStatus: formData.plateStatus,
        plateNotes: formData.plateNotes,
        origin: formData.origin,
        actionsDescription: formData.actionsDescription,
        observations: formData.observations,
        invoiceNumber: formData.invoiceNumber,
        customsNumber: formData.customsNumber,
        capturedBy: "Usuario Actual",
        createdAt: new Date().toISOString(),
      };

      let equipmentId;
      let isNewEquipment = !selectedEquipment;

      // ============================================
      // 📴 MODO OFFLINE
      // ============================================
      if (isOffline) {
        // console.log("📴 Modo OFFLINE: Guardando equipo localmente...");

        if (isNewEquipment) {
          // CREAR NUEVO EQUIPO LOCAL
          const localResult = await saveEquipmentLocal(
            equipmentData,
            selectedPlant.id
          );

          if (!localResult.success) {
            throw new Error(localResult.error);
          }

          equipmentId = localResult.data.id;
          // console.log("✅ Equipo guardado localmente con ID:", equipmentId);

          // Guardar imágenes en Base64
          const imageCategories = ["equipment", "plate"];
          let imageCount = 0;

          for (const category of imageCategories) {
            const images = capturedImages[category];
            if (images && images.length > 0) {
              // console.log(`📸 Procesando ${images.length} imágenes de categoría ${category}`);
              
              for (const image of images) {
                if (image.file) {
                  // console.log(`  📸 Guardando imagen ${category}:`, image.file.name);
                  
                  try {
                    const result = await saveImageLocal(image.file, category, equipmentId);
                    
                    if (result.success) {
                      // console.log(`  ✅ Imagen guardada:`, result.data.id);
                      imageCount++;
                    } else {
                      console.error(`  ❌ Error al guardar imagen:`, result.error);
                    }
                  } catch (error) {
                    console.error(`  ❌ Excepción al guardar imagen:`, error);
                  }
                }
              }
            }
          }

          // Guardar PDFs en Base64
          const pdfCategories = ["factura", "pedimento"];
          let pdfCount = 0;

          for (const category of pdfCategories) {
            const pdfs = capturedPDFs[category];
            if (pdfs && pdfs.length > 0) {
              // console.log(`📄 Procesando ${pdfs.length} PDFs de categoría ${category}`);
              
              for (const pdf of pdfs) {
                if (pdf.file) {
                  // console.log(`  📄 Guardando PDF ${category}:`, pdf.file.name);
                  
                  try {
                    const result = await savePDFLocal(pdf.file, category, equipmentId);
                    
                    if (result.success) {
                      // console.log(`  ✅ PDF guardado:`, result.data.id);
                      pdfCount++;
                    } else {
                      console.error(`  ❌ Error al guardar PDF:`, result.error);
                    }
                  } catch (error) {
                    console.error(`  ❌ Excepción al guardar PDF:`, error);
                  }
                }
              }
            }
          }

          // console.log(`✅ Total de imágenes guardadas: ${imageCount}`);
          // console.log(`✅ Total de PDFs guardados: ${pdfCount}`);

          // Agregar equipo a cola de sincronización
          await addToSyncQueue('ADD_EQUIPMENT', {
            ...equipmentData,
            id: equipmentId,
            plantId: selectedPlant.id,
          });

          // Agregar imágenes a cola de sincronización
          for (const category of imageCategories) {
            const images = capturedImages[category];
            if (images && images.length > 0) {
              for (const image of images) {
                if (image.file) {
                  await addToSyncQueue('UPLOAD_IMAGE', {
                    category: category,
                    equipmentId: equipmentId,
                    plantId: selectedPlant.id,
                    fileName: image.file.name,
                  });
                }
              }
            }
          }

          // Agregar PDFs a cola de sincronización
          for (const category of pdfCategories) {
            const pdfs = capturedPDFs[category];
            if (pdfs && pdfs.length > 0) {
              for (const pdf of pdfs) {
                if (pdf.file) {
                  await addToSyncQueue('UPLOAD_PDF', {
                    category: category,
                    equipmentId: equipmentId,
                    plantId: selectedPlant.id,
                    fileName: pdf.file.name,
                  });
                }
              }
            }
          }

          // console.log("✅ Operaciones agregadas a cola de sincronización");

        } else {
          // ACTUALIZAR EQUIPO EXISTENTE LOCAL
          equipmentId = selectedEquipment.id;

          const localResult = await saveEquipmentLocal(
            { ...equipmentData, id: equipmentId },
            selectedPlant.id
          );

          if (!localResult.success) {
            throw new Error(localResult.error);
          }

          await addToSyncQueue('UPDATE_EQUIPMENT', {
            ...equipmentData,
            id: equipmentId,
          });

          // console.log("✅ Equipo actualizado localmente");
        }

        await updateSyncStats();

        setSuccessMessage(
          `⚡️ Equipo "${formData.equipmentName}" guardado localmente. Se sincronizará al conectar.`
        );
        setShowSuccessMessage(true);

        const localEquipment = await getEquipmentByPlantLocal(selectedPlant.id);
        if (localEquipment.success) {
          setEquipment(localEquipment.data);
        }

        setTimeout(() => {
          resetForm();
          setCurrentView("equipment");
        }, 2000);

      } 
      // ============================================
      // 🌐 MODO ONLINE
      // ============================================
      else {
        // console.log("🌐 Modo ONLINE: Guardando en Firebase...");

        if (isNewEquipment) {
          // CREAR NUEVO EQUIPO EN FIREBASE
          const result = await saveEquipment(selectedPlant.id, equipmentData, null);

          if (!result.success) {
            throw new Error(result.error);
          }

          equipmentId = result.id;
          // console.log("✅ Equipo creado con ID:", equipmentId);
        
        } else {
          // ACTUALIZAR EQUIPO EXISTENTE EN FIREBASE
          equipmentId = selectedEquipment.id;
          const updateResult = await saveEquipment(selectedPlant.id, equipmentData, equipmentId);

          if (!updateResult.success) {
            throw new Error(updateResult.error);
          }

          // console.log("✅ Equipo actualizado");
        }

        // SUBIR NUEVAS IMÁGENES
        const imageCategories = ["equipment", "plate"];
        const uploadedUrls = {};
        let totalImagesUploaded = 0;

        for (const category of imageCategories) {
          const images = capturedImages[category];
          
          if (images && images.length > 0) {
            uploadedUrls[category] = [];

            for (let i = 0; i < images.length; i++) {
              const image = images[i];

              if (image.isNew && image.file) {
                // console.log(`📤 Subiendo imagen ${category}...`);

                try {
                  const uploadResult = await uploadImage(
                    image.file,
                    category,
                    selectedPlant.id,
                    equipmentId
                  );

                  if (uploadResult.success) {
                    // console.log(`✅ Imagen ${category} subida`);
                    
                    uploadedUrls[category].push({
                      url: uploadResult.url,
                      path: uploadResult.path,
                      uploadDate: new Date().toISOString(),
                    });
                    totalImagesUploaded++;
                  } else {
                    console.error(`❌ Error al subir imagen ${category}:`, uploadResult.error);
                  }
                } catch (uploadError) {
                  console.error(`❌ Excepción al subir imagen ${category}:`, uploadError);
                }
              } else if (!image.isNew && image.url) {
                // Imagen existente, mantener su URL
                uploadedUrls[category].push({
                  url: image.url,
                  path: image.path,
                  uploadDate: image.uploadDate,
                });
              }
            }
          }
        }

        // console.log(`📊 Total de imágenes subidas: ${totalImagesUploaded}`);

        // SUBIR NUEVOS PDFs
        const pdfCategories = ["factura", "pedimento"];
        const uploadedPDFUrls = {};
        let totalPDFsUploaded = 0;

        for (const category of pdfCategories) {
          const pdfs = capturedPDFs[category];
          
          if (pdfs && pdfs.length > 0) {
            uploadedPDFUrls[category] = [];

            for (let i = 0; i < pdfs.length; i++) {
              const pdf = pdfs[i];

              if (pdf.isNew && pdf.file) {
                // console.log(`📤 Subiendo PDF ${category}...`);

                try {
                  const uploadResult = await uploadPDF(
                    pdf.file,
                    category,
                    selectedPlant.id,
                    equipmentId
                  );

                  if (uploadResult.success) {
                    // console.log(`✅ PDF ${category} subido`);
                    
                    uploadedPDFUrls[category].push({
                      url: uploadResult.url,
                      path: uploadResult.path,
                      fileName: uploadResult.fileName,
                      size: uploadResult.size,
                      uploadDate: new Date().toISOString(),
                    });
                    totalPDFsUploaded++;
                  } else {
                    console.error(`❌ Error al subir PDF ${category}:`, uploadResult.error);
                  }
                } catch (uploadError) {
                  console.error(`❌ Excepción al subir PDF ${category}:`, uploadError);
                }
              } else if (!pdf.isNew && pdf.url) {
                // PDF existente, mantener su URL
                uploadedPDFUrls[category].push({
                  url: pdf.url,
                  path: pdf.path,
                  fileName: pdf.fileName,
                  size: pdf.size,
                  uploadDate: pdf.uploadDate,
                });
              }
            }
          }
        }

        // console.log(`📊 Total de PDFs subidos: ${totalPDFsUploaded}`);

        // ACTUALIZAR EQUIPO CON URLs DE IMÁGENES Y PDFs
        if (totalImagesUploaded > 0 || totalPDFsUploaded > 0) {
          // console.log(`🔄 Actualizando equipo con ${totalImagesUploaded} imágenes y ${totalPDFsUploaded} PDFs...`);

          const updateData = {
            images: uploadedUrls,
            pdfs: uploadedPDFUrls,
            updatedAt: new Date().toISOString(),
          };

          const finalUpdate = await updateEquipment(equipmentId, updateData);

          if (finalUpdate.success) {
            // console.log("✅ URLs de imágenes y PDFs guardadas en Firestore");
          } else {
            console.error("❌ Error al actualizar URLs:", finalUpdate.error);
          }
        }

        // También guardar localmente como caché
        await saveEquipmentLocal(
          { ...equipmentData, id: equipmentId, syncStatus: 'synced' },
          selectedPlant.id
        );

        // MENSAJE DE ÉXITO Y NAVEGACIÓN
        const successMsg = isNewEquipment
          ? `✅ Equipo "${formData.equipmentName}" guardado correctamente${
              totalImagesUploaded > 0
                ? ` con ${totalImagesUploaded} imagen${totalImagesUploaded > 1 ? "es" : ""}`
                : ""
            }${
              totalPDFsUploaded > 0
                ? ` y ${totalPDFsUploaded} PDF${totalPDFsUploaded > 1 ? "s" : ""}`
                : ""
            }`
          : `✅ Equipo "${formData.equipmentName}" actualizado correctamente`;

        setSuccessMessage(successMsg);
        setShowSuccessMessage(true);

        await loadEquipment(selectedPlant.id);

        setTimeout(() => {
          resetForm();
          setCurrentView("equipment");
        }, 2000);
      }

    } catch (error) {
      console.error("❌ Error al guardar equipo:", error);
      alert(`❌ Error al guardar equipo: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // ============================================
  // 🔄 FUNCIÓN AUXILIAR: RESETEAR FORMULARIO
  // ============================================
  
  const resetForm = () => {
    setFormData({
      equipmentName: "",
      locationInPlant: "",
      serialNumber: "",
      model: "",
      manufacturer: "",
      countryOfOrigin: "",
      plateStatus: "OK",
      plateNotes: "",
      origin: "NACIONAL",
      actionsDescription: "",
      observations: "",
      invoiceNumber: "",
      customsNumber: "",
    });
    setCapturedImages({
      equipment: [],
      plate: [],
    });
    setCapturedPDFs({
      factura: [],
      pedimento: [],
    });
    setSelectedEquipment(null);
  };

  // ============================================
  // 📤 RETORNAR ESTADO Y FUNCIONES
  // ============================================
  
  return {
    // Estados
    equipment,
    selectedEquipment,
    formData,
    capturedImages,
    capturedPDFs,
    isLoading,
    
    // Setters
    setEquipment,
    setSelectedEquipment,
    setFormData,
    setCapturedImages,
    setCapturedPDFs,
    
    // Funciones
    loadEquipment,
    handleNewEquipment,
    handleCancelEquipment,
    handleSaveEquipment,
    resetForm,
  };
};

export default useEquipment;
