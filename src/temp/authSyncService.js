// authSyncService.js - Integración de Auth con Sync
// Versión: 1.0
// Extiende syncService para incluir verificación de autenticación

import { isAuthenticated, getCurrentUser, onAuthChange } from './authService';
import { syncAllPendingOperations, getSyncStatus } from './syncService';

// ============================================
// ESTADO DE AUTENTICACIÓN Y SINCRONIZACIÓN
// ============================================

let authSyncInterval = null;
let isAutoSyncEnabled = false;

/**
 * 🔐 SINCRONIZAR CON VERIFICACIÓN DE AUTH
 * 
 * Verifica que el usuario esté autenticado antes de sincronizar
 * 
 * @param {Function} onProgress - Callback de progreso
 * @returns {Promise} Resultado de la sincronización
 */
export const syncWithAuth = async (onProgress = null) => {
  console.log('🔐 Verificando autenticación antes de sincronizar...');

  // Verificar autenticación
  if (!isAuthenticated()) {
    console.warn('⚠️ No se puede sincronizar: usuario no autenticado');
    
    if (onProgress) {
      onProgress({
        success: false,
        reason: 'not_authenticated',
        message: 'Debes iniciar sesión para sincronizar',
        current: 0,
        total: 0,
        percentage: 0
      });
    }

    return {
      success: false,
      reason: 'not_authenticated',
      message: 'Usuario no autenticado'
    };
  }

  const user = getCurrentUser();
  console.log('✅ Usuario autenticado:', user.email || user.uid);
  console.log('🔄 Iniciando sincronización...');

  // Proceder con sincronización normal
  return await syncAllPendingOperations(onProgress);
};

/**
 * 📊 OBTENER ESTADO DE SYNC CON INFO DE AUTH
 * 
 * Retorna estado de sincronización + info de autenticación
 * 
 * @returns {Promise} Estado completo
 */
export const getSyncStatusWithAuth = async () => {
  const syncStatus = await getSyncStatus();
  const user = getCurrentUser();
  const authenticated = isAuthenticated();

  return {
    ...syncStatus,
    auth: {
      isAuthenticated: authenticated,
      user: user ? {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName
      } : null
    }
  };
};

/**
 * ⚙️ AUTO-SYNC CON AUTENTICACIÓN
 * 
 * Inicia sincronización automática solo si el usuario está autenticado
 * Si el usuario cierra sesión, detiene el auto-sync
 * Si inicia sesión, lo reinicia
 * 
 * @param {Number} interval - Intervalo en milisegundos (default: 5 minutos)
 */
export const startAuthAwareAutoSync = (interval = 5 * 60 * 1000) => {
  console.log('⚙️ Configurando auto-sync con autenticación...');

  // Detener auto-sync previo si existe
  if (authSyncInterval) {
    clearInterval(authSyncInterval);
    authSyncInterval = null;
  }

  // Función que verifica auth antes de sincronizar
  const authAwareSync = async () => {
    if (isAuthenticated() && navigator.onLine) {
      console.log('🔄 Auto-sync: Usuario autenticado y online');
      await syncWithAuth();
    } else {
      if (!isAuthenticated()) {
        console.log('⏸️ Auto-sync pausado: usuario no autenticado');
      } else {
        console.log('⏸️ Auto-sync pausado: offline');
      }
    }
  };

  // Ejecutar sincronización inicial
  authAwareSync();

  // Configurar intervalo
  authSyncInterval = setInterval(authAwareSync, interval);
  isAutoSyncEnabled = true;

  console.log('✅ Auto-sync iniciado con intervalo de', interval / 1000, 'segundos');
};

/**
 * 🛑 DETENER AUTO-SYNC
 */
export const stopAuthAwareAutoSync = () => {
  if (authSyncInterval) {
    clearInterval(authSyncInterval);
    authSyncInterval = null;
    isAutoSyncEnabled = false;
    console.log('🛑 Auto-sync detenido');
  }
};

/**
 * 🔄 OBSERVADOR DE AUTH PARA AUTO-SYNC
 * 
 * Inicia/detiene auto-sync automáticamente según el estado de autenticación
 * 
 * @param {Number} interval - Intervalo de auto-sync
 * @returns {Function} Función para cancelar observador
 */
export const setupAuthSyncObserver = (interval = 5 * 60 * 1000) => {
  console.log('👀 Configurando observador de auth para auto-sync...');

  const unsubscribe = onAuthChange((authState) => {
    if (authState.isAuthenticated) {
      console.log('👤 Usuario autenticado, iniciando auto-sync...');
      startAuthAwareAutoSync(interval);
    } else {
      console.log('👤 Usuario no autenticado, deteniendo auto-sync...');
      stopAuthAwareAutoSync();
    }
  });

  console.log('✅ Observador de auth-sync configurado');

  return () => {
    console.log('🔄 Cancelando observador de auth-sync...');
    unsubscribe();
    stopAuthAwareAutoSync();
  };
};

/**
 * 🌐 SINCRONIZAR AL CONECTARSE (con Auth)
 * 
 * Versión con autenticación del evento de conexión
 */
export const syncOnConnectionWithAuth = () => {
  window.addEventListener('online', async () => {
    console.log('🌐 Conexión restaurada');
    
    if (isAuthenticated()) {
      console.log('✅ Usuario autenticado, sincronizando...');
      await syncWithAuth();
    } else {
      console.log('⏸️ Usuario no autenticado, sincronización omitida');
    }
  });

  console.log('✅ Listener de conexión configurado con auth');
};

/**
 * 📋 OBTENER RESUMEN COMPLETO
 * 
 * Info de auth + sync + conexión
 */
export const getFullStatus = async () => {
  const syncStatusWithAuth = await getSyncStatusWithAuth();
  const user = getCurrentUser();

  return {
    ...syncStatusWithAuth,
    connection: {
      online: navigator.onLine
    },
    autoSync: {
      enabled: isAutoSyncEnabled,
      running: authSyncInterval !== null
    },
    user: user ? {
      uid: user.uid,
      email: user.email || 'Anónimo',
      displayName: user.displayName || 'Usuario',
      isAnonymous: user.isAnonymous || false
    } : null
  };
};

/**
 * ⚡ FORZAR SINCRONIZACIÓN MANUAL
 * 
 * Para botones de "Sincronizar ahora"
 */
export const forceSyncNow = async () => {
  console.log('⚡ Sincronización manual solicitada...');

  if (!isAuthenticated()) {
    console.warn('⚠️ No se puede sincronizar: usuario no autenticado');
    return {
      success: false,
      error: 'Debes iniciar sesión para sincronizar'
    };
  }

  if (!navigator.onLine) {
    console.warn('⚠️ No se puede sincronizar: sin conexión');
    return {
      success: false,
      error: 'Sin conexión a internet'
    };
  }

  return await syncWithAuth();
};

// ============================================
// EXPORTACIONES
// ============================================

const authSyncService = {
  syncWithAuth,
  getSyncStatusWithAuth,
  startAuthAwareAutoSync,
  stopAuthAwareAutoSync,
  setupAuthSyncObserver,
  syncOnConnectionWithAuth,
  getFullStatus,
  forceSyncNow
};

export default authSyncService;
