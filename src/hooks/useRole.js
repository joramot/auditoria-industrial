/**
 * useRole.js - VERSIÓN CORREGIDA v2.0
 * Hook personalizado para gestión de roles en React
 * Detecta automáticamente el usuario autenticado de Firebase
 * 
 * IMPORTANTE: Este archivo reemplaza COMPLETAMENTE el useRole.js anterior
 */

import { useState, useEffect, useCallback } from 'react';
import { auth } from '../services/firebase/firebaseConfig';
import {
  getUserRole,
  hasPermission,
  canEditField,
  canViewPlant,
  ROLES,
  EDITABLE_FIELDS_BY_ROLE,
  getRoleName
} from '../services/migration/roleService';

/**
 * Hook principal de roles - VERSIÓN MEJORADA
 * Detecta automáticamente el usuario actual de Firebase Auth
 * @returns {Object} Datos y funciones de rol
 */
export const useRole = () => {  // ← SIN PARÁMETROS
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  // ============================================
  // PASO 1: Detectar usuario autenticado
  // ============================================
  
  useEffect(() => {
    console.log('🎭 useRole: Configurando detección de usuario...');
    
    const unsubscribe = auth.onAuthStateChanged((user) => {
      console.log('🎭 useRole: Usuario detectado:', user?.email || 'ninguno');
      setCurrentUser(user);
      
      // Si no hay usuario, resetear todo
      if (!user) {
        setUserRole(null);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // ============================================
  // PASO 2: Cargar rol cuando hay usuario
  // ============================================
  
  useEffect(() => {
    const loadUserRole = async () => {
      // Si no hay usuario autenticado, no hacer nada
      if (!currentUser) {
        console.log('🎭 useRole: No hay usuario autenticado');
        setUserRole(null);
        setLoading(false);
        return;
      }

      try {
        console.log('🎭 useRole: Cargando rol para usuario:', currentUser.uid);
        setLoading(true);
        
        const roleData = await getUserRole(currentUser.uid);
        
        console.log('🎭 useRole: Rol obtenido:', roleData);
        
        setUserRole(roleData);
        setError(null);
        
      } catch (err) {
        console.error('❌ useRole: Error al cargar rol:', err);
        setError(err.message);
        setUserRole(null);
      } finally {
        setLoading(false);
      }
    };

    loadUserRole();
  }, [currentUser]); // ← Se ejecuta cuando currentUser cambia

  // ============================================
  // FUNCIONES DE VERIFICACIÓN
  // ============================================
  
  // Verificar permiso específico
  const checkPermission = useCallback(async (permission) => {
    if (!currentUser) return false;
    return await hasPermission(currentUser.uid, permission);
  }, [currentUser]);

  // Verificar si puede editar un campo
  const checkEditField = useCallback(async (fieldName) => {
    if (!currentUser) return false;
    return await canEditField(currentUser.uid, fieldName);
  }, [currentUser]);

  // Verificar si puede ver una planta
  const checkViewPlant = useCallback(async (plantId) => {
    if (!currentUser) return false;
    return await canViewPlant(currentUser.uid, plantId);
  }, [currentUser]);

  // ============================================
  // VERIFICACIONES DE ROL (BOOLEANOS)
  // ============================================

  const isAdmin = userRole?.role === ROLES.ADMIN;
  const isSupervisor = userRole?.role === ROLES.SUPERVISOR;
  const isAuditor = userRole?.role === ROLES.AUDITOR;
  const isVisualizador = userRole?.role === ROLES.VISUALIZADOR;

  // Nombre legible del rol
  const roleName = userRole ? getRoleName(userRole.role) : '';

  // Campos editables para este rol
  const editableFields = userRole 
    ? EDITABLE_FIELDS_BY_ROLE[userRole.role] || []
    : [];

  // ============================================
  // RETORNO DEL HOOK
  // ============================================
  
  return {
    // Datos del usuario y rol
    userRole,           // Objeto completo con rol y datos
    role: userRole?.role,
    roleName,
    assignedPlants: userRole?.assignedPlants || [],
    permissions: userRole?.permissions || [],
    
    // Verificaciones de rol (booleanos)
    isAdmin,
    isSupervisor,
    isAuditor,
    isVisualizador,

    // Funciones de verificación
    checkPermission,
    checkEditField,
    checkViewPlant,
    
    // Datos útiles
    editableFields,
    
    // Estado
    loading,
    error,
    
    // Usuario actual
    user: currentUser
  };
};

/**
 * Hook para verificar permisos específicos
 * @param {string} permission - Permiso a verificar
 * @returns {Object} Estado del permiso
 */
export const usePermission = (permission) => {
  const [hasAccess, setHasAccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  // Detectar usuario
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Verificar permiso
  useEffect(() => {
    const checkAccess = async () => {
      if (!currentUser || !permission) {
        setHasAccess(false);
        setLoading(false);
        return;
      }

      try {
        const access = await hasPermission(currentUser.uid, permission);
        setHasAccess(access);
      } catch (error) {
        console.error('❌ Error al verificar permiso:', error);
        setHasAccess(false);
      } finally {
        setLoading(false);
      }
    };

    checkAccess();
  }, [currentUser, permission]);

  return { hasAccess, loading };
};

/**
 * Hook para verificar si un campo es editable
 * @param {string} fieldName - Nombre del campo
 * @returns {Object} Estado de edición
 */
export const useFieldPermission = (fieldName) => {
  const [canEdit, setCanEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  // Detectar usuario
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Verificar campo
  useEffect(() => {
    const checkEdit = async () => {
      if (!currentUser || !fieldName) {
        setCanEdit(false);
        setLoading(false);
        return;
      }

      try {
        const editable = await canEditField(currentUser.uid, fieldName);
        setCanEdit(editable);
      } catch (error) {
        console.error('❌ Error al verificar campo editable:', error);
        setCanEdit(false);
      } finally {
        setLoading(false);
      }
    };

    checkEdit();
  }, [currentUser, fieldName]);

  return { canEdit, loading };
};

/**
 * Hook simple para obtener solo el rol
 * @returns {Object} Rol y estado
 */
export const useUserRole = () => {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  // Detectar usuario
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Cargar rol
  useEffect(() => {
    const loadRole = async () => {
      if (!currentUser) {
        setRole(null);
        setLoading(false);
        return;
      }

      try {
        const data = await getUserRole(currentUser.uid);
        setRole(data?.role);
      } catch (error) {
        console.error('❌ Error al cargar rol:', error);
        setRole(null);
      } finally {
        setLoading(false);
      }
    };

    loadRole();
  }, [currentUser]);

  return {
    role,
    loading,
    isAdmin: role === ROLES.ADMIN,
    isSupervisor: role === ROLES.SUPERVISOR,
    isAuditor: role === ROLES.AUDITOR,
    isVisualizador: role === ROLES.VISUALIZADOR
  };
};

export default useRole;
