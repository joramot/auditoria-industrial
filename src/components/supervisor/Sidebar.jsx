/**
 * Sidebar.jsx - Barra lateral de navegación para Supervisor
 *
 * Componente que muestra el menú de navegación lateral con:
 * - Logo y título de la aplicación
 * - Selector de planta (dropdown)
 * - Menú de navegación (Equipos, Reportes, Estadísticas)
 * - Información del usuario y logout
 *
 * @version 2.0.0
 */

import React, { useState } from "react";
import {
  Factory,
  FileText,
  BarChart3,
  LogOut,
  ChevronDown,
  Wifi,
  WifiOff,
  Plus,
  Settings,
  User,
} from "lucide-react";
import { logoutUser } from "../../services/auth/authService";

/**
 * Item del menú de navegación
 */
const MenuItem = ({ icon: Icon, label, isActive, onClick, disabled }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`
      w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left
      transition-all duration-200
      ${isActive
        ? "bg-gray-800 text-white border-l-4 border-amber-400 pl-3"
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
 * Componente Sidebar
 */
export const Sidebar = ({
  plants = [],
  selectedPlant,
  onPlantSelect,
  onNewPlant,
  currentView,
  onNavigate,
  user,
  isOffline,
  isAdmin,
}) => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Manejar selección de planta
  const handlePlantChange = (e) => {
    const plantId = e.target.value;

    if (plantId === "new") {
      onNewPlant();
      return;
    }

    if (plantId) {
      const plant = plants.find(p => p.id === plantId);
      if (plant) {
        onPlantSelect(plant);
      }
    }
  };

  // Manejar logout
  const handleLogout = async () => {
    try {
      await logoutUser();
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  return (
    <aside className="w-64 bg-gray-900 min-h-screen flex flex-col">
      {/* Header con logo */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-amber-400 rounded-full flex items-center justify-center">
            <Settings size={24} className="text-gray-900" />
          </div>
          <div>
            <h1 className="text-white text-lg font-bold">Auditoría</h1>
            <p className="text-gray-400 text-xs">Industrial</p>
          </div>
        </div>
      </div>

      {/* Indicador de conexión */}
      <div className="px-4 py-2 border-b border-gray-700">
        <div className={`
          flex items-center gap-2 text-xs px-3 py-1.5 rounded-full
          ${isOffline
            ? "bg-red-900/50 text-red-300"
            : "bg-green-900/50 text-green-300"
          }
        `}>
          {isOffline ? <WifiOff size={14} /> : <Wifi size={14} />}
          <span>{isOffline ? "Sin conexión" : "Conectado"}</span>
        </div>
      </div>

      {/* Selector de Planta */}
      <div className="p-4 border-b border-gray-700">
        <label className="block text-gray-400 text-xs mb-2 uppercase tracking-wide">
          Planta Activa
        </label>
        <div className="relative">
          <select
            value={selectedPlant?.id || ""}
            onChange={handlePlantChange}
            className="
              w-full bg-gray-800 text-white text-sm
              border border-gray-700 rounded-lg
              px-4 py-2.5 pr-10
              appearance-none cursor-pointer
              focus:outline-none focus:ring-2 focus:ring-amber-400
              hover:border-gray-600
            "
          >
            <option value="">Elegir planta...</option>
            {plants.map((plant) => (
              <option key={plant.id} value={plant.id}>
                {plant.name}
              </option>
            ))}
            <option value="new">+ Nueva Planta</option>
          </select>
          <ChevronDown
            size={18}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
          />
        </div>
        {selectedPlant && (
          <p className="text-gray-500 text-xs mt-2 truncate">
            {selectedPlant.location || "Sin ubicación"}
          </p>
        )}
      </div>

      {/* Menú de Navegación */}
      <nav className="flex-1 p-4 space-y-1">
        <p className="text-gray-500 text-xs uppercase tracking-wide mb-3 px-4">
          Menú
        </p>

        <MenuItem
          icon={Factory}
          label="Equipos"
          isActive={currentView === "equipment" || currentView === "form"}
          onClick={() => selectedPlant && onNavigate("equipment")}
          disabled={!selectedPlant}
        />

        <MenuItem
          icon={FileText}
          label="Reportes"
          isActive={currentView === "reports"}
          onClick={() => onNavigate("reports")}
        />

        <MenuItem
          icon={BarChart3}
          label="Estadísticas"
          isActive={currentView === "stats"}
          onClick={() => onNavigate("stats")}
        />
      </nav>

      {/* Footer con usuario */}
      <div className="p-4 border-t border-gray-700">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
            <User size={16} className="text-gray-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">
              {user?.displayName || user?.email?.split("@")[0] || "Usuario"}
            </p>
            <p className="text-gray-500 text-xs truncate">
              {isAdmin ? "Administrador" : "Supervisor"}
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
          <span>Cerrar Sesión</span>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
