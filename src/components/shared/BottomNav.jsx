import React from "react";
import { Home, ClipboardList, Filter } from "lucide-react";

/**
 * BottomNav Component
 * Barra de navegación inferior fija con los accesos principales:
 * - Plantas (vista principal)
 * - Reportes
 * - Filtros (en desarrollo)
 * 
 * @param {Object} props
 * @param {string} props.currentView - Vista actual para destacar el botón activo
 * @param {Function} props.onNavigate - Función para cambiar de vista
 */
export const BottomNav = ({ currentView, onNavigate }) => {
  // Determina si la vista actual está relacionada con plantas
  const isPlantsRelated =
    currentView === "plants" ||
    currentView === "equipment" ||
    currentView === "form" ||
    currentView === "newPlant";

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-10">
      <div className="flex justify-around p-2">
        {/* Botón Plantas */}
        <button
          onClick={() => onNavigate("plants")}
          className={`flex flex-col items-center p-2 rounded transition-colors ${
            isPlantsRelated
              ? "text-blue-600"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          <Home className="w-6 h-6" />
          <span className="text-xs mt-1">Plantas</span>
        </button>

        {/* Botón Reportes */}
        <button
          onClick={() => onNavigate("reports")}
          className={`flex flex-col items-center p-2 rounded transition-colors ${
            currentView === "reports"
              ? "text-blue-600"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          <ClipboardList className="w-6 h-6" />
          <span className="text-xs mt-1">Reportes</span>
        </button>

        {/* Botón Filtros (en desarrollo) */}
        <button
          onClick={() => alert("🔧 Panel de filtros avanzados en desarrollo")}
          className="flex flex-col items-center p-2 rounded text-gray-600 hover:text-gray-800 transition-colors"
        >
          <Filter className="w-6 h-6" />
          <span className="text-xs mt-1">Filtros</span>
        </button>
      </div>
    </div>
  );
};

export default BottomNav;