/**
 * EJEMPLO DE INTEGRACIÓN - AuditoriaApp.jsx
 * 
 * Este archivo muestra cómo integrar el AuditorDashboard
 * en tu aplicación existente
 */

import React, { useState, useEffect } from "react";
import { onAuthChange, logout } from "../src/authService";
import LoginScreen from "../src/LoginScreen";
import AuditorDashboard from "../src/AuditorDashboard";
import { useRole } from "./useRole";
import { LogOut, User as UserIcon, Database } from "lucide-react";

const AuditoriaApp = () => {
  // Estados de autenticación (ya existentes)
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // Hook de roles
  const { userRole, isAdmin, isAuditor, isSupervisor, loading: roleLoading } = useRole();

  // Observador de autenticación (ya existente)
  useEffect(() => {
    const unsubscribe = onAuthChange((authState) => {
      setIsAuthenticated(authState.isAuthenticated);
      setUser(authState.user);
      setIsAuthLoading(false);
    });
    
    return () => unsubscribe();
  }, []);

  // Función de logout
  const handleLogout = async () => {
    try {
      await logout();
      // El observador se encargará de actualizar el estado
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  // Header común para todas las vistas
  const renderHeader = () => (
    <div className="bg-blue-600 text-white p-4 shadow-md">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Database className="w-8 h-8" />
          <div>
            <h1 className="text-lg font-bold">Auditoría Industrial</h1>
            {userRole && (
              <p className="text-xs text-blue-100">
                {userRole.displayName || user.email}
                {' - '}
                <span className="font-medium">
                  {isAdmin ? 'Administrador' : isSupervisor ? 'Supervisor' : 'Auditor'}
                </span>
              </p>
            )}
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
  );

  // ============================================
  // RENDERIZADO CONDICIONAL
  // ============================================

  // Loading de autenticación
  if (isAuthLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center">
        <div className="text-center">
          <Database className="w-12 h-12 text-blue-600 animate-pulse mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Auditoría Industrial</h2>
          <p className="text-gray-600">Verificando autenticación...</p>
        </div>
      </div>
    );
  }

  // Pantalla de login si no está autenticado
  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={() => {
      console.log('Login exitoso, cargando aplicación...');
    }} />;
  }

  // ============================================
  // RENDERIZADO POR ROL
  // ============================================

  // AUDITOR → Mostrar AuditorDashboard
  if (isAuditor) {
    return (
      <div className="min-h-screen bg-gray-100">
        {renderHeader()}
        <AuditorDashboard user={user} />
      </div>
    );
  }

  // SUPERVISOR → Mostrar interfaz actual de captura
  if (isSupervisor) {
    return (
      <div className="max-w-md mx-auto bg-gray-100 min-h-screen">
        {renderHeader()}
        {/* ... Tu código actual de supervisor ... */}
        <div className="p-4">
          <p className="text-center text-gray-600">
            Interfaz de Supervisor (tu código actual)
          </p>
        </div>
      </div>
    );
  }

  // ADMIN → Mostrar panel de administración
  if (isAdmin) {
    return (
      <div className="max-w-6xl mx-auto bg-gray-100 min-h-screen">
        {renderHeader()}
        {/* ... Panel de administración ... */}
        <div className="p-4">
          <p className="text-center text-gray-600">
            Panel de Administración (a implementar en FASE 6)
          </p>
          {/* Nota: El admin podría tener un selector para ver cualquier interfaz */}
        </div>
      </div>
    );
  }

  // Fallback
  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-md p-8 max-w-md text-center">
        <UserIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          Rol no reconocido
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          Tu usuario no tiene un rol asignado. Contacta al administrador.
        </p>
        <button
          onClick={handleLogout}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
};

export default AuditoriaApp;

/**
 * NOTAS DE IMPLEMENTACIÓN:
 * 
 * 1. Importa los nuevos componentes:
 *    - AuditorDashboard
 *    - useRole
 * 
 * 2. El hook useRole detecta automáticamente el rol del usuario
 *    y proporciona helpers (isAdmin, isAuditor, isSupervisor)
 * 
 * 3. El renderizado condicional muestra la interfaz correcta
 *    según el rol del usuario
 * 
 * 4. Cada rol tiene su propia interfaz optimizada:
 *    - Auditor: AuditorDashboard (revisión de equipos)
 *    - Supervisor: Interfaz actual de captura
 *    - Admin: Panel de administración (FASE 6)
 * 
 * 5. El header es común pero muestra el rol del usuario
 * 
 * 6. Si necesitas que el admin pueda cambiar entre interfaces,
 *    agrega un selector de vista en el header para admins
 */
