/**
 * useAppState.js - Hook para estados generales de la aplicación
 * 
 * Centraliza:
 * - Estado de vista actual (currentView)
 * - Estados de búsqueda (searchTerm, equipmentSearchTerm)
 * - Estados de mensajes (showSuccessMessage, successMessage)
 * - Estado de loading general
 * - Inicialización de IndexedDB
 * 
 * @version 1.0.0
 */

import { useState, useEffect, useCallback } from "react";
import { initDB } from "../services/storage/localStorageService";

/**
 * @param {Function} updateSyncStats - Función para actualizar stats de sync
 * @returns {Object} Estados y funciones de la aplicación
 */
export const useAppState = (updateSyncStats) => {
  // ============================================
  // ESTADOS DE NAVEGACIÓN
  // ============================================
  const [currentView, setCurrentView] = useState("plants");
  
  // ============================================
  // ESTADOS DE BÚSQUEDA
  // ============================================
  const [searchTerm, setSearchTerm] = useState("");
  const [equipmentSearchTerm, setEquipmentSearchTerm] = useState("");
  
  // ============================================
  // ESTADOS DE MENSAJES
  // ============================================
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  
  // ============================================
  // ESTADO DE LOADING GENERAL
  // ============================================
  const [generalLoading, setGeneralLoading] = useState(false);

  // ============================================
  // INICIALIZACIÓN DE INDEXEDDB
  // ============================================
  useEffect(() => {
    initDB()
      .then(() => {
        console.log("✅ IndexedDB inicializada correctamente");
        if (updateSyncStats) {
          updateSyncStats();
        }
      })
      .catch((error) => {
        console.error("❌ Error al inicializar IndexedDB:", error);
      });
  }, [updateSyncStats]);

  // ============================================
  // AUTO-OCULTAR MENSAJES DE ÉXITO
  // ============================================
  useEffect(() => {
    if (showSuccessMessage) {
      const timer = setTimeout(() => {
        setShowSuccessMessage(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessMessage]);

  // ============================================
  // FUNCIONES DE NAVEGACIÓN
  // ============================================
  const handleNavigate = useCallback((view) => {
    setCurrentView(view);
  }, []);

  // ============================================
  // FUNCIONES DE MENSAJES
  // ============================================
  const showSuccess = useCallback((message) => {
    setSuccessMessage(message);
    setShowSuccessMessage(true);
  }, []);

  const hideSuccess = useCallback(() => {
    setShowSuccessMessage(false);
    setSuccessMessage("");
  }, []);

  // ============================================
  // FUNCIONES DE BÚSQUEDA
  // ============================================
  const clearSearch = useCallback(() => {
    setSearchTerm("");
    setEquipmentSearchTerm("");
  }, []);

  // ============================================
  // RETORNO DEL HOOK
  // ============================================
  return {
    // Estados de navegación
    currentView,
    setCurrentView,
    handleNavigate,

    // Estados de búsqueda
    searchTerm,
    setSearchTerm,
    equipmentSearchTerm,
    setEquipmentSearchTerm,
    clearSearch,

    // Estados de mensajes
    showSuccessMessage,
    setShowSuccessMessage,
    successMessage,
    setSuccessMessage,
    showSuccess,
    hideSuccess,

    // Loading general
    generalLoading,
    setGeneralLoading,
  };
};

export default useAppState;
