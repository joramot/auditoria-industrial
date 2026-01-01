/**
 * VisualizadorLayout.jsx - Layout completo para usuarios con rol Visualizador
 *
 * Encapsula:
 * - Header personalizado con logo, usuario y logout
 * - Dashboard del visualizador con sidebar y visor de expedientes
 *
 * @version 1.0.0
 */

import React from 'react';
import { FileText, LogOut } from 'lucide-react';
import { logout } from '../../services/auth/authService';
import VisualizadorDashboard from '../visualizador/VisualizadorDashboard';

/**
 * @param {Object} props
 * @param {Object} props.user - Usuario actual
 * @param {string} props.roleName - Nombre del rol para mostrar
 */
export const VisualizadorLayout = ({ user, roleName }) => {
  const handleLogout = async () => {
    if (window.confirm('¿Cerrar sesión?')) {
      await logout();
    }
  };

  console.log('👁️ Renderizando interfaz de VISUALIZADOR');

  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Header personalizado para Visualizador */}
      <div className="bg-purple-600 text-white p-4 shadow-md flex-shrink-0">
        <div className="w-full max-w-[1600px] 2xl:max-w-[1920px] mx-auto px-2 lg:px-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8" />
            <div>
              <h1 className="text-lg font-bold">Auditoría Industrial</h1>
              <p className="text-xs text-purple-100">
                {user?.displayName || user?.email} - {roleName}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-lg transition-all"
            title="Cerrar sesión"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Dashboard del Visualizador - ocupa el resto de la altura */}
      <div className="flex-1 overflow-hidden">
        <VisualizadorDashboard user={user} />
      </div>
    </div>
  );
};

export default VisualizadorLayout;
