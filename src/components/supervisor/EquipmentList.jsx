import React from "react";
import {
  Search,
  Plus,
  CheckCircle,
  AlertCircle,
  Database,
  Loader,
} from "lucide-react";

/**
 * EquipmentList - Componente para mostrar la lista de equipos de una planta
 * 
 * @param {Object} props
 * @param {Array} props.equipment - Array de equipos a mostrar
 * @param {Object} props.selectedPlant - Planta seleccionada
 * @param {Function} props.onSelectEquipment - Callback al seleccionar un equipo
 * @param {Function} props.onNewEquipment - Callback para crear nuevo equipo
 * @param {string} props.searchTerm - Término de búsqueda actual
 * @param {Function} props.onSearchChange - Callback al cambiar búsqueda
 * @param {boolean} props.isLoading - Estado de carga
 * @param {boolean} props.showSuccessMessage - Mostrar mensaje de éxito
 * @param {string} props.successMessage - Texto del mensaje de éxito
 */
const EMPTY_ARRAY = [];

export const EquipmentList = ({
  equipment = EMPTY_ARRAY,
  selectedPlant = null,
  onSelectEquipment,
  onNewEquipment,
  searchTerm = "",
  onSearchChange,
  isLoading = false,
  showSuccessMessage = false,
  successMessage = "",
}) => {
  const filteredEquipment = equipment.filter((equip) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      equip.name.toLowerCase().includes(searchLower) ||
      equip.location.toLowerCase().includes(searchLower) ||
      equip.serialNumber.toLowerCase().includes(searchLower) ||
      (equip.manufacturer && equip.manufacturer.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="p-4 pb-24 bg-gray-50 min-h-screen">
      {/* Encabezado con información de la planta */}
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

      {/* Barra de búsqueda y botón nuevo equipo */}
      <div className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar equipos..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button
          onClick={onNewEquipment}
          className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors shadow-md"
          title="Agregar nuevo equipo"
        >
          <Plus className="w-6 h-6" />
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
          {filteredEquipment.length > 0 ? (
            // Lista de equipos filtrados
            filteredEquipment.map((equip) => (
              <div
                key={equip.id}
                onClick={() => onSelectEquipment(equip)}
                onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') onSelectEquipment(equip); }}
                role="button"
                tabIndex={0}
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
          ) : searchTerm ? (
            // Sin resultados de búsqueda
            <div className="text-center py-12">
              <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">
                No se encontraron equipos que coincidan con "{searchTerm}"
              </p>
              <button
                onClick={() => onSearchChange("")}
                className="text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                Limpiar búsqueda
              </button>
            </div>
          ) : (
            // Estado vacío - sin equipos
            <div className="text-center py-12">
              <Database className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">
                No hay equipos registrados en esta planta
              </p>
              <button
                onClick={onNewEquipment}
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
};

export default EquipmentList;
