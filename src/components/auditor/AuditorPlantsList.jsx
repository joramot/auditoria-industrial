/**
 * AuditorPlantsList.jsx - Lista de Plantas para Auditor
 * Muestra todas las plantas con total de equipos y botón Entrar
 * VERSIÓN SIMPLIFICADA - Sin barra de progreso ni indicadores de revisión
 */

import React from 'react';
import {
  MapPin,
  AlertCircle,
  Building2,
  User,
  ArrowRight
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
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-lg shadow-md p-4 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (plants.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
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
    <div className="space-y-3">
      {plants.map(plant => {
        const counts = equipmentCountByPlant[plant.id] || { total: 0, reviewed: 0, pending: 0 };
        const hasEquipment = counts.total > 0;

        return (
          <div
            key={plant.id}
            className="bg-white rounded-lg shadow-md p-5 border-l-4 border-blue-500"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  <h3 className="font-bold text-gray-800 text-lg">
                    {plant.name}
                  </h3>
                </div>
                <p className="text-sm text-gray-600 ml-7">
                  {plant.location}
                </p>
              </div>
            </div>

            {/* Info Adicional */}
            {plant.responsiblePerson && (
              <div className="flex items-center gap-2 mb-4 ml-7 text-xs text-gray-600">
                <User className="w-3 h-3" />
                <span>{plant.responsiblePerson}</span>
              </div>
            )}

            {/* Contador de Equipos y Botón */}
            <div className="flex items-center justify-between">
              <div className="bg-gray-50 rounded-lg px-4 py-2">
                <span className="text-sm font-medium text-gray-700">
                  {counts.total} {counts.total === 1 ? 'Equipo' : 'Equipos'}
                </span>
                {!hasEquipment && (
                  <div className="flex items-center gap-2 text-gray-500 mt-1">
                    <AlertCircle className="w-3 h-3" />
                    <span className="text-xs">Sin equipos registrados</span>
                  </div>
                )}
              </div>

              {/* Botón Entrar */}
              <button
                onClick={() => onSelectPlant(plant)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <span>Entrar</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AuditorPlantsList;
