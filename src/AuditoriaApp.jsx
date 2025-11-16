import React, { useState, useEffect } from "react";

import {
  Camera,
  Upload,
  Search,
  Filter,
  Download,
  Plus,
  ChevronRight,
  CheckCircle,
  AlertCircle,
  Wifi,
  WifiOff,
  Home,
  ClipboardList,
  Database,
  Settings,
  X,
  Save,
  Trash2,
  FileText,
  Loader,
  RefreshCw
} from "lucide-react";

import {
  addPlant,
  getPlants,
  updatePlant,
  deletePlant,
  addEquipment,
  getEquipmentByPlant,
  updateEquipment,
  deleteEquipment,
  saveEquipment,
  uploadImage,
  uploadPDF,           
  deleteImage,
  exportToJSON,
  exportToCSV,
  countEquipmentByPlant,
  updatePlantEquipmentCount,
} from "./firebaseServices";

import {
  initDB,
  savePlantLocal,
  saveEquipmentLocal,
  saveImageLocal,
  savePDFLocal,
  getPlantsLocal,
  getEquipmentByPlantLocal,
  addToSyncQueue,
  getSyncStats,
} from "./localStorageService";

// Ã¢Å“â€¦ CORRECCIÃƒâ€œN 4: Imports actualizados de syncService
import {
  syncAllPendingOperations,
  getSyncStatus,           // Ã¢Å“â€¦ FunciÃƒÂ³n que existe y se usa
  syncOnConnection,        // Ã¢Å“â€¦ FunciÃƒÂ³n que existe y se usa
  startAutoSync,           // Ã¢Å“â€¦ FunciÃƒÂ³n que existe y se usa
  addPDFToSyncQueue,
} from "./syncService";

import {
  deletePedimento,
  deleteFactura,
  deleteEquipmentImage,
  deletePlacaImage,
  deleteEquipmentComplete,
  deletePlantComplete,
  getDeleteInfo,
} from "./deletionService_FIXED";  // Ã¢Å“â€¦ CORRECCIÃƒâ€œN 1: Nombre correcto

import {
  DeleteEquipmentButton,
  DeletePlantButton,
  NukeDatabaseButton
} from "./DeletionButtons";

// Ã¢Å“â€¦ NUEVO: Imports para limpieza de base de datos
import {
  findDuplicates,
  removeDuplicates,
  cleanEverything
} from "./utils/cleanDatabase";

import ImageUploader from "./ImageUploader";
import PDFUploader from "./PDFUploader";

// âœ… AUTENTICACIÃ“N: Imports para Firebase Auth
import { onAuthChange, logout } from "./authService";
import LoginScreen from "./LoginScreen";
import { LogOut, User as UserIcon } from "lucide-react";

const AuditoriaApp = () => {
  // ============================================
  // ðŸ” ESTADOS DE AUTENTICACIÃ“N
  // ============================================
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // ============================================
  // ESTADOS EXISTENTES
  // ============================================
  const [currentView, setCurrentView] = useState("plants");
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [searchTerm, setSearchTerm] = useState("");
  const [equipmentSearchTerm, setEquipmentSearchTerm] = useState("");
  const [plants, setPlants] = useState([]);
  const [equipment, setEquipment] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  const [newPlantData, setNewPlantData] = useState({
    name: "",
    location: "",
    address: "",
    responsiblePerson: "",
    phoneNumber: "",
  });

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
  });

  const [capturedImages, setCapturedImages] = useState({
    equipment: [],
    plate: [],
  });

  const [capturedPDFs, setCapturedPDFs] = useState({
    factura: [],
    pedimento: [],
  });

  const [syncStatus, setSyncStatus] = useState({
    isSyncing: false,
    pendingCount: 0,
    lastSync: null,
  });

  const [showSyncProgress, setShowSyncProgress] = useState(false);
  
  const [syncProgress, setSyncProgress] = useState({
    current: 0,
    total: 0,
    percentage: 0,
    type: '',
  });

  // Monitorear conexiÃƒÂ³n
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Inicializar IndexedDB
  useEffect(() => {
    initDB()
      .then(() => {
        console.log("Ã¢Å“â€¦ IndexedDB inicializada correctamente");
        updateSyncStats();
      })
      .catch((error) => {
        console.error("Ã¢ÂÅ’ Error al inicializar IndexedDB:", error);
      });
  }, []);

  // ============================================
  // ðŸ” OBSERVADOR DE AUTENTICACIÃ“N
  // ============================================
  useEffect(() => {
    console.log('ðŸ” Configurando observador de autenticaciÃ³n...');
    
    // Observar cambios en el estado de autenticaciÃ³n
    const unsubscribe = onAuthChange((authState) => {
      console.log('ðŸ” Estado de auth cambiÃ³:', authState);
      
      setIsAuthenticated(authState.isAuthenticated);
      setUser(authState.user);
      setIsAuthLoading(false);
      
      if (authState.isAuthenticated) {
        console.log('âœ… Usuario autenticado:', authState.user.email || authState.user.displayName);
      } else {
        console.log('â„¹ï¸ No hay usuario autenticado');
      }
    });
    
    // Cleanup: cancelar suscripciÃ³n al desmontar
    return () => {
      console.log('ðŸ” Cancelando observador de autenticaciÃ³n');
      unsubscribe();
    };
  }, []);


  // Configurar sincronizaciÃƒÂ³n automÃƒÂ¡tica
  useEffect(() => {
    const cleanupSyncOnConnection = syncOnConnection((progress) => {
      console.log("Ã°Å¸â€œÅ  Progreso de sincronizaciÃƒÂ³n:", progress);
      
      if (progress.total > 0) {
        setSyncProgress(progress);
        setShowSyncProgress(true);
        setSyncStatus(prev => ({ ...prev, isSyncing: true }));
      }
    });

    const syncInterval = startAutoSync(5, (progress) => {
      console.log("Ã°Å¸â€œÅ  Progreso de sincronizaciÃƒÂ³n:", progress);
      
      if (progress.total > 0) {
        setSyncProgress(progress);
        setShowSyncProgress(true);
        setSyncStatus(prev => ({ ...prev, isSyncing: true }));
      }
    });

    return () => {
      cleanupSyncOnConnection();
      if (syncInterval) clearInterval(syncInterval);
    };
  }, []);

  // Cerrar modal de sincronizaciÃƒÂ³n
  useEffect(() => {
    if ((syncProgress.percentage === 100 || syncProgress.completed) && showSyncProgress) {
      const timer = setTimeout(() => {
        console.log("Ã¢Å“â€¦ Cerrando modal de sincronizaciÃƒÂ³n");
        setShowSyncProgress(false);
        setSyncStatus(prev => ({ ...prev, isSyncing: false }));
        
        updateSyncStats();
        loadPlants();
        
        setSyncStatus(prev => ({
          ...prev,
          lastSync: new Date().toISOString(),
        }));
        
        setSyncProgress({
          current: 0,
          total: 0,
          percentage: 0,
          type: '',
        });
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [syncProgress.percentage, syncProgress.completed, showSyncProgress]);

  useEffect(() => {
    if (!isOffline) {
      updateSyncStats();
    }
  }, [isOffline]);

  useEffect(() => {
    loadPlants();
  }, []);

  useEffect(() => {
    if (showSuccessMessage) {
      const timer = setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessMessage]);

  const loadPlants = async () => {
    try {
      if (isLoading) {
        console.log("Ã¢ÂÂ­Ã¯Â¸Â Ya se estÃƒÂ¡n cargando las plantas, omitiendo llamada duplicada");
        return;
      }
      
      setIsLoading(true);

      if (isOffline) {
        console.log("Ã°Å¸â€œÂ´ Modo OFFLINE: Cargando plantas desde IndexedDB...");
        
        const localResult = await getPlantsLocal();
        
        if (localResult.success) {
          const localPlants = localResult.data;
          console.log(`Ã¢Å“â€¦ ${localPlants.length} plantas cargadas desde IndexedDB`);
          setPlants(localPlants);
        } else {
          console.error("Ã¢ÂÅ’ Error al cargar plantas locales:", localResult.error);
          setPlants([]);
        }
        
      } else {
        console.log("Ã°Å¸Å’Â Modo ONLINE: Cargando plantas...");
        
        const result = await getPlants();
        let firebasePlants = [];
        
        if (result.success) {
          firebasePlants = result.data;
          console.log(`Ã¢Å“â€¦ ${firebasePlants.length} plantas cargadas desde Firebase`);
          
          console.log("Ã°Å¸â€œÅ  Contando equipos de cada planta...");
          for (const plant of firebasePlants) {
            const equipResult = await getEquipmentByPlant(plant.id);
            if (equipResult.success) {
              plant.equipmentCount = equipResult.data.length;
              console.log(`  Ã¢Å“â€¦ Planta "${plant.name}": ${plant.equipmentCount} equipos`);
            } else {
              plant.equipmentCount = 0;
            }
          }
        }

        const localResult = await getPlantsLocal();
        let localPlants = [];
        
        if (localResult.success) {
          localPlants = localResult.data;
          console.log(`Ã¢Å“â€¦ ${localPlants.length} plantas en IndexedDB`);
          
          for (const plant of localPlants) {
            const equipResult = await getEquipmentByPlantLocal(plant.id);
            if (equipResult.success) {
              plant.equipmentCount = equipResult.data.length;
            } else {
              plant.equipmentCount = 0;
            }
          }
        }

        const firebaseIds = new Set(firebasePlants.map(p => p.id));
        
        const uniqueLocalPlants = localPlants.filter(plant => {
          if (plant.id.startsWith('local_')) {
            return true;
          }
          return !firebaseIds.has(plant.id);
        });

        console.log(`Ã°Å¸â€œÅ  Plantas ÃƒÂºnicas locales (no sincronizadas): ${uniqueLocalPlants.length}`);

        const allPlants = [...firebasePlants, ...uniqueLocalPlants];
        
        console.log(`Ã¢Å“â€¦ Total de plantas a mostrar: ${allPlants.length}`);
        setPlants(allPlants);
      }

    } catch (error) {
      console.error("Ã¢ÂÅ’ Error al cargar plantas:", error);
      setPlants([]);
    } finally {
      setIsLoading(false);
    }
  };

const loadEquipment = async (plantId) => {
  console.log("\nÃ°Å¸â€â€ž RECARGANDO EQUIPOS de planta:", plantId);
  setIsLoading(true);
  
  try {
    const result = await getEquipmentByPlant(plantId);
    
    if (result.success) {
      // Eliminar duplicados basÃƒÂ¡ndose en el ID
      const uniqueEquipment = result.data.reduce((acc, current) => {
        const existingIndex = acc.findIndex(item => item.id === current.id);
        
        if (existingIndex === -1) {
          // No existe, agregarlo
          acc.push(current);
        } else {
          // Ya existe, mantener el que tenga syncStatus 'synced' o el mÃƒÂ¡s reciente
          const existing = acc[existingIndex];
          
          if (current.syncStatus === 'synced' && existing.syncStatus !== 'synced') {
            // Reemplazar con la versiÃƒÂ³n sincronizada
            acc[existingIndex] = current;
          } else if (current.updatedAt > existing.updatedAt) {
            // Reemplazar con la versiÃƒÂ³n mÃƒÂ¡s reciente
            acc[existingIndex] = current;
          }
        }
        
        return acc;
      }, []);
      
      console.log("Ã¢Å“â€¦ Equipos cargados:", uniqueEquipment.length);
      console.log(`Ã°Å¸â€œÅ  Duplicados eliminados: ${result.data.length - uniqueEquipment.length}`);
      
      setEquipment(uniqueEquipment);
    } else {
      console.error("Ã¢ÂÅ’ Error al cargar equipos:", result.error);
      alert("Ã¢ÂÅ’ Error al cargar equipos: " + result.error);
      setEquipment([]);
    }
  } catch (error) {
    console.error("Ã¢ÂÅ’ ExcepciÃƒÂ³n al cargar equipos:", error);
    alert("Ã¢ÂÅ’ Error inesperado al cargar equipos: " + error.message);
    setEquipment([]);
  } finally {
    setIsLoading(false);
  }
};

  const handleNewEquipment = () => {
    console.log("\nÃ¢Å¾â€¢ ABRIENDO FORMULARIO DE NUEVO EQUIPO");
    
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
    
    console.log("Ã¢Å“â€¦ Formulario limpio y listo para nuevo equipo");
  };

  const handleCancelEquipment = () => {
    console.log("\nÃ¢ÂÅ’ CANCELANDO EDICIÃƒâ€œN/CREACIÃƒâ€œN DE EQUIPO");
    
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
    
    console.log("Ã¢Å“â€¦ Formulario limpiado, volviendo a lista de equipos");
  };

  const updateSyncStats = async () => {
    const status = await getSyncStatus();
    if (status.success) {
      setSyncStatus(prev => ({
        ...prev,
        pendingCount: status.pending,
      }));
    }
  };

  const handleSavePlant = async () => {
    if (!newPlantData.name || !newPlantData.location) {
      alert(
        "Ã¢Å¡Â Ã¯Â¸Â Por favor completa los campos obligatorios:\n- Nombre de la Planta\n- Ciudad y Estado"
      );
      return;
    }

    setIsLoading(true);

    try {
      const plantData = {
        ...newPlantData,
        createdAt: new Date().toISOString(),
      };

      if (isOffline) {
        console.log("Ã°Å¸â€œÂ´ Modo OFFLINE: Guardando planta localmente...");

        const localResult = await savePlantLocal(plantData);

        if (!localResult.success) {
          throw new Error(localResult.error);
        }

        await addToSyncQueue('ADD_PLANT', {
          ...plantData,
          id: localResult.data.id,
        });

        await updateSyncStats();

        setSuccessMessage(
          `Ã¢Å¡Â Ã¯Â¸Â Planta "${newPlantData.name}" guardada localmente. Se sincronizarÃƒÂ¡ al conectar.`
        );
        setShowSuccessMessage(true);

        await loadPlants();

        setTimeout(() => {
          setCurrentView("plants");
          setNewPlantData({
            name: "",
            location: "",
            address: "",
            responsiblePerson: "",
            phoneNumber: "",
          });
        }, 2000);

      } else {
        console.log("Ã°Å¸Å’Â Modo ONLINE: Guardando planta en Firebase...");

        const result = await addPlant(plantData);

        if (result.success) {
          await savePlantLocal({
            ...plantData,
            id: result.id,
            syncStatus: 'synced',
          });

          setSuccessMessage(
            `Ã¢Å“â€œ Planta "${newPlantData.name}" guardada y sincronizada con Firebase`
          );
          setShowSuccessMessage(true);

          await loadPlants();

          setTimeout(() => {
            setCurrentView("plants");
            setNewPlantData({
              name: "",
              location: "",
              address: "",
              responsiblePerson: "",
              phoneNumber: "",
            });
          }, 2000);
        } else {
          throw new Error(result.error);
        }
      }

    } catch (error) {
      console.error("Ã¢ÂÅ’ Error al guardar planta:", error);
      alert("Ã¢ÂÅ’ Error al guardar planta: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveEquipment = async () => {
    if (
      !formData.equipmentName ||
      !formData.locationInPlant ||
      !formData.serialNumber
    ) {
      alert(
        "Ã¢Å¡Â Ã¯Â¸Â Por favor completa los campos obligatorios:\n- Nombre del Equipo\n- LocalizaciÃƒÂ³n en Planta\n- NÃƒÂºmero de Serie"
      );
      return;
    }

    setIsLoading(true);

    try {
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
        capturedBy: "Usuario Actual",
        createdAt: new Date().toISOString(),
      };

      let equipmentId;
      let isNewEquipment = !selectedEquipment;

      if (isOffline) {
        console.log("Ã°Å¸â€œÂ´ Modo OFFLINE: Guardando equipo localmente...");

        if (isNewEquipment) {
          const localResult = await saveEquipmentLocal(
            equipmentData,
            selectedPlant.id
          );

          if (!localResult.success) {
            throw new Error(localResult.error);
          }

          equipmentId = localResult.data.id;
          console.log("Ã¢Å“â€¦ Equipo guardado localmente con ID:", equipmentId);

          // Guardar imÃƒÂ¡genes en Base64
          const imageCategories = ["equipment", "plate"];
          let imageCount = 0;

          for (const category of imageCategories) {
            const images = capturedImages[category];
            if (images && images.length > 0) {
              console.log(`Ã°Å¸â€œÂ¸ Procesando ${images.length} imÃƒÂ¡genes de categorÃƒÂ­a ${category}`);
              
              for (const image of images) {
                if (image.file) {
                  console.log(`  Ã°Å¸â€œÂ¸ Guardando imagen ${category}:`, image.file.name);
                  
                  try {
                    const result = await saveImageLocal(image.file, category, equipmentId);
                    
                    if (result.success) {
                      console.log(`  Ã¢Å“â€¦ Imagen guardada:`, result.data.id);
                      imageCount++;
                    } else {
                      console.error(`  Ã¢ÂÅ’ Error al guardar imagen:`, result.error);
                    }
                  } catch (error) {
                    console.error(`  Ã¢ÂÅ’ ExcepciÃƒÂ³n al guardar imagen:`, error);
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
              console.log(`Ã°Å¸â€œâ€ž Procesando ${pdfs.length} PDFs de categorÃƒÂ­a ${category}`);
              
              for (const pdf of pdfs) {
                if (pdf.file) {
                  console.log(`  Ã°Å¸â€œâ€ž Guardando PDF ${category}:`, pdf.file.name);
                  
                  try {
                    const result = await savePDFLocal(pdf.file, category, equipmentId);
                    
                    if (result.success) {
                      console.log(`  Ã¢Å“â€¦ PDF guardado:`, result.data.id);
                      pdfCount++;
                    } else {
                      console.error(`  Ã¢ÂÅ’ Error al guardar PDF:`, result.error);
                    }
                  } catch (error) {
                    console.error(`  Ã¢ÂÅ’ ExcepciÃƒÂ³n al guardar PDF:`, error);
                  }
                }
              }
            }
          }

          console.log(`Ã¢Å“â€¦ Total de imÃƒÂ¡genes guardadas: ${imageCount}`);
          console.log(`Ã¢Å“â€¦ Total de PDFs guardados: ${pdfCount}`);

          // Agregar equipo a cola de sincronizaciÃƒÂ³n
          await addToSyncQueue('ADD_EQUIPMENT', {
            ...equipmentData,
            id: equipmentId,
            plantId: selectedPlant.id,
          });

          // Agregar imÃƒÂ¡genes a cola de sincronizaciÃƒÂ³n
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

          // Agregar PDFs a cola de sincronizaciÃƒÂ³n
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

          console.log("Ã¢Å“â€¦ Operaciones agregadas a cola de sincronizaciÃƒÂ³n");

        } else {
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

          console.log("Ã¢Å“â€¦ Equipo actualizado localmente");
        }

        await updateSyncStats();

        setSuccessMessage(
          `Ã¢Å¡Â Ã¯Â¸Â Equipo "${formData.equipmentName}" guardado localmente. Se sincronizarÃƒÂ¡ al conectar.`
        );
        setShowSuccessMessage(true);

        const localEquipment = await getEquipmentByPlantLocal(selectedPlant.id);
        if (localEquipment.success) {
          setEquipment(localEquipment.data);
        }

        setTimeout(() => {
          setCurrentView("equipment");
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
        }, 2000);

      } else {
        // MODO ONLINE: Guardar en Firebase
        console.log("Ã°Å¸Å’Â Modo ONLINE: Guardando en Firebase...");

        if (isNewEquipment) {
          const result = await saveEquipment(selectedPlant.id, equipmentData, null);

          if (!result.success) {
            throw new Error(result.error);
          }

          equipmentId = result.id;
          console.log("Ã¢Å“â€¦ Equipo creado con ID:", equipmentId);
        
        } else {
          equipmentId = selectedEquipment.id;
          const updateResult = await saveEquipment(selectedPlant.id, equipmentData, equipmentId);

          if (!updateResult.success) {
            throw new Error(updateResult.error);
          }

          console.log("Ã¢Å“â€¦ Equipo actualizado");
        }

        // SUBIR NUEVAS IMÃƒÂGENES
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
                console.log(`Ã°Å¸â€œÂ¤ Subiendo imagen ${category}...`);

                try {
                  const uploadResult = await uploadImage(
                    image.file,
                    category,
                    selectedPlant.id,
                    equipmentId
                  );

                  if (uploadResult.success) {
                    console.log(`Ã¢Å“â€¦ Imagen ${category} subida`);
                    
                    uploadedUrls[category].push({
                      url: uploadResult.url,
                      path: uploadResult.path,
                      uploadDate: new Date().toISOString(),
                    });
                    totalImagesUploaded++;
                  } else {
                    console.error(`Ã¢ÂÅ’ Error al subir imagen ${category}:`, uploadResult.error);
                  }
                } catch (uploadError) {
                  console.error(`Ã¢ÂÅ’ ExcepciÃƒÂ³n al subir imagen ${category}:`, uploadError);
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

        console.log(`Ã°Å¸â€œÅ  Total de imÃƒÂ¡genes subidas: ${totalImagesUploaded}`);

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
                console.log(`Ã°Å¸â€œÂ¤ Subiendo PDF ${category}...`);

                try {
                  const uploadResult = await uploadPDF(
                    pdf.file,
                    category,
                    selectedPlant.id,
                    equipmentId
                  );

                  if (uploadResult.success) {
                    console.log(`Ã¢Å“â€¦ PDF ${category} subido`);
                    
                    uploadedPDFUrls[category].push({
                      url: uploadResult.url,
                      path: uploadResult.path,
                      fileName: uploadResult.fileName,
                      size: uploadResult.size,
                      uploadDate: new Date().toISOString(),
                    });
                    totalPDFsUploaded++;
                  } else {
                    console.error(`Ã¢ÂÅ’ Error al subir PDF ${category}:`, uploadResult.error);
                  }
                } catch (uploadError) {
                  console.error(`Ã¢ÂÅ’ ExcepciÃƒÂ³n al subir PDF ${category}:`, uploadError);
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

        console.log(`Ã°Å¸â€œÅ  Total de PDFs subidos: ${totalPDFsUploaded}`);

        // ACTUALIZAR EQUIPO CON URLs DE IMÃƒÂGENES Y PDFs
        if (totalImagesUploaded > 0 || totalPDFsUploaded > 0) {
          console.log(`Ã°Å¸â€œÂ Actualizando equipo con ${totalImagesUploaded} imÃƒÂ¡genes y ${totalPDFsUploaded} PDFs...`);

          const updateData = {
            images: uploadedUrls,
            pdfs: uploadedPDFUrls,
            updatedAt: new Date().toISOString(),
          };

          const finalUpdate = await updateEquipment(equipmentId, updateData);

          if (finalUpdate.success) {
            console.log("Ã¢Å“â€¦ URLs de imÃƒÂ¡genes y PDFs guardadas en Firestore");
          } else {
            console.error("Ã¢ÂÅ’ Error al actualizar URLs:", finalUpdate.error);
          }
        }

        // TambiÃƒÂ©n guardar localmente como cachÃƒÂ©
        await saveEquipmentLocal(
          { ...equipmentData, id: equipmentId, syncStatus: 'synced' },
          selectedPlant.id
        );

        // MENSAJE DE Ãƒâ€°XITO Y NAVEGACIÃƒâ€œN
        const successMsg = isNewEquipment
          ? `Ã¢Å“â€œ Equipo "${formData.equipmentName}" guardado correctamente${
              totalImagesUploaded > 0
                ? ` con ${totalImagesUploaded} imagen${totalImagesUploaded > 1 ? "es" : ""}`
                : ""
            }${
              totalPDFsUploaded > 0
                ? ` y ${totalPDFsUploaded} PDF${totalPDFsUploaded > 1 ? "s" : ""}`
                : ""
            }`
          : `Ã¢Å“â€œ Equipo "${formData.equipmentName}" actualizado correctamente`;

        setSuccessMessage(successMsg);
        setShowSuccessMessage(true);

        await loadEquipment(selectedPlant.id);

        setTimeout(() => {
          setCurrentView("equipment");
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
        }, 2000);
      }

    } catch (error) {
      console.error("Ã¢ÂÅ’ Error al guardar equipo:", error);
      alert(`Ã¢ÂÅ’ Error al guardar equipo: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const syncNow = async () => {
    if (isOffline) {
      alert("Ã¢Å¡Â Ã¯Â¸Â No hay conexiÃƒÂ³n. ConÃƒÂ©ctate a internet para sincronizar.");
      return;
    }

    if (syncStatus.pendingCount === 0) {
      alert("Ã¢Å“â€¦ No hay operaciones pendientes de sincronizar.");
      return;
    }

    console.log("Ã°Å¸â€â€ž Iniciando sincronizaciÃƒÂ³n manual...");

    setShowSyncProgress(true);
    setSyncStatus(prev => ({ ...prev, isSyncing: true }));

    try {
      const result = await syncAllPendingOperations((progress) => {
        setSyncProgress(progress);
      });

      if (result.success) {
        setSuccessMessage(
          `Ã¢Å“â€œ SincronizaciÃƒÂ³n completada: ${result.synced} ${result.synced === 1 ? 'registro' : 'registros'}`
        );
        setShowSuccessMessage(true);

        await updateSyncStats();

        await loadPlants();
        if (selectedPlant) {
          await loadEquipment(selectedPlant.id);
        }

        setSyncStatus(prev => ({
          ...prev,
          lastSync: new Date().toISOString(),
        }));

      } else {
        alert("Ã¢ÂÅ’ Error en la sincronizaciÃƒÂ³n: " + result.error);
      }

    } catch (error) {
      console.error("Ã¢ÂÅ’ Error al sincronizar:", error);
      alert("Ã¢ÂÅ’ Error al sincronizar: " + error.message);
    } finally {
      setShowSyncProgress(false);
      setSyncStatus(prev => ({ ...prev, isSyncing: false }));
    }
  };

  const handleImageCapture = async (type) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.capture = "environment";

    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        alert(
          `Ã°Å¸â€œÂ¸ Imagen capturada: ${file.name}\n\nEn la versiÃƒÂ³n completa, esto subirÃƒÂ¡ la imagen a Firebase Storage y la comprimirÃƒÂ¡ automÃƒÂ¡ticamente.`
        );
      }
    };

    input.click();
  };

  const handleExport = async (format) => {
    setIsLoading(true);

    if (format === "json") {
      const result = await exportToJSON();
      if (result.success) {
        alert("Ã¢Å“â€¦ Datos exportados a JSON correctamente");
      } else {
        alert("Ã¢ÂÅ’ Error al exportar: " + result.error);
      }
    } else if (format === "excel" || format === "csv") {
      const result = await exportToCSV();
      if (result.success) {
        alert("Ã¢Å“â€¦ Datos exportados a CSV/Excel correctamente");
      } else {
        alert("Ã¢ÂÅ’ Error al exportar: " + result.error);
      }
    } else {
      alert(`Ã°Å¸â€œÂ¥ ExportaciÃƒÂ³n en formato ${format.toUpperCase()} en desarrollo`);
    }

    setIsLoading(false);
  };

  const filteredPlants = plants
    .filter((plant, index, self) => 
      index === self.findIndex((p) => p.id === plant.id)
    )
    .filter((plant) =>
      plant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      plant.location.toLowerCase().includes(searchTerm.toLowerCase())
    );

  
  // ============================================
  // ðŸšª FUNCIÃ“N DE LOGOUT
  // ============================================
  const handleLogout = async () => {
    if (window.confirm('Â¿Cerrar sesiÃ³n?')) {
      console.log('ðŸšª Cerrando sesiÃ³n...');
      
      const result = await logout();
      
      if (result.success) {
        console.log('âœ… SesiÃ³n cerrada exitosamente');
        // El observador de auth se encargarÃ¡ de actualizar el estado
      } else {
        console.error('âŒ Error al cerrar sesiÃ³n:', result.error);
        alert('Error al cerrar sesiÃ³n: ' + result.error);
      }
    }
  };

  const renderHeader = () => (
    <div className="bg-blue-600 text-white p-4 shadow-lg sticky top-0 z-20">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <Database className="w-6 h-6" />
          <h1 className="text-xl font-bold">Auditoría Industrial</h1>
        </div>
        
        <div className="flex items-center gap-3">
          {isOffline ? (
            <div className="flex items-center gap-1 bg-red-500 px-2 py-1 rounded text-xs">
              <WifiOff className="w-4 h-4" />
              <span>Offline</span>
              {syncStatus.pendingCount > 0 && (
                <span className="ml-1 bg-red-700 px-1.5 py-0.5 rounded-full text-xs font-bold">
                  {syncStatus.pendingCount}
                </span>
              )}
            </div>
          ) : syncStatus.isSyncing ? (
            <div className="flex items-center gap-1 bg-blue-500 px-2 py-1 rounded text-xs">
              <Loader className="w-4 h-4 animate-spin" />
              <span>Sincronizando</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 bg-green-500 px-2 py-1 rounded text-xs">
              <Wifi className="w-4 h-4" />
              <span>Online</span>
            </div>
          )}
          {isLoading && <Loader className="w-5 h-5 animate-spin" />}
        </div>
      </div>

      {/* Usuario y botón Salir */}
      <div className="flex justify-between items-center mt-2 pt-2 border-t border-blue-500">
        <div className="flex items-center gap-2 text-sm">
          <UserIcon className="w-4 h-4" />
          <span className="font-medium">
            {user?.displayName || user?.email || 'Usuario'}
          </span>
        </div>
        
        <button
          onClick={async () => {
            try {
              await logout();
              console.log('âœ… Sesiï¿½n cerrada exitosamente');
            } catch (error) {
              console.error('â�Œ Error al cerrar sesiï¿½n:', error);
            }
          }}
          className="flex items-center gap-1 bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-xs font-medium transition-colors"
        >
          <LogOut className="w-3 h-3" />
          <span>Salir</span>
        </button>
      </div>

      {currentView === "equipment" && selectedPlant && (
        <div className="text-sm opacity-90 flex items-center gap-2">
          <button
            onClick={() => setCurrentView("plants")}
            className="hover:underline"
          >
            Plantas
          </button>
          <ChevronRight className="w-4 h-4" />
          <span>{selectedPlant.name}</span>
        </div>
      )}

      {currentView === "newPlant" && (
        <div className="text-sm opacity-90 flex items-center gap-2">
          <button
            onClick={() => setCurrentView("plants")}
            className="hover:underline"
          >
            Plantas
          </button>
          <ChevronRight className="w-4 h-4" />
          <span>Nueva Planta</span>
        </div>
      )}

      {currentView === "form" && (
        <div className="text-sm opacity-90 flex items-center gap-2">
          <button
            onClick={() => setCurrentView("plants")}
            className="hover:underline"
          >
            Plantas
          </button>
          <ChevronRight className="w-4 h-4" />
          <button
            onClick={() => setCurrentView("equipment")}
            className="hover:underline"
          >
            {selectedPlant?.name}
          </button>
          <ChevronRight className="w-4 h-4" />
          <span>Captura de Equipo</span>
        </div>
      )}
    </div>
  );

  const renderBottomNav = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-10">
      <div className="flex justify-around p-2">
        <button
          onClick={() => setCurrentView("plants")}
          className={`flex flex-col items-center p-2 rounded transition-colors ${
            currentView === "plants" ||
            currentView === "equipment" ||
            currentView === "form" ||
            currentView === "newPlant"
              ? "text-blue-600"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          <Home className="w-6 h-6" />
          <span className="text-xs mt-1">Plantas</span>
        </button>
        <button
          onClick={() => setCurrentView("reports")}
          className={`flex flex-col items-center p-2 rounded transition-colors ${
            currentView === "reports"
              ? "text-blue-600"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          <ClipboardList className="w-6 h-6" />
          <span className="text-xs mt-1">Reportes</span>
        </button>
        <button
          onClick={() => alert("Ã°Å¸â€Â Panel de filtros avanzados en desarrollo")}
          className="flex flex-col items-center p-2 rounded text-gray-600 hover:text-gray-800 transition-colors"
        >
          <Filter className="w-6 h-6" />
          <span className="text-xs mt-1">Filtros</span>
        </button>
      </div>
    </div>
  );

  const renderPlantsList = () => (
    <div className="p-4 pb-24 bg-gray-50 min-h-screen">
      <div className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar plantas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={() => setCurrentView("newPlant")}
          className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 px-4 shadow-md"
        >
          <Plus className="w-6 h-6" />
          <span className="text-sm font-medium">Planta</span>
        </button>
      </div>

      {showSuccessMessage && (
        <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPlants.map((plant) => (
            <div
              key={plant.id}
              onClick={() => {
                setSelectedPlant(plant);
                loadEquipment(plant.id);
                setCurrentView("equipment");
              }}
              className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:shadow-lg transition-all cursor-pointer hover:scale-[1.02]"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <h3 className="font-bold text-lg text-gray-800">
                    {plant.name}
                  </h3>
                  <p className="text-sm text-gray-600">{plant.location}</p>
                </div>
                <ChevronRight className="w-6 h-6 text-gray-400" />
              </div>
              <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-blue-600" />
                  <span className="text-sm text-gray-700">
                    {plant.equipmentCount || 0} equipos
                  </span>
                </div>
                <span className="text-xs text-gray-500">
                  Última auditorí­a: {plant.lastAudit}
                </span>
              </div>
              
              {/* Ã¢Å“â€¦ CORRECCIÓN 3: onClick stopPropagation agregado */}
              <div 
                className="mt-3 pt-3 border-t border-gray-200"
                onClick={(e) => e.stopPropagation()}
              >
                <DeletePlantButton
                  plantId={plant.id}
                  plantName={plant.name}
                  isOnline={!isOffline}
                  onSuccess={(result) => {
                    console.log("Ã¢Å“â€¦ Planta eliminada:", result);
                    loadPlants();
                  }}
                  onError={(error) => console.error("Ã¢ÂÅ’ Error:", error)}
                  className="w-full"
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && filteredPlants.length === 0 && (
        <div className="text-center py-12">
          <Database className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No se encontraron plantas</p>
          <button
            onClick={() => setCurrentView("newPlant")}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Agregar primera planta
          </button>
        </div>
      )}
    </div>
  );

  const renderNewPlantForm = () => (
    <div className="p-4 pb-24 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <h2 className="text-lg font-bold text-gray-800 mb-4">
          Nueva Planta Industrial
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de la Planta <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newPlantData.name}
              onChange={(e) =>
                setNewPlantData({ ...newPlantData, name: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ej: Planta Norte"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ciudad y Estado <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newPlantData.location}
              onChange={(e) =>
                setNewPlantData({ ...newPlantData, location: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ej: Monterrey, NL"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dirección Completa
            </label>
            <textarea
              value={newPlantData.address}
              onChange={(e) =>
                setNewPlantData({ ...newPlantData, address: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows="2"
              placeholder="Calle, nÃƒÂºmero, colonia, cÃƒÂ³digo postal"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Responsable de Planta
            </label>
            <input
              type="text"
              value={newPlantData.responsiblePerson}
              onChange={(e) =>
                setNewPlantData({
                  ...newPlantData,
                  responsiblePerson: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Nombre del responsable"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono de Contacto
            </label>
            <input
              type="tel"
              value={newPlantData.phoneNumber}
              onChange={(e) =>
                setNewPlantData({
                  ...newPlantData,
                  phoneNumber: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="(999) 999-9999"
              disabled={isLoading}
            />
          </div>
        </div>
      </div>

      {showSuccessMessage && (
        <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      <div className="flex gap-2 mb-4">
        <button
          onClick={handleSavePlant}
          disabled={isLoading}
          className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
        >
          {isLoading ? (
            <Loader className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          {isLoading ? "Guardando..." : "Guardar Planta"}
        </button>
        <button
          onClick={() => {
            setCurrentView("plants");
            setNewPlantData({
              name: "",
              location: "",
              address: "",
              responsiblePerson: "",
              phoneNumber: "",
            });
          }}
          disabled={isLoading}
          className="px-6 bg-gray-500 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors shadow-md disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
        <span className="font-medium">Ã¢â€žÂ¹Ã¯Â¸Â InformaciÃƒÂ³n:</span> Los campos marcados
        con <span className="text-red-500">*</span> son obligatorios
      </div>
    </div>
  );

  const renderEquipmentList = () => (
    <div className="p-4 pb-24 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <h2 className="font-bold text-lg text-gray-800">
          {selectedPlant?.name}
        </h2>
        <p className="text-sm text-gray-600">{selectedPlant?.location}</p>
        <div className="mt-2 pt-2 border-t border-gray-100 flex items-center gap-4 text-sm">
          <span className="text-gray-700">
            <strong>{equipment.length}</strong> equipos
          </span>
          {selectedPlant?.responsiblePerson && (
            <span className="text-gray-600">
              Responsable: {selectedPlant.responsiblePerson}
            </span>
          )}
        </div>
      </div>

      <div className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar equipos..."
            value={equipmentSearchTerm}
            onChange={(e) => setEquipmentSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={handleNewEquipment}
          className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors shadow-md"
          title="Agregar nuevo equipo"
        >
          <Plus className="w-6 h-6" />
        </button>
      </div>

      {showSuccessMessage && (
        <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="space-y-3">
          {equipment.length > 0 ? (
            equipment
              .filter((equip) => {
                const searchLower = equipmentSearchTerm.toLowerCase();
                return (
                  equip.name.toLowerCase().includes(searchLower) ||
                  equip.location.toLowerCase().includes(searchLower) ||
                  equip.serialNumber.toLowerCase().includes(searchLower) ||
                  (equip.manufacturer && equip.manufacturer.toLowerCase().includes(searchLower))
                );
              })
              .map((equip) => (
              <div
                key={equip.id}
                onClick={async () => {
                  setSelectedEquipment(equip);
                  setFormData({
                    equipmentName: equip.name,
                    locationInPlant: equip.location,
                    serialNumber: equip.serialNumber,
                    model: equip.model || "",
                    manufacturer: equip.manufacturer || "",
                    countryOfOrigin: equip.countryOfOrigin || "",
                    plateStatus: equip.plateStatus,
                    plateNotes: equip.plateNotes || "",
                    origin: equip.origin,
                    actionsDescription: equip.actionsDescription || "",
                    observations: equip.observations || "",
                  });

                  console.log("\nÃ°Å¸â€Â CARGANDO EQUIPO PARA EDITAR:");
                  console.log("  Equipo ID:", equip.id);
                  console.log("  Equipo completo:", equip);
                  console.log("  Ã‚Â¿Tiene campo images?:", !!equip.images);
                  
                  if (equip.images) {
                    console.log("  Ã¢Å“â€¦ Equipo tiene imÃƒÂ¡genes:", equip.images);
                    
                    const existingImages = {
                      equipment: [],
                      plate: [],
                    };

                    Object.keys(equip.images).forEach((category) => {
                      console.log(`  Ã°Å¸â€œâ€š Procesando categorÃƒÂ­a: ${category}`);
                      console.log(`     Datos:`, equip.images[category]);
                      console.log(`     Es array:`, Array.isArray(equip.images[category]));
                      
                      if (
                        equip.images[category] &&
                        Array.isArray(equip.images[category])
                      ) {
                        existingImages[category] = equip.images[category].map(
                          (img) => {
                            console.log(`       Ã°Å¸â€œÂ· Imagen en ${category}:`, img);
                            return {
                              url: img.url,
                              path: img.path,
                              uploadDate: img.uploadDate,
                              isNew: false,
                            };
                          }
                        );
                        console.log(`     Ã¢Å“â€¦ ${category}: ${existingImages[category].length} imÃƒÂ¡genes cargadas`);
                      }
                    });

                    console.log("  Ã°Å¸â€œÅ  Resumen de imÃƒÂ¡genes cargadas:");
                    Object.keys(existingImages).forEach(cat => {
                      console.log(`     ${cat}: ${existingImages[cat].length} imÃƒÂ¡genes`);
                    });

                    setCapturedImages(existingImages);
                    console.log("  Ã¢Å“â€¦ capturedImages actualizado con imÃƒÂ¡genes existentes");
                  } else {
                    console.log("  Ã¢Å¡Â Ã¯Â¸Â Equipo NO tiene campo images");
                    setCapturedImages({
                      equipment: [],
                      plate: [],
                    });
                    console.log("  Ã¢â€žÂ¹Ã¯Â¸Â capturedImages reiniciado vacÃƒÂ­o");
                  }

                  setCapturedPDFs({
                    factura: [],
                    pedimento: [],
                  });

                  setCurrentView("form");
                }}
                className="bg-white rounded-lg shadow-md p-4 border border-gray-200 hover:shadow-lg transition-all cursor-pointer hover:scale-[1.02]"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">
                      {equip.name}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {equip.location}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      S/N: {equip.serialNumber}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {equip.status === "complete" ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertCircle className="w-5 h-5 text-orange-500" />
                    )}
                    {equip.syncStatus === "synced" ? (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                        Sincronizado
                      </span>
                    ) : (
                      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded">
                        Pendiente
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))
          ) : equipmentSearchTerm ? (
            <div className="text-center py-12">
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">
                No se encontraron equipos que coincidan con "{equipmentSearchTerm}"
              </p>
              <button
                onClick={() => setEquipmentSearchTerm("")}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Limpiar bÃƒÂºsqueda
              </button>
            </div>
          ) : (
            <div className="text-center py-12">
              <Database className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">
                No hay equipos registrados en esta planta
              </p>
              <button
                onClick={handleNewEquipment}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Agregar primer equipo
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );

  const renderForm = () => (
    <div className="p-4 pb-24 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <h2 className="text-lg font-bold text-gray-800 mb-4">
          {selectedEquipment ? "✏️ Editar Equipo" : "Ã¢Å¾â€¢ Nuevo Equipo"}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Equipo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.equipmentName}
              onChange={(e) =>
                setFormData({ ...formData, equipmentName: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Compresor Atlas Copco GA55"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Localización en Planta <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.locationInPlant}
              onChange={(e) =>
                setFormData({ ...formData, locationInPlant: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: ÃƒÂrea de ProducciÃƒÂ³n A"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Imágenes del Equipo
            </label>
            <ImageUploader
              category="equipment"
              images={capturedImages.equipment}
              onImagesChange={(imgs) =>
                setCapturedImages({ ...capturedImages, equipment: imgs })
              }
              equipmentId={selectedEquipment?.id}
              plantId={selectedPlant?.id} 
              isOnline={!isOffline}
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Imágenes de la Placa
            </label>
            <ImageUploader
              category="plate"
              images={capturedImages.plate}
              onImagesChange={(imgs) =>
                setCapturedImages({ ...capturedImages, plate: imgs })
              }
              equipmentId={selectedEquipment?.id}
              plantId={selectedPlant?.id}
              isOnline={!isOffline}
              disabled={isLoading}
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <h3 className="text-md font-bold text-gray-800 mb-4">Datos Técnicos</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número de Serie <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.serialNumber}
              onChange={(e) =>
                setFormData({ ...formData, serialNumber: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: AC-2023-001"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Modelo
            </label>
            <input
              type="text"
              value={formData.model}
              onChange={(e) =>
                setFormData({ ...formData, model: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: GA55"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fabricante
            </label>
            <input
              type="text"
              value={formData.manufacturer}
              onChange={(e) =>
                setFormData({ ...formData, manufacturer: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Atlas Copco"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Paí­s de Origen
            </label>
            <input
              type="text"
              value={formData.countryOfOrigin}
              onChange={(e) =>
                setFormData({ ...formData, countryOfOrigin: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Alemania"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status de la Placa
            </label>
            <div className="flex gap-2 mb-2">
              <button
                onClick={() => setFormData({ ...formData, plateStatus: "OK" })}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  formData.plateStatus === "OK"
                    ? "bg-green-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
                disabled={isLoading}
              >
                OK
              </button>
              <button
                onClick={() =>
                  setFormData({ ...formData, plateStatus: "OBSERVACIONES" })
                }
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  formData.plateStatus === "OBSERVACIONES"
                    ? "bg-orange-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
                disabled={isLoading}
              >
                Observaciones
              </button>
            </div>
            {formData.plateStatus === "OBSERVACIONES" && (
              <textarea
                value={formData.plateNotes}
                onChange={(e) =>
                  setFormData({ ...formData, plateNotes: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows="2"
                placeholder="Describe las observaciones de la placa..."
                disabled={isLoading}
              />
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Origen del Equipo
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => setFormData({ ...formData, origin: "NACIONAL" })}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  formData.origin === "NACIONAL"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
                disabled={isLoading}
              >
                Nacional
              </button>
              <button
                onClick={() =>
                  setFormData({ ...formData, origin: "EXTRANJERO" })
                }
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  formData.origin === "EXTRANJERO"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
                disabled={isLoading}
              >
                Extranjero
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <h3 className="text-md font-bold text-gray-800 mb-4">Documentación</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📄 Factura de Compra (PDF)
            </label>
            <PDFUploader
              category="factura"
              label="Facturas"
              pdfs={capturedPDFs.factura}
              onPDFsChange={(pdfs) =>
                setCapturedPDFs({ ...capturedPDFs, factura: pdfs })
              }
              equipmentId={selectedEquipment?.id}
              isOnline={!isOffline}
              maxPDFs={5}
              maxSizeMB={20}
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📄 Pedimento Aduanal (PDF)
            </label>
            <PDFUploader
              category="pedimento"
              label="Pedimentos"
              pdfs={capturedPDFs.pedimento}
              onPDFsChange={(pdfs) =>
                setCapturedPDFs({ ...capturedPDFs, pedimento: pdfs })
              }
              equipmentId={selectedEquipment?.id}
              isOnline={!isOffline}
              maxPDFs={5}
              maxSizeMB={20}
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción de Acciones a Realizar
            </label>
            <textarea
              value={formData.actionsDescription}
              onChange={(e) =>
                setFormData({ ...formData, actionsDescription: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="Describe las acciones necesarias (mantenimiento, reparación, etc.)"
              disabled={isLoading}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observaciones Generales
            </label>
            <textarea
              value={formData.observations}
              onChange={(e) =>
                setFormData({ ...formData, observations: e.target.value })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows="4"
              placeholder="Observaciones detalladas sobre el equipo..."
              disabled={isLoading}
            />
          </div>
        </div>
      </div>

      {showSuccessMessage && (
        <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {/* Ã¢Å“â€¦ CORRECCIÃƒâ€œN 2: BotÃƒÂ³n DeleteEquipmentButton movido ANTES del botÃƒÂ³n Guardar */}
      {selectedEquipment && (
        <div className="mb-4">
          <DeleteEquipmentButton
            equipmentId={selectedEquipment.id}
            plantId={selectedPlant.id}
            equipmentName={selectedEquipment.name}
            isOnline={!isOffline}
            onSuccess={(result) => {
              console.log("Ã¢Å“â€¦ Equipo eliminado:", result);
              setCurrentView("equipment");
              loadEquipment(selectedPlant.id);
            }}
            onError={(error) => console.error("Ã¢ÂÅ’ Error:", error)}
            className="w-full"
          />
        </div>
      )}

      <div className="flex gap-2 mb-4">
        <button
          onClick={handleSaveEquipment}
          disabled={isLoading}
          className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
        >
          {isLoading ? (
            <Loader className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          {isLoading
            ? "Guardando..."
            : selectedEquipment
            ? "Actualizar Equipo"
            : "Guardar Equipo"}
        </button>
        <button
          onClick={handleCancelEquipment}
          disabled={isLoading}
          className="px-6 bg-gray-500 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors shadow-md disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800 flex items-center gap-2">
        <AlertCircle className="w-4 h-4" />
        <span>💾 Los datos se guardan automáticamente en Firebase</span>
      </div>
    </div>
  );

  const renderReports = () => (
    <div className="p-4 pb-24 bg-gray-50 min-h-screen">
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        Reportes y Exportación
      </h2>

      <div className="bg-white rounded-lg shadow-md p-4 mb-4 border-l-4 border-blue-500">
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-blue-600" />
          Estado de Sincronización
        </h3>
        
        <div className="space-y-2 text-sm mb-4">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Operaciones pendientes:</span>
            <span className={`font-semibold ${
              syncStatus.pendingCount > 0 ? 'text-orange-600' : 'text-green-600'
            }`}>
              {syncStatus.pendingCount}
            </span>
          </div>
          
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Última sincronización:</span>
            <span className="text-sm text-gray-800">
              {syncStatus.lastSync 
                ? new Date(syncStatus.lastSync).toLocaleString('es-MX', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })
                : "Nunca"
              }
            </span>
          </div>
          
          <div className="flex justify-between py-2">
            <span className="text-gray-600">Estado de conexión:</span>
            <span className={`font-semibold ${
              isOffline ? "text-red-600" : "text-green-600"
            }`}>
              {isOffline ? "Sin conexiÃƒÂ³n" : "Conectado"}
            </span>
          </div>
        </div>
        
        <button
          onClick={syncNow}
          disabled={isOffline || syncStatus.isSyncing || syncStatus.pendingCount === 0}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {syncStatus.isSyncing ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Sincronizando...
            </>
          ) : (
            <>
              <RefreshCw className="w-5 h-5" />
              Sincronizar Ahora
              {syncStatus.pendingCount > 0 && (
                <span className="ml-1 bg-blue-800 px-2 py-0.5 rounded-full text-xs">
                  {syncStatus.pendingCount}
                </span>
              )}
            </>
          )}
        </button>

        {isOffline && (
          <p className="text-xs text-orange-600 mt-2 flex items-center gap-1">
            <AlertCircle className="w-4 h-4" />
            Conéctate a internet para sincronizar los datos pendientes
          </p>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <h3 className="font-semibold text-gray-800 mb-3">
          Filtros de Búsqueda
        </h3>
        <div className="space-y-3">
          <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
            <option>Todas las plantas</option>
            {plants.map((plant) => (
              <option key={plant.id}>{plant.name}</option>
            ))}
          </select>

          <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
            <option>Todos los orí­genes</option>
            <option>Nacional</option>
            <option>Extranjero</option>
          </select>

          <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
            <option>Todos los estados</option>
            <option>Completos</option>
            <option>Incompletos</option>
          </select>

          <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
            <option>Estado de sincronización</option>
            <option>Sincronizados</option>
            <option>Pendientes</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <h3 className="font-semibold text-gray-800 mb-3">Exportar Datos</h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => handleExport("excel")}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md disabled:opacity-50"
          >
            {isLoading ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <Download className="w-5 h-5" />
            )}
            <span className="font-medium">Excel</span>
          </button>
          <button
            onClick={() => handleExport("pdf")}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-md disabled:opacity-50"
          >
            {isLoading ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <Download className="w-5 h-5" />
            )}
            <span className="font-medium">PDF</span>
          </button>
          <button
            onClick={() => handleExport("json")}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md disabled:opacity-50"
          >
            {isLoading ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <Download className="w-5 h-5" />
            )}
            <span className="font-medium">JSON</span>
          </button>
          <button
            onClick={() => handleExport("txt")}
            disabled={isLoading}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors shadow-md disabled:opacity-50"
          >
            {isLoading ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <Download className="w-5 h-5" />
            )}
            <span className="font-medium">TXT</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <h3 className="font-semibold text-gray-800 mb-3">
          Estadí­sticas Generales
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Total de plantas:</span>
            <span className="font-semibold text-blue-600">{plants.length}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Total de equipos:</span>
            <span className="font-semibold text-blue-600">
              {plants.reduce(
                (sum, plant) => sum + (plant.equipmentCount || 0),
                0
              )}
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-100">
            <span className="text-gray-600">Última sincronización:</span>
            <span className="font-semibold text-green-600">
              {isOffline ? "Modo Offline" : "Sincronizado"}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">Ã°Å¸â€™Â¡ Tip: ExportaciÃƒÂ³n de Datos</p>
            <p>
              Los reportes se generan desde Firebase e incluyen toda la
              informaciÃƒÂ³n capturada en tiempo real.
            </p>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-4 mb-4 mt-4">
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          Zona de Peligro
        </h3>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-3">
          <p className="text-sm text-red-800 mb-2">
            <strong>Ã¢Å¡Â Ã¯Â¸Â PrecauciÃƒÂ³n:</strong> EliminarÃƒÂ¡ toda la BD local.
          </p>
          <p className="text-xs text-red-700">
            Firebase no se verÃƒÂ¡ afectado.
          </p>
        </div>

        <NukeDatabaseButton
          onSuccess={() => console.log("Ã¢Å“â€¦ BD eliminada")}
          className="w-full"
        />
      </div>

      {/* ========== NUEVO: PANEL DE LIMPIEZA DE DUPLICADOS ========== */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          Limpieza de Duplicados
        </h3>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-3">
          <p className="text-sm text-yellow-800 mb-2">
            <strong>Ã¢Å¡Â Ã¯Â¸Â Detectado:</strong> Posibles duplicados en la base de datos
          </p>
          <p className="text-xs text-yellow-700">
            Esta operación buscará y eliminará registros duplicados manteniendo el más antiguo.
          </p>
        </div>

        <div className="space-y-2">
          <button
            onClick={async () => {
              setIsLoading(true);
              try {
                const result = await findDuplicates();
                setIsLoading(false);
                
                if (result.success) {
                  if (result.duplicates.length === 0) {
                    setSuccessMessage("Ã¢Å“â€¦ No se encontraron duplicados");
                    setShowSuccessMessage(true);
                  } else {
                    alert(
                      `Ã¢Å¡Â Ã¯Â¸Â Duplicados encontrados: ${result.duplicates.length}\n\n` +
                      `Revisa la consola (F12) para ver detalles`
                    );
                  }
                } else {
                  alert("Ã¢ÂÅ’ Error: " + result.error);
                }
              } catch (error) {
                setIsLoading(false);
                alert("Ã¢ÂÅ’ Error: " + error.message);
              }
            }}
            disabled={isLoading}
            className="w-full bg-yellow-600 text-white py-2 rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <Search className="w-5 h-5" />
            )}
            {isLoading ? "Buscando..." : "Ã°Å¸â€Â Buscar Duplicados"}
          </button>
          
          <button
            onClick={async () => {
              if (!window.confirm(
                'Ã‚Â¿Eliminar duplicados?\n\n' +
                'Se mantendrÃƒÂ¡ el registro mÃƒÂ¡s antiguo de cada duplicado.\n' +
                'Esta acciÃƒÂ³n NO se puede deshacer.'
              )) {
                return;
              }
              
              setIsLoading(true);
              try {
                const result = await removeDuplicates();
                setIsLoading(false);
                
                if (result.success) {
                  setSuccessMessage(`Ã¢Å“â€¦ Duplicados eliminados: ${result.removed}`);
                  setShowSuccessMessage(true);
                  
                  // Recargar plantas
                  await loadPlants();
                } else {
                  alert("Ã¢ÂÅ’ Error: " + result.error);
                }
              } catch (error) {
                setIsLoading(false);
                alert("Ã¢ÂÅ’ Error: " + error.message);
              }
            }}
            disabled={isLoading}
            className="w-full bg-orange-600 text-white py-2 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <Trash2 className="w-5 h-5" />
            )}
            {isLoading ? "Eliminando..." : "Ã°Å¸â€”â€˜Ã¯Â¸Â Eliminar Duplicados"}
          </button>
        </div>
      </div>

      {/* ========== NUEVO: PANEL DE LIMPIEZA TOTAL ========== */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          Ã°Å¸â€Â¥ Limpieza Total
        </h3>
        
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-3">
          <p className="text-sm text-red-800 mb-2">
            <strong>Ã°Å¸Å¡Â¨ PELIGRO EXTREMO:</strong> Esto eliminarÃƒÂ¡ TODO
          </p>
          <ul className="text-xs text-red-700 list-disc list-inside space-y-1">
            <li>Todas las plantas de Firebase</li>
            <li>Todos los equipos de Firebase</li>
            <li>Toda la cachÃƒÂ© local (IndexedDB)</li>
            <li>Operaciones pendientes de sincronizaciÃƒÂ³n</li>
          </ul>
          <p className="text-xs text-red-700 mt-2">
            Ã¢Å¡Â Ã¯Â¸Â Las imÃƒÂ¡genes y PDFs en Storage deben eliminarse manualmente desde Firebase Console
          </p>
        </div>

        <button
          onClick={async () => {
            // Triple confirmaciÃƒÂ³n
            if (!window.confirm(
              'Ã¢Å¡Â Ã¯Â¸ÂÃ¢Å¡Â Ã¯Â¸ÂÃ¢Å¡Â Ã¯Â¸Â Ã‚Â¿ELIMINAR TODA LA BASE DE DATOS?\n\n' +
              'Esta acciÃƒÂ³n es IRREVERSIBLE.\n' +
              'Se eliminarÃƒÂ¡n:\n' +
              '- Todas las plantas\n' +
              '- Todos los equipos\n' +
              '- Toda la cachÃƒÂ© local\n\n' +
              'Ã‚Â¿Continuar?'
            )) {
              return;
            }
            
            if (!window.confirm(
              'Ã¢Å¡Â Ã¯Â¸ÂÃ¢Å¡Â Ã¯Â¸Â SEGUNDA CONFIRMACIÃƒâ€œN\n\n' +
              'Ã‚Â¿ESTÃƒÂS COMPLETAMENTE SEGURO?\n\n' +
              'No hay vuelta atrÃƒÂ¡s.'
            )) {
              return;
            }
            
            const confirmText = prompt(
              'Para confirmar la eliminaciÃƒÂ³n total, escribe exactamente:\n\n' +
              'BORRAR TODO\n\n' +
              '(en mayÃƒÂºsculas)'
            );
            
            if (confirmText !== 'BORRAR TODO') {
              alert('Ã¢ÂÅ’ OperaciÃƒÂ³n cancelada - Texto incorrecto');
              return;
            }
            
            setIsLoading(true);
            
            try {
              const result = await cleanEverything();
              setIsLoading(false);
              
              if (result.success) {
                alert(
                  'Ã¢Å“â€¦ BASE DE DATOS COMPLETAMENTE LIMPIA\n\n' +
                  'Ã°Å¸â€œâ€¹ Resultados:\n' +
                  `- Firebase limpio: ${result.results.firebase.totalDeleted} registros\n` +
                  `- IndexedDB limpio: Ã¢Å“â€¦\n\n` +
                  'Ã¢Å¡Â Ã¯Â¸Â IMPORTANTE:\n' +
                  '1. Limpia Firebase Storage manualmente\n' +
                  '2. RECARGA LA PÃƒÂGINA (F5)\n' +
                  '3. Crea nuevos datos ONLINE'
                );
                
                // Sugerir recarga
                if (window.confirm('Ã‚Â¿Recargar la pÃƒÂ¡gina ahora?')) {
                  window.location.reload();
                }
              } else {
                alert('Ã¢ÂÅ’ Error en limpieza: ' + result.error);
              }
            } catch (error) {
              setIsLoading(false);
              alert('Ã¢ÂÅ’ Error inesperado: ' + error.message);
            }
          }}
          disabled={isLoading}
          className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 font-bold"
        >
          {isLoading ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Eliminando Todo...
            </>
          ) : (
            <>
              <AlertCircle className="w-5 h-5" />
              Ã°Å¸â€Â¥ ELIMINAR TODO
            </>
          )}
        </button>
        
        <p className="text-xs text-red-600 mt-2 text-center font-medium">
          Ã¢Å¡Â Ã¯Â¸Â Requiere 3 confirmaciones y escribir "BORRAR TODO"
        </p>
      </div>
    </div>  
  );

  // ============================================
  // ðŸ” RENDERIZADO CONDICIONAL POR AUTENTICACIÃ“N
  // ============================================
  
  // Mostrar loading mientras se verifica la autenticaciÃ³n
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <div className="flex items-center gap-3 justify-center mb-4">
            <Database className="w-12 h-12 text-blue-600 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">AuditorÃ­a Industrial</h2>
          <p className="text-gray-600">Verificando autenticaciÃ³n...</p>
          <div className="mt-4">
            <Loader className="w-8 h-8 text-blue-600 animate-spin mx-auto" />
          </div>
        </div>
      </div>
    );
  }
  
  // Mostrar pantalla de login si no estÃ¡ autenticado
  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={() => {
      console.log('âœ… Login exitoso, cargando aplicaciÃ³n...');
    }} />;
  }
  
  // Usuario autenticado: mostrar aplicaciÃ³n normal
  return (
    <div className="max-w-md mx-auto bg-gray-100 min-h-screen">
      {renderHeader()}

      {showSyncProgress && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Loader className="w-5 h-5 animate-spin text-blue-600" />
              Sincronizando datos...
            </h3>
            
            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-600">Progreso</span>
                <span className="text-sm font-medium text-blue-600">
                  {syncProgress.current}/{syncProgress.total}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div 
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${syncProgress.percentage}%` }}
                />
              </div>
            </div>
            
            <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
              {syncProgress.type ? (
                <>
                  <span className="font-medium">Procesando:</span> {syncProgress.type}
                </>
              ) : (
                'Iniciando sincronizaciÃƒÂ³n...'
              )}
            </p>
          </div>
        </div>
      )}

      {currentView === "plants" && renderPlantsList()}
      {currentView === "newPlant" && renderNewPlantForm()}
      {currentView === "equipment" && renderEquipmentList()}
      {currentView === "form" && renderForm()}
      {currentView === "reports" && renderReports()}

      {renderBottomNav()}
    </div>
  );
};

export default AuditoriaApp;
