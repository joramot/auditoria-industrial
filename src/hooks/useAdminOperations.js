/**
 * useAdminOperations.js - Hook para operaciones administrativas
 * 
 * Centraliza funciones de:
 * - Exportación de datos (JSON, CSV/Excel)
 * - Búsqueda y eliminación de duplicados
 * - Limpieza total de base de datos
 * 
 * @version 1.0.0
 */

import { useCallback } from "react";
import {
  exportToJSON,
  exportToCSV,
} from "../services/firebase/firebaseServices";
import {
  findDuplicates,
  removeDuplicates,
  cleanEverything,
} from "../utils/cleanDatabase";

/**
 * @param {Object} options - Opciones del hook
 * @param {Function} options.setGeneralLoading - Setter de estado de loading
 * @param {Function} options.showSuccess - Función para mostrar mensaje de éxito
 * @param {Function} options.loadPlants - Función para recargar plantas
 * @returns {Object} Funciones de operaciones admin
 */
export const useAdminOperations = ({
  setGeneralLoading,
  showSuccess,
  loadPlants,
}) => {
  // ============================================
  // EXPORTACIÓN DE DATOS
  // ============================================
  const handleExport = useCallback(async (format) => {
    setGeneralLoading(true);

    try {
      if (format === "json") {
        const result = await exportToJSON();
        if (result.success) {
          alert("✅ Datos exportados a JSON correctamente");
        } else {
          alert("❌ Error al exportar: " + result.error);
        }
      } else if (format === "excel" || format === "csv") {
        const result = await exportToCSV();
        if (result.success) {
          alert("✅ Datos exportados a CSV/Excel correctamente");
        } else {
          alert("❌ Error al exportar: " + result.error);
        }
      } else {
        alert(`📥 Exportación en formato ${format.toUpperCase()} en desarrollo`);
      }
    } catch (error) {
      alert("❌ Error inesperado: " + error.message);
    } finally {
      setGeneralLoading(false);
    }
  }, [setGeneralLoading]);

  // ============================================
  // BUSCAR DUPLICADOS
  // ============================================
  const handleFindDuplicates = useCallback(async () => {
    setGeneralLoading(true);
    try {
      const result = await findDuplicates();
      
      if (result.success) {
        if (result.duplicates.length === 0) {
          showSuccess("✅ No se encontraron duplicados");
        } else {
          alert(
            `⚠️ Duplicados encontrados: ${result.duplicates.length}\n\n` +
            `Revisa la consola (F12) para ver detalles`
          );
        }
      } else {
        alert("❌ Error: " + result.error);
      }
    } catch (error) {
      alert("❌ Error: " + error.message);
    } finally {
      setGeneralLoading(false);
    }
  }, [setGeneralLoading, showSuccess]);

  // ============================================
  // ELIMINAR DUPLICADOS
  // ============================================
  const handleRemoveDuplicates = useCallback(async () => {
    if (!window.confirm(
      '¿Eliminar duplicados?\n\n' +
      'Se mantendrá el registro más antiguo de cada duplicado.\n' +
      'Esta acción NO se puede deshacer.'
    )) {
      return;
    }
    
    setGeneralLoading(true);
    try {
      const result = await removeDuplicates();
      
      if (result.success) {
        showSuccess(`✅ Duplicados eliminados: ${result.removed}`);
        await loadPlants();
      } else {
        alert("❌ Error: " + result.error);
      }
    } catch (error) {
      alert("❌ Error: " + error.message);
    } finally {
      setGeneralLoading(false);
    }
  }, [setGeneralLoading, showSuccess, loadPlants]);

  // ============================================
  // LIMPIAR TODO (TRIPLE CONFIRMACIÓN)
  // ============================================
  const handleCleanEverything = useCallback(async () => {
    // Primera confirmación
    if (!window.confirm(
      '⚠️⚠️⚠️ ¿ELIMINAR TODA LA BASE DE DATOS?\n\n' +
      'Esta acción es IRREVERSIBLE.\n' +
      'Se eliminarán:\n' +
      '- Todas las plantas\n' +
      '- Todos los equipos\n' +
      '- Toda la caché local\n\n' +
      '¿Continuar?'
    )) {
      return;
    }
    
    // Segunda confirmación
    if (!window.confirm(
      '⚠️⚠️ SEGUNDA CONFIRMACIÓN\n\n' +
      '¿ESTÁS COMPLETAMENTE SEGURO?\n\n' +
      'No hay vuelta atrás.'
    )) {
      return;
    }
    
    // Tercera confirmación con texto
    const confirmText = prompt(
      'Para confirmar la eliminación total, escribe exactamente:\n\n' +
      'BORRAR TODO\n\n' +
      '(en mayúsculas)'
    );
    
    if (confirmText !== 'BORRAR TODO') {
      alert('❌ Operación cancelada - Texto incorrecto');
      return;
    }
    
    setGeneralLoading(true);
    
    try {
      const result = await cleanEverything();
      
      if (result.success) {
        alert(
          '✅ BASE DE DATOS COMPLETAMENTE LIMPIA\n\n' +
          '📋 Resultados:\n' +
          `- Firebase limpio: ${result.results.firebase.totalDeleted} registros\n` +
          `- IndexedDB limpio: ✅\n\n` +
          '⚠️ IMPORTANTE:\n' +
          '1. Limpia Firebase Storage manualmente\n' +
          '2. RECARGA LA PÁGINA (F5)\n' +
          '3. Crea nuevos datos ONLINE'
        );
        
        if (window.confirm('¿Recargar la página ahora?')) {
          window.location.reload();
        }
      } else {
        alert('❌ Error en limpieza: ' + result.error);
      }
    } catch (error) {
      alert('❌ Error inesperado: ' + error.message);
    } finally {
      setGeneralLoading(false);
    }
  }, [setGeneralLoading]);

  // ============================================
  // RETORNO DEL HOOK
  // ============================================
  return {
    handleExport,
    handleFindDuplicates,
    handleRemoveDuplicates,
    handleCleanEverything,
  };
};

export default useAdminOperations;
