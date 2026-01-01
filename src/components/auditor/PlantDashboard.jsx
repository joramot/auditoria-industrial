/**
 * PlantDashboard.jsx - Dashboard de Resumen de Auditoría por Planta
 * Muestra estadísticas e indicadores de la planta seleccionada
 */

import React from 'react';
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Package,
  TrendingUp,
  ArrowRight
} from 'lucide-react';

/**
 * Componente de Dashboard de Planta
 *
 * @param {Object} props
 * @param {Object} props.plant - Planta seleccionada
 * @param {Object} props.equipmentCounts - Contadores de equipos { total, reviewed, pending }
 * @param {Function} props.onBackToPlants - Callback para volver a la lista de plantas
 * @param {Function} props.onViewEquipment - Callback para ver lista de equipos
 */
const PlantDashboard = ({
  plant,
  equipmentCounts = { total: 0, reviewed: 0, pending: 0 },
  onBackToPlants,
  onViewEquipment
}) => {

  // Calcular porcentaje de progreso
  const reviewProgress = equipmentCounts.total > 0
    ? Math.round((equipmentCounts.reviewed / equipmentCounts.total) * 100)
    : 0;

  return (
    <div>
      {/* Header: Panel de Auditoría con nombre de planta */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-4">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Panel de Auditoría
        </h1>
        <div className="flex items-center gap-2">
          <div className="w-1 h-6 bg-blue-600 rounded"></div>
          <p className="text-lg font-semibold text-blue-600">
            {plant?.name}
          </p>
        </div>
        {plant?.location && (
          <p className="text-sm text-gray-600 mt-1 ml-3">
            {plant.location}
          </p>
        )}
      </div>

      {/* Resumen de Auditoría */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-4">
        <h2 className="text-xl font-bold text-gray-800 mb-6">
          Resumen de Auditoría
        </h2>

        {/* Grid de Indicadores */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Total de Equipos */}
          <div className="bg-blue-50 rounded-lg p-5 border-l-4 border-blue-500">
            <div className="flex items-center justify-between mb-2">
              <Package className="w-8 h-8 text-blue-600" />
            </div>
            <p className="text-3xl font-bold text-gray-800 mb-1">
              {equipmentCounts.total}
            </p>
            <p className="text-sm text-gray-600 font-medium">
              Total de Equipos
            </p>
          </div>

          {/* Equipos Revisados */}
          <div className="bg-green-50 rounded-lg p-5 border-l-4 border-green-500">
            <div className="flex items-center justify-between mb-2">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <p className="text-3xl font-bold text-gray-800 mb-1">
              {equipmentCounts.reviewed}
            </p>
            <p className="text-sm text-gray-600 font-medium">
              Equipos Revisados
            </p>
          </div>

          {/* Equipos Pendientes */}
          <div className="bg-orange-50 rounded-lg p-5 border-l-4 border-orange-500">
            <div className="flex items-center justify-between mb-2">
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
            <p className="text-3xl font-bold text-gray-800 mb-1">
              {equipmentCounts.pending}
            </p>
            <p className="text-sm text-gray-600 font-medium">
              Equipos Pendientes
            </p>
          </div>
        </div>

        {/* Indicador de Progreso */}
        <div className="bg-gray-50 rounded-lg p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h3 className="text-lg font-semibold text-gray-800">
                Progreso de Revisión
              </h3>
            </div>
            <span className="text-2xl font-bold text-blue-600">
              {reviewProgress}%
            </span>
          </div>

          {/* Barra de Progreso */}
          <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
            <div
              className={`h-4 rounded-full transition-all duration-500 ${
                reviewProgress === 100 ? 'bg-green-500' : 'bg-blue-500'
              }`}
              style={{ width: `${reviewProgress}%` }}
            />
          </div>

          <div className="flex justify-between text-sm text-gray-600 mt-2">
            <span>{equipmentCounts.reviewed} de {equipmentCounts.total} completados</span>
            {reviewProgress === 100 && (
              <span className="text-green-600 font-medium flex items-center gap-1">
                <CheckCircle className="w-4 h-4" />
                Auditoría Completa
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Botones de navegación */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex gap-4">
          {/* Botón Volver a Plantas - Izquierda */}
          <button
            onClick={onBackToPlants}
            className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-3 text-lg"
          >
            <ArrowLeft className="w-6 h-6" />
            <span>Volver a Plantas</span>
          </button>

          {/* Botón Ver Lista de Equipos - Derecha */}
          <button
            onClick={onViewEquipment}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-3 text-lg"
          >
            <span>Ver Lista de Equipos</span>
            <ArrowRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default PlantDashboard;
