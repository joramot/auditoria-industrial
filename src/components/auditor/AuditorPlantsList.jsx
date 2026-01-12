/**
 * AuditorPlantsList.jsx - Lista de Plantas para Auditor
 * Muestra todas las plantas con progreso de auditoria y acceso a equipos
 *
 * @version 2.0.0
 */

import React from 'react';
import {
  MapPin,
  AlertCircle,
  Building2,
  User,
  ArrowRight,
  CheckCircle,
  Clock,
  Package,
} from 'lucide-react';

/**
 * Componente de Lista de Plantas para Auditor
 *
 * @param {Object} props
 * @param {Array} props.plants - Lista de plantas
 * @param {Object} props.equipmentCountByPlant - Contador de equipos por planta
 * @param {Function} props.onSelectPlant - Callback al seleccionar una planta
 * @param {boolean} props.loading - Estado de carga
 */
const AuditorPlantsList = ({
  plants = [],
  equipmentCountByPlant = {},
  onSelectPlant,
  loading = false
}) => {

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Plantas Disponibles</h2>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-gray-50 rounded-lg p-4 animate-pulse">
              <div className="h-5 bg-gray-200 rounded w-1/3 mb-3"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
              <div className="h-2 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (plants.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <Building2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          No hay plantas registradas
        </h3>
        <p className="text-sm text-gray-600">
          Contacta al administrador para que agregue plantas al sistema.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
        <h2 className="text-xl font-bold text-white">Plantas Disponibles</h2>
        <p className="text-sm text-blue-100 mt-1">
          Selecciona una planta para auditar sus equipos
        </p>
      </div>

      {/* Lista de plantas */}
      <div className="divide-y divide-gray-200">
        {plants.map(plant => {
          const counts = equipmentCountByPlant[plant.id] || { total: 0, reviewed: 0, pending: 0 };
          const hasEquipment = counts.total > 0;
          const progress = counts.total > 0 ? Math.round((counts.reviewed / counts.total) * 100) : 0;
          const isComplete = progress === 100 && counts.total > 0;

          return (
            <div
              key={plant.id}
              className="p-5 hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-start gap-4">
                {/* Icono y estado */}
                <div className={`
                  w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
                  ${isComplete
                    ? 'bg-green-100 text-green-600'
                    : hasEquipment
                      ? 'bg-blue-100 text-blue-600'
                      : 'bg-gray-100 text-gray-400'
                  }
                `}>
                  {isComplete ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : (
                    <Building2 className="w-6 h-6" />
                  )}
                </div>

                {/* Informacion de la planta */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-bold text-gray-900 text-lg truncate">
                      {plant.name}
                    </h3>
                    {isComplete && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Completado
                      </span>
                    )}
                  </div>

                  {/* Ubicacion */}
                  <div className="flex items-center gap-1 text-sm text-gray-600 mb-2">
                    <MapPin className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{plant.location || 'Sin ubicacion'}</span>
                  </div>

                  {/* Responsable */}
                  {plant.responsiblePerson && (
                    <div className="flex items-center gap-1 text-xs text-gray-500 mb-3">
                      <User className="w-3 h-3" />
                      <span>{plant.responsiblePerson}</span>
                    </div>
                  )}

                  {/* Progreso y contadores */}
                  {hasEquipment ? (
                    <div className="space-y-2">
                      {/* Barra de progreso */}
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${
                              isComplete ? 'bg-green-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <span className={`text-sm font-semibold ${isComplete ? 'text-green-600' : 'text-blue-600'}`}>
                          {progress}%
                        </span>
                      </div>

                      {/* Contadores */}
                      <div className="flex items-center gap-4 text-xs">
                        <div className="flex items-center gap-1.5 text-gray-600">
                          <Package className="w-3.5 h-3.5" />
                          <span>{counts.total} total</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-green-600">
                          <CheckCircle className="w-3.5 h-3.5" />
                          <span>{counts.reviewed} revisados</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-orange-600">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{counts.pending} pendientes</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-gray-500 text-sm">
                      <AlertCircle className="w-4 h-4" />
                      <span>Sin equipos registrados</span>
                    </div>
                  )}
                </div>

                {/* Boton de accion */}
                <div className="flex-shrink-0">
                  <button
                    onClick={() => onSelectPlant(plant)}
                    className={`
                      px-5 py-2.5 rounded-lg font-semibold transition-colors flex items-center gap-2
                      ${hasEquipment
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                      }
                    `}
                    disabled={!hasEquipment}
                  >
                    <span>Auditar</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer con resumen */}
      <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            {plants.length} planta{plants.length !== 1 ? 's' : ''} disponible{plants.length !== 1 ? 's' : ''}
          </span>
          <span className="text-gray-500">
            Selecciona una planta para comenzar
          </span>
        </div>
      </div>
    </div>
  );
};

export default AuditorPlantsList;
