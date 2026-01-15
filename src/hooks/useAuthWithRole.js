/**
 * useAuthWithRole.js - Hook Combinado de Autenticación y Roles
 * Versión: 1.0
 * 
 * Combina la funcionalidad de useAuth y useRole en un solo hook
 * para simplificar el acceso a autenticación y permisos.
 * 
 * FASE 3: Control de Acceso - Tarea 3.1
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { auth } from '../services/firebase/firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  getUserRole, 
  hasPermission, 
  canEditField,
  canViewPlant,
  ROLES,
  PERMISSIONS,
  EDITABLE_FIELDS_BY_ROLE,
  getRoleName
} from '../services/migration/roleService';

/**
 * 🔐 HOOK PRINCIPAL DE AUTENTICACIÓN CON ROLES
 * 
 * Uso en componentes:
 * ```javascript
 * const { 
 *   user, 
 *   isAuthenticated, 
 *   role, 
 *   isAdmin, 
 *   checkPermission,
 *   canEditField 
 * } = useAuthWithRole();
 * ```
 * 
 * @returns {Object} Estado completo de autenticación y roles
 */
export const useAuthWithRole = () => {
  // ============================================
  // ESTADO
  // ============================================
  
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState(true);
  const [error, setError] = useState(null);

  // ============================================
  // EFECTO: Detectar usuario autenticado
  // ============================================
  
  useEffect(() => {
    // console.log('🔐 useAuthWithRole: Inicializando...');
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      // console.log('🔐 useAuthWithRole: Usuario:', firebaseUser?.email || 'ninguno');
      
      setUser(firebaseUser);
      setLoading(false);
      
      // Si no hay usuario, resetear rol
      if (!firebaseUser) {
        setUserRole(null);
        setRoleLoading(false);
        return;
      }
      
      // Cargar rol del usuario
      try {
        setRoleLoading(true);
        const roleData = await getUserRole(firebaseUser.uid);
        // console.log('🔐 useAuthWithRole: Rol obtenido:', roleData?.role);
        setUserRole(roleData);
        setError(null);
      } catch (err) {
        console.error('❌ useAuthWithRole: Error al cargar rol:', err);
        setError(err.message);
        setUserRole(null);
      } finally {
        setRoleLoading(false);
      }
    });

    return () => {
      // console.log('🔐 useAuthWithRole: Limpiando suscripción');
      unsubscribe();
    };
  }, []);

  // ============================================
  // FUNCIONES DE VERIFICACIÓN
  // ============================================
  
  /**
   * Verificar si el usuario tiene un permiso específico
   * @param {string} permission - Permiso a verificar (ej: 'plants.create')
   * @returns {Promise<boolean>}
   */
  const checkPermission = useCallback(async (permission) => {
    if (!user) return false;
    return await hasPermission(user.uid, permission);
  }, [user]);

  /**
   * Verificar si el usuario puede editar un campo específico
   * @param {string} fieldName - Nombre del campo
   * @returns {Promise<boolean>}
   */
  const checkEditField = useCallback(async (fieldName) => {
    if (!user) return false;
    return await canEditField(user.uid, fieldName);
  }, [user]);

  /**
   * Verificar si el campo es editable (versión síncrona usando rol cargado)
   * @param {string} fieldName - Nombre del campo
   * @returns {boolean}
   */
  const canEditFieldSync = useCallback((fieldName) => {
    if (!userRole?.role) return false;
    const editableFields = EDITABLE_FIELDS_BY_ROLE[userRole.role] || [];
    return editableFields.includes(fieldName);
  }, [userRole]);

  /**
   * Verificar si el usuario puede ver una planta
   * @param {string} plantId - ID de la planta
   * @returns {Promise<boolean>}
   */
  const checkViewPlant = useCallback(async (plantId) => {
    if (!user) return false;
    return await canViewPlant(user.uid, plantId);
  }, [user]);

  /**
   * Verificar si puede ver la planta (versión síncrona)
   * @param {string} plantId - ID de la planta
   * @returns {boolean}
   */
  const canViewPlantSync = useCallback((plantId) => {
    if (!userRole) return false;
    
    // Admin y Auditor pueden ver todas
    if (userRole.role === ROLES.ADMIN || userRole.role === ROLES.AUDITOR) {
      return true;
    }
    
    // Supervisor solo puede ver plantas asignadas
    if (userRole.role === ROLES.SUPERVISOR) {
      return (userRole.assignedPlants || []).includes(plantId);
    }
    
    return false;
  }, [userRole]);

  /**
   * Verificar si el usuario tiene alguno de los roles especificados
   * @param {Array<string>} roles - Array de roles permitidos
   * @returns {boolean}
   */
  const hasAnyRole = useCallback((roles) => {
    if (!userRole?.role) return false;
    return roles.includes(userRole.role);
  }, [userRole]);

  /**
   * Verificar si tiene permiso específico (versión síncrona)
   * @param {string} permission - Permiso a verificar
   * @returns {boolean}
   */
  const hasPermissionSync = useCallback((permission) => {
    if (!userRole?.permissions) return false;
    return userRole.permissions.includes(permission);
  }, [userRole]);

  // ============================================
  // VALORES DERIVADOS (MEMOIZADOS)
  // ============================================
  
  const isAuthenticated = useMemo(() => !!user, [user]);
  
  const role = useMemo(() => userRole?.role || null, [userRole]);
  
  const roleName = useMemo(() => 
    userRole ? getRoleName(userRole.role) : '', 
    [userRole]
  );
  
  const isAdmin = useMemo(() => 
    userRole?.role === ROLES.ADMIN, 
    [userRole]
  );
  
  const isSupervisor = useMemo(() => 
    userRole?.role === ROLES.SUPERVISOR, 
    [userRole]
  );
  
  const isAuditor = useMemo(() => 
    userRole?.role === ROLES.AUDITOR, 
    [userRole]
  );
  
  const assignedPlants = useMemo(() => 
    userRole?.assignedPlants || [], 
    [userRole]
  );
  
  const permissions = useMemo(() => 
    userRole?.permissions || [], 
    [userRole]
  );
  
  const editableFields = useMemo(() => 
    userRole ? (EDITABLE_FIELDS_BY_ROLE[userRole.role] || []) : [], 
    [userRole]
  );

  const isFullyLoaded = useMemo(() => 
    !loading && !roleLoading, 
    [loading, roleLoading]
  );

  // ============================================
  // RETORNO DEL HOOK
  // ============================================
  
  return {
    // Datos del usuario
    user,
    userId: user?.uid || null,
    email: user?.email || null,
    displayName: userRole?.displayName || user?.displayName || null,
    
    // Estado de autenticación
    isAuthenticated,
    
    // Datos del rol
    userRole,           // Objeto completo
    role,               // String: 'admin', 'supervisor', 'auditor'
    roleName,           // String: 'Administrador', 'Supervisor', 'Auditor'
    
    // Verificaciones de rol (booleanos)
    isAdmin,
    isSupervisor,
    isAuditor,
    
    // Datos adicionales
    assignedPlants,
    permissions,
    editableFields,
    
    // Funciones de verificación asíncronas
    checkPermission,
    checkEditField,
    checkViewPlant,
    
    // Funciones de verificación síncronas
    canEditFieldSync,
    canViewPlantSync,
    hasAnyRole,
    hasPermissionSync,
    
    // Estado de carga
    loading,
    roleLoading,
    isFullyLoaded,
    error,
    
    // Constantes útiles
    ROLES,
    PERMISSIONS
  };
};

/**
 * 🛡️ HOOK PARA REQUERIR AUTENTICACIÓN Y ROL
 * 
 * Verifica que el usuario esté autenticado y tenga uno de los roles permitidos.
 * Devuelve información sobre si debe redirigir o mostrar acceso denegado.
 * 
 * @param {Object} options - Opciones de configuración
 * @param {Array<string>} options.allowedRoles - Roles permitidos
 * @param {string} options.redirectTo - URL a redirigir si no autenticado
 * @returns {Object} Estado de autorización
 */
export const useRequireRole = (options = {}) => {
  const { 
    allowedRoles = Object.values(ROLES),
    redirectTo = '/login'
  } = options;
  
  const authWithRole = useAuthWithRole();
  const { isAuthenticated, role, isFullyLoaded } = authWithRole;
  
  const [authState, setAuthState] = useState({
    isAuthorized: false,
    shouldRedirect: false,
    accessDenied: false,
    redirectTo: null
  });

  useEffect(() => {
    if (!isFullyLoaded) return;
    
    if (!isAuthenticated) {
      // No autenticado - redirigir a login
      setAuthState({
        isAuthorized: false,
        shouldRedirect: true,
        accessDenied: false,
        redirectTo: redirectTo
      });
    } else if (!allowedRoles.includes(role)) {
      // Autenticado pero sin rol permitido
      setAuthState({
        isAuthorized: false,
        shouldRedirect: false,
        accessDenied: true,
        redirectTo: null
      });
    } else {
      // Autorizado
      setAuthState({
        isAuthorized: true,
        shouldRedirect: false,
        accessDenied: false,
        redirectTo: null
      });
    }
  }, [isAuthenticated, role, isFullyLoaded, allowedRoles, redirectTo]);

  return {
    ...authWithRole,
    ...authState
  };
};

export default useAuthWithRole;