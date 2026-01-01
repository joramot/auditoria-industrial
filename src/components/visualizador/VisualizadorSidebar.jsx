/**
 * VisualizadorSidebar.jsx - Barra lateral del visualizador
 *
 * Contiene:
 * - Botón regresar (a lista)
 * - Botón salir (logout)
 * - Campo de búsqueda
 * - Filtros por planta
 * - Lista navegable de equipos
 * - Botones de descarga e impresión
 */

import React, { useState } from 'react';
import {
  ArrowLeft,
  LogOut,
  Search,
  Filter,
  Printer,
  Download,
  ChevronDown,
  ChevronRight,
  Package,
  Building2,
  FileText
} from 'lucide-react';
import { logout } from '../../services/auth/authService';

/**
 * @param {Object} props
 * @param {Array} props.plants - Lista de plantas
 * @param {Array} props.equipment - Lista de equipos
 * @param {Object} props.selectedPlant - Planta seleccionada
 * @param {Object} props.selectedEquipment - Equipo seleccionado
 * @param {Function} props.onSelectPlant - Callback al seleccionar planta
 * @param {Function} props.onSelectEquipment - Callback al seleccionar equipo
 * @param {Function} props.onBack - Callback para regresar
 * @param {boolean} props.showEquipmentList - Mostrar lista de equipos
 */
export const VisualizadorSidebar = ({
  plants = [],
  equipment = [],
  selectedPlant,
  selectedEquipment,
  onSelectPlant,
  onSelectEquipment,
  onBack,
  showEquipmentList = false
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedPlants, setExpandedPlants] = useState({});
  const [filterPlant, setFilterPlant] = useState('all');

  // Función de logout
  const handleLogout = async () => {
    if (window.confirm('¿Cerrar sesión?')) {
      await logout();
    }
  };

  // Función de impresión
  const handlePrint = () => {
    window.print();
  };

  // Filtrar equipos por búsqueda y planta
  const filteredEquipment = equipment.filter(equip => {
    const matchesSearch = searchTerm === '' ||
      (equip.name || equip.equipmentName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (equip.serialNumber || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPlant = filterPlant === 'all' || equip.plantId === filterPlant;

    return matchesSearch && matchesPlant;
  });

  // Toggle expandir planta
  const togglePlant = (plantId) => {
    setExpandedPlants(prev => ({
      ...prev,
      [plantId]: !prev[plantId]
    }));
  };

  // Obtener equipos de una planta
  const getPlantEquipment = (plantId) => {
    return filteredEquipment.filter(e => e.plantId === plantId);
  };

  return (
    <div className="h-full flex flex-col bg-gray-50 border-r border-gray-200">
      {/* Encabezado con botones principales */}
      <div className="p-3 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-3">
          {/* Botón Regresar */}
          {showEquipmentList && onBack && (
            <button
              onClick={onBack}
              className="flex items-center gap-1 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Regresar</span>
            </button>
          )}

          {/* Botón Salir */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-1 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-auto"
          >
            <LogOut className="w-4 h-4" />
            <span>Salir</span>
          </button>
        </div>

        {/* Título de sección */}
        <div className="flex items-center gap-2 text-gray-800 font-medium mb-3">
          <FileText className="w-5 h-5 text-purple-600" />
          <span>Expedientes</span>
        </div>

        {/* Campo de búsqueda */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar equipo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          />
        </div>
      </div>

      {/* Filtros */}
      <div className="p-3 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center gap-2 mb-2 text-sm text-gray-600">
          <Filter className="w-4 h-4" />
          <span>Filtrar por planta</span>
        </div>
        <select
          value={filterPlant}
          onChange={(e) => setFilterPlant(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500"
        >
          <option value="all">Todas las plantas</option>
          {plants.map(plant => (
            <option key={plant.id} value={plant.id}>
              {plant.name}
            </option>
          ))}
        </select>
      </div>

      {/* Lista de plantas y equipos */}
      <div className="flex-1 overflow-y-auto p-2">
        {plants.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Building2 className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No hay plantas disponibles</p>
          </div>
        ) : (
          <div className="space-y-1">
            {plants
              .filter(plant => filterPlant === 'all' || plant.id === filterPlant)
              .map(plant => {
                const plantEquipment = getPlantEquipment(plant.id);
                const isExpanded = expandedPlants[plant.id];

                return (
                  <div key={plant.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    {/* Header de planta */}
                    <button
                      onClick={() => togglePlant(plant.id)}
                      className={`w-full flex items-center gap-2 p-3 text-left hover:bg-gray-50 transition-colors ${
                        selectedPlant?.id === plant.id ? 'bg-purple-50' : ''
                      }`}
                    >
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                      )}
                      <Building2 className="w-4 h-4 text-purple-600" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {plant.name}
                        </p>
                        <p className="text-xs text-gray-500">
                          {plantEquipment.length} equipo(s)
                        </p>
                      </div>
                    </button>

                    {/* Lista de equipos de la planta */}
                    {isExpanded && (
                      <div className="border-t border-gray-100 bg-gray-50">
                        {plantEquipment.length === 0 ? (
                          <p className="p-3 text-xs text-gray-500 text-center">
                            No hay equipos
                          </p>
                        ) : (
                          plantEquipment.map(equip => (
                            <button
                              key={equip.id}
                              onClick={() => {
                                onSelectPlant(plant);
                                onSelectEquipment(equip);
                              }}
                              className={`w-full flex items-center gap-2 p-3 pl-8 text-left hover:bg-purple-50 transition-colors border-t border-gray-100 ${
                                selectedEquipment?.id === equip.id
                                  ? 'bg-purple-100 border-l-4 border-l-purple-600'
                                  : ''
                              }`}
                            >
                              <Package className="w-4 h-4 text-gray-400" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-800 truncate">
                                  {equip.name || equip.equipmentName || 'Sin nombre'}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                  {equip.serialNumber || 'Sin serie'}
                                </p>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        )}
      </div>

      {/* Barra de acciones inferior */}
      <div className="p-3 border-t border-gray-200 bg-white">
        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            disabled={!selectedEquipment}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Imprimir expediente"
          >
            <Printer className="w-4 h-4" />
            <span className="text-sm">Imprimir</span>
          </button>
          <button
            disabled={!selectedEquipment}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Descargar expediente"
          >
            <Download className="w-4 h-4" />
            <span className="text-sm">Descargar</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default VisualizadorSidebar;
