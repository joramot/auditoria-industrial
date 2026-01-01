/**
 * AuditorLayout.jsx - Layout completo para usuarios con rol Auditor
 * 
 * Encapsula:
 * - Header personalizado con logout
 * - Dashboard del auditor (AuditorDashboard)
 * 
 * @version 1.0.0
 */

import React from "react";
import { Database, LogOut } from "lucide-react";
import { logout } from "../../services/auth/authService";
import AuditorDashboard from "../auditor/AuditorDashboard";

/**
 * @param {Object} props
 * @param {Object} props.user - Usuario actual
 * @param {string} props.roleName - Nombre del rol para mostrar
 */
export const AuditorLayout = ({ user, roleName }) => {
  const handleLogout = async () => {
    if (window.confirm('¿Cerrar sesión?')) {
      await logout();
    }
  };

  console.log('🎭 Renderizando interfaz de AUDITOR');

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header personalizado para Auditor */}
      <div className="bg-blue-600 text-white p-4 shadow-md">
        <div className="w-full max-w-[1600px] 2xl:max-w-[1920px] mx-auto px-2 lg:px-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Database className="w-8 h-8" />
            <div>
              <h1 className="text-lg font-bold">Auditoría Industrial</h1>
              <p className="text-xs text-blue-100">
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
      
      {/* Dashboard del Auditor */}
      <AuditorDashboard user={user} />
    </div>
  );
};

export default AuditorLayout;
