/**
 * AuditorSidebar.jsx - Barra lateral de navegacion para Auditor
 *
 * Componente que muestra el menu de navegacion lateral con:
 * - Logo y titulo de la aplicacion
 * - Selector de planta (dropdown)
 * - Menu de navegacion (Equipos, Reportes, Estadisticas)
 * - Informacion del usuario y logout
 *
 * @version 1.0.0
 */

import React from "react";
import {
  Factory,
  FileText,
  BarChart3,
  LogOut,
  ChevronDown,
  Wifi,
  WifiOff,
  ClipboardCheck,
  User,
  Building2,
  X,
} from "lucide-react";
import { logout } from "../../services/auth/authService";

/**
 * Item del menu de navegacion
 */
const MenuItem = ({ icon: Icon, label, isActive, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`
      w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left
      transition-all duration-200
      ${isActive
        ? "bg-blue-800 text-white border-l-4 border-blue-400 pl-3"
        : "text-gray-400 hover:bg-gray-800 hover:text-white"
      }
      ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
    `}
  >
    <Icon size={20} />
    <span className="text-sm font-medium">{label}</span>
  </button>
);

/**
 * Componente AuditorSidebar
 */
export const AuditorSidebar = ({
  plants = [],
  selectedPlant,
  onPlantSelect,
  currentView,
  onNavigate,
  user,
  isOffline = false,
  equipmentCounts = {},
  isOpen = false,
  onClose,
}) => {

  // Manejar seleccion de planta
  const handlePlantChange = (e) => {
    const plantId = e.target.value;

    if (plantId) {
      const plant = plants.find(p => p.id === plantId);
      if (plant) {
        onPlantSelect(plant);
      }
    }
  };

  // Manejar logout
  const handleLogout = async () => {
    if (window.confirm('Cerrar sesion?')) {
      try {
        await logout();
      } catch (error) {
        console.error("Error al cerrar sesion:", error);
      }
    }
  };

  // Obtener conteo de equipos de la planta seleccionada
  const counts = selectedPlant ? (equipmentCounts[selectedPlant.id] || { total: 0, reviewed: 0, pending: 0 }) : { total: 0, reviewed: 0, pending: 0 };

  // Manejar navegacion en movil (cerrar sidebar al navegar)
  const handleMobileNavigate = (view) => {
    onNavigate(view);
    if (onClose) onClose();
  };

  const handleMobilePlantChange = (e) => {
    handlePlantChange(e);
    if (onClose) onClose();
  };

  return (
    <>
      {/* Backdrop overlay para movil */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 flex flex-col flex-shrink-0
        transform transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:relative md:translate-x-0 md:w-56 lg:w-60 xl:w-64
      `}>
      {/* Header con logo */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <ClipboardCheck size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-white text-lg font-bold">Auditoria</h1>
              <p className="text-gray-400 text-xs">Industrial</p>
            </div>
          </div>
          {/* Boton cerrar solo en movil */}
          <button
            onClick={onClose}
            className="md:hidden p-1.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Indicador de conexion */}
      <div className="px-4 py-2 border-b border-gray-700">
        <div className={`
          flex items-center gap-2 text-xs px-3 py-1.5 rounded-full
          ${isOffline
            ? "bg-red-900/50 text-red-300"
            : "bg-green-900/50 text-green-300"
          }
        `}>
          {isOffline ? <WifiOff size={14} /> : <Wifi size={14} />}
          <span>{isOffline ? "Sin conexion" : "Conectado"}</span>
        </div>
      </div>

      {/* Selector de Planta */}
      <div className="p-4 border-b border-gray-700">
        <label className="block text-gray-400 text-xs mb-2 uppercase tracking-wide">
          Planta a Auditar
        </label>
        <div className="relative">
          <select
            value={selectedPlant?.id || ""}
            onChange={handleMobilePlantChange}
            className="
              w-full bg-gray-800 text-white text-sm
              border border-gray-700 rounded-lg
              px-4 py-2.5 pr-10
              appearance-none cursor-pointer
              focus:outline-none focus:ring-2 focus:ring-blue-400
              hover:border-gray-600
            "
          >
            <option value="">Elegir planta...</option>
            {plants.map((plant) => (
              <option key={plant.id} value={plant.id}>
                {plant.name}
              </option>
            ))}
          </select>
          <ChevronDown
            size={18}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
        </div>
        {selectedPlant && (
          <p className="text-gray-500 text-xs mt-2 truncate">
            {selectedPlant.location || "Sin ubicacion"}
          </p>
        )}
      </div>

      {/* Resumen de Auditoria (si hay planta seleccionada) */}
      {selectedPlant && (
        <div className="p-4 border-b border-gray-700">
          <label className="block text-gray-400 text-xs mb-3 uppercase tracking-wide">
            Progreso de Auditoria
          </label>
          <div className="space-y-2">
            {/* Total */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">Total Equipos</span>
              <span className="text-white font-medium">{counts.total}</span>
            </div>
            {/* Revisados */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-green-400">Revisados</span>
              <span className="text-green-400 font-medium">{counts.reviewed}</span>
            </div>
            {/* Pendientes */}
            <div className="flex items-center justify-between text-xs">
              <span className="text-orange-400">Pendientes</span>
              <span className="text-orange-400 font-medium">{counts.pending}</span>
            </div>
            {/* Barra de progreso */}
            <div className="mt-2">
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500 rounded-full transition-all duration-300"
                  style={{ width: `${counts.total > 0 ? (counts.reviewed / counts.total) * 100 : 0}%` }}
                />
              </div>
              <p className="text-gray-500 text-xs text-center mt-1">
                {counts.total > 0 ? Math.round((counts.reviewed / counts.total) * 100) : 0}% completado
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Menu de Navegacion */}
      <nav className="flex-1 p-4 space-y-1">
        <p className="text-gray-500 text-xs uppercase tracking-wide mb-3 px-4">
          Menu
        </p>

        <MenuItem
          icon={Factory}
          label="Equipos"
          isActive={currentView === "equipment" || currentView === "review"}
          onClick={() => { if (selectedPlant) handleMobileNavigate("equipment"); }}
          disabled={!selectedPlant}
        />

        <MenuItem
          icon={FileText}
          label="Reportes"
          isActive={currentView === "reports"}
          onClick={() => handleMobileNavigate("reports")}
        />

        <MenuItem
          icon={BarChart3}
          label="Estadisticas"
          isActive={currentView === "stats"}
          onClick={() => handleMobileNavigate("stats")}
        />

        <MenuItem
          icon={Building2}
          label="Plantas"
          isActive={currentView === "plants"}
          onClick={() => handleMobileNavigate("plants")}
        />
      </nav>

      {/* Footer con usuario */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-blue-700 rounded-full flex items-center justify-center">
            <User size={16} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">
              {user?.displayName || user?.email?.split("@")[0] || "Usuario"}
            </p>
            <p className="text-blue-400 text-xs truncate">
              Auditor
            </p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="
            w-full flex items-center justify-center gap-2
            bg-red-900/30 hover:bg-red-900/50
            text-red-400 hover:text-red-300
            py-2 px-4 rounded-lg
            transition-colors duration-200
            text-sm
          "
        >
          <LogOut size={16} />
          <span>Cerrar Sesion</span>
        </button>
      </div>
    </aside>
    </>
  );
};

export default AuditorSidebar;
