/**
 * AuditorLayout.jsx - Layout con sidebar para usuarios Auditor
 *
 * Nuevo diseño similar al SupervisorLayout con:
 * - Sidebar lateral izquierdo con menu de navegacion
 * - Area principal derecha con contenido dinamico
 * - Selector de planta en el sidebar
 * - Tabla de equipos para seleccionar equipo a auditar
 *
 * @version 2.0.0
 */

import React, { useState, useEffect, useCallback } from "react";
import { CheckCircle } from "lucide-react";

// Componentes del Auditor
import AuditorSidebar from "../auditor/AuditorSidebar";
import AuditorPlantsList from "../auditor/AuditorPlantsList";
import AuditorEquipmentTable from "../auditor/AuditorEquipmentTable";
import AuditorEquipmentReview from "../auditor/AuditorEquipmentReview";

// Servicios
import {
  getPlants,
  getEquipmentByPlant,
  updateEquipment,
} from "../../services/firebase/firebaseServices";

/**
 * Panel de bienvenida cuando no hay planta seleccionada
 */
const WelcomePanel = ({ plantsCount }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
      <CheckCircle className="w-8 h-8 text-blue-600" />
    </div>
    <h2 className="text-2xl font-bold text-gray-900 mb-2">
      Panel de Auditoria
    </h2>
    <p className="text-gray-600 mb-4">
      Selecciona una planta en el menu lateral para comenzar la auditoria de equipos.
    </p>
    <p className="text-sm text-gray-500">
      {plantsCount} planta{plantsCount !== 1 ? "s" : ""} disponible{plantsCount !== 1 ? "s" : ""}
    </p>
  </div>
);

/**
 * Componente Principal del Layout del Auditor
 */
export const AuditorLayout = ({ user }) => {
  // ============================================
  // ESTADOS PRINCIPALES
  // ============================================

  // Estados de datos
  const [plants, setPlants] = useState([]);
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [equipment, setEquipment] = useState([]);
  const [equipmentCountByPlant, setEquipmentCountByPlant] = useState({});

  // Estados de navegacion
  const [currentView, setCurrentView] = useState("plants"); // 'plants', 'equipment', 'review'
  const [selectedEquipmentIndex, setSelectedEquipmentIndex] = useState(0);

  // Estados de UI
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // 'all', 'revisado', 'pendiente'

  // Estado de conexion (simulado por ahora)
  const [isOffline] = useState(false);

  // ============================================
  // EFECTOS
  // ============================================

  // Cargar plantas al iniciar
  useEffect(() => {
    loadPlants();
  }, []);

  // Cargar conteo de equipos cuando cambian las plantas
  useEffect(() => {
    if (plants.length > 0) {
      loadEquipmentCounts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plants]);

  // Navegacion con teclado en vista de revision
  useEffect(() => {
    if (currentView !== "review") return;

    const handleKeyDown = (e) => {
      // Ignorar teclas si el foco esta en un campo de texto editable
      const activeElement = document.activeElement;
      const isEditableField =
        activeElement?.tagName === "TEXTAREA" ||
        activeElement?.tagName === "INPUT" ||
        activeElement?.isContentEditable;

      if (isEditableField) return;

      if (e.key === "ArrowLeft") {
        handlePreviousEquipment();
      } else if (e.key === "ArrowRight") {
        handleNextEquipment();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentView, selectedEquipmentIndex, equipment]);

  // ============================================
  // FUNCIONES DE CARGA DE DATOS
  // ============================================

  const loadPlants = async () => {
    setLoading(true);
    try {
      // console.log("Cargando plantas...");
      const result = await getPlants();

      if (result.success && result.data) {
        // console.log("Plantas cargadas:", result.data.length);
        setPlants(result.data);
      } else {
        console.error("Error al cargar plantas:", result.error);
        setPlants([]);
      }
    } catch (error) {
      console.error("Excepcion al cargar plantas:", error);
      setPlants([]);
    } finally {
      setLoading(false);
    }
  };

  const loadEquipmentCounts = async () => {
    try {
      // console.log("Contando equipos por planta...");
      const counts = {};

      for (const plant of plants) {
        const result = await getEquipmentByPlant(plant.id);

        if (result.success && result.data) {
          const plantEquipment = result.data;
          const total = plantEquipment.length;
          const reviewed = plantEquipment.filter((eq) => eq.reviewStatus === "revisado").length;
          const pending = total - reviewed;

          counts[plant.id] = { total, reviewed, pending };
        } else {
          counts[plant.id] = { total: 0, reviewed: 0, pending: 0 };
        }
      }

      setEquipmentCountByPlant(counts);
      // console.log("Conteo completado");
    } catch (error) {
      console.error("Error al contar equipos:", error);
    }
  };

  const loadEquipmentForPlant = async (plant) => {
    setLoading(true);
    try {
      // console.log(`Cargando equipos de planta: ${plant.name}`);
      const result = await getEquipmentByPlant(plant.id);

      if (result.success && result.data) {
        // Ordenar por nombre
        const sortedEquipment = [...result.data].sort((a, b) =>
          (a.name || "").localeCompare(b.name || "")
        );
        // console.log("Equipos cargados:", sortedEquipment.length);
        setEquipment(sortedEquipment);
      } else {
        console.error("Error:", result.error);
        setEquipment([]);
      }
    } catch (error) {
      console.error("Excepcion al cargar equipos:", error);
      setEquipment([]);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // FUNCIONES DE GUARDADO
  // ============================================

  const handleSaveEquipment = async (updatedData) => {
    setSaving(true);
    try {
      const currentEquipment = equipment[selectedEquipmentIndex];
      // console.log("Guardando cambios en equipo:", currentEquipment.id);

      const result = await updateEquipment(currentEquipment.id, updatedData);

      if (result.success) {
        // console.log("Equipo actualizado correctamente");

        // Actualizar el equipo en el estado local
        const updatedEquipment = [...equipment];
        updatedEquipment[selectedEquipmentIndex] = {
          ...currentEquipment,
          ...updatedData,
        };
        setEquipment(updatedEquipment);

        showSuccess("Cambios guardados correctamente");
      } else {
        console.error("Error al guardar:", result.error);
        alert("Error al guardar los cambios: " + result.error);
      }
    } catch (error) {
      console.error("Excepcion al guardar:", error);
      alert("Error al guardar los cambios");
    } finally {
      setSaving(false);
    }
  };

  const handleMarkReviewed = async (reviewData) => {
    const currentEquipment = equipment[selectedEquipmentIndex];
    const wasReviewed = currentEquipment.reviewStatus === "revisado";
    const newStatus = reviewData.reviewStatus;

    setSaving(true);
    try {
      // console.log("Cambiando estado del equipo:", currentEquipment.id, "a", newStatus);

      // Agregar datos del usuario si se marca como revisado
      const dataToSave = {
        ...reviewData,
        reviewedBy: newStatus === "revisado" ? (user?.uid || null) : null,
        reviewerName: newStatus === "revisado" ? (user?.displayName || user?.email || "Auditor") : null,
      };

      const result = await updateEquipment(currentEquipment.id, dataToSave);

      if (result.success) {
        // console.log("Estado actualizado correctamente");

        // Actualizar el equipo en el estado local
        const updatedEquipment = [...equipment];
        updatedEquipment[selectedEquipmentIndex] = {
          ...currentEquipment,
          ...dataToSave,
        };
        setEquipment(updatedEquipment);

        // Actualizar conteo segun el cambio de estado
        const counts = { ...equipmentCountByPlant };
        if (counts[selectedPlant.id]) {
          if (newStatus === "revisado" && !wasReviewed) {
            // Cambio de pendiente a revisado
            counts[selectedPlant.id].reviewed += 1;
            counts[selectedPlant.id].pending -= 1;
          } else if (newStatus === "pendiente" && wasReviewed) {
            // Cambio de revisado a pendiente
            counts[selectedPlant.id].reviewed -= 1;
            counts[selectedPlant.id].pending += 1;
          }
          setEquipmentCountByPlant(counts);
        }

        showSuccess(
          newStatus === "revisado"
            ? "Equipo marcado como revisado"
            : "Equipo marcado como pendiente"
        );

        // Avanzar al siguiente equipo si se marco como revisado y hay mas
        if (newStatus === "revisado" && selectedEquipmentIndex < equipment.length - 1) {
          setTimeout(() => {
            handleNextEquipment();
          }, 1000);
        }
      } else {
        console.error("Error al cambiar estado:", result.error);
        alert("Error al cambiar estado: " + result.error);
      }
    } catch (error) {
      console.error("Excepcion al cambiar estado:", error);
      alert("Error al actualizar el estado");
    } finally {
      setSaving(false);
    }
  };

  // ============================================
  // FUNCIONES DE NAVEGACION
  // ============================================

  const handleSelectPlant = useCallback(async (plant) => {
    // console.log("Seleccionando planta:", plant.name);
    setSelectedPlant(plant);
    setSearchTerm("");
    setFilterStatus("all");
    await loadEquipmentForPlant(plant);
    setCurrentView("equipment");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectEquipment = useCallback((equip, index) => {
    // console.log("Seleccionando equipo indice:", index);
    setSelectedEquipmentIndex(index);
    setCurrentView("review");
  }, []);

  const handleNavigate = useCallback((view) => {
    // console.log("Navegando a:", view);
    if (view === "equipment" && !selectedPlant) {
      return;
    }
    setCurrentView(view);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPlant]);

  const handleBackToEquipmentList = useCallback(() => {
    // console.log("Volviendo a lista de equipos");
    setCurrentView("equipment");
  }, []);

  const handleNextEquipment = useCallback(() => {
    if (selectedEquipmentIndex < equipment.length - 1) {
      setSelectedEquipmentIndex(selectedEquipmentIndex + 1);
    }
  }, [selectedEquipmentIndex, equipment.length]);

  const handlePreviousEquipment = useCallback(() => {
    if (selectedEquipmentIndex > 0) {
      setSelectedEquipmentIndex(selectedEquipmentIndex - 1);
    }
  }, [selectedEquipmentIndex]);

  const handleFirstEquipment = useCallback(() => {
    setSelectedEquipmentIndex(0);
  }, []);

  const handleLastEquipment = useCallback(() => {
    setSelectedEquipmentIndex(equipment.length - 1);
  }, [equipment.length]);

  // ============================================
  // FUNCIONES DE UTILIDAD
  // ============================================

  const showSuccess = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  // ============================================
  // RENDERIZADO DEL CONTENIDO PRINCIPAL
  // ============================================

  const renderMainContent = () => {
    // Vista de lista de plantas
    if (currentView === "plants") {
      return (
        <AuditorPlantsList
          plants={plants}
          onSelectPlant={handleSelectPlant}
          loading={loading}
          equipmentCountByPlant={equipmentCountByPlant}
        />
      );
    }

    // Vista de tabla de equipos
    if (currentView === "equipment" && selectedPlant) {
      return (
        <AuditorEquipmentTable
          equipment={equipment}
          plantName={selectedPlant.name}
          plantLocation={selectedPlant.location}
          onSelectEquipment={handleSelectEquipment}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          isLoading={loading}
          filterStatus={filterStatus}
          onFilterStatusChange={setFilterStatus}
        />
      );
    }

    // Vista de revision de equipo
    if (currentView === "review" && selectedPlant && equipment.length > 0) {
      const currentEquipment = equipment[selectedEquipmentIndex];
      return (
        <AuditorEquipmentReview
          equipment={currentEquipment}
          plant={selectedPlant}
          onSave={handleSaveEquipment}
          onMarkReviewed={handleMarkReviewed}
          saving={saving}
          currentIndex={selectedEquipmentIndex}
          totalEquipment={equipment.length}
          onPrevious={handlePreviousEquipment}
          onNext={handleNextEquipment}
          onFirst={handleFirstEquipment}
          onLast={handleLastEquipment}
          onBackToList={handleBackToEquipmentList}
        />
      );
    }

    // Vista por defecto (bienvenida)
    return <WelcomePanel plantsCount={plants.length} />;
  };

  // ============================================
  // RENDER PRINCIPAL
  // ============================================

  // console.log("Renderizando interfaz de AUDITOR v2.0");

  return (
    <div className="layout-main flex min-h-screen min-h-dvh bg-gray-100">
      {/* Sidebar izquierdo */}
      <AuditorSidebar
        plants={plants}
        selectedPlant={selectedPlant}
        onPlantSelect={handleSelectPlant}
        currentView={currentView}
        onNavigate={handleNavigate}
        user={user}
        isOffline={isOffline}
        equipmentCounts={equipmentCountByPlant}
      />

      {/* Area principal derecha - responsive */}
      <main className="main-content-responsive flex-1 p-4 laptop-sm:p-5 xl:p-6 overflow-auto">
        {/* Mensaje de exito */}
        {successMessage && (
          <div className="fixed top-4 right-4 bg-green-500 text-white px-4 laptop-sm:px-6 py-2 laptop-sm:py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 animate-fade-in text-sm laptop-sm:text-base">
            <CheckCircle className="w-4 h-4 laptop-sm:w-5 laptop-sm:h-5" />
            {successMessage}
          </div>
        )}

        {/* Contenido principal */}
        {renderMainContent()}
      </main>
    </div>
  );
};

export default AuditorLayout;
