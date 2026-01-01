/**
 * VisualizadorDashboard.jsx - Dashboard principal del visualizador
 *
 * Estructura:
 * - Sidebar izquierdo (25% del ancho) con navegación y filtros
 * - Área de visualización (75% del ancho) con el visor de expediente
 */

import React, { useState, useEffect } from 'react';
import { Loader, PanelLeftClose, PanelLeft } from 'lucide-react';
import { VisualizadorSidebar } from './VisualizadorSidebar';
import { ExpedienteViewer } from './ExpedienteViewer';
import { useExpediente } from './hooks/useExpediente';
import { getPlants, getEquipmentByPlant } from '../../services/firebase/firebaseServices';

/**
 * @param {Object} props
 * @param {Object} props.user - Usuario actual
 */
export const VisualizadorDashboard = ({ user }) => {
  // Estado de plantas y equipos
  const [plants, setPlants] = useState([]);
  const [allEquipment, setAllEquipment] = useState([]);
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [selectedEquipment, setSelectedEquipment] = useState(null);
  const [loadingData, setLoadingData] = useState(true);

  // Estado para controlar visibilidad del sidebar
  const [sidebarVisible, setSidebarVisible] = useState(true);

  // Toggle sidebar
  const toggleSidebar = () => {
    setSidebarVisible(prev => !prev);
  };

  // Hook del expediente
  const expediente = useExpediente(
    selectedEquipment?.id,
    selectedEquipment?.plantId || selectedPlant?.id
  );

  // Cargar plantas y equipos al iniciar
  useEffect(() => {
    const loadData = async () => {
      setLoadingData(true);
      try {
        // Cargar plantas
        const plantsResult = await getPlants();
        if (plantsResult.success) {
          setPlants(plantsResult.data || []);

          // Cargar equipos de todas las plantas
          const allEquip = [];
          for (const plant of plantsResult.data || []) {
            const equipResult = await getEquipmentByPlant(plant.id);
            if (equipResult.success) {
              allEquip.push(...(equipResult.data || []));
            }
          }
          setAllEquipment(allEquip);
        }
      } catch (error) {
        console.error('Error al cargar datos:', error);
      } finally {
        setLoadingData(false);
      }
    };

    loadData();
  }, []);

  // Handlers
  const handleSelectPlant = (plant) => {
    setSelectedPlant(plant);
  };

  const handleSelectEquipment = (equipment) => {
    setSelectedEquipment(equipment);
    // Encontrar la planta del equipo
    const plant = plants.find(p => p.id === equipment.plantId);
    if (plant) {
      setSelectedPlant(plant);
    }
  };

  const handleBack = () => {
    setSelectedEquipment(null);
  };

  // Loading inicial
  if (loadingData) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <Loader className="w-12 h-12 text-purple-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando datos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex relative">
      {/* Sidebar izquierdo con animación */}
      <div
        className={`h-full transition-all duration-300 ease-in-out overflow-hidden ${
          sidebarVisible
            ? 'w-1/4 min-w-[280px] max-w-[400px]'
            : 'w-0 min-w-0'
        }`}
      >
        <div className="w-[280px] min-w-[280px] max-w-[400px] h-full">
          <VisualizadorSidebar
            plants={plants}
            equipment={allEquipment}
            selectedPlant={selectedPlant}
            selectedEquipment={selectedEquipment}
            onSelectPlant={handleSelectPlant}
            onSelectEquipment={handleSelectEquipment}
            onBack={handleBack}
            showEquipmentList={!!selectedEquipment}
          />
        </div>
      </div>

      {/* Botón toggle sidebar */}
      <button
        onClick={toggleSidebar}
        className={`absolute top-4 z-10 p-2 bg-purple-600 text-white rounded-r-lg shadow-lg hover:bg-purple-700 transition-all duration-300 ${
          sidebarVisible ? 'left-[280px]' : 'left-0'
        }`}
        title={sidebarVisible ? 'Ocultar panel' : 'Mostrar panel'}
      >
        {sidebarVisible ? (
          <PanelLeftClose className="w-5 h-5" />
        ) : (
          <PanelLeft className="w-5 h-5" />
        )}
      </button>

      {/* Área de visualización */}
      <div className="flex-1 h-full transition-all duration-300">
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
};

export default VisualizadorDashboard;
