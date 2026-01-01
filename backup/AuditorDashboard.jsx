/**
 * AuditorDashboard.jsx - Panel Principal del Auditor
 * Dashboard completo para revisión de equipos con búsqueda, filtros y navegación
 * 
 * ✅ VERSIÓN ACTUALIZADA - Noviembre 2025
 * 
 * CAMBIOS EN LAYOUT:
 * 1. Reorganización de secciones: Título → Info Planta → Resumen (accordion)
 * 2. Resumen de Auditoría convertido en accordion colapsable
 * 
 * CORRECCIONES APLICADAS:
 * 1. loadPlants() - Extrae result.data correctamente
 * 2. loadAllEquipment() - Maneja respuestas de Firebase
 * 3. loadEquipmentCounts() - COMPLETADA - Calcula total, reviewed, pending
 * 4. loadEquipmentForPlant() - Verifica success y extrae data
 * 5. handleSaveEquipment() - Verifica éxito ANTES de actualizar estado
 * 6. handleMarkReviewed() - Verifica éxito ANTES de actualizar estado
 * 7. handleSelectPlant() - Actualiza estados correctamente
 */

import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Filter,
  ArrowLeft,
  Loader,
  AlertCircle,
  CheckCircle,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';

import AuditorStats from './AuditorStats';
import AuditorPlantsList from './AuditorPlantsList';
import AuditorEquipmentReview from './AuditorEquipmentReview';
import AuditorNavigation from './AuditorNavigation';

import { 
  getPlants, 
  getEquipmentByPlant,
  updateEquipment,
} from '../../services/firebase/firebaseServices';

/**
 * Componente Principal del Dashboard del Auditor
 * 
 * @param {Object} props
 * @param {Object} props.user - Usuario actual
 */
const AuditorDashboard = ({ user }) => {
  // Estados principales
  const [currentView, setCurrentView] = useState('plants'); // 'plants', 'equipment', 'review'
  const [plants, setPlants] = useState([]);
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [equipment, setEquipment] = useState([]);
  const [allEquipment, setAllEquipment] = useState([]);
  const [selectedEquipmentIndex, setSelectedEquipmentIndex] = useState(0);
  const [equipmentCountByPlant, setEquipmentCountByPlant] = useState({});

  // Estados de UI
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // 'all', 'revisado', 'pendiente'
  const [sortBy, setSortBy] = useState('name'); // 'name', 'date', 'status'
  const [showFilters, setShowFilters] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  
  // 🆕 Estado para controlar el accordion del resumen
  const [isResumenExpanded, setIsResumenExpanded] = useState(true);

  // Cargar plantas al iniciar
  useEffect(() => {
    loadPlants();
  }, []);

  // Cargar todos los equipos cuando las plantas cambian
  useEffect(() => {
    if (plants.length > 0) {
      loadAllEquipment();
      loadEquipmentCounts();
    }
  }, [plants]);

  // Navegación con teclado
  useEffect(() => {
    if (currentView !== 'review') return;

    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        handlePreviousEquipment();
      } else if (e.key === 'ArrowRight') {
        handleNextEquipment();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentView, selectedEquipmentIndex, equipment]);

  // ============================================
  // FUNCIONES DE CARGA DE DATOS - ✅ CORREGIDAS
  // ============================================

  /**
   * ✅ CORRECCIÓN 1: loadPlants()
   * Extrae correctamente result.data del objeto de respuesta de Firebase
   */
  const loadPlants = async () => {
    setLoading(true);
    try {
      console.log('📋 Cargando plantas...');
      const result = await getPlants();
      
      if (result.success && result.data) {
        console.log('✅ Plantas cargadas:', result.data.length);
        setPlants(result.data);
      } else {
        console.error('❌ Error al cargar plantas:', result.error);
        setPlants([]);
      }
    } catch (error) {
      console.error('❌ Excepción al cargar plantas:', error);
      alert('Error al cargar las plantas');
      setPlants([]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * ✅ CORRECCIÓN 2: loadAllEquipment()
   * Maneja correctamente las respuestas de Firebase para todos los equipos
   */
  const loadAllEquipment = async () => {
    try {
      console.log('📦 Cargando todos los equipos...');
      const allEquipmentData = [];
      
      for (const plant of plants) {
        const result = await getEquipmentByPlant(plant.id);
        if (result.success && result.data) {
          allEquipmentData.push(...result.data);
        }
      }
      
      console.log('✅ Total equipos cargados:', allEquipmentData.length);
      setAllEquipment(allEquipmentData);
    } catch (error) {
      console.error('❌ Error al cargar equipos:', error);
    }
  };

  /**
   * ✅ CORRECCIÓN 3: loadEquipmentCounts() - COMPLETADA
   * Calcula correctamente total, reviewed y pending para cada planta
   */
  const loadEquipmentCounts = async () => {
    try {
      console.log('🔢 Contando equipos por planta...');
      const counts = {};
      
      for (const plant of plants) {
        const result = await getEquipmentByPlant(plant.id);
        
        if (result.success && result.data) {
          const plantEquipment = result.data;
          const total = plantEquipment.length;
          const reviewed = plantEquipment.filter(eq => eq.reviewStatus === 'revisado').length;
          const pending = total - reviewed;
          
          counts[plant.id] = {
            total: total,
            reviewed: reviewed,
            pending: pending
          };
          
          console.log(`  ✅ ${plant.name}: ${total} total, ${reviewed} revisados, ${pending} pendientes`);
        } else {
          counts[plant.id] = { total: 0, reviewed: 0, pending: 0 };
          console.log(`  ℹ️ ${plant.name}: Sin equipos`);
        }
      }
      
      setEquipmentCountByPlant(counts);
      console.log('✅ Conteo completado');
    } catch (error) {
      console.error('❌ Error al contar equipos:', error);
    }
  };

  /**
   * ✅ CORRECCIÓN 4: loadEquipmentForPlant()
   * Verifica success y extrae data correctamente
   */
  const loadEquipmentForPlant = async (plant) => {
    setLoading(true);
    try {
      console.log(`📦 Cargando equipos de planta: ${plant.name}`);
      const result = await getEquipmentByPlant(plant.id);
      
      if (result.success && result.data) {
        const sortedEquipment = sortEquipment(result.data);
        console.log('✅ Equipos cargados y ordenados:', sortedEquipment.length);
        setEquipment(sortedEquipment);
      } else {
        console.error('❌ Error:', result.error);
        setEquipment([]);
      }
    } catch (error) {
      console.error('❌ Excepción al cargar equipos:', error);
      alert('Error al cargar los equipos de la planta');
      setEquipment([]);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // FUNCIONES DE GUARDADO - ✅ CORREGIDAS
  // ============================================

  /**
   * ✅ CORRECCIÓN 5: handleSaveEquipment()
   * Verifica éxito ANTES de actualizar estado
   */
  const handleSaveEquipment = async (updatedData) => {
    setSaving(true);
    try {
      const currentEquipment = equipment[selectedEquipmentIndex];
      console.log('💾 Guardando cambios en equipo:', currentEquipment.id);
      
      const result = await updateEquipment(selectedPlant.id, currentEquipment.id, updatedData);
      
      if (result.success) {
        console.log('✅ Equipo actualizado correctamente');
        
        // Actualizar el equipo en el estado local
        const updatedEquipment = [...equipment];
        updatedEquipment[selectedEquipmentIndex] = {
          ...currentEquipment,
          ...updatedData
        };
        setEquipment(updatedEquipment);
        
        showSuccessMessage('Cambios guardados correctamente');
      } else {
        console.error('❌ Error al guardar:', result.error);
        alert('Error al guardar los cambios: ' + result.error);
      }
    } catch (error) {
      console.error('❌ Excepción al guardar:', error);
      alert('Error al guardar los cambios');
    } finally {
      setSaving(false);
    }
  };

  /**
   * ✅ CORRECCIÓN 6: handleMarkReviewed()
   * Verifica éxito ANTES de actualizar estado
   */
  const handleMarkReviewed = async () => {
    const currentEquipment = equipment[selectedEquipmentIndex];
    
    if (window.confirm(`¿Marcar "${currentEquipment.equipmentName}" como revisado?`)) {
      setSaving(true);
      try {
        console.log('✅ Marcando equipo como revisado:', currentEquipment.id);
        
        const result = await updateEquipment(
          selectedPlant.id,
          currentEquipment.id,
          { reviewStatus: 'revisado' }
        );
        
        if (result.success) {
          console.log('✅ Estado actualizado correctamente');
          
          // Actualizar el equipo en el estado local
          const updatedEquipment = [...equipment];
          updatedEquipment[selectedEquipmentIndex] = {
            ...currentEquipment,
            reviewStatus: 'revisado'
          };
          setEquipment(updatedEquipment);
          
          showSuccessMessage('Equipo marcado como revisado');
          
          // Avanzar al siguiente equipo si hay más
          if (selectedEquipmentIndex < equipment.length - 1) {
            setTimeout(() => {
              handleNextEquipment();
            }, 1000);
          }
        } else {
          console.error('❌ Error al marcar como revisado:', result.error);
          alert('Error al marcar como revisado: ' + result.error);
        }
      } catch (error) {
        console.error('❌ Excepción al marcar como revisado:', error);
        alert('Error al actualizar el estado');
      } finally {
        setSaving(false);
      }
    }
  };

  // ============================================
  // FUNCIONES DE NAVEGACIÓN
  // ============================================

  /**
   * ✅ CORRECCIÓN 7: handleSelectPlant()
   * Actualiza estados correctamente antes de cambiar vista
   */
  const handleSelectPlant = async (plant) => {
    console.log('🏭 Seleccionando planta:', plant.name);
    setSelectedPlant(plant);
    await loadEquipmentForPlant(plant);
    setCurrentView('equipment');
  };

  const handleSelectEquipment = (index) => {
    console.log('📦 Seleccionando equipo índice:', index);
    setSelectedEquipmentIndex(index);
    setCurrentView('review');
  };

  const handleBackToPlants = () => {
    console.log('⬅️ Volviendo a lista de plantas');
    setCurrentView('plants');
    setSelectedPlant(null);
    setEquipment([]);
    setSearchTerm('');
    setFilterStatus('all');
  };

  const handleBackToEquipmentList = () => {
    console.log('⬅️ Volviendo a lista de equipos');
    setCurrentView('equipment');
  };

  const handleNextEquipment = () => {
    if (selectedEquipmentIndex < equipment.length - 1) {
      setSelectedEquipmentIndex(selectedEquipmentIndex + 1);
    }
  };

  const handlePreviousEquipment = () => {
    if (selectedEquipmentIndex > 0) {
      setSelectedEquipmentIndex(selectedEquipmentIndex - 1);
    }
  };

  const handleFirstEquipment = () => {
    setSelectedEquipmentIndex(0);
  };

  const handleLastEquipment = () => {
    setSelectedEquipmentIndex(equipment.length - 1);
  };

  // ============================================
  // FUNCIONES DE UTILIDAD
  // ============================================

  const sortEquipment = (equipmentList) => {
    const sorted = [...equipmentList];
    
    switch (sortBy) {
      case 'name':
        return sorted.sort((a, b) => 
          (a.equipmentName || '').localeCompare(b.equipmentName || '')
        );
      case 'date':
        return sorted.sort((a, b) => {
          const dateA = a.createdAt?.toDate?.() || new Date(0);
          const dateB = b.createdAt?.toDate?.() || new Date(0);
          return dateB - dateA;
        });
      case 'status':
        return sorted.sort((a, b) => {
          const statusOrder = { 'pendiente': 0, 'revisado': 1 };
          const statusA = statusOrder[a.reviewStatus || 'pendiente'];
          const statusB = statusOrder[b.reviewStatus || 'pendiente'];
          return statusA - statusB;
        });
      default:
        return sorted;
    }
  };

  const showSuccessMessage = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // ============================================
  // CÁLCULOS DE ESTADÍSTICAS GLOBALES
  // ============================================

  const globalStats = {
    totalPlants: plants.length,
    totalEquipment: allEquipment.length,
    totalReviewed: allEquipment.filter(eq => eq.reviewStatus === 'revisado').length,
    totalPending: allEquipment.filter(eq => eq.reviewStatus !== 'revisado').length,
    totalWithObservations: allEquipment.filter(eq => 
      eq.observations && eq.observations.trim() !== ''
    ).length,
    totalWithActions: allEquipment.filter(eq => 
      eq.actionDescription && eq.actionDescription.trim() !== ''
    ).length
  };

  const reviewProgress = globalStats.totalEquipment > 0
    ? Math.round((globalStats.totalReviewed / globalStats.totalEquipment) * 100)
    : 0;

  // ============================================
  // VISTAS DEL COMPONENTE
  // ============================================

  // Vista de Plantas (Lista Principal)
  const renderPlantsView = () => {
    return (
      <div>
        {/* 🆕 SECCIÓN 1: Título Principal */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-4">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Panel de Auditoría
          </h1>
          <p className="text-sm text-gray-600">
            Selecciona una planta para revisar sus equipos
          </p>
        </div>

        {/* 🆕 SECCIÓN 2: Lista de Plantas */}
        <div className="mb-4">
          <AuditorPlantsList
            plants={plants}
            onSelectPlant={handleSelectPlant}
            loading={loading}
            equipmentCountByPlant={equipmentCountByPlant}
          />
        </div>

        {/* 🆕 SECCIÓN 3: Resumen de Auditoría (Accordion) */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {/* Header del Accordion - Siempre visible */}
          <button
            onClick={() => setIsResumenExpanded(!isResumenExpanded)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-bold text-gray-800">
                Resumen de Auditoría
              </h2>
              <span className="text-sm text-gray-600">
                Progreso: <span className="font-semibold text-blue-600">{reviewProgress}%</span>
              </span>
            </div>
            {isResumenExpanded ? (
              <ChevronUp className="w-5 h-5 text-gray-600" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-600" />
            )}
          </button>

          {/* Contenido del Accordion - Colapsable */}
          {isResumenExpanded && (
            <div className="px-6 pb-6 pt-2 border-t border-gray-200">
              {/* Barra de progreso */}
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>{globalStats.totalReviewed} revisados</span>
                  <span>{globalStats.totalPending} pendientes</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                  <div
                    className="bg-green-500 h-full transition-all duration-500 rounded-full"
                    style={{ width: `${reviewProgress}%` }}
                  />
                </div>
              </div>

              {/* Grid de estadísticas */}
              <AuditorStats stats={globalStats} />
            </div>
          )}
        </div>
      </div>
    );
  };

  // Vista de Lista de Equipos
  const renderEquipmentListView = () => {
    // Aplicar filtros y búsqueda
    const filteredEquipment = equipment.filter(eq => {
      // Filtro por búsqueda
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm || 
        (eq.equipmentName || '').toLowerCase().includes(searchLower) ||
        (eq.serialNumber || '').toLowerCase().includes(searchLower) ||
        (eq.model || '').toLowerCase().includes(searchLower) ||
        (eq.locationInPlant || '').toLowerCase().includes(searchLower);

      // Filtro por estado
      const matchesStatus = filterStatus === 'all' ||
        (filterStatus === 'revisado' && eq.reviewStatus === 'revisado') ||
        (filterStatus === 'pendiente' && eq.reviewStatus !== 'revisado');

      return matchesSearch && matchesStatus;
    });

    const hasEquipment = filteredEquipment.length > 0;

    return (
      <div>
        {/* Header con botón de regresar */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <button
            onClick={handleBackToPlants}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-3"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Volver a Plantas</span>
          </button>
          
          <h2 className="text-xl font-bold text-gray-800">
            {selectedPlant?.name}
          </h2>
          <p className="text-sm text-gray-600">
            {selectedPlant?.address}
          </p>
        </div>

        {/* Resumen de equipos de la planta */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-2xl font-bold text-gray-800">
                {equipmentCountByPlant[selectedPlant?.id]?.total || 0}
              </p>
              <p className="text-sm text-gray-600">Equipos totales</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-green-600 font-medium">
                ✓ {equipmentCountByPlant[selectedPlant?.id]?.reviewed || 0} Revisados
              </p>
              <p className="text-sm text-orange-600 font-medium">
                ⏳ {equipmentCountByPlant[selectedPlant?.id]?.pending || 0} Pendientes
              </p>
            </div>
          </div>
        </div>

        {/* Información de equipos */}
        <div className="bg-blue-50 rounded-lg p-4 mb-4 border-l-4 border-blue-500">
          <p className="text-sm text-gray-600">
            {equipment.length} {equipment.length === 1 ? 'equipo' : 'equipos'} registrados
          </p>
        </div>

        {/* Buscador y Filtros */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          {/* Buscador */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, serie, modelo..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Botón de filtros */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="w-full flex items-center justify-between gap-2 py-2 px-3 bg-gray-50 rounded-lg border border-gray-300 hover:bg-gray-100 transition-colors"
          >
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              <span className="text-sm font-medium">Filtros y Ordenamiento</span>
            </div>
            <span className={`text-xs transition-transform ${showFilters ? 'rotate-180' : ''}`}>▼</span>
          </button>

          {/* Panel de filtros */}
          {showFilters && (
            <div className="mt-3 pt-3 border-t border-gray-200 space-y-3">
              {/* Filtro por estado */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Estado de Revisión
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['all', 'pendiente', 'revisado'].map(status => (
                    <button
                      key={status}
                      onClick={() => setFilterStatus(status)}
                      className={`
                        py-2 px-3 rounded-lg text-xs font-medium transition-all
                        ${filterStatus === status
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }
                      `}
                    >
                      {status === 'all' ? 'Todos' : status === 'pendiente' ? 'Pendientes' : 'Revisados'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ordenamiento */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-2">
                  Ordenar por
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full py-2 px-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="name">Nombre (A-Z)</option>
                  <option value="date">Fecha (más reciente)</option>
                  <option value="status">Estado (pendientes primero)</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Lista de Equipos */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <Loader className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
            <p className="text-gray-600">Cargando equipos...</p>
          </div>
        ) : !hasEquipment ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              {searchTerm || filterStatus !== 'all' 
                ? 'No se encontraron equipos' 
                : 'No hay equipos registrados'
              }
            </h3>
            <p className="text-sm text-gray-600">
              {searchTerm || filterStatus !== 'all'
                ? 'Intenta con otros filtros de búsqueda'
                : 'Esta planta aún no tiene equipos registrados'
              }
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEquipment.map((eq, index) => {
              const isReviewed = eq.reviewStatus === 'revisado';
              return (
                <button
                  key={eq.id}
                  onClick={() => handleSelectEquipment(equipment.indexOf(eq))}
                  className="w-full bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-all text-left border-l-4 border-blue-500"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-800 mb-1">
                        {eq.equipmentName}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {eq.locationInPlant}
                      </p>
                    </div>
                    <div className={`
                      px-3 py-1 rounded-full text-xs font-medium flex-shrink-0
                      ${isReviewed 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-orange-100 text-orange-800'
                      }
                    `}>
                      {isReviewed ? (
                        <div className="flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          Revisado
                        </div>
                      ) : (
                        'Pendiente'
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-xs text-gray-600 mt-2">
                    {eq.serialNumber && (
                      <span>S/N: {eq.serialNumber}</span>
                    )}
                    {eq.model && (
                      <span>Modelo: {eq.model}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  // Vista de Revisión de Equipo
  const renderReviewView = () => {
    const currentEquipment = equipment[selectedEquipmentIndex];

    return (
      <div>
        {/* Header con navegación */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <button
            onClick={handleBackToEquipmentList}
            className="flex items-center gap-2 text-blue-600 hover:text-blue-700"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Volver a Lista de Equipos</span>
          </button>
        </div>

        {/* Navegación entre equipos */}
        <AuditorNavigation
          currentIndex={selectedEquipmentIndex}
          total={equipment.length}
          onPrevious={handlePreviousEquipment}
          onNext={handleNextEquipment}
          onFirst={handleFirstEquipment}
          onLast={handleLastEquipment}
          reviewStatus={currentEquipment?.reviewStatus}
        />

        {/* Componente de revisión */}
        <AuditorEquipmentReview
          equipment={currentEquipment}
          plant={selectedPlant}
          onSave={handleSaveEquipment}
          onMarkReviewed={handleMarkReviewed}
          saving={saving}
        />
      </div>
    );
  };

  // ============================================
  // RENDER PRINCIPAL
  // ============================================

  return (
    <div className="max-w-4xl mx-auto min-h-screen bg-gray-100 p-4">
      {/* Mensaje de éxito */}
      {successMessage && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 animate-fade-in">
          <CheckCircle className="w-5 h-5" />
          {successMessage}
        </div>
      )}

      {/* Renderizar vista según el estado */}
      {currentView === 'plants' && renderPlantsView()}
      {currentView === 'equipment' && renderEquipmentListView()}
      {currentView === 'review' && renderReviewView()}
    </div>
  );
};

export default AuditorDashboard;