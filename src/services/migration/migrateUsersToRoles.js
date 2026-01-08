/**
 * migrateUsersToRoles.js
 * Script de migración para agregar roles a usuarios existentes
 * 
 * INSTRUCCIONES DE USO:
 * 1. Importar en tu aplicación o ejecutar desde consola
 * 2. Llamar a migrateAllUsers() una vez
 * 3. Verificar los resultados en Firebase Console
 */

import { db } from '../firebase/firebaseConfig';
import { collection, getDocs, doc, setDoc, updateDoc, getDoc } from 'firebase/firestore';
import { ROLES } from './roleService';

/**
 * Migrar un usuario específico
 * @param {string} userId - ID del usuario
 * @param {string} email - Email del usuario
 * @param {string} displayName - Nombre del usuario
 * @param {string} role - Rol a asignar (default: supervisor)
 * @returns {Promise<Object>} Resultado de la migración
 */
export const migrateUser = async (userId, email, displayName = null, role = ROLES.SUPERVISOR) => {
  try {
    const userRef = doc(db, 'users', userId);
    const userDoc = await getDoc(userRef);

    const userData = {
      email: email,
      displayName: displayName || email,
      role: role,
      assignedPlants: [],
      updatedAt: new Date().toISOString()
    };

    if (userDoc.exists()) {
      // Usuario existe, actualizar solo si no tiene rol
      const existingData = userDoc.data();
      if (!existingData.role) {
        await updateDoc(userRef, {
          role: role,
          assignedPlants: existingData.assignedPlants || [],
          updatedAt: new Date().toISOString()
        });
        console.log(`✅ Usuario actualizado: ${email} -> ${role}`);
        return { success: true, action: 'updated', email };
      } else {
        console.log(`ℹ️ Usuario ya tiene rol: ${email} (${existingData.role})`);
        return { success: true, action: 'skipped', email, existingRole: existingData.role };
      }
    } else {
      // Usuario no existe, crear nuevo
      await setDoc(userRef, {
        ...userData,
        createdAt: new Date().toISOString()
      });
      console.log(`✅ Usuario creado: ${email} -> ${role}`);
      return { success: true, action: 'created', email };
    }
  } catch (error) {
    console.error(`❌ Error al migrar usuario ${email}:`, error);
    return { success: false, error: error.message, email };
  }
};

/**
 * Migrar todos los usuarios existentes de Firebase Auth
 * NOTA: Esta función requiere acceso admin a Firebase Auth
 */
export const migrateAllUsers = async () => {
  console.log('🚀 Iniciando migración de usuarios...');
  console.log('═══════════════════════════════════════');

  try {
    // Obtener todos los usuarios existentes en Firestore
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    
    const results = {
      total: 0,
      updated: 0,
      created: 0,
      skipped: 0,
      errors: 0
    };

    if (snapshot.empty) {
      console.log('⚠️ No se encontraron usuarios en Firestore');
      console.log('ℹ️ Los usuarios se crearán automáticamente al iniciar sesión');
      return results;
    }

    // Procesar cada usuario
    for (const doc of snapshot.docs) {
      results.total++;
      const userId = doc.id;
      const userData = doc.data();

      const result = await migrateUser(
        userId,
        userData.email,
        userData.displayName,
        userData.role || ROLES.SUPERVISOR
      );

      if (result.success) {
        if (result.action === 'updated') results.updated++;
        else if (result.action === 'created') results.created++;
        else if (result.action === 'skipped') results.skipped++;
      } else {
        results.errors++;
      }
    }

    console.log('═══════════════════════════════════════');
    console.log('✅ Migración completada');
    console.log('═══════════════════════════════════════');
    console.log(`📊 Total de usuarios: ${results.total}`);
    console.log(`✅ Actualizados: ${results.updated}`);
    console.log(`➕ Creados: ${results.created}`);
    console.log(`⏭️ Omitidos: ${results.skipped}`);
    console.log(`❌ Errores: ${results.errors}`);
    console.log('═══════════════════════════════════════');

    return results;
  } catch (error) {
    console.error('❌ Error en migración:', error);
    throw error;
  }
};

/**
 * Asignar rol de administrador al primer usuario
 * Útil para setup inicial
 * @param {string} email - Email del usuario a hacer admin
 */
export const makeFirstAdmin = async (email) => {
  try {
    // Buscar usuario por email
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    
    let userFound = false;
    for (const doc of snapshot.docs) {
      const userData = doc.data();
      if (userData.email === email) {
        const userRef = doc.ref;
        await updateDoc(userRef, {
          role: ROLES.ADMIN,
          updatedAt: new Date().toISOString()
        });
        console.log(`✅ ${email} es ahora ADMINISTRADOR`);
        userFound = true;
        break;
      }
    }

    if (!userFound) {
      console.log(`⚠️ Usuario con email ${email} no encontrado`);
      console.log('ℹ️ El usuario debe iniciar sesión primero');
    }

    return userFound;
  } catch (error) {
    console.error('❌ Error al asignar admin:', error);
    return false;
  }
};

/**
 * Crear usuarios de ejemplo para testing
 * SOLO USAR EN DESARROLLO
 */
export const createSampleUsers = async () => {
  console.log('🧪 Creando usuarios de ejemplo...');
  
  const sampleUsers = [
    {
      id: 'admin-sample-001',
      email: 'admin@auditoria.com',
      displayName: 'Administrador Principal',
      role: ROLES.ADMIN
    },
    {
      id: 'supervisor-sample-001',
      email: 'supervisor1@auditoria.com',
      displayName: 'Juan Supervisor',
      role: ROLES.SUPERVISOR
    },
    {
      id: 'auditor-sample-001',
      email: 'auditor1@auditoria.com',
      displayName: 'María Auditor',
      role: ROLES.AUDITOR
    }
  ];

  const results = [];
  for (const user of sampleUsers) {
    const result = await migrateUser(user.id, user.email, user.displayName, user.role);
    results.push(result);
  }

  console.log('✅ Usuarios de ejemplo creados');
  return results;
};

/**
 * Verificar estado de la migración
 * Muestra estadísticas de usuarios por rol
 */
export const checkMigrationStatus = async () => {
  try {
    console.log('🔍 Verificando estado de usuarios...');
    console.log('═══════════════════════════════════════');

    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);

    const stats = {
      total: 0,
      withRole: 0,
      withoutRole: 0,
      byRole: {
        [ROLES.ADMIN]: 0,
        [ROLES.SUPERVISOR]: 0,
        [ROLES.AUDITOR]: 0
      }
    };

    snapshot.forEach(doc => {
      stats.total++;
      const userData = doc.data();
      
      if (userData.role) {
        stats.withRole++;
        stats.byRole[userData.role] = (stats.byRole[userData.role] || 0) + 1;
      } else {
        stats.withoutRole++;
      }
    });

    console.log(`📊 Total de usuarios: ${stats.total}`);
    console.log(`✅ Con rol asignado: ${stats.withRole}`);
    console.log(`⚠️ Sin rol asignado: ${stats.withoutRole}`);
    console.log('');
    console.log('👥 Por rol:');
    console.log(`   👑 Administradores: ${stats.byRole[ROLES.ADMIN]}`);
    console.log(`   👷 Supervisores: ${stats.byRole[ROLES.SUPERVISOR]}`);
    console.log(`   🔍 Auditores: ${stats.byRole[ROLES.AUDITOR]}`);
    console.log('═══════════════════════════════════════');

    return stats;
  } catch (error) {
    console.error('❌ Error al verificar estado:', error);
    return null;
  }
};

// Exportar funciones para uso en aplicación
const userMigrationService = {
  migrateUser,
  migrateAllUsers,
  makeFirstAdmin,
  createSampleUsers,
  checkMigrationStatus
};

export default userMigrationService;
