/**
 * usePlants Hook - VERSIÓN CORREGIDA v2
 * 
 * Custom Hook para manejar toda la lógica relacionada con plantas:
 * - Carga de plantas (Firebase + Local)
 * - Creación de nuevas plantas
 * - Selección de planta actual
 * - Gestión de estado de plantas
 * - Sincronización online/offline
 * 
 * CORRECCIONES:
 * - v1: Eliminado isLoading de dependencias para evitar loop infinito
 * - v2: Recarga plantas cuando el usuario se autentica
 * 
 * @param {boolean} isOffline - Estado de conexión (online/offline)
 * @param {boolean} isAuthenticated - Estado de autenticación del usuario
 * @returns {Object} Estado y funciones para manejar plantas
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import {
  addPlant,
  getPlants,
  getEquipmentByPlant,
} from '../services/firebase/firebaseServices';
import {
  savePlantLocal,
  getPlantsLocal,
  addToSyncQueue,
  getEquipmentByPlantLocal,
} from '../services/storage/localStorageService';

export const usePlants = (isOffline = false, isAuthenticated = false) => {
  // ============================================
  // ESTADOS
  // ============================================
  const [plants, setPlants] = useState([]);
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [newPlantData, setNewPlantData] = useState({
    name: "",
    location: "",
    address: "",
    responsiblePerson: "",
    phoneNumber: "",
  });

  // ============================================
  // REF PARA CONTROLAR LLAMADAS DUPLICADAS
  // ============================================
  const isLoadingRef = useRef(false);
  const lastAuthState = useRef(false); // Para detectar cambios en autenticación

  // ============================================
  // 🔄 CARGAR PLANTAS
  // ============================================
  const loadPlants = useCallback(async () => {
    // Usar ref para evitar llamadas duplicadas (no causa re-render)
    if (isLoadingRef.current) {
      // console.log("⏭️ Ya se están cargando las plantas, omitiendo llamada duplicada");
      return;
    }

    try {
      isLoadingRef.current = true;
      setIsLoading(true);

      if (isOffline) {
        // MODO OFFLINE: Cargar solo de IndexedDB
        // console.log("📴 Modo OFFLINE: Cargando plantas desde IndexedDB...");
        
        const localResult = await getPlantsLocal();
        
        if (localResult.success) {
          const localPlants = localResult.data;
          // console.log(`✅ ${localPlants.length} plantas cargadas desde IndexedDB`);
          
          // Contar equipos de cada planta
          for (const plant of localPlants) {
            const equipResult = await getEquipmentByPlantLocal(plant.id);
            if (equipResult.success) {
              plant.equipmentCount = equipResult.data.length;
            } else {
              plant.equipmentCount = 0;
            }
          }
          
          setPlants(localPlants);
        } else {
          console.error("❌ Error al cargar plantas locales:", localResult.error);
          setPlants([]);
        }
        
      } else {
        // MODO ONLINE: Cargar de Firebase y combinar con local
        // console.log("📡 Modo ONLINE: Cargando plantas...");
        
        // 1. Cargar plantas de Firebase
        const result = await getPlants();
        let firebasePlants = [];
        
        if (result.success) {
          firebasePlants = result.data;
          // console.log(`✅ ${firebasePlants.length} plantas cargadas desde Firebase`);
          
          // Contar equipos de cada planta
          // console.log("📊 Contando equipos de cada planta...");
          for (const plant of firebasePlants) {
            const equipResult = await getEquipmentByPlant(plant.id);
            if (equipResult.success) {
              plant.equipmentCount = equipResult.data.length;
              // console.log(`  ✅ Planta "${plant.name}": ${plant.equipmentCount} equipos`);
            } else {
              plant.equipmentCount = 0;
            }
          }
        } else {
          console.error("❌ Error al obtener plantas de Firebase:", result.error);
        }

        // 2. Cargar plantas locales
        const localResult = await getPlantsLocal();
        let localPlants = [];
        
        if (localResult.success) {
          localPlants = localResult.data;
          // console.log(`✅ ${localPlants.length} plantas en IndexedDB`);
          
          // Contar equipos locales
          for (const plant of localPlants) {
            const equipResult = await getEquipmentByPlantLocal(plant.id);
            if (equipResult.success) {
              plant.equipmentCount = equipResult.data.length;
            } else {
              plant.equipmentCount = 0;
            }
          }
        }

        // 3. Combinar plantas: Firebase + locales no sincronizadas
        const firebaseIds = new Set(firebasePlants.map(p => p.id));
        
        const uniqueLocalPlants = localPlants.filter(plant => {
          // Incluir plantas con ID local (no sincronizadas)
          if (plant.id.startsWith('local_')) {
            return true;
          }
          // Incluir plantas que no estén en Firebase
          return !firebaseIds.has(plant.id);
        });

        // console.log(`📊 Plantas únicas locales (no sincronizadas): ${uniqueLocalPlants.length}`);

        const allPlants = [...firebasePlants, ...uniqueLocalPlants];
        
        // console.log(`✅ Total de plantas a mostrar: ${allPlants.length}`);
        setPlants(allPlants);
      }

    } catch (error) {
      console.error("❌ Error al cargar plantas:", error);
      setPlants([]);
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  }, [isOffline]); // ← SOLO isOffline, NO isLoading

  // ============================================
  // 💾 GUARDAR NUEVA PLANTA
  // ============================================
  const savePlant = useCallback(async () => {
    // Validación
    if (!newPlantData.name || !newPlantData.location) {
      throw new Error("Por favor completa los campos obligatorios:\n- Nombre de la Planta\n- Ciudad y Estado");
    }

    setIsLoading(true);

    try {
      const plantData = {
        ...newPlantData,
        createdAt: new Date().toISOString(),
      };

      if (isOffline) {
        // MODO OFFLINE: Guardar localmente
        // console.log("Modo OFFLINE: Guardando planta localmente...");

        const localResult = await savePlantLocal(plantData);

        if (!localResult.success) {
          throw new Error(localResult.error);
        }

        // Agregar a cola de sincronización
        await addToSyncQueue('ADD_PLANT', {
          ...plantData,
          id: localResult.data.id,
        });

        // console.log("Planta guardada localmente");

        return {
          success: true,
          message: `✔ Planta "${newPlantData.name}" guardada localmente. Se sincronizará al conectar.`,
          id: localResult.data.id,
        };

      } else {
        // MODO ONLINE: Guardar en Firebase
        // console.log("📡 Modo ONLINE: Guardando planta en Firebase...");

        const result = await addPlant(plantData);

        if (!result.success) {
          throw new Error(result.error);
        }

        // Guardar también en local para uso offline
        await savePlantLocal({
          ...plantData,
          id: result.id,
          syncStatus: 'synced',
        });

        // console.log("Planta guardada y sincronizada");

        return {
          success: true,
          message: `✔ Planta "${newPlantData.name}" guardada y sincronizada con Firebase`,
          id: result.id,
        };
      }

    } catch (error) {
      console.error("❌ Error al guardar planta:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [newPlantData, isOffline]);

  // ============================================
  // 🎯 SELECCIONAR PLANTA
  // ============================================
  const selectPlant = useCallback((plant) => {
    // console.log("🎯 Planta seleccionada:", plant?.name || "ninguna");
    setSelectedPlant(plant);
  }, []);

  // ============================================
  // 🔄 ACTUALIZAR DATOS DE NUEVA PLANTA
  // ============================================
  const updateNewPlantData = useCallback((field, value) => {
    setNewPlantData((prev) => ({
      ...prev,
      [field]: value,
    }));
  }, []);

  // También permitir actualización completa
  const setNewPlantDataComplete = useCallback((data) => {
    setNewPlantData(data);
  }, []);

  // ============================================
  //  RESETEAR FORMULARIO
  // ============================================
  const resetNewPlantForm = useCallback(() => {
    setNewPlantData({
      name: "",
      location: "",
      address: "",
      responsiblePerson: "",
      phoneNumber: "",
    });
  }, []);

  // ============================================
  //  CARGAR PLANTAS CUANDO CAMBIE AUTENTICACIÓN
  // ============================================
  useEffect(() => {
    // Detectar si el usuario acaba de autenticarse
    const justAuthenticated = isAuthenticated && !lastAuthState.current;
    
    // Actualizar el estado anterior
    lastAuthState.current = isAuthenticated;

    // Cargar plantas si:
    // 1. El usuario acaba de autenticarse (justAuthenticated)
    // 2. O es la primera carga y hay usuario autenticado
    if (justAuthenticated) {
      // console.log("🔄 Usuario autenticado, recargando plantas...");
      loadPlants();
    }
  }, [isAuthenticated, loadPlants]);

  // ============================================
  //  CARGA INICIAL (solo si ya está autenticado)
  // ============================================
  useEffect(() => {
    // Solo cargar al montar si el usuario ya está autenticado
    // Si no está autenticado, el useEffect anterior se encargará cuando se autentique
    if (isAuthenticated) {
      loadPlants();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo al montar

  // ============================================
  //  RETORNO DEL HOOK
  // ============================================
  return {
    // Estados
    plants,
    selectedPlant,
    isLoading,
    newPlantData,

    // Funciones principales
    loadPlants,
    savePlant,
    selectPlant,

    // Funciones auxiliares
    updateNewPlantData,
    setNewPlantData: setNewPlantDataComplete,
    resetNewPlantForm,
  };
};

export default usePlants;