/**
 * SupervisorLayout.jsx - Layout con sidebar para usuarios Supervisor/Admin
 *
 * Nuevo diseño con:
 * - Sidebar lateral izquierdo con menú de navegación
 * - Área principal derecha con contenido dinámico
 * - Selector de planta en el sidebar
 * - Tabla de equipos estilo hoja de cálculo
 *
 * @version 2.0.0
 */

import React, { useCallback, useState } from "react";

// Componentes compartidos
import { SyncProgress } from "../shared/SyncProgress";

// Componentes de supervisor
import {
  PlantForm,
  EquipmentForm,
  ReportsView,
  Sidebar,
  EquipmentTable,
  WelcomePanel,
  StatsPanel,
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
  console.log(`🎭 Renderizando interfaz de ${isAdmin ? "ADMIN" : "SUPERVISOR"} v2.0`);

  // Estado para el equipo a eliminar
  const [equipmentToDelete, setEquipmentToDelete] = useState(null);

  // ============================================
  // HANDLERS PARA COMPONENTES
  // ============================================

  // Handler para seleccionar planta desde el sidebar
  const handleSelectPlant = useCallback(
    (plant) => {
      selectPlant(plant);
      loadEquipment(plant.id);
      setCurrentView("equipment");
    },
    [selectPlant, loadEquipment, setCurrentView]
  );

  // Handler para crear nueva planta
  const handleNewPlant = useCallback(() => {
    setCurrentView("newPlant");
  }, [setCurrentView]);

  // Handler para seleccionar equipo (carga datos en formulario)
  const handleSelectEquipment = useCallback(
    (equip) => {
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
            console.log(
              `  ✅ ${category}: ${existingImages[category].length} imágenes cargadas`
            );
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
            console.log(
              `  ✅ ${category}: ${existingPDFs[category].length} PDFs cargados`
            );
          }
        });

        setCapturedPDFs(existingPDFs);
      } else {
        console.log("  ⚠️ Equipo NO tiene campo pdfs");
        setCapturedPDFs({ factura: [], pedimento: [] });
      }

      setCurrentView("form");
    },
    [setSelectedEquipment, setFormData, setCapturedImages, setCapturedPDFs, setCurrentView]
  );

  // Handler para eliminar equipo (placeholder)
  const handleDeleteEquipment = useCallback((equip) => {
    setEquipmentToDelete(equip);
    // TODO: Implementar modal de confirmación
    console.log("Eliminar equipo:", equip.id);
  }, []);

  // Handler para guardar planta
  const handleSavePlant = useCallback(async () => {
    try {
      const result = await savePlant();

      if (result.success) {
        setSuccessMessage(result.message);
        setShowSuccessMessage(true);
        await loadPlants();

        setTimeout(() => {
          setCurrentView("equipment");
          resetNewPlantForm();
        }, 2000);
      }
    } catch (error) {
      alert("❌ Error al guardar planta: " + error.message);
    }
  }, [
    savePlant,
    setSuccessMessage,
    setShowSuccessMessage,
    loadPlants,
    setCurrentView,
    resetNewPlantForm,
  ]);

  // Handler para cancelar formulario de planta
  const handleCancelPlant = useCallback(() => {
    setCurrentView(selectedPlant ? "equipment" : "welcome");
    resetNewPlantForm();
  }, [setCurrentView, selectedPlant, resetNewPlantForm]);

  // Handler para cancelar formulario de equipo (volver a tabla)
  const handleCancelEquipmentForm = useCallback(() => {
    handleCancelEquipment();
    setCurrentView("equipment");
  }, [handleCancelEquipment, setCurrentView]);

  // Handler para cambio de imágenes
  const handleImageChange = useCallback(
    (category, images) => {
      setCapturedImages((prev) => ({ ...prev, [category]: images }));
    },
    [setCapturedImages]
  );

  // Handler para cambio de PDFs
  const handlePDFChange = useCallback(
    (category, pdfs) => {
      setCapturedPDFs((prev) => ({ ...prev, [category]: pdfs }));
    },
    [setCapturedPDFs]
  );

  // Handler después de eliminar equipo
  const handleEquipmentDeleted = useCallback(() => {
    setCurrentView("equipment");
    if (selectedPlant) {
      loadEquipment(selectedPlant.id);
    }
  }, [setCurrentView, selectedPlant, loadEquipment]);

  // Handler para navegación desde sidebar
  const handleSidebarNavigate = useCallback(
    (view) => {
      if (view === "equipment" && !selectedPlant) {
        // Si no hay planta seleccionada, no navegar a equipos
        return;
      }
      setCurrentView(view);
    },
    [setCurrentView, selectedPlant]
  );

  // ============================================
  // DETERMINAR QUÉ CONTENIDO MOSTRAR
  // ============================================

  const renderMainContent = () => {
    // Vista de formulario de nueva planta
    if (currentView === "newPlant") {
      return (
        <div className="max-w-2xl mx-auto">
          <PlantForm
            formData={newPlantData}
            onChange={updateNewPlantData}
            onSave={handleSavePlant}
            onCancel={handleCancelPlant}
            isLoading={isLoading}
            showSuccessMessage={showSuccessMessage}
            successMessage={successMessage}
          />
        </div>
      );
    }

    // Vista de formulario de equipo (crear/editar)
    if (currentView === "form") {
      return (
        <EquipmentForm
          formData={formData}
          onChange={setFormData}
          onSave={handleSaveEquipment}
          onCancel={handleCancelEquipmentForm}
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
      );
    }

    // Vista de reportes
    if (currentView === "reports") {
      return (
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
      );
    }

    // Vista de estadísticas
    if (currentView === "stats") {
      return (
        <StatsPanel
          plants={plants}
          equipment={equipment}
          syncStatus={syncStatus}
          isOffline={isOffline}
        />
      );
    }

    // Vista de tabla de equipos (cuando hay planta seleccionada)
    if (selectedPlant && (currentView === "equipment" || currentView === "plants")) {
      return (
        <EquipmentTable
          equipment={equipment}
          plantName={selectedPlant.name}
          onSelectEquipment={handleSelectEquipment}
          onNewEquipment={handleNewEquipment}
          onDeleteEquipment={handleDeleteEquipment}
          searchTerm={equipmentSearchTerm}
          onSearchChange={setEquipmentSearchTerm}
          isLoading={isLoading}
          showSuccessMessage={showSuccessMessage}
          successMessage={successMessage}
        />
      );
    }

    // Vista de bienvenida (sin planta seleccionada)
    return (
      <WelcomePanel
        onNewPlant={handleNewPlant}
        plantsCount={plants.length}
      />
    );
  };

  // ============================================
  // RENDERIZADO
  // ============================================
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar izquierdo */}
      <Sidebar
        plants={plants}
        selectedPlant={selectedPlant}
        onPlantSelect={handleSelectPlant}
        onNewPlant={handleNewPlant}
        currentView={currentView}
        onNavigate={handleSidebarNavigate}
        user={user}
        isOffline={isOffline}
        isAdmin={isAdmin}
      />

      {/* Área principal derecha */}
      <main className="flex-1 p-6 overflow-auto">
        {/* Modal de progreso de sincronización */}
        <SyncProgress show={showSyncProgress} progress={syncProgress} />

        {/* Contenido principal */}
        {renderMainContent()}
      </main>
    </div>
  );
};

export default SupervisorLayout;
