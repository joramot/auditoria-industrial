/**
 * migrateEquipmentsToAuditFields.js
 * 
 * Script de migración para agregar campos de auditoría
 * a todos los equipos existentes en Firebase
 * 
 * IMPORTANTE: Ejecutar UNA SOLA VEZ después de actualizar firebaseServices.js
 */

import { db } from './firebase/firebaseConfig';
import {
  collection,
  getDocs,
  doc,
  writeBatch
} from 'firebase/firestore';

/**
 * 🔄 MIGRAR EQUIPOS EXISTENTES
 * 
 * Agrega los campos de auditoría a todos los equipos que no los tienen
 */
export const migrateEquipmentsToAuditFields = async () => {
  console.log('\n🔄 ================================================');
  console.log('🔄 INICIANDO MIGRACIÓN A CAMPOS DE AUDITORÍA');
  console.log('🔄 ================================================\n');

  try {
    // 1. Obtener todos los equipos
    console.log('📋 Paso 1: Obteniendo equipos existentes...');
    const equipmentRef = collection(db, 'equipment');
    const snapshot = await getDocs(equipmentRef);
    
    console.log(`✅ Encontrados ${snapshot.size} equipos`);

    if (snapshot.size === 0) {
      console.log('ℹ️ No hay equipos para migrar');
      return { success: true, migrated: 0 };
    }

    // 2. Identificar equipos que necesitan migración
    const equipmentsToMigrate = [];
    
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      
      // Verificar si ya tiene los campos de auditoría
      const needsMigration = 
        data.reviewStatus === undefined ||
        data.reviewDate === undefined ||
        data.reviewedBy === undefined ||
        data.reviewerName === undefined ||
        data.actionsDescription === undefined ||
        data.observations === undefined;
      
      if (needsMigration) {
        equipmentsToMigrate.push({
          id: docSnap.id,
          data: data
        });
      }
    });

    console.log(`\n📊 Análisis:`);
    console.log(`   - Total de equipos: ${snapshot.size}`);
    console.log(`   - Necesitan migración: ${equipmentsToMigrate.length}`);
    console.log(`   - Ya migrados: ${snapshot.size - equipmentsToMigrate.length}`);

    if (equipmentsToMigrate.length === 0) {
      console.log('\n✅ Todos los equipos ya tienen campos de auditoría');
      return { success: true, migrated: 0, alreadyMigrated: snapshot.size };
    }

    // 3. Migrar en lotes (batch)
    console.log(`\n🔄 Paso 2: Migrando ${equipmentsToMigrate.length} equipos...`);
    
    const batchSize = 500; // Firestore limita a 500 operaciones por batch
    let totalMigrated = 0;
    let currentBatch = 0;

    for (let i = 0; i < equipmentsToMigrate.length; i += batchSize) {
      const batch = writeBatch(db);
      const batchEquipments = equipmentsToMigrate.slice(i, i + batchSize);
      currentBatch++;

      console.log(`\n   📦 Batch ${currentBatch}: Migrando equipos ${i + 1} - ${Math.min(i + batchSize, equipmentsToMigrate.length)}...`);

      batchEquipments.forEach((equipment) => {
        const equipmentRef = doc(db, 'equipment', equipment.id);
        
        // Preparar campos de auditoría
        const auditFields = {
          reviewStatus: equipment.data.reviewStatus || 'pendiente',
          reviewDate: equipment.data.reviewDate || null,
          reviewedBy: equipment.data.reviewedBy || null,
          reviewerName: equipment.data.reviewerName || null,
          actionsDescription: equipment.data.actionsDescription || '',
          observations: equipment.data.observations || ''
        };

        // Agregar al batch
        batch.update(equipmentRef, auditFields);
      });

      // Ejecutar batch
      await batch.commit();
      totalMigrated += batchEquipments.length;
      console.log(`   ✅ Batch ${currentBatch} completado (${totalMigrated}/${equipmentsToMigrate.length})`);
    }

    console.log('\n✅ ================================================');
    console.log('✅ MIGRACIÓN COMPLETADA EXITOSAMENTE');
    console.log('✅ ================================================');
    console.log(`\n📊 Resultado:`);
    console.log(`   - Equipos migrados: ${totalMigrated}`);
    console.log(`   - Batches procesados: ${currentBatch}`);
    console.log(`   - Estado: ✅ ÉXITO\n`);

    return {
      success: true,
      migrated: totalMigrated,
      batches: currentBatch,
      totalEquipment: snapshot.size
    };

  } catch (error) {
    console.error('\n❌ ================================================');
    console.error('❌ ERROR EN LA MIGRACIÓN');
    console.error('❌ ================================================');
    console.error('Error:', error);
    console.error('Mensaje:', error.message);
    
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * 🔍 VERIFICAR ESTADO DE MIGRACIÓN
 * 
 * Verifica cuántos equipos tienen campos de auditoría
 */
export const checkMigrationStatus = async () => {
  try {
    console.log('\n🔍 Verificando estado de migración...\n');

    const equipmentRef = collection(db, 'equipment');
    const snapshot = await getDocs(equipmentRef);

    let withAuditFields = 0;
    let withoutAuditFields = 0;
    let partialAuditFields = 0;

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      
      const hasAllFields = 
        data.reviewStatus !== undefined &&
        data.reviewDate !== undefined &&
        data.reviewedBy !== undefined &&
        data.reviewerName !== undefined &&
        data.actionsDescription !== undefined &&
        data.observations !== undefined;
      
      const hasSomeFields = 
        data.reviewStatus !== undefined ||
        data.reviewDate !== undefined ||
        data.reviewedBy !== undefined ||
        data.reviewerName !== undefined ||
        data.actionsDescription !== undefined ||
        data.observations !== undefined;

      if (hasAllFields) {
        withAuditFields++;
      } else if (hasSomeFields) {
        partialAuditFields++;
      } else {
        withoutAuditFields++;
      }
    });

    console.log('📊 Estado de Migración:');
    console.log(`   - Total de equipos: ${snapshot.size}`);
    console.log(`   - ✅ Con campos completos: ${withAuditFields}`);
    console.log(`   - ⚠️  Con campos parciales: ${partialAuditFields}`);
    console.log(`   - ❌ Sin campos: ${withoutAuditFields}`);
    
    const percentage = snapshot.size > 0 
      ? Math.round((withAuditFields / snapshot.size) * 100) 
      : 0;
    
    console.log(`   - 📈 Progreso: ${percentage}%\n`);

    return {
      success: true,
      total: snapshot.size,
      withAuditFields,
      partialAuditFields,
      withoutAuditFields,
      percentage
    };

  } catch (error) {
    console.error('❌ Error al verificar estado:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * 🧹 LIMPIAR CAMPOS DE AUDITORÍA (OPCIONAL)
 * 
 * Elimina los campos de auditoría de todos los equipos
 * USAR SOLO PARA PRUEBAS - NO EN PRODUCCIÓN
 */
export const cleanAuditFields = async () => {
  console.log('\n⚠️  ================================================');
  console.log('⚠️  ADVERTENCIA: LIMPIANDO CAMPOS DE AUDITORÍA');
  console.log('⚠️  ================================================\n');

  try {
    const equipmentRef = collection(db, 'equipment');
    const snapshot = await getDocs(equipmentRef);

    console.log(`Limpiando ${snapshot.size} equipos...`);

    const batch = writeBatch(db);
    let count = 0;

    snapshot.forEach((docSnap) => {
      const equipmentDocRef = doc(db, 'equipment', docSnap.id);
      batch.update(equipmentDocRef, {
        reviewStatus: 'pendiente',
        reviewDate: null,
        reviewedBy: null,
        reviewerName: null,
        actionsDescription: '',
        observations: ''
      });
      count++;
    });

    await batch.commit();

    console.log(`✅ ${count} equipos limpiados\n`);

    return { success: true, cleaned: count };

  } catch (error) {
    console.error('❌ Error al limpiar:', error);
    return { success: false, error: error.message };
  }
};

const migrationService = {
  migrateEquipmentsToAuditFields,
  checkMigrationStatus,
  cleanAuditFields
};

export default migrationService;
