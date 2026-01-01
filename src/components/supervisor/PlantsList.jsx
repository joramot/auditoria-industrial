import React from "react";
import {
  Search,
  Plus,
  ChevronRight,
  CheckCircle,
  Database,
  Loader,
} from "lucide-react";

/**
 * PlantsList - Componente para mostrar la lista de plantas
 *
 * @param {Object} props
 * @param {Array} props.plants - Array de plantas filtradas a mostrar
 * @param {Function} props.onSelectPlant - Callback al seleccionar una planta
 * @param {Function} props.onNewPlant - Callback para crear nueva planta
 * @param {string} props.searchTerm - Termino de busqueda actual
 * @param {Function} props.onSearchChange - Callback al cambiar busqueda
 * @param {boolean} props.isLoading - Estado de carga
 * @param {boolean} props.isOffline - Estado de conexion
 * @param {boolean} props.showSuccessMessage - Mostrar mensaje de exito
 * @param {string} props.successMessage - Texto del mensaje de exito
 */
export const PlantsList = ({
  plants = [],
  onSelectPlant,
  onNewPlant,
  searchTerm = "",
  onSearchChange,
  isLoading = false,
  isOffline = false,
  showSuccessMessage = false,
  successMessage = "",
}) => {
  return (
    <div className="p-4 pb-24 bg-gray-50 min-h-screen">
      {/* Barra de búsqueda y botón nueva planta */}
      <div className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar plantas..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={onNewPlant}
          className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 px-4 shadow-md"
        >
          <Plus className="w-6 h-6" />
          <span className="text-sm font-medium">Planta</span>
        </button>
      </div>

      {/* Mensaje de éxito */}
      {showSuccessMessage && (
        <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {/* Estado de carga */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="space-y-3">
          {/* Lista de plantas */}
          {plants.map((plant) => (
            <div
              key={plant.id}
              onClick={() => onSelectPlant(plant)}
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
                  Ultima auditoria: {plant.lastAudit}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Estado vacío */}
      {!isLoading && plants.length === 0 && (
        <div className="text-center py-12">
          <Database className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500">No se encontraron plantas</p>
          <button
            onClick={onNewPlant}
            className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Agregar primera planta
          </button>
        </div>
      )}
    </div>
  );
};

export default PlantsList;