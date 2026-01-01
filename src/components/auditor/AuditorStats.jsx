/**
 * AuditorStats.jsx - Componente de Estadísticas para Auditor
 * Muestra métricas clave del progreso de auditoría
 */

import React from 'react';
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  TrendingUp,
  FileText,
  MapPin
} from 'lucide-react';

/**
 * Componente de Estadísticas del Auditor
 * 
 * @param {Object} props
 * @param {Array} props.plants - Lista de plantas
 * @param {Array} props.allEquipment - Lista de todos los equipos
 * @param {boolean} props.loading - Estado de carga
 */
const AuditorStats = ({ plants = [], allEquipment = [], loading = false }) => {
  
  // Calcular estadísticas
  const totalPlants = plants.length;
  const totalEquipment = allEquipment.length;
  const reviewedEquipment = allEquipment.filter(eq => eq.reviewStatus === 'revisado').length;
  const pendingEquipment = totalEquipment - reviewedEquipment;
  const reviewProgress = totalEquipment > 0 ? Math.round((reviewedEquipment / totalEquipment) * 100) : 0;

  // Equipos con observaciones
  const equipmentWithObservations = allEquipment.filter(eq => 
    eq.observations && eq.observations.trim() !== ''
  ).length;

  // Equipos con acciones requeridas
  const equipmentWithActions = allEquipment.filter(eq => 
    eq.actionsDescription && eq.actionsDescription.trim() !== ''
  ).length;

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const stats = [
    {
      icon: MapPin,
      label: 'Plantas',
      value: totalPlants,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      icon: FileText,
      label: 'Total Equipos',
      value: totalEquipment,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      icon: CheckCircle,
      label: 'Revisados',
      value: reviewedEquipment,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      icon: Clock,
      label: 'Pendientes',
      value: pendingEquipment,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      icon: AlertCircle,
      label: 'Con Observaciones',
      value: equipmentWithObservations,
      color: 'text-red-600',
      bgColor: 'bg-red-100'
    },
    {
      icon: TrendingUp,
      label: 'Con Acciones',
      value: equipmentWithActions,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100'
    }
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-800">
          Resumen de Auditoría
        </h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Progreso:</span>
          <span className="text-lg font-bold text-blue-600">{reviewProgress}%</span>
        </div>
      </div>

      {/* Barra de Progreso */}
      <div className="mb-6">
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-blue-500 to-green-500 h-3 rounded-full transition-all duration-500 ease-out"
            style={{ width: `${reviewProgress}%` }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-gray-600">
          <span>{reviewedEquipment} revisados</span>
          <span>{pendingEquipment} pendientes</span>
        </div>
      </div>

      {/* Grid de Estadísticas */}
      <div className="grid grid-cols-2 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div 
              key={index}
              className="bg-gray-50 rounded-lg p-4 border border-gray-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-3">
                <div className={`${stat.bgColor} rounded-lg p-2`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div className="flex-1">
                  <p className="text-xs text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Mensaje de estado */}
      {totalEquipment === 0 && (
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-800">
            📋 No hay equipos registrados aún. Los supervisores deben capturar equipos primero.
          </p>
        </div>
      )}

      {totalEquipment > 0 && pendingEquipment === 0 && (
        <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
          <p className="text-sm text-green-800 flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            ¡Excelente! Todos los equipos han sido revisados.
          </p>
        </div>
      )}
    </div>
  );
};

export default AuditorStats;
