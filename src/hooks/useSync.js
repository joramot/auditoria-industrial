/**
 * useSync.js
 * 
 * Hook personalizado para gestión de sincronización offline/online.
 * 
 * Responsabilidades:
 * - Estados de sincronización (syncStatus, syncProgress, showSyncProgress)
 * - Sincronización manual y automática
 * - Monitoreo de operaciones pendientes
 * - Gestión del modal de progreso
 * 
 * @module hooks/useSync
 */

import { useState, useEffect, useCallback } from 'react';

import {
  syncAllPendingOperations,
  getSyncStatus,
  syncOnConnection,
  startAutoSync,
} from '../services/storage/syncService';

/**
 * Hook para gestión completa de sincronización
 * 
 * @param {boolean} isOffline - Estado de conexión actual
 * @param {Function} onSyncComplete - Callback ejecutado al completar sincronización
 * @param {Function} setSuccessMessage - Función para mostrar mensajes de éxito
 * @param {Function} setShowSuccessMessage - Función para controlar visibilidad del mensaje
 * @returns {Object} Estados y funciones de sincronización
 */
const useSync = (isOffline, onSyncComplete, setSuccessMessage, setShowSuccessMessage) => {
  
  // ============================================
  // 📊 ESTADOS DE SINCRONIZACIÓN
  // ============================================
  
  /**
   * Estado principal de sincronización
   * - isSyncing: Indica si hay una sincronización en curso
   * - pendingCount: Número de operaciones pendientes
   * - lastSync: Timestamp de la última sincronización
   */
  const [syncStatus, setSyncStatus] = useState({
    isSyncing: false,
    pendingCount: 0,
    lastSync: null,
  });

  /**
   * Estado de progreso de sincronización
   * - current: Número de operaciones procesadas
   * - total: Total de operaciones a procesar
   * - percentage: Porcentaje completado (0-100)
   * - type: Tipo de operación actual
   * - completed: Flag de completado
   */
  const [syncProgress, setSyncProgress] = useState({
    current: 0,
    total: 0,
    percentage: 0,
    type: '',
    completed: false,
  });

  /**
   * Controla visibilidad del modal de progreso
   */
  const [showSyncProgress, setShowSyncProgress] = useState(false);

  // ============================================
  // 📈 FUNCIÓN: Actualizar estadísticas
  // ============================================
  
  /**
   * Obtiene y actualiza el conteo de operaciones pendientes
   * desde el servicio de sincronización
   */
  const updateSyncStats = useCallback(async () => {
    try {
      const status = await getSyncStatus();
      if (status.success) {
        setSyncStatus(prev => ({
          ...prev,
          pendingCount: status.pending,
        }));
      }
    } catch (error) {
      console.error('❌ Error al obtener estado de sync:', error);
    }
  }, []);

  // ============================================
  // 🔄 FUNCIÓN: Sincronización manual
  // ============================================
  
  /**
   * Ejecuta sincronización manual de todas las operaciones pendientes
   * 
   * @returns {Promise<Object>} Resultado de la sincronización
   */
  const triggerSync = useCallback(async () => {
    // Validar conexión
    if (isOffline) {
      alert('⚠️ No hay conexión. Conéctate a internet para sincronizar.');
      return { success: false, error: 'No hay conexión' };
    }

    // Validar si hay operaciones pendientes
    if (syncStatus.pendingCount === 0) {
      alert('✅ No hay operaciones pendientes de sincronizar.');
      return { success: true, synced: 0 };
    }

    console.log('🔄 Iniciando sincronización manual...');

    // Mostrar modal de progreso
    setShowSyncProgress(true);
    setSyncStatus(prev => ({ ...prev, isSyncing: true }));

    try {
      const result = await syncAllPendingOperations((progress) => {
        setSyncProgress(progress);
      });

      if (result.success) {
        // Mostrar mensaje de éxito
        if (setSuccessMessage && setShowSuccessMessage) {
          setSuccessMessage(
            `✔ Sincronización completada: ${result.synced} ${result.synced === 1 ? 'registro' : 'registros'}`
          );
          setShowSuccessMessage(true);
        }

        // Actualizar estadísticas
        await updateSyncStats();

        // Ejecutar callback de completado (para recargar plantas/equipos)
        if (onSyncComplete) {
          await onSyncComplete();
        }

        // Actualizar timestamp de última sincronización
        setSyncStatus(prev => ({
          ...prev,
          lastSync: new Date().toISOString(),
        }));

        return result;
      } else {
        alert('❌ Error en la sincronización: ' + result.error);
        return result;
      }

    } catch (error) {
      console.error('❌ Error al sincronizar:', error);
      alert('❌ Error al sincronizar: ' + error.message);
      return { success: false, error: error.message };
    } finally {
      // Ocultar modal y resetear estado
      setShowSyncProgress(false);
      setSyncStatus(prev => ({ ...prev, isSyncing: false }));
    }
  }, [isOffline, syncStatus.pendingCount, updateSyncStats, onSyncComplete, setSuccessMessage, setShowSuccessMessage]);

  // Alias para compatibilidad
  const syncNow = triggerSync;

  // ============================================
  // ⚡ EFECTO: Sincronización automática
  // ============================================
  
  useEffect(() => {
    /**
     * Callback para manejar progreso de sincronización
     * @param {Object} progress - Datos de progreso
     */
    const handleSyncProgress = (progress) => {
      console.log('📊 Progreso de sincronización:', progress);
      
      if (progress.total > 0) {
        setSyncProgress(progress);
        setShowSyncProgress(true);
        setSyncStatus(prev => ({ ...prev, isSyncing: true }));
      }
    };

    // Configurar sincronización al reconectar
    const cleanupSyncOnConnection = syncOnConnection(handleSyncProgress);

    // Configurar sincronización periódica (cada 5 minutos)
    const syncInterval = startAutoSync(5, handleSyncProgress);

    // Cleanup
    return () => {
      cleanupSyncOnConnection();
      if (syncInterval) clearInterval(syncInterval);
    };
  }, []);

  // ============================================
  // ⚡ EFECTO: Cerrar modal cuando termina
  // ============================================
  
  useEffect(() => {
    const isComplete = syncProgress.percentage === 100 || syncProgress.completed;
    
    if (isComplete && showSyncProgress) {
      const timer = setTimeout(() => {
        console.log('✅ Cerrando modal de sincronización');
        
        // Ocultar modal
        setShowSyncProgress(false);
        setSyncStatus(prev => ({ ...prev, isSyncing: false }));
        
        // Actualizar stats y ejecutar callback
        updateSyncStats();
        if (onSyncComplete) {
          onSyncComplete();
        }
        
        // Actualizar timestamp
        setSyncStatus(prev => ({
          ...prev,
          lastSync: new Date().toISOString(),
        }));
        
        // Resetear progreso
        setSyncProgress({
          current: 0,
          total: 0,
          percentage: 0,
          type: '',
          completed: false,
        });
      }, 1500);

      return () => clearTimeout(timer);
    }
  }, [syncProgress.percentage, syncProgress.completed, showSyncProgress, updateSyncStats, onSyncComplete]);

  // ============================================
  // ⚡ EFECTO: Actualizar stats al reconectar
  // ============================================
  
  useEffect(() => {
    if (!isOffline) {
      updateSyncStats();
    }
  }, [isOffline, updateSyncStats]);

  // ============================================
  // 📦 RETORNO DEL HOOK
  // ============================================
  
  return {
    // Estados
    syncStatus,
    syncProgress,
    showSyncProgress,
    
    // Setters (para casos especiales)
    setSyncStatus,
    setSyncProgress,
    setShowSyncProgress,
    
    // Funciones
    updateSyncStats,
    triggerSync,
    syncNow,         // Alias para triggerSync
  };
};

export default useSync;