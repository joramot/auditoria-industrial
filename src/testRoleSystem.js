/**
 * testRoleSystem.js
 * Suite de pruebas para el sistema de roles
 * 
 * INSTRUCCIONES:
 * 1. Importar en tu aplicación
 * 2. Ejecutar las funciones de prueba desde la consola
 * 3. Verificar resultados en Firebase Console
 */

import {
  getUserRole,
  createOrUpdateUserRole,
  hasPermission,
  canEditField,
  canViewPlant,
  assignRole,
  isAdmin,
  isSupervisor,
  isAuditor,
  debugUserRole,
  ROLES,
  PERMISSIONS
} from './services/roleService';

import {
  migrateAllUsers,
  makeFirstAdmin,
  checkMigrationStatus
} from './migrateUsersToRoles';

// ============================================
// 🧪 PRUEBAS UNITARIAS
// ============================================

/**
 * Prueba 1: Crear usuario con rol
 */
export const testCreateUser = async () => {
  console.log('\n🧪 TEST 1: Crear Usuario con Rol');
  console.log('═══════════════════════════════════════');
  
  const testUserId = 'test-user-001';
  const testData = {
    email: 'test@auditoria.com',
    displayName: 'Usuario de Prueba',
    role: ROLES.SUPERVISOR,
    assignedPlants: []
  };

  try {
    const result = await createOrUpdateUserRole(testUserId, testData);
    
    if (result) {
      console.log('✅ Usuario creado correctamente');
      
      // Verificar que se guardó
      const userData = await getUserRole(testUserId);
      console.log('📊 Datos guardados:', userData);
      
      return true;
    } else {
      console.log('❌ Error al crear usuario');
      return false;
    }
  } catch (error) {
    console.error('❌ Error en prueba:', error);
    return false;
  }
};

/**
 * Prueba 2: Verificar permisos por rol
 */
export const testPermissions = async () => {
  console.log('\n🧪 TEST 2: Verificar Permisos por Rol');
  console.log('═══════════════════════════════════════');
  
  // Crear usuarios de prueba con diferentes roles
  const testUsers = [
    {
      id: 'test-admin',
      email: 'admin-test@auditoria.com',
      displayName: 'Admin Test',
      role: ROLES.ADMIN
    },
    {
      id: 'test-supervisor',
      email: 'supervisor-test@auditoria.com',
      displayName: 'Supervisor Test',
      role: ROLES.SUPERVISOR
    },
    {
      id: 'test-auditor',
      email: 'auditor-test@auditoria.com',
      displayName: 'Auditor Test',
      role: ROLES.AUDITOR
    }
  ];

  try {
    // Crear usuarios
    for (const user of testUsers) {
      await createOrUpdateUserRole(user.id, user);
    }

    // Probar permisos de Admin
    console.log('\n👑 Probando permisos de ADMIN:');
    const adminCanCreateUsers = await hasPermission('test-admin', PERMISSIONS.users.create);
    const adminCanDeletePlants = await hasPermission('test-admin', PERMISSIONS.plants.delete);
    const adminCanViewAll = await hasPermission('test-admin', PERMISSIONS.equipment.viewAll);
    console.log('  Crear usuarios:', adminCanCreateUsers ? '✅' : '❌');
    console.log('  Eliminar plantas:', adminCanDeletePlants ? '✅' : '❌');
    console.log('  Ver todos los equipos:', adminCanViewAll ? '✅' : '❌');

    // Probar permisos de Supervisor
    console.log('\n👷 Probando permisos de SUPERVISOR:');
    const supCanCreateEquip = await hasPermission('test-supervisor', PERMISSIONS.equipment.create);
    const supCanDeleteUsers = await hasPermission('test-supervisor', PERMISSIONS.users.delete);
    const supCanUpload = await hasPermission('test-supervisor', PERMISSIONS.files.upload);
    console.log('  Crear equipos:', supCanCreateEquip ? '✅' : '❌');
    console.log('  Eliminar usuarios:', supCanDeleteUsers ? '❌ (correcto)' : '✅ (error!)');
    console.log('  Subir archivos:', supCanUpload ? '✅' : '❌');

    // Probar permisos de Auditor
    console.log('\n🔍 Probando permisos de AUDITOR:');
    const audCanViewAll = await hasPermission('test-auditor', PERMISSIONS.equipment.viewAll);
    const audCanEditReview = await hasPermission('test-auditor', PERMISSIONS.equipment.editReview);
    const audCanUpload = await hasPermission('test-auditor', PERMISSIONS.files.upload);
    console.log('  Ver todos los equipos:', audCanViewAll ? '✅' : '❌');
    console.log('  Editar campos de revisión:', audCanEditReview ? '✅' : '❌');
    console.log('  Subir archivos:', audCanUpload ? '❌ (correcto)' : '✅ (error!)');

    return true;
  } catch (error) {
    console.error('❌ Error en prueba:', error);
    return false;
  }
};

/**
 * Prueba 3: Verificar campos editables
 */
export const testEditableFields = async () => {
  console.log('\n🧪 TEST 3: Verificar Campos Editables');
  console.log('═══════════════════════════════════════');

  try {
    // Supervisor puede editar todos los campos
    console.log('\n👷 Supervisor:');
    const supCanEditName = await canEditField('test-supervisor', 'equipmentName');
    const supCanEditActions = await canEditField('test-supervisor', 'actionsDescription');
    console.log('  Editar nombre equipo:', supCanEditName ? '✅' : '❌');
    console.log('  Editar acciones:', supCanEditActions ? '✅' : '❌');

    // Auditor solo puede editar 2 campos
    console.log('\n🔍 Auditor:');
    const audCanEditName = await canEditField('test-auditor', 'equipmentName');
    const audCanEditActions = await canEditField('test-auditor', 'actionsDescription');
    const audCanEditObs = await canEditField('test-auditor', 'observations');
    console.log('  Editar nombre equipo:', audCanEditName ? '✅ (error!)' : '❌ (correcto)');
    console.log('  Editar acciones:', audCanEditActions ? '✅' : '❌');
    console.log('  Editar observaciones:', audCanEditObs ? '✅' : '❌');

    return true;
  } catch (error) {
    console.error('❌ Error en prueba:', error);
    return false;
  }
};

/**
 * Prueba 4: Asignar roles
 */
export const testAssignRole = async () => {
  console.log('\n🧪 TEST 4: Asignar Roles');
  console.log('═══════════════════════════════════════');

  try {
    // Intentar asignar rol siendo admin
    console.log('\n✅ Admin asignando rol a usuario:');
    const result1 = await assignRole('test-admin', 'test-supervisor', ROLES.AUDITOR);
    console.log('  Resultado:', result1);

    // Verificar el cambio
    const userData = await getUserRole('test-supervisor');
    console.log('  Nuevo rol:', userData?.role);

    // Intentar asignar rol NO siendo admin (debe fallar)
    console.log('\n❌ Supervisor intentando asignar rol (debe fallar):');
    const result2 = await assignRole('test-supervisor', 'test-auditor', ROLES.ADMIN);
    console.log('  Resultado:', result2);

    return true;
  } catch (error) {
    console.error('❌ Error en prueba:', error);
    return false;
  }
};

/**
 * Prueba 5: Verificar acceso a plantas
 */
export const testPlantAccess = async () => {
  console.log('\n🧪 TEST 5: Verificar Acceso a Plantas');
  console.log('═══════════════════════════════════════');

  try {
    // Crear supervisor con plantas asignadas
    await createOrUpdateUserRole('test-supervisor', {
      email: 'supervisor-test@auditoria.com',
      displayName: 'Supervisor Test',
      role: ROLES.SUPERVISOR,
      assignedPlants: ['plant-001', 'plant-002']
    });

    console.log('\n👷 Supervisor:');
    const canViewPlant1 = await canViewPlant('test-supervisor', 'plant-001');
    const canViewPlant2 = await canViewPlant('test-supervisor', 'plant-999');
    console.log('  Ver planta asignada (plant-001):', canViewPlant1 ? '✅' : '❌');
    console.log('  Ver planta NO asignada (plant-999):', canViewPlant2 ? '✅ (error!)' : '❌ (correcto)');

    console.log('\n🔍 Auditor:');
    const audCanViewAny = await canViewPlant('test-auditor', 'plant-999');
    console.log('  Ver cualquier planta:', audCanViewAny ? '✅' : '❌');

    return true;
  } catch (error) {
    console.error('❌ Error en prueba:', error);
    return false;
  }
};

/**
 * Prueba 6: Verificar funciones de verificación rápida
 */
export const testRoleChecks = async () => {
  console.log('\n🧪 TEST 6: Verificar Funciones Rápidas de Rol');
  console.log('═══════════════════════════════════════');

  try {
    const adminCheck = await isAdmin('test-admin');
    const supervisorCheck = await isSupervisor('test-supervisor');
    const auditorCheck = await isAuditor('test-auditor');

    console.log('isAdmin(test-admin):', adminCheck ? '✅' : '❌');
    console.log('isSupervisor(test-supervisor):', supervisorCheck ? '✅' : '❌');
    console.log('isAuditor(test-auditor):', auditorCheck ? '✅' : '❌');

    // Verificar que no se confundan
    const adminNotSupervisor = !(await isSupervisor('test-admin'));
    console.log('Admin NO es Supervisor:', adminNotSupervisor ? '✅' : '❌');

    return true;
  } catch (error) {
    console.error('❌ Error en prueba:', error);
    return false;
  }
};

// ============================================
// 🎯 EJECUTAR TODAS LAS PRUEBAS
// ============================================

/**
 * Ejecutar suite completa de pruebas
 */
export const runAllTests = async () => {
  console.log('\n');
  console.log('═══════════════════════════════════════');
  console.log('🚀 INICIANDO SUITE DE PRUEBAS');
  console.log('═══════════════════════════════════════');

  const results = {
    total: 0,
    passed: 0,
    failed: 0
  };

  const tests = [
    { name: 'Crear Usuario', fn: testCreateUser },
    { name: 'Verificar Permisos', fn: testPermissions },
    { name: 'Campos Editables', fn: testEditableFields },
    { name: 'Asignar Roles', fn: testAssignRole },
    { name: 'Acceso a Plantas', fn: testPlantAccess },
    { name: 'Verificaciones Rápidas', fn: testRoleChecks }
  ];

  for (const test of tests) {
    results.total++;
    try {
      const passed = await test.fn();
      if (passed) {
        results.passed++;
        console.log(`\n✅ ${test.name}: PASÓ`);
      } else {
        results.failed++;
        console.log(`\n❌ ${test.name}: FALLÓ`);
      }
    } catch (error) {
      results.failed++;
      console.log(`\n❌ ${test.name}: ERROR`);
      console.error(error);
    }
  }

  console.log('\n');
  console.log('═══════════════════════════════════════');
  console.log('📊 RESUMEN DE PRUEBAS');
  console.log('═══════════════════════════════════════');
  console.log(`Total: ${results.total}`);
  console.log(`✅ Pasaron: ${results.passed}`);
  console.log(`❌ Fallaron: ${results.failed}`);
  console.log(`📈 Tasa de éxito: ${((results.passed / results.total) * 100).toFixed(2)}%`);
  console.log('═══════════════════════════════════════');

  return results;
};

// ============================================
// 🔧 UTILIDADES DE DEBUG
// ============================================

/**
 * Imprimir información de un usuario
 */
export const printUserInfo = async (userId) => {
  await debugUserRole(userId);
};

/**
 * Limpiar usuarios de prueba
 */
export const cleanupTestUsers = async () => {
  console.log('\n🧹 Limpiando usuarios de prueba...');
  
  // Nota: Esta función requiere permisos de admin para eliminar
  // Por ahora solo imprime los IDs
  const testUserIds = [
    'test-user-001',
    'test-admin',
    'test-supervisor',
    'test-auditor'
  ];

  console.log('IDs de usuarios de prueba creados:');
  testUserIds.forEach(id => console.log(`  - ${id}`));
  console.log('\nElimina estos usuarios manualmente desde Firebase Console');
};

// Exportar todas las funciones de prueba
export default {
  testCreateUser,
  testPermissions,
  testEditableFields,
  testAssignRole,
  testPlantAccess,
  testRoleChecks,
  runAllTests,
  printUserInfo,
  cleanupTestUsers
};
