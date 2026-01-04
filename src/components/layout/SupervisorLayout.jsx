/**
 * SupervisorLayout.jsx - Layout completo para usuarios Supervisor/Admin
 * 
 * Encapsula toda la lógica de renderizado de vistas y navegación
 * para los roles de Supervisor y Administrador.
 * 
 * Incluye:
 * - Header con estado de conexión
 * - Navegación entre vistas (plants, equipment, form, reports)
 * - Componentes de supervisor (PlantsList, PlantForm, EquipmentList, etc.)
 * - BottomNav
 * 
 * @version 1.0.0
 */

import React, { useCallback } from "react";

// Componentes compartidos
import { Header } from "../shared/Header";
import { BottomNav } from "../shared/BottomNav";
import { SyncProgress } from "../shared/SyncProgress";

// Componentes de supervisor
import {
  PlantsList,
  PlantForm,
  EquipmentList,
  EquipmentForm,
  ReportsView,
} from "../supervisor";

/**
 * @param {Object} props - Propiedades del componente
 */
export const SupervisorLayout = ({
  // Usuario y conexión
  user,
  isOffline,
  isAdmin,
  
  // Estado de la app
  currentView,
  handleNavigate,
  
  // Loading
  isLoading,
  
  // Mensajes
  showSuccessMessage,
  successMessage,
  
  // Sync
  syncStatus,
  syncProgress,
  showSyncProgress,
  syncNow,
  
  // Plantas
  plants,
  selectedPlant,
  filteredPlants,
  newPlantData,
  searchTerm,
  setSearchTerm,
  selectPlant,
  loadPlants,
  loadEquipment,
  savePlant,
  updateNewPlantData,
  resetNewPlantForm,
  
  // Equipos
  equipment,
  selectedEquipment,
  formData,
  capturedImages,
  capturedPDFs,
  equipmentSearchTerm,
  setEquipmentSearchTerm,
  setSelectedEquipment,
  setFormData,
  setCapturedImages,
  setCapturedPDFs,
  handleNewEquipment,
  handleSaveEquipment,
  handleCancelEquipment,
  
  // Operaciones admin
  handleExport,

  // Callbacks para control de estado
  setSuccessMessage,
  setShowSuccessMessage,
  setCurrentView,
}) => {
  console.log(`🎭 Renderizando interfaz de ${isAdmin ? 'ADMIN' : 'SUPERVISOR'}`);

  // ============================================
  // HANDLERS PARA COMPONENTES
  // ============================================

  // Handler para seleccionar planta
  const handleSelectPlant = useCallback((plant) => {
    selectPlant(plant);
    loadEquipment(plant.id);
    setCurrentView("equipment");
  }, [selectPlant, loadEquipment, setCurrentView]);

  // Handler para seleccionar equipo (carga datos en formulario)
  const handleSelectEquipment = useCallback((equip) => {
    console.log("\n🔍 CARGANDO EQUIPO PARA EDITAR:");
    console.log("  Equipo ID:", equip.id);
    
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
      invoiceNumber: equip.invoiceNumber || "",
      customsNumber: equip.customsNumber || "",
    });

    // Cargar imágenes existentes
    if (equip.images) {
      console.log("  ✅ Equipo tiene imágenes:", equip.images);
      
      const existingImages = {
        equipment: [],
        plate: [],
      };

      Object.keys(equip.images).forEach((category) => {
        if (equip.images[category] && Array.isArray(equip.images[category])) {
          existingImages[category] = equip.images[category].map((img) => ({
            url: img.url,
            path: img.path,
            uploadDate: img.uploadDate,
            isNew: false,
          }));
          console.log(`  ✅ ${category}: ${existingImages[category].length} imágenes cargadas`);
        }
      });

      setCapturedImages(existingImages);
    } else {
      console.log("  ⚠️ Equipo NO tiene campo images");
      setCapturedImages({ equipment: [], plate: [] });
    }

    // Cargar PDFs existentes
    if (equip.pdfs) {
      console.log("  ✅ Equipo tiene PDFs:", equip.pdfs);

      const existingPDFs = {
        factura: [],
        pedimento: [],
      };

      Object.keys(equip.pdfs).forEach((category) => {
        if (equip.pdfs[category] && Array.isArray(equip.pdfs[category])) {
          existingPDFs[category] = equip.pdfs[category].map((pdf) => ({
            url: pdf.url,
            path: pdf.path,
            fileName: pdf.fileName,
            size: pdf.size,
            uploadDate: pdf.uploadDate,
            isNew: false,
          }));
          console.log(`  ✅ ${category}: ${existingPDFs[category].length} PDFs cargados`);
        }
      });

      setCapturedPDFs(existingPDFs);
    } else {
      console.log("  ⚠️ Equipo NO tiene campo pdfs");
      setCapturedPDFs({ factura: [], pedimento: [] });
    }

    setCurrentView("form");
  }, [setSelectedEquipment, setFormData, setCapturedImages, setCapturedPDFs, setCurrentView]);

  // Handler para guardar planta
  const handleSavePlant = useCallback(async () => {
    try {
      const result = await savePlant();
      
      if (result.success) {
        setSuccessMessage(result.message);
        setShowSuccessMessage(true);
        await loadPlants();
        
        setTimeout(() => {
          setCurrentView("plants");
          resetNewPlantForm();
        }, 2000);
      }
    } catch (error) {
      alert("❌ Error al guardar planta: " + error.message);
    }
  }, [savePlant, setSuccessMessage, setShowSuccessMessage, loadPlants, setCurrentView, resetNewPlantForm]);

  // Handler para cancelar formulario de planta
  const handleCancelPlant = useCallback(() => {
    setCurrentView("plants");
    resetNewPlantForm();
  }, [setCurrentView, resetNewPlantForm]);

  // Handler para cambio de imágenes
  const handleImageChange = useCallback((category, images) => {
    setCapturedImages(prev => ({ ...prev, [category]: images }));
  }, [setCapturedImages]);

  // Handler para cambio de PDFs
  const handlePDFChange = useCallback((category, pdfs) => {
    setCapturedPDFs(prev => ({ ...prev, [category]: pdfs }));
  }, [setCapturedPDFs]);

  // Handler después de eliminar equipo
  const handleEquipmentDeleted = useCallback(() => {
    setCurrentView("equipment");
    if (selectedPlant) {
      loadEquipment(selectedPlant.id);
    }
  }, [setCurrentView, selectedPlant, loadEquipment]);

  // ============================================
  // RENDERIZADO
  // ============================================
  return (
    <div className="w-full max-w-md sm:max-w-xl md:max-w-3xl lg:max-w-5xl xl:max-w-6xl mx-auto bg-gray-100 min-h-screen">
      {/* Header */}
      <Header
        user={user}
        isOffline={isOffline}
        syncStatus={syncStatus}
        isLoading={isLoading}
        currentView={currentView}
        selectedPlant={selectedPlant}
        onNavigate={handleNavigate}
      />

      {/* Modal de progreso de sincronización */}
      <SyncProgress
        show={showSyncProgress}
        progress={syncProgress}
      />

      {/* Vista de Lista de Plantas */}
      {currentView === "plants" && (
        <PlantsList
          plants={filteredPlants}
          onSelectPlant={handleSelectPlant}
          onNewPlant={() => setCurrentView("newPlant")}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          isLoading={isLoading}
          isOffline={isOffline}
          showSuccessMessage={showSuccessMessage}
          successMessage={successMessage}
        />
      )}

      {/* Vista de Formulario Nueva Planta */}
      {currentView === "newPlant" && (
        <PlantForm
          formData={newPlantData}
          onChange={updateNewPlantData}
          onSave={handleSavePlant}
          onCancel={handleCancelPlant}
          isLoading={isLoading}
          showSuccessMessage={showSuccessMessage}
          successMessage={successMessage}
        />
      )}

      {/* Vista de Lista de Equipos */}
      {currentView === "equipment" && (
        <EquipmentList
          equipment={equipment}
          selectedPlant={selectedPlant}
          onSelectEquipment={handleSelectEquipment}
          onNewEquipment={handleNewEquipment}
          searchTerm={equipmentSearchTerm}
          onSearchChange={setEquipmentSearchTerm}
          isLoading={isLoading}
          showSuccessMessage={showSuccessMessage}
          successMessage={successMessage}
        />
      )}

      {/* Vista de Formulario de Equipo */}
      {currentView === "form" && (
        <EquipmentForm
          formData={formData}
          onChange={setFormData}
          onSave={handleSaveEquipment}
          onCancel={handleCancelEquipment}
          capturedImages={capturedImages}
          capturedPDFs={capturedPDFs}
          onImageChange={handleImageChange}
          onPDFChange={handlePDFChange}
          selectedEquipment={selectedEquipment}
          selectedPlant={selectedPlant}
          isLoading={isLoading}
          isOffline={isOffline}
          showSuccessMessage={showSuccessMessage}
          successMessage={successMessage}
          onEquipmentDeleted={handleEquipmentDeleted}
        />
      )}

      {/* Vista de Reportes */}
      {currentView === "reports" && (
        <ReportsView
          plants={plants}
          syncStatus={syncStatus}
          isOffline={isOffline}
          isLoading={isLoading}
          onExport={handleExport}
          onSyncNow={syncNow}
          showSuccessMessage={showSuccessMessage}
          successMessage={successMessage}
        />
      )}

      {/* Navegación inferior */}
      <BottomNav
        currentView={currentView}
        onNavigate={handleNavigate}
      />
    </div>
  );
};

export default SupervisorLayout;
