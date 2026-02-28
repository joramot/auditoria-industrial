/**
 * StatsPanel.jsx - Panel de estadísticas del sistema
 *
 * Muestra un dashboard con estadísticas generales:
 * - Total de plantas
 * - Total de equipos
 * - Equipos pendientes de revisión
 * - Estado de sincronización
 *
 * @version 1.0.0
 */

import React, { useMemo } from "react";
import {
  Factory,
  AlertCircle,
  CheckCircle,
  Clock,
  Package,
  Wifi,
  WifiOff,
} from "lucide-react";

/**
 * Tarjeta de estadística individual
 */
const StatCard = ({ icon: Icon, title, value, subtitle, color = "blue" }) => {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600 border-blue-200",
    green: "bg-green-50 text-green-600 border-green-200",
    amber: "bg-amber-50 text-amber-600 border-amber-200",
    red: "bg-red-50 text-red-600 border-red-200",
    purple: "bg-purple-50 text-purple-600 border-purple-200",
  };

  const iconColorClasses = {
    blue: "bg-blue-100 text-blue-600",
    green: "bg-green-100 text-green-600",
    amber: "bg-amber-100 text-amber-600",
    red: "bg-red-100 text-red-600",
    purple: "bg-purple-100 text-purple-600",
  };

  return (
    <div className={`bg-white rounded-xl p-6 border ${colorClasses[color]} shadow-sm`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-400 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${iconColorClasses[color]}`}>
          <Icon size={24} />
        </div>
      </div>
    </div>
  );
};

const EMPTY_ARRAY = [];

/**
 * Componente StatsPanel
 */
export const StatsPanel = ({
  plants = EMPTY_ARRAY,
  equipment = EMPTY_ARRAY,
  syncStatus,
  isOffline,
}) => {
  // Calcular estadísticas
  const stats = useMemo(() => {
    const totalPlants = plants.length;

    // Calcular total de equipos sumando el equipmentCount de cada planta
    const totalEquipment = plants.reduce(
      (sum, plant) => sum + (plant.equipmentCount || 0),
      0
    );

    // Equipos pendientes de revisión (reviewStatus === 'pendiente')
    const pendingReview = equipment.filter(
      (eq) => eq.reviewStatus === "pendiente" || !eq.reviewStatus
    ).length;

    // Equipos revisados
    const reviewedEquipment = equipment.filter(
      (eq) => eq.reviewStatus === "revisado"
    ).length;

    return {
      totalPlants,
      totalEquipment,
      pendingReview,
      reviewedEquipment,
    };
  }, [plants, equipment]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Estadísticas</h2>
        <p className="text-gray-500 mt-1">
          Resumen general del sistema de auditoría
        </p>
      </div>

      {/* Grid de estadísticas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Factory}
          title="Total Plantas"
          value={stats.totalPlants}
          subtitle="Plantas registradas"
          color="blue"
        />

        <StatCard
          icon={Package}
          title="Total Equipos"
          value={stats.totalEquipment}
          subtitle="En todas las plantas"
          color="green"
        />

        <StatCard
          icon={Clock}
          title="Pendientes Revisión"
          value={stats.pendingReview}
          subtitle="Equipos por auditar"
          color="amber"
        />

        <StatCard
          icon={CheckCircle}
          title="Revisados"
          value={stats.reviewedEquipment}
          subtitle="Auditorías completadas"
          color="purple"
        />
      </div>

      {/* Estado de conexión */}
      <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Estado del Sistema
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Conexión */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className={`
              w-10 h-10 rounded-full flex items-center justify-center
              ${isOffline ? "bg-red-100" : "bg-green-100"}
            `}>
              {isOffline ? (
                <WifiOff size={20} className="text-red-600" />
              ) : (
                <Wifi size={20} className="text-green-600" />
              )}
            </div>
            <div>
              <p className="font-medium text-gray-900">
                {isOffline ? "Sin conexión" : "Conectado"}
              </p>
              <p className="text-sm text-gray-500">
                {isOffline
                  ? "Los cambios se guardarán localmente"
                  : "Sincronización en tiempo real"}
              </p>
            </div>
          </div>

          {/* Sincronización */}
          <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
            <div className={`
              w-10 h-10 rounded-full flex items-center justify-center
              ${syncStatus?.pendingOperations > 0 ? "bg-amber-100" : "bg-green-100"}
            `}>
              {syncStatus?.pendingOperations > 0 ? (
                <AlertCircle size={20} className="text-amber-600" />
              ) : (
                <CheckCircle size={20} className="text-green-600" />
              )}
            </div>
            <div>
              <p className="font-medium text-gray-900">
                {syncStatus?.pendingOperations > 0
                  ? `${syncStatus.pendingOperations} pendientes`
                  : "Todo sincronizado"}
              </p>
              <p className="text-sm text-gray-500">
                {syncStatus?.lastSync
                  ? `Última sync: ${new Date(syncStatus.lastSync).toLocaleString("es-MX")}`
                  : "Sin sincronización reciente"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Resumen por planta */}
      {plants.length > 0 && (
        <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Equipos por Planta
          </h3>

          <div className="space-y-3">
            {plants.map((plant) => (
              <div
                key={plant.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <Factory size={18} className="text-gray-400" />
                  <div>
                    <p className="font-medium text-gray-900">{plant.name}</p>
                    <p className="text-xs text-gray-500">{plant.location || "Sin ubicación"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-gray-900">
                    {plant.equipmentCount || 0}
                  </span>
                  <span className="text-sm text-gray-500">equipos</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsPanel;
