/**
 * useRole.js
 * Hook personalizado para gestión de roles en React
 * Proporciona acceso fácil a roles, permisos y verificaciones
 */

import { useState, useEffect, useCallback } from 'react';
import { 
  getUserRole, 
  hasPermission, 
  canEditField,
  canViewPlant,
  ROLES,
  PERMISSIONS,
  EDITABLE_FIELDS_BY_ROLE,
  getRoleName
} from './roleService';

/**
 * Hook principal de roles
 * @param {string} userId - ID del usuario actual
 * @returns {Object} Datos y funciones de rol
 */
export const useRole = (userId) => {
  const [roleData, setRoleData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Cargar datos del rol del usuario
  useEffect(() => {
    const loadUserRole = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const data = await getUserRole(userId);
        setRoleData(data);
        setError(null);
      } catch (err) {
        console.error('❌ Error al cargar rol:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    loadUserRole();
  }, [userId]);

  // Verificar permiso específico
  const checkPermission = useCallback(async (permission) => {
    if (!userId) return false;
    return await hasPermission(userId, permission);
  }, [userId]);

  // Verificar si puede editar un campo
  const checkEditField = useCallback(async (fieldName) => {
    if (!userId) return false;
    return await canEditField(userId, fieldName);
  }, [userId]);

  // Verificar si puede ver una planta
  const checkViewPlant = useCallback(async (plantId) => {
    if (!userId) return false;
    return await canViewPlant(userId, plantId);
  }, [userId]);

  // Verificaciones de rol
  const isAdmin = roleData?.role === ROLES.ADMIN;
  const isSupervisor = roleData?.role === ROLES.SUPERVISOR;
  const isAuditor = roleData?.role === ROLES.AUDITOR;

  // Nombre legible del rol
  const roleName = roleData ? getRoleName(roleData.role) : '';

  // Campos editables para este rol
  const editableFields = roleData 
    ? EDITABLE_FIELDS_BY_ROLE[roleData.role] || []
    : [];

  return {
    // Datos del rol
    roleData,
    role: roleData?.role,
    roleName,
    assignedPlants: roleData?.assignedPlants || [],
    permissions: roleData?.permissions || [],
    
    // Verificaciones de rol
    isAdmin,
    isSupervisor,
    isAuditor,
    
    // Funciones de verificación
    checkPermission,
    checkEditField,
    checkViewPlant,
    
    // Datos útiles
    editableFields,
    
    // Estado
    loading,
    error
  };
};

/**
 * Hook para verificar permisos específicos
 * @param {string} userId - ID del usuario
 * @param {string} permission - Permiso a verificar
 * @returns {Object} Estado del permiso
 */
export const usePermission = (userId, permission) => {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      if (!userId || !permission) {
        setLoading(false);
        return;
      }

      try {
        const access = await hasPermission(userId, permission);
        setHasAccess(access);
      } catch (error) {
        console.error('❌ Error al verificar permiso:', error);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [userId, permission]);

  return { hasAccess, loading };
};

/**
 * Hook para verificar si un campo es editable
 * @param {string} userId - ID del usuario
 * @param {string} fieldName - Nombre del campo
 * @returns {Object} Estado de edición
 */
export const useFieldPermission = (userId, fieldName) => {
  const [canEdit, setCanEdit] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkEdit = async () => {
      if (!userId || !fieldName) {
        setLoading(false);
        return;
      }

      try {
        const editable = await canEditField(userId, fieldName);
        setCanEdit(editable);
      } catch (error) {
        console.error('❌ Error al verificar campo editable:', error);
        setCanEdit(false);
      } finally {
        setLoading(false);
      }
    };

    checkEdit();
  }, [userId, fieldName]);

  return { canEdit, loading };
};

/**
 * Hook simple para obtener solo el rol
 * @param {string} userId - ID del usuario
 * @returns {Object} Rol y estado
 */
export const useUserRole = (userId) => {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadRole = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const data = await getUserRole(userId);
        setRole(data?.role);
      } catch (error) {
        console.error('❌ Error al cargar rol:', error);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    loadRole();
  }, [userId]);

  return { 
    role, 
    loading,
    isAdmin: role === ROLES.ADMIN,
    isSupervisor: role === ROLES.SUPERVISOR,
    isAuditor: role === ROLES.AUDITOR
  };
};

export default useRole;
