/**
 * useRole.js - Custom React Hook para Gestión de Roles
 * Versión: 1.0
 * 
 * Hook personalizado que facilita el trabajo con roles y permisos
 * en componentes React
 */

import { useState, useEffect } from 'react';
import { useAuth } from './useAuth';
import { 
  getUserRole, 
  hasPermission, 
  canEditField,
  ROLES,
  PERMISSIONS,
  EDITABLE_FIELDS_BY_ROLE,
  getRoleName
} from './roleService';

/**
 * 🎭 HOOK PERSONALIZADO DE ROLES
 * 
 * Uso en componentes:
 * ```javascript
 * const { userRole, isAdmin, isAuditor, isSupervisor, canEdit, loading } = useRole();
 * ```
 * 
 * @returns {Object} Estado de roles y permisos
 */
export const useRole = () => {
  const { user, isAuthenticated } = useAuth();
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  // Cargar rol del usuario
  useEffect(() => {
    const loadUserRole = async () => {
      if (!isAuthenticated || !user) {
        setUserRole(null);
        setLoading(false);
        return;
      }

      try {
        const roleData = await getUserRole(user.uid);
        setUserRole(roleData);
      } catch (error) {
        console.error('❌ Error al cargar rol:', error);
        setUserRole(null);
      } finally {
        setLoading(false);
      }
    };

    loadUserRole();
  }, [user, isAuthenticated]);

  // Función para verificar si tiene un permiso específico
  const checkPermission = async (permission) => {
    if (!user) return false;
    return await hasPermission(user.uid, permission);
  };

  // Función para verificar si puede editar un campo
  const canEdit = (fieldName) => {
    if (!userRole) return false;
    const editableFields = EDITABLE_FIELDS_BY_ROLE[userRole.role] || [];
    return editableFields.includes(fieldName);
  };

  return {
    userRole,
    loading,
    isAdmin: userRole?.role === ROLES.ADMIN,
    isSupervisor: userRole?.role === ROLES.SUPERVISOR,
    isAuditor: userRole?.role === ROLES.AUDITOR,
    roleName: userRole ? getRoleName(userRole.role) : '',
    permissions: userRole?.permissions || [],
    assignedPlants: userRole?.assignedPlants || [],
    checkPermission,
    canEdit,
    editableFields: userRole ? EDITABLE_FIELDS_BY_ROLE[userRole.role] : []
  };
};

export default useRole;
