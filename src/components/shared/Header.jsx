import React from "react";
import {
  ChevronRight,
  Database,
  Loader,
  LogOut,
  User as UserIcon,
  Wifi,
  WifiOff,
} from "lucide-react";
import { logout } from "../../services/auth/authService";

/**
 * Header Component
 * Muestra la barra superior de la aplicación con:
 * - Título y logo
 * - Estado de conexión (Online/Offline/Sincronizando)
 * - Información del usuario y botón de logout
 * - Breadcrumbs de navegación según la vista actual
 * 
 * @param {Object} props
 * @param {Object} props.user - Usuario autenticado
 * @param {boolean} props.isOffline - Estado de conexión
 * @param {Object} props.syncStatus - Estado de sincronización { isSyncing, pendingCount }
 * @param {boolean} props.isLoading - Indica si hay operaciones en curso
 * @param {string} props.currentView - Vista actual ('plants', 'equipment', 'form', 'newPlant', 'reports')
 * @param {Object} props.selectedPlant - Planta seleccionada actualmente
 * @param {Function} props.onNavigate - Función para cambiar de vista
 */
export const Header = ({
  user,
  isOffline,
  syncStatus,
  isLoading,
  currentView,
  selectedPlant,
  onNavigate,
}) => {
  // Handler para cerrar sesión
  const handleLogout = async () => {
    try {
      await logout();
      console.log("✅ Sesión cerrada exitosamente");
    } catch (error) {
      console.error("❌ Error al cerrar sesión:", error);
    }
  };

  return (
    <div className="bg-blue-600 text-white p-4 shadow-lg sticky top-0 z-20">
      {/* Fila superior: Título y estado de conexión */}
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <Database className="w-6 h-6" />
          <h1 className="text-xl font-bold">Auditoría Industrial</h1>
        </div>

        <div className="flex items-center gap-3">
          {/* Estado de conexión */}
          {isOffline ? (
            <div className="flex items-center gap-1 bg-red-500 px-2 py-1 rounded text-xs">
              <WifiOff className="w-4 h-4" />
              <span>Offline</span>
              {syncStatus.pendingCount > 0 && (
                <span className="ml-1 bg-red-700 px-1.5 py-0.5 rounded-full text-xs font-bold">
                  {syncStatus.pendingCount}
                </span>
              )}
            </div>
          ) : syncStatus.isSyncing ? (
            <div className="flex items-center gap-1 bg-blue-500 px-2 py-1 rounded text-xs">
              <Loader className="w-4 h-4 animate-spin" />
              <span>Sincronizando</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 bg-green-500 px-2 py-1 rounded text-xs">
              <Wifi className="w-4 h-4" />
              <span>Online</span>
            </div>
          )}
          
          {/* Indicador de carga */}
          {isLoading && <Loader className="w-5 h-5 animate-spin" />}
        </div>
      </div>

      {/* Fila de usuario y logout */}
      <div className="flex justify-between items-center mt-2 pt-2 border-t border-blue-500">
        <div className="flex items-center gap-2 text-sm">
          <UserIcon className="w-4 h-4" />
          <span className="font-medium">
            {user?.displayName || user?.email || "Usuario"}
          </span>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-1 bg-red-500 hover:bg-red-600 px-3 py-1 rounded text-xs font-medium transition-colors"
        >
          <LogOut className="w-3 h-3" />
          <span>Salir</span>
        </button>
      </div>

      {/* Breadcrumbs - Vista de equipos */}
      {currentView === "equipment" && selectedPlant && (
        <div className="text-sm opacity-90 flex items-center gap-2 mt-2">
          <button
            onClick={() => onNavigate("plants")}
            className="hover:underline"
          >
            Plantas
          </button>
          <ChevronRight className="w-4 h-4" />
          <span>{selectedPlant.name}</span>
        </div>
      )}

      {/* Breadcrumbs - Nueva planta */}
      {currentView === "newPlant" && (
        <div className="text-sm opacity-90 flex items-center gap-2 mt-2">
          <button
            onClick={() => onNavigate("plants")}
            className="hover:underline"
          >
            Plantas
          </button>
          <ChevronRight className="w-4 h-4" />
          <span>Nueva Planta</span>
        </div>
      )}

      {/* Breadcrumbs - Formulario de equipo */}
      {currentView === "form" && (
        <div className="text-sm opacity-90 flex items-center gap-2 mt-2">
          <button
            onClick={() => onNavigate("plants")}
            className="hover:underline"
          >
            Plantas
          </button>
          <ChevronRight className="w-4 h-4" />
          <button
            onClick={() => onNavigate("equipment")}
            className="hover:underline"
          >
            {selectedPlant?.name}
          </button>
          <ChevronRight className="w-4 h-4" />
          <span>Captura de Equipo</span>
        </div>
      )}
    </div>
  );
};

export default Header;