/**
 * VisualizadorLayout.jsx - Layout con sidebar para usuarios Visualizador
 *
 * Nuevo diseno homologado con AuditorLayout:
 * - Sidebar lateral izquierdo con menu de navegacion
 * - Area principal derecha con contenido dinamico
 * - Selector de planta en el sidebar
 * - Tabla de equipos para seleccionar equipo a consultar
 *
 * @version 2.0.0 - Homologado con AuditorLayout
 */

import React, { useState, useEffect, useCallback } from "react";
import { Eye, Menu } from "lucide-react";

// Componentes del Visualizador
import VisualizadorSidebar from "../visualizador/VisualizadorSidebar";
import VisualizadorPlantsList from "../visualizador/VisualizadorPlantsList";
import VisualizadorEquipmentTable from "../visualizador/VisualizadorEquipmentTable";
import { ExpedienteViewer } from "../visualizador/ExpedienteViewer";
import { useExpediente } from "../visualizador/hooks/useExpediente";

// Servicios
import {
  getPlants,
  getEquipmentByPlant,
} from "../../services/firebase/firebaseServices";

/**
 * Panel de bienvenida cuando no hay planta seleccionada
 */
const WelcomePanel = ({ plantsCount }) => (
  <div className="card-responsive bg-white rounded-xl shadow-sm border border-gray-200 p-8 laptop-sm:p-10 xl:p-12 text-center">
    <div className="w-12 h-12 laptop-sm:w-14 laptop-sm:h-14 xl:w-16 xl:h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3 laptop-sm:mb-4">
      <Eye className="w-6 h-6 laptop-sm:w-7 laptop-sm:h-7 xl:w-8 xl:h-8 text-purple-600" />
    </div>
    <h2 className="text-responsive-xl laptop-sm:text-xl xl:text-2xl font-bold text-gray-900 mb-2">
      Panel de Consulta
    </h2>
    <p className="text-responsive-sm laptop-sm:text-sm xl:text-base text-gray-600 mb-3 laptop-sm:mb-4">
      Selecciona una planta en el menu lateral para consultar los equipos.
    </p>
    <p className="text-responsive-xs laptop-sm:text-xs xl:text-sm text-gray-500">
      {plantsCount} planta{plantsCount !== 1 ? "s" : ""} disponible{plantsCount !== 1 ? "s" : ""}
    </p>
  </div>
);

/**
 * Componente Principal del Layout del Visualizador
 */
export const VisualizadorLayout = ({ user, roleName }) => {
  // ============================================
  // ESTADOS PRINCIPALES
  // ============================================

  // Estados de datos
  const [plants, setPlants] = useState([]);
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [equipment, setEquipment] = useState([]);
  const [equipmentCountByPlant, setEquipmentCountByPlant] = useState({});

  // Estados de navegacion
  const [currentView, setCurrentView] = useState("plants"); // 'plants', 'equipment', 'detail'
  const [selectedEquipmentIndex, setSelectedEquipmentIndex] = useState(0);

  // Estados de UI
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all"); // 'all', 'revisado', 'pendiente'

  // Estado de conexion (simulado por ahora)
  const [isOffline] = useState(false);

  // Hook del expediente para la vista de detalle
  const selectedEquipment = equipment[selectedEquipmentIndex];
  const expediente = useExpediente(
    selectedEquipment?.id,
    selectedEquipment?.plantId || selectedPlant?.id
  );

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

  // ============================================
  // FUNCIONES DE CARGA DE DATOS
  // ============================================

  const loadPlants = async () => {
    setLoading(true);
    try {
      const result = await getPlants();

      if (result.success && result.data) {
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
    } catch (error) {
      console.error("Error al contar equipos:", error);
    }
  };

  const loadEquipmentForPlant = async (plant) => {
    setLoading(true);
    try {
      const result = await getEquipmentByPlant(plant.id);

      if (result.success && result.data) {
        // Ordenar por nombre
        const sortedEquipment = [...result.data].sort((a, b) =>
          (a.name || "").localeCompare(b.name || "")
        );
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
  // FUNCIONES DE NAVEGACION
  // ============================================

  const handleSelectPlant = useCallback(async (plant) => {
    setSelectedPlant(plant);
    setSearchTerm("");
    setFilterStatus("all");
    await loadEquipmentForPlant(plant);
    setCurrentView("equipment");
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectEquipment = useCallback((equip, index) => {
    setSelectedEquipmentIndex(index);
    setCurrentView("detail");
  }, []);

  const handleNavigate = useCallback((view) => {
    if (view === "equipment" && !selectedPlant) {
      return;
    }
    setCurrentView(view);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPlant]);

  const handleBackToEquipmentList = useCallback(() => {
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
  // RENDERIZADO DEL CONTENIDO PRINCIPAL
  // ============================================

  const renderMainContent = () => {
    // Vista de lista de plantas
    if (currentView === "plants") {
      return (
        <VisualizadorPlantsList
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
        <VisualizadorEquipmentTable
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

    // Vista de detalle de equipo (Expediente)
    if (currentView === "detail" && selectedPlant && equipment.length > 0) {
      return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* Header con navegacion - responsive */}
          <div className="equipment-header-responsive px-4 py-3 laptop-sm:px-5 laptop-sm:py-3.5 xl:px-6 xl:py-4 border-b border-gray-200 bg-gradient-to-r from-purple-600 to-purple-700">
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0 flex-1">
                <h2 className="text-responsive-lg laptop-sm:text-lg xl:text-xl font-bold text-white truncate">
                  {selectedEquipment?.name || 'Equipo'}
                </h2>
                <p className="text-responsive-xs laptop-sm:text-xs xl:text-sm text-purple-100 mt-0.5 laptop-sm:mt-1 truncate">
                  {selectedPlant.name} - Equipo {selectedEquipmentIndex + 1} de {equipment.length}
                </p>
              </div>
              <button
                onClick={handleBackToEquipmentList}
                className="px-3 py-1.5 laptop-sm:px-4 laptop-sm:py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors text-xs laptop-sm:text-sm whitespace-nowrap"
              >
                Volver a Lista
              </button>
            </div>

            {/* Navegacion entre equipos - responsive */}
            <div className="nav-buttons-responsive flex items-center gap-1.5 laptop-sm:gap-2 mt-2 laptop-sm:mt-3 xl:mt-4 flex-wrap">
              <button
                onClick={handleFirstEquipment}
                disabled={selectedEquipmentIndex === 0}
                className="px-2 py-1 laptop-sm:px-3 laptop-sm:py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs laptop-sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Primero
              </button>
              <button
                onClick={handlePreviousEquipment}
                disabled={selectedEquipmentIndex === 0}
                className="px-2 py-1 laptop-sm:px-3 laptop-sm:py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs laptop-sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Anterior
              </button>
              <span className="px-2 laptop-sm:px-4 text-white text-xs laptop-sm:text-sm">
                {selectedEquipmentIndex + 1} / {equipment.length}
              </span>
              <button
                onClick={handleNextEquipment}
                disabled={selectedEquipmentIndex === equipment.length - 1}
                className="px-2 py-1 laptop-sm:px-3 laptop-sm:py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs laptop-sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Siguiente
              </button>
              <button
                onClick={handleLastEquipment}
                disabled={selectedEquipmentIndex === equipment.length - 1}
                className="px-2 py-1 laptop-sm:px-3 laptop-sm:py-1.5 bg-white/20 hover:bg-white/30 text-white rounded-lg text-xs laptop-sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Ultimo
              </button>
            </div>
          </div>

          {/* Visor de Expediente - altura responsive */}
          <div className="expediente-viewer-height">
            <ExpedienteViewer
              currentPageData={expediente.currentPageData}
              currentPage={expediente.currentPage}
              totalPages={expediente.totalPages}
              goToPage={expediente.goToPage}
              nextPage={expediente.nextPage}
              prevPage={expediente.prevPage}
              firstPage={expediente.firstPage}
              lastPage={expediente.lastPage}
              hasNextPage={expediente.hasNextPage}
              hasPrevPage={expediente.hasPrevPage}
              loading={expediente.loading}
              error={expediente.error}
            />
          </div>
        </div>
      );
    }

    // Vista por defecto (bienvenida)
    return <WelcomePanel plantsCount={plants.length} />;
  };

  // ============================================
  // RENDER PRINCIPAL
  // ============================================

  return (
    <div className="layout-main flex min-h-screen min-h-dvh bg-gray-100">
      {/* Sidebar izquierdo */}
      <VisualizadorSidebar
        plants={plants}
        selectedPlant={selectedPlant}
        onPlantSelect={handleSelectPlant}
        currentView={currentView}
        onNavigate={handleNavigate}
        user={user}
        isOffline={isOffline}
        equipmentCounts={equipmentCountByPlant}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Area principal derecha - responsive */}
      <main className="main-content-responsive flex-1 p-4 laptop-sm:p-5 xl:p-6 overflow-auto">
        {/* Boton hamburguesa para movil */}
        <button
          onClick={() => setSidebarOpen(true)}
          className="md:hidden fixed top-3 left-3 z-30 p-2 bg-gray-900 text-white rounded-lg shadow-lg hover:bg-gray-800 transition-colors"
          aria-label="Abrir menu"
        >
          <Menu size={22} />
        </button>

        {/* Contenido principal */}
        {renderMainContent()}
      </main>
    </div>
  );
};

export default VisualizadorLayout;
