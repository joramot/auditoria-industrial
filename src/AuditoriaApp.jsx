/**
 * AuditoriaApp.jsx - VERSIÓN SIMPLIFICADA (FASE 6)
 * 
 * Componente principal de la aplicación de Auditoría Industrial.
 * Reducido de ~756 líneas a ~180 líneas mediante:
 * - Uso de hooks personalizados existentes
 * - Componentes modulares por rol
 * - Separación de responsabilidades
 * 
 * @version 3.0.0
 * @date 2025-11-25
 */

import React, { useMemo } from "react";

// ============================================
// 🪝 HOOKS PERSONALIZADOS (EXISTENTES)
// ============================================
import { useAuth } from "./hooks/useAuth";
import { useRole } from "./hooks/useRole";
import { usePlants } from "./hooks/usePlants";
import { useEquipment } from "./hooks/useEquipment";
import useSync from "./hooks/useSync";
import useOfflineStatus from "./hooks/useOfflineStatus";

// ============================================
// 🪝 HOOKS NUEVOS (FASE 6)
// ============================================
import { useAppState } from "./hooks/useAppState";
import { useAdminOperations } from "./hooks/useAdminOperations";

// ============================================
// 🎨 COMPONENTES COMPARTIDOS
// ============================================
import { LoadingScreen } from "./components/shared/LoadingScreen";
import { NoRoleScreen } from "./components/shared/NoRoleScreen";
import LoginScreen from "./components/auth/LoginScreen";

// ============================================
// LAYOUTS POR ROL
// ============================================
import { AdminLayout, AuditorLayout, SupervisorLayout, VisualizadorLayout } from "./components/layout";

/**
 * Componente Principal de la Aplicación
 */
const AuditoriaApp = () => {
  // ============================================
  // AUTENTICACIÓN
  // ============================================
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  
  // ============================================
  // ROL DEL USUARIO
  // ============================================
  const {
    isAdmin,
    isSupervisor,
    isAuditor,
    isVisualizador,
    loading: roleLoading,
    roleName
  } = useRole();
  
  // ============================================
  // ESTADO DE CONEXIÓN
  // ============================================
  const isOffline = useOfflineStatus();

  // ============================================
  // SINCRONIZACIÓN
  // ============================================
  const {
    syncStatus,
    syncProgress,
    showSyncProgress,
    updateSyncStats,
    syncNow,
  } = useSync(isOffline);

  // ============================================
  // ESTADO DE LA APLICACIÓN
  // ============================================
  const appState = useAppState(updateSyncStats);
  const {
    currentView,
    setCurrentView,
    handleNavigate,
    searchTerm,
    setSearchTerm,
    equipmentSearchTerm,
    setEquipmentSearchTerm,
    showSuccessMessage,
    setShowSuccessMessage,
    successMessage,
    setSuccessMessage,
    showSuccess,
    generalLoading,
    setGeneralLoading,
  } = appState;

  // ============================================
  // PLANTAS
  // ============================================
  const {
    plants,
    selectedPlant,
    isLoading: plantsLoading,
    newPlantData,
    loadPlants,
    savePlant,
    selectPlant,
    updateNewPlantData,
    resetNewPlantForm,
  } = usePlants(isOffline, isAuthenticated);

  // ============================================
  // EQUIPOS
  // ============================================
  const equipmentHook = useEquipment(
    selectedPlant,
    isOffline,
    setCurrentView,
    setSuccessMessage,
    setShowSuccessMessage,
    updateSyncStats
  );

  // ============================================
  // OPERACIONES ADMIN
  // ============================================
  const adminOps = useAdminOperations({
    setGeneralLoading,
    showSuccess,
    loadPlants,
  });

  // ============================================
  // ESTADO DE LOADING COMBINADO
  // ============================================
  const isLoading = plantsLoading || equipmentHook.isLoading || generalLoading;

  // ============================================
  // PLANTAS FILTRADAS (memo para optimización)
  // ============================================
  const filteredPlants = useMemo(() => {
    return plants
      .filter((plant, index, self) => 
        index === self.findIndex((p) => p.id === plant.id)
      )
      .filter((plant) =>
        plant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plant.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [plants, searchTerm]);

  // ============================================
  // NOTA: loadPlants se ejecuta automáticamente
  // dentro de usePlants al montar el componente
  // ============================================

  // ============================================
  // RENDERIZADO CONDICIONAL
  // ============================================

  // Loading de Autenticación
  if (isAuthLoading) {
    return <LoadingScreen type="auth" />;
  }
  
  // Login requerido
  if (!isAuthenticated) {
    return <LoginScreen onLoginSuccess={() => { /* console.log('✅ Login exitoso') */ }} />;
  }

  // Loading de Rol
  if (roleLoading) {
    return <LoadingScreen type="role" />;
  }

  // Layout de Admin (tiene prioridad)
  if (isAdmin) {
    return <AdminLayout user={user} roleName={roleName} />;
  }

  // Layout de Auditor
  if (isAuditor) {
    return <AuditorLayout user={user} roleName={roleName} />;
  }

  // Layout de Visualizador
  if (isVisualizador) {
    return <VisualizadorLayout user={user} roleName={roleName} />;
  }

  // Layout de Supervisor
  if (isSupervisor) {
    return (
      <SupervisorLayout
        // Usuario y conexión
        user={user}
        isOffline={isOffline}
        isAdmin={isAdmin}
        
        // Estado de la app
        currentView={currentView}
        setCurrentView={setCurrentView}
        handleNavigate={handleNavigate}
        
        // Loading
        isLoading={isLoading}
        
        // Mensajes
        showSuccessMessage={showSuccessMessage}
        setShowSuccessMessage={setShowSuccessMessage}
        successMessage={successMessage}
        setSuccessMessage={setSuccessMessage}
        
        // Sync
        syncStatus={syncStatus}
        syncProgress={syncProgress}
        showSyncProgress={showSyncProgress}
        syncNow={syncNow}
        
        // Plantas
        plants={plants}
        selectedPlant={selectedPlant}
        filteredPlants={filteredPlants}
        newPlantData={newPlantData}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectPlant={selectPlant}
        loadPlants={loadPlants}
        loadEquipment={equipmentHook.loadEquipment}
        savePlant={savePlant}
        updateNewPlantData={updateNewPlantData}
        resetNewPlantForm={resetNewPlantForm}
        
        // Equipos
        equipment={equipmentHook.equipment}
        selectedEquipment={equipmentHook.selectedEquipment}
        formData={equipmentHook.formData}
        capturedImages={equipmentHook.capturedImages}
        capturedPDFs={equipmentHook.capturedPDFs}
        equipmentSearchTerm={equipmentSearchTerm}
        setEquipmentSearchTerm={setEquipmentSearchTerm}
        setSelectedEquipment={equipmentHook.setSelectedEquipment}
        setFormData={equipmentHook.setFormData}
        setCapturedImages={equipmentHook.setCapturedImages}
        setCapturedPDFs={equipmentHook.setCapturedPDFs}
        handleNewEquipment={equipmentHook.handleNewEquipment}
        handleSaveEquipment={equipmentHook.handleSaveEquipment}
        handleCancelEquipment={equipmentHook.handleCancelEquipment}
        
        // Operaciones
        handleExport={adminOps.handleExport}
      />
    );
  }

  // Sin rol asignado
  return <NoRoleScreen user={user} />;
};

export default AuditoriaApp;