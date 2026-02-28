import React from "react";
import {
  Download,
  AlertCircle,
  FileText,
  Loader,
  RefreshCw,
} from "lucide-react";

/**
 * ReportsView - Vista de reportes y sincronizacion
 *
 * @param {Object} props
 * @param {Array} props.plants - Array de plantas para estadisticas y filtros
 * @param {Object} props.syncStatus - Estado de sincronizacion
 * @param {boolean} props.isOffline - Estado de conexion
 * @param {boolean} props.isLoading - Estado de carga
 * @param {Function} props.onExport - Callback para exportar (format)
 * @param {Function} props.onSyncNow - Callback para sincronizar ahora
 * @param {boolean} props.showSuccessMessage - Mostrar mensaje de exito
 * @param {string} props.successMessage - Texto del mensaje de exito
 */
const EMPTY_ARRAY = [];

export const ReportsView = ({
  plants = EMPTY_ARRAY,
  syncStatus = {
    pendingCount: 0,
    lastSync: null,
    isSyncing: false,
  },
  isOffline = false,
  isLoading = false,
  onExport,
  onSyncNow,
  showSuccessMessage = false,
  successMessage = "",
}) => {
  return (
    <div className="p-4 pb-24 bg-gray-50 min-h-screen">
      <h2 className="text-xl font-bold text-gray-800 mb-4">
        Reportes y Exportación
      </h2>

      {/* Panel de Estado de Sincronización */}
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
              {isOffline ? "Sin conexión" : "Conectado"}
            </span>
          </div>
        </div>
        
        <button
          onClick={onSyncNow}
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

      {/* Panel de Filtros de Búsqueda */}
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
            <option>Todos los orígenes</option>
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

      {/* Panel de Exportación */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <h3 className="font-semibold text-gray-800 mb-3">Exportar Datos</h3>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onExport("excel")}
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
            onClick={() => onExport("pdf")}
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
            onClick={() => onExport("json")}
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
            onClick={() => onExport("txt")}
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

      {/* Panel de Estadísticas Generales */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <h3 className="font-semibold text-gray-800 mb-3">
          Estadísticas Generales
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

      {/* Tip de Exportacion */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-1" />
          <div className="text-sm text-blue-800">
            <p className="font-semibold mb-1">Tip: Exportacion de Datos</p>
            <p>
              Los reportes se generan desde Firebase e incluyen toda la
              informacion capturada en tiempo real.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReportsView;
