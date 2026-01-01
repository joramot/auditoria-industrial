/**
 * AdminLayout.jsx - Layout completo para usuarios con rol Admin
 *
 * Encapsula:
 * - Header personalizado con logout
 * - Dashboard del administrador (AdminDashboard)
 *
 * @version 1.0.0
 */

import React from "react";
import { Shield, LogOut } from "lucide-react";
import { logout } from "../../services/auth/authService";
import AdminDashboard from "../admin/AdminDashboard";

/**
 * @param {Object} props
 * @param {Object} props.user - Usuario actual
 * @param {string} props.roleName - Nombre del rol para mostrar
 */
export const AdminLayout = ({ user, roleName }) => {
  const handleLogout = async () => {
    if (window.confirm('Cerrar sesion?')) {
      await logout();
    }
  };

  console.log('Renderizando interfaz de ADMIN');

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header personalizado para Admin */}
      <div className="bg-purple-700 text-white p-4 shadow-md">
        <div className="w-full max-w-[1600px] 2xl:max-w-[1920px] mx-auto px-2 lg:px-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8" />
            <div>
              <h1 className="text-lg font-bold">Panel de Administracion</h1>
              <p className="text-xs text-purple-200">
                {user?.displayName || user?.email} - {roleName}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-lg transition-all"
            title="Cerrar sesion"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Dashboard del Admin */}
      <div className="w-full max-w-[1600px] 2xl:max-w-[1920px] mx-auto px-2 lg:px-3 py-4">
        <AdminDashboard user={user} />
      </div>
    </div>
  );
};

export default AdminLayout;
