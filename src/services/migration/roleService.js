/**
 * roleService.js
 * Servicio de Gestión de Roles y Permisos
 *
 * Sistema de 4 Roles:
 * - ADMIN: Control total del sistema
 * - SUPERVISOR: Captura de datos en campo
 * - AUDITOR: Revisión y evaluación
 * - VISUALIZADOR: Solo consulta de información (lectura)
 */

import { db } from '../firebase/firebaseConfig';
import { 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  collection,
  query,
  where,
  getDocs 
} from 'firebase/firestore';

// ============================================
// 🎯 DEFINICIÓN DE ROLES Y PERMISOS
// ============================================

/**
 * Roles disponibles en el sistema
 */
export const ROLES = {
  ADMIN: 'admin',
  SUPERVISOR: 'supervisor',
  AUDITOR: 'auditor',
  VISUALIZADOR: 'visualizador'
};

/**
 * Permisos del sistema organizados por categoría
 */
export const PERMISSIONS = {
  // Gestión de Usuarios
  users: {
    view: 'users.view',
    create: 'users.create',
    edit: 'users.edit',
    delete: 'users.delete',
    assignRole: 'users.assignRole'
  },
  
  // Gestión de Plantas
  plants: {
    viewAll: 'plants.viewAll',      // Ver todas las plantas
    viewOwn: 'plants.viewOwn',      // Ver solo plantas asignadas
    create: 'plants.create',
    edit: 'plants.edit',
    delete: 'plants.delete',
    assign: 'plants.assign'          // Asignar plantas a supervisores
  },
  
  // Gestión de Equipos
  equipment: {
    viewAll: 'equipment.viewAll',
    viewOwn: 'equipment.viewOwn',
    create: 'equipment.create',
    editAll: 'equipment.editAll',    // Editar todos los campos
    editReview: 'equipment.editReview', // Solo campos de revisión (auditor)
    delete: 'equipment.delete'
  },
  
  // Imágenes y PDFs
  files: {
    viewAll: 'files.viewAll',
    upload: 'files.upload',
    delete: 'files.delete',
    download: 'files.download'
  },
  
  // Reportes
  reports: {
    generate: 'reports.generate',
    exportPDF: 'reports.exportPDF',
    exportExcel: 'reports.exportExcel',
    viewStats: 'reports.viewStats'
  },
  
  // Sistema
  system: {
    config: 'system.config',
    backup: 'system.backup',
    cleanDatabase: 'system.cleanDatabase'
  }
};

/**
 * Matriz de permisos por rol
 */
export const ROLE_PERMISSIONS = {
  [ROLES.ADMIN]: [
    // Usuarios
    PERMISSIONS.users.view,
    PERMISSIONS.users.create,
    PERMISSIONS.users.edit,
    PERMISSIONS.users.delete,
    PERMISSIONS.users.assignRole,
    
    // Plantas
    PERMISSIONS.plants.viewAll,
    PERMISSIONS.plants.create,
    PERMISSIONS.plants.edit,
    PERMISSIONS.plants.delete,
    PERMISSIONS.plants.assign,
    
    // Equipos
    PERMISSIONS.equipment.viewAll,
    PERMISSIONS.equipment.create,
    PERMISSIONS.equipment.editAll,
    PERMISSIONS.equipment.delete,
    
    // Archivos
    PERMISSIONS.files.viewAll,
    PERMISSIONS.files.upload,
    PERMISSIONS.files.delete,
    PERMISSIONS.files.download,
    
    // Reportes
    PERMISSIONS.reports.generate,
    PERMISSIONS.reports.exportPDF,
    PERMISSIONS.reports.exportExcel,
    PERMISSIONS.reports.viewStats,
    
    // Sistema
    PERMISSIONS.system.config,
    PERMISSIONS.system.backup,
    PERMISSIONS.system.cleanDatabase
  ],
  
  [ROLES.SUPERVISOR]: [
    // Plantas (solo asignadas)
    PERMISSIONS.plants.viewOwn,
    PERMISSIONS.plants.edit,
    
    // Equipos (solo de sus plantas)
    PERMISSIONS.equipment.viewOwn,
    PERMISSIONS.equipment.create,
    PERMISSIONS.equipment.editAll,
    
    // Archivos
    PERMISSIONS.files.viewAll,
    PERMISSIONS.files.upload,
    PERMISSIONS.files.download,
    
    // Reportes básicos
    PERMISSIONS.reports.generate,
    PERMISSIONS.reports.exportPDF
  ],
  
  [ROLES.AUDITOR]: [
    // Plantas (ver todas)
    PERMISSIONS.plants.viewAll,

    // Equipos (ver todos, editar solo campos de revisión)
    PERMISSIONS.equipment.viewAll,
    PERMISSIONS.equipment.editReview,

    // Archivos (solo lectura y descarga)
    PERMISSIONS.files.viewAll,
    PERMISSIONS.files.download,

    // Reportes completos
    PERMISSIONS.reports.generate,
    PERMISSIONS.reports.exportPDF,
    PERMISSIONS.reports.exportExcel,
    PERMISSIONS.reports.viewStats
  ],

  [ROLES.VISUALIZADOR]: [
    // Plantas (ver todas - solo lectura)
    PERMISSIONS.plants.viewAll,

    // Equipos (ver todos - solo lectura)
    PERMISSIONS.equipment.viewAll,

    // Archivos (solo lectura y descarga)
    PERMISSIONS.files.viewAll,
    PERMISSIONS.files.download,

    // Reportes (solo visualización)
    PERMISSIONS.reports.viewStats
  ]
};

/**
 * Campos que cada rol puede editar en un equipo
 */
export const EDITABLE_FIELDS_BY_ROLE = {
  [ROLES.ADMIN]: [
    'equipmentName',
    'locationInPlant',
    'serialNumber',
    'model',
    'manufacturer',
    'countryOfOrigin',
    'plateStatus',
    'plateNotes',
    'origin',
    'actionsDescription',
    'observations'
  ],
  
  [ROLES.SUPERVISOR]: [
    'equipmentName',
    'locationInPlant',
    'serialNumber',
    'model',
    'manufacturer',
    'countryOfOrigin',
    'plateStatus',
    'plateNotes',
    'origin',
    'actionsDescription',
    'observations'
  ],
  
  [ROLES.AUDITOR]: [
    'actionsDescription',  // Solo puede editar estos 2 campos
    'observations'
  ],

  [ROLES.VISUALIZADOR]: []  // No puede editar ningún campo (solo lectura)
};

// ============================================
// 🔐 FUNCIONES DE GESTIÓN DE ROLES
// ============================================

/**
 * Obtener datos completos del usuario incluyendo rol
 * @param {string} userId - ID del usuario
 * @returns {Promise<Object>} Datos del usuario con rol
 */
export const getUserRole = async (userId) => {
  try {
    if (!userId) {
      console.error('❌ getUserRole: userId es requerido');
      return null;
    }

    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      console.log('⚠️ Usuario no encontrado en Firestore:', userId);
      return {
        role: ROLES.SUPERVISOR, // Rol por defecto
        assignedPlants: [],
        permissions: ROLE_PERMISSIONS[ROLES.SUPERVISOR]
      };
    }

    const userData = userDoc.data();
    const role = userData.role || ROLES.SUPERVISOR;
    
    return {
      id: userId,
      email: userData.email,
      displayName: userData.displayName,
      role: role,
      assignedPlants: userData.assignedPlants || [],
      permissions: ROLE_PERMISSIONS[role] || [],
      createdAt: userData.createdAt,
      lastLogin: userData.lastLogin
    };
  } catch (error) {
    console.error('❌ Error al obtener rol del usuario:', error);
    return null;
  }
};

/**
 * Crear o actualizar datos del usuario en Firestore
 * @param {string} userId - ID del usuario
 * @param {Object} userData - Datos del usuario
 * @param {string} userData.email - Email del usuario
 * @param {string} userData.displayName - Nombre del usuario
 * @param {string} userData.role - Rol del usuario
 * @returns {Promise<boolean>} True si se actualizó correctamente
 */
export const createOrUpdateUserRole = async (userId, userData) => {
  try {
    if (!userId) {
      throw new Error('userId es requerido');
    }

    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    if (userDoc.exists()) {
      // Usuario existente: actualizar SOLO campos básicos, NO el rol
      const existingData = userDoc.data();
      await updateDoc(userRef, {
        email: userData.email || existingData.email,
        displayName: userData.displayName || existingData.displayName,
        // ❌ NO sobrescribir: role, assignedPlants (se mantienen los existentes)
        updatedAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      });
      console.log('✅ Usuario actualizado (rol preservado):', userId, '- Rol:', existingData.role);
    } else {
      // Crear nuevo usuario con rol por defecto
      const defaultData = {
        email: userData.email,
        displayName: userData.displayName || userData.email,
        role: userData.role || ROLES.SUPERVISOR,
        assignedPlants: userData.assignedPlants || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };
      await setDoc(userRef, defaultData);
      console.log('✅ Nuevo usuario creado:', userId, '- Rol:', defaultData.role);
    }

    return true;
  } catch (error) {
    console.error('❌ Error al crear/actualizar usuario:', error);
    return false;
  }
};

/**
 * Verificar si el usuario tiene un permiso específico
 * @param {string} userId - ID del usuario
 * @param {string} permission - Permiso a verificar
 * @returns {Promise<boolean>} True si tiene el permiso
 */
export const hasPermission = async (userId, permission) => {
  try {
    const userRole = await getUserRole(userId);
    if (!userRole) return false;

    const userPermissions = ROLE_PERMISSIONS[userRole.role] || [];
    return userPermissions.includes(permission);
  } catch (error) {
    console.error('❌ Error al verificar permiso:', error);
    return false;
  }
};

/**
 * Verificar si el usuario puede editar un campo específico de un equipo
 * @param {string} userId - ID del usuario
 * @param {string} fieldName - Nombre del campo
 * @returns {Promise<boolean>} True si puede editar el campo
 */
export const canEditField = async (userId, fieldName) => {
  try {
    const userRole = await getUserRole(userId);
    if (!userRole) return false;

    const editableFields = EDITABLE_FIELDS_BY_ROLE[userRole.role] || [];
    return editableFields.includes(fieldName);
  } catch (error) {
    console.error('❌ Error al verificar campo editable:', error);
    return false;
  }
};

/**
 * Verificar si el usuario puede ver una planta
 * @param {string} userId - ID del usuario
 * @param {string} plantId - ID de la planta
 * @returns {Promise<boolean>} True si puede ver la planta
 */
export const canViewPlant = async (userId, plantId) => {
  try {
    const userRole = await getUserRole(userId);
    if (!userRole) return false;

    // Admin, Auditor y Visualizador pueden ver todas las plantas
    if (userRole.role === ROLES.ADMIN || userRole.role === ROLES.AUDITOR || userRole.role === ROLES.VISUALIZADOR) {
      return true;
    }

    // Supervisor solo puede ver plantas asignadas
    if (userRole.role === ROLES.SUPERVISOR) {
      return userRole.assignedPlants.includes(plantId);
    }

    return false;
  } catch (error) {
    console.error('❌ Error al verificar acceso a planta:', error);
    return false;
  }
};

/**
 * Asignar rol a un usuario (solo Admin)
 * @param {string} adminId - ID del administrador
 * @param {string} targetUserId - ID del usuario a modificar
 * @param {string} newRole - Nuevo rol a asignar
 * @returns {Promise<Object>} Resultado de la operación
 */
export const assignRole = async (adminId, targetUserId, newRole) => {
  try {
    // Verificar que el usuario que asigna es admin
    const adminRole = await getUserRole(adminId);
    if (!adminRole || adminRole.role !== ROLES.ADMIN) {
      return {
        success: false,
        error: 'Solo administradores pueden asignar roles'
      };
    }

    // Verificar que el rol es válido
    if (!Object.values(ROLES).includes(newRole)) {
      return {
        success: false,
        error: 'Rol inválido'
      };
    }

    // Actualizar el rol
    const userRef = doc(db, 'users', targetUserId);
    await updateDoc(userRef, {
      role: newRole,
      updatedAt: new Date().toISOString(),
      updatedBy: adminId
    });

    console.log(`✅ Rol actualizado: ${targetUserId} -> ${newRole}`);
    
    return {
      success: true,
      message: 'Rol actualizado correctamente'
    };
  } catch (error) {
    console.error('❌ Error al asignar rol:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Asignar plantas a un supervisor (solo Admin)
 * @param {string} adminId - ID del administrador
 * @param {string} supervisorId - ID del supervisor
 * @param {Array<string>} plantIds - Array de IDs de plantas
 * @returns {Promise<Object>} Resultado de la operación
 */
export const assignPlantsToSupervisor = async (adminId, supervisorId, plantIds) => {
  try {
    // Verificar que el usuario que asigna es admin
    const adminRole = await getUserRole(adminId);
    if (!adminRole || adminRole.role !== ROLES.ADMIN) {
      return {
        success: false,
        error: 'Solo administradores pueden asignar plantas'
      };
    }

    // Verificar que el supervisor existe y tiene el rol correcto
    const supervisorRole = await getUserRole(supervisorId);
    if (!supervisorRole || supervisorRole.role !== ROLES.SUPERVISOR) {
      return {
        success: false,
        error: 'El usuario no es un supervisor'
      };
    }

    // Actualizar plantas asignadas
    const userRef = doc(db, 'users', supervisorId);
    await updateDoc(userRef, {
      assignedPlants: plantIds,
      updatedAt: new Date().toISOString(),
      updatedBy: adminId
    });

    console.log(`✅ Plantas asignadas a supervisor ${supervisorId}:`, plantIds);
    
    return {
      success: true,
      message: 'Plantas asignadas correctamente'
    };
  } catch (error) {
    console.error('❌ Error al asignar plantas:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Obtener todos los usuarios (solo Admin)
 * @param {string} adminId - ID del administrador
 * @returns {Promise<Array>} Lista de usuarios
 */
export const getAllUsers = async (adminId) => {
  try {
    // Verificar que el usuario es admin
    const adminRole = await getUserRole(adminId);
    if (!adminRole || adminRole.role !== ROLES.ADMIN) {
      console.error('❌ Solo administradores pueden ver todos los usuarios');
      return [];
    }

    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    
    const users = [];
    snapshot.forEach(doc => {
      users.push({
        id: doc.id,
        ...doc.data()
      });
    });

    console.log(`✅ Obtenidos ${users.length} usuarios`);
    return users;
  } catch (error) {
    console.error('❌ Error al obtener usuarios:', error);
    return [];
  }
};

/**
 * Obtener usuarios por rol
 * @param {string} role - Rol a buscar
 * @returns {Promise<Array>} Lista de usuarios con ese rol
 */
export const getUsersByRole = async (role) => {
  try {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('role', '==', role));
    const snapshot = await getDocs(q);
    
    const users = [];
    snapshot.forEach(doc => {
      users.push({
        id: doc.id,
        ...doc.data()
      });
    });

    console.log(`✅ Encontrados ${users.length} usuarios con rol ${role}`);
    return users;
  } catch (error) {
    console.error('❌ Error al obtener usuarios por rol:', error);
    return [];
  }
};

// ============================================
// 🛡️ FUNCIONES DE VERIFICACIÓN RÁPIDA
// ============================================

/**
 * Verificar si es Admin
 */
export const isAdmin = async (userId) => {
  const userRole = await getUserRole(userId);
  return userRole?.role === ROLES.ADMIN;
};

/**
 * Verificar si es Supervisor
 */
export const isSupervisor = async (userId) => {
  const userRole = await getUserRole(userId);
  return userRole?.role === ROLES.SUPERVISOR;
};

/**
 * Verificar si es Auditor
 */
export const isAuditor = async (userId) => {
  const userRole = await getUserRole(userId);
  return userRole?.role === ROLES.AUDITOR;
};

/**
 * Verificar si es Visualizador
 */
export const isVisualizador = async (userId) => {
  const userRole = await getUserRole(userId);
  return userRole?.role === ROLES.VISUALIZADOR;
};

/**
 * Obtener nombre legible del rol
 */
export const getRoleName = (role) => {
  const roleNames = {
    [ROLES.ADMIN]: 'Administrador',
    [ROLES.SUPERVISOR]: 'Supervisor',
    [ROLES.AUDITOR]: 'Auditor',
    [ROLES.VISUALIZADOR]: 'Visualizador'
  };
  return roleNames[role] || 'Desconocido';
};

// ============================================
// 📊 FUNCIONES DE LOGGING Y DEBUGGING
// ============================================

/**
 * Obtener información completa del rol del usuario (para debugging)
 */
export const debugUserRole = async (userId) => {
  try {
    const userRole = await getUserRole(userId);
    
    console.log('═══════════════════════════════════════');
    console.log('🔍 DEBUG: Información del Usuario');
    console.log('═══════════════════════════════════════');
    console.log('ID:', userId);
    console.log('Email:', userRole?.email);
    console.log('Nombre:', userRole?.displayName);
    console.log('Rol:', getRoleName(userRole?.role));
    console.log('Plantas Asignadas:', userRole?.assignedPlants);
    console.log('Permisos:', userRole?.permissions?.length || 0);
    console.log('═══════════════════════════════════════');
    
    return userRole;
  } catch (error) {
    console.error('❌ Error en debug:', error);
    return null;
  }
};

export default {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  EDITABLE_FIELDS_BY_ROLE,
  getUserRole,
  createOrUpdateUserRole,
  hasPermission,
  canEditField,
  canViewPlant,
  assignRole,
  assignPlantsToSupervisor,
  getAllUsers,
  getUsersByRole,
  isAdmin,
  isSupervisor,
  isAuditor,
  isVisualizador,
  getRoleName,
  debugUserRole
};