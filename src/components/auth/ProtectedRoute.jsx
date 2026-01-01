/**
 * ProtectedRoute.jsx - Componente de Protección de Rutas
 * Versión: 1.0
 * 
 * Componente HOC que protege rutas verificando:
 * - Autenticación del usuario
 * - Rol requerido
 * - Permisos específicos (opcional)
 * 
 * FASE 3: Control de Acceso - Tarea 3.2
 */

import React from 'react';
import { useAuthWithRole } from '../../hooks/useAuthWithRole';
import { ROLES } from '../../services/migration/roleService';
import { LoadingScreen } from '../shared/LoadingScreen';
import { Shield, Lock, LogIn } from 'lucide-react';

/**
 * 🛡️ COMPONENTE DE RUTA PROTEGIDA
 * 
 * Uso:
 * ```jsx
 * <ProtectedRoute allowedRoles={['admin', 'supervisor']}>
 *   <MiComponente />
 * </ProtectedRoute>
 * ```
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Contenido a renderizar si autorizado
 * @param {Array<string>} props.allowedRoles - Roles permitidos
 * @param {string} props.requiredPermission - Permiso específico requerido (opcional)
 * @param {Function} props.onAccessDenied - Callback cuando se deniega acceso
 * @param {Function} props.onNotAuthenticated - Callback cuando no está autenticado
 * @param {React.ReactNode} props.loadingComponent - Componente de carga personalizado
 * @param {React.ReactNode} props.accessDeniedComponent - Componente de acceso denegado personalizado
 * @param {React.ReactNode} props.notAuthenticatedComponent - Componente de no autenticado personalizado
 */
export const ProtectedRoute = ({
  children,
  allowedRoles = Object.values(ROLES),
  requiredPermission = null,
  onAccessDenied = null,
  onNotAuthenticated = null,
  loadingComponent = null,
  accessDeniedComponent = null,
  notAuthenticatedComponent = null
}) => {
  const {
    isAuthenticated,
    role,
    isFullyLoaded,
    hasPermissionSync,
    roleName
  } = useAuthWithRole();

  // ============================================
  // ESTADO DE CARGA
  // ============================================
  
  if (!isFullyLoaded) {
    if (loadingComponent) {
      return loadingComponent;
    }
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando permisos...</p>
        </div>
      </div>
    );
  }

  // ============================================
  // USUARIO NO AUTENTICADO
  // ============================================
  
  if (!isAuthenticated) {
    // Ejecutar callback si existe
    if (onNotAuthenticated) {
      onNotAuthenticated();
    }

    // Renderizar componente personalizado si existe
    if (notAuthenticatedComponent) {
      return notAuthenticatedComponent;
    }

    return <NotAuthenticatedScreen />;
  }

  // ============================================
  // VERIFICAR ROL
  // ============================================
  
  const hasAllowedRole = allowedRoles.includes(role);
  
  if (!hasAllowedRole) {
    // Ejecutar callback si existe
    if (onAccessDenied) {
      onAccessDenied({ reason: 'role', userRole: role, requiredRoles: allowedRoles });
    }

    // Renderizar componente personalizado si existe
    if (accessDeniedComponent) {
      return accessDeniedComponent;
    }

    return (
      <AccessDeniedScreen 
        reason="role"
        userRole={roleName}
        requiredRoles={allowedRoles}
      />
    );
  }

  // ============================================
  // VERIFICAR PERMISO ESPECÍFICO (SI SE REQUIERE)
  // ============================================
  
  if (requiredPermission && !hasPermissionSync(requiredPermission)) {
    // Ejecutar callback si existe
    if (onAccessDenied) {
      onAccessDenied({ reason: 'permission', requiredPermission });
    }

    // Renderizar componente personalizado si existe
    if (accessDeniedComponent) {
      return accessDeniedComponent;
    }

    return (
      <AccessDeniedScreen 
        reason="permission"
        requiredPermission={requiredPermission}
      />
    );
  }

  // ============================================
  // AUTORIZADO - RENDERIZAR CONTENIDO
  // ============================================
  
  return children;
};

/**
 * 🚫 PANTALLA DE USUARIO NO AUTENTICADO
 */
const NotAuthenticatedScreen = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4">
        <div className="text-center">
          {/* Icono */}
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6">
            <LogIn className="w-8 h-8 text-blue-600" />
          </div>
          
          {/* Título */}
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Iniciar Sesión Requerido
          </h2>
          
          {/* Mensaje */}
          <p className="text-gray-600 mb-6">
            Debes iniciar sesión para acceder a esta sección de la aplicación.
          </p>
          
          {/* Botón */}
          <button
            onClick={() => window.location.href = '/login'}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <LogIn className="w-5 h-5" />
            Ir a Iniciar Sesión
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * 🔒 PANTALLA DE ACCESO DENEGADO
 */
const AccessDeniedScreen = ({ reason, userRole, requiredRoles, requiredPermission }) => {
  const getRoleDisplayName = (role) => {
    const names = {
      [ROLES.ADMIN]: 'Administrador',
      [ROLES.SUPERVISOR]: 'Supervisor',
      [ROLES.AUDITOR]: 'Auditor'
    };
    return names[role] || role;
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-orange-50">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full mx-4">
        <div className="text-center">
          {/* Icono */}
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-6">
            <Shield className="w-8 h-8 text-red-600" />
          </div>
          
          {/* Título */}
          <h2 className="text-2xl font-bold text-gray-800 mb-2">
            Acceso Denegado
          </h2>
          
          {/* Mensaje según razón */}
          {reason === 'role' && (
            <div className="text-gray-600 mb-6">
              <p className="mb-4">
                No tienes el rol necesario para acceder a esta sección.
              </p>
              <div className="bg-gray-50 rounded-lg p-4 text-left">
                <p className="text-sm mb-2">
                  <span className="font-medium">Tu rol actual:</span>{' '}
                  <span className="text-blue-600">{userRole}</span>
                </p>
                <p className="text-sm">
                  <span className="font-medium">Roles permitidos:</span>{' '}
                  <span className="text-green-600">
                    {requiredRoles.map(r => getRoleDisplayName(r)).join(', ')}
                  </span>
                </p>
              </div>
            </div>
          )}
          
          {reason === 'permission' && (
            <div className="text-gray-600 mb-6">
              <p className="mb-4">
                No tienes el permiso necesario para realizar esta acción.
              </p>
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm">
                  <span className="font-medium">Permiso requerido:</span>{' '}
                  <code className="bg-gray-200 px-2 py-1 rounded text-red-600">
                    {requiredPermission}
                  </code>
                </p>
              </div>
            </div>
          )}
          
          {/* Botón */}
          <button
            onClick={() => window.history.back()}
            className="w-full bg-gray-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
          >
            <Lock className="w-5 h-5" />
            Volver
          </button>
          
          {/* Nota */}
          <p className="mt-4 text-xs text-gray-500">
            Si crees que deberías tener acceso, contacta al administrador del sistema.
          </p>
        </div>
      </div>
    </div>
  );
};

/**
 * 🎯 HOC PARA PROTEGER COMPONENTES
 * 
 * Uso:
 * ```jsx
 * const AdminDashboard = withRoleProtection(Dashboard, {
 *   allowedRoles: ['admin']
 * });
 * ```
 */
export const withRoleProtection = (WrappedComponent, options = {}) => {
  const {
    allowedRoles = Object.values(ROLES),
    requiredPermission = null
  } = options;

  return function ProtectedComponent(props) {
    return (
      <ProtectedRoute
        allowedRoles={allowedRoles}
        requiredPermission={requiredPermission}
      >
        <WrappedComponent {...props} />
      </ProtectedRoute>
    );
  };
};

/**
 * 🔐 COMPONENTE PARA RUTAS DE ADMIN
 */
export const AdminRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={[ROLES.ADMIN]}>
    {children}
  </ProtectedRoute>
);

/**
 * 👷 COMPONENTE PARA RUTAS DE SUPERVISOR
 */
export const SupervisorRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.SUPERVISOR]}>
    {children}
  </ProtectedRoute>
);

/**
 * 🔍 COMPONENTE PARA RUTAS DE AUDITOR
 */
export const AuditorRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={[ROLES.ADMIN, ROLES.AUDITOR]}>
    {children}
  </ProtectedRoute>
);

/**
 * 👥 COMPONENTE PARA RUTAS DE CUALQUIER ROL AUTENTICADO
 */
export const AuthenticatedRoute = ({ children }) => (
  <ProtectedRoute allowedRoles={Object.values(ROLES)}>
    {children}
  </ProtectedRoute>
);

export default ProtectedRoute;