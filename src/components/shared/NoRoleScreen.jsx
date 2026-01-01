/**
 * NoRoleScreen.jsx - Pantalla para usuarios sin rol asignado
 * 
 * Se muestra cuando un usuario está autenticado pero no tiene
 * un rol asignado en el sistema (admin, supervisor, auditor).
 * 
 * @version 1.0.0
 */

import React from "react";
import { AlertCircle } from "lucide-react";
import { logout } from "../../services/auth/authService";

/**
 * @param {Object} props
 * @param {Object} props.user - Usuario actual autenticado
 */
export const NoRoleScreen = ({ user }) => {
  const handleLogout = async () => {
    await logout();
  };

  console.log('⚠️ Usuario sin rol asignado');

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md text-center">
        <AlertCircle className="w-16 h-16 text-orange-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Sin Rol Asignado
        </h2>
        <p className="text-gray-600 mb-6">
          Tu cuenta no tiene un rol asignado. Por favor contacta al administrador del sistema.
        </p>
        
        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
          <p className="text-sm text-gray-700 mb-2">
            <strong>Usuario:</strong> {user?.email || user?.displayName}
          </p>
          <p className="text-sm text-gray-700">
            <strong>ID:</strong> {user?.uid}
          </p>
        </div>

        <button
          onClick={handleLogout}
          className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
};

export default NoRoleScreen;
