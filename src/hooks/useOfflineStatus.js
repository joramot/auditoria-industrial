/**
 * useOfflineStatus.js
 * 
 * Hook personalizado para detectar y monitorear el estado de conexión a internet.
 * 
 * @description
 * Este hook gestiona:
 * - Estado inicial de conexión basado en navigator.onLine
 * - Escucha de eventos 'online' y 'offline' del navegador
 * - Limpieza automática de listeners al desmontar
 * 
 * @returns {boolean} isOffline - true si no hay conexión, false si hay conexión
 * 
 * @example
 * const isOffline = useOfflineStatus();
 * 
 * // Uso en componente
 * {isOffline ? (
 *   <span>Sin conexión</span>
 * ) : (
 *   <span>Conectado</span>
 * )}
 */

import { useState, useEffect } from 'react';

const useOfflineStatus = () => {
  // ============================================
  // 📡 ESTADO DE CONEXIÓN
  // ============================================
  
  /**
   * Estado que indica si el dispositivo está offline.
   * Se inicializa con el valor inverso de navigator.onLine:
   * - navigator.onLine = true  → isOffline = false (conectado)
   * - navigator.onLine = false → isOffline = true (sin conexión)
   */
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // ============================================
  // ⚡ EFECTO: Monitorear cambios de conexión
  // ============================================
  useEffect(() => {
    /**
     * Handler para evento 'online'
     * Se dispara cuando el navegador detecta conexión a internet
     */
    const handleOnline = () => {
      // console.log('🌐 Conexión detectada - Estado: Online');
      setIsOffline(false);
    };

    /**
     * Handler para evento 'offline'
     * Se dispara cuando el navegador pierde conexión a internet
     */
    const handleOffline = () => {
      // console.log('📴 Conexión perdida - Estado: Offline');
      setIsOffline(true);
    };

    // Registrar listeners de eventos de conexión
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Log inicial del estado de conexión
    // console.log(`📡 Estado inicial de conexión: ${navigator.onLine ? 'Online' : 'Offline'}`);

    // Cleanup: remover listeners al desmontar el componente
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []); // Solo se ejecuta al montar/desmontar

  // ============================================
  // 📤 RETORNO
  // ============================================
  
  /**
   * Retornamos solo isOffline ya que:
   * - El estado se actualiza automáticamente con los event listeners
   * - No hay necesidad de exponer setIsOffline externamente
   * - Mantiene la API simple y fácil de usar
   */
  return isOffline;
};

export default useOfflineStatus;
