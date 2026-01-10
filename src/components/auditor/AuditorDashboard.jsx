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
  ArrowLeft,
  Loader,
  AlertCircle,
  CheckCircle,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

import AuditorPlantsList from './AuditorPlantsList';
import AuditorEquipmentReview from './AuditorEquipmentReview';
import PlantDashboard from './PlantDashboard';

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
  const [currentView, setCurrentView] = useState('plants'); // 'plants', 'plantDashboard', 'equipment', 'review'
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
  const [successMessage, setSuccessMessage] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(null); // null = no seleccionado, 5, 10, 15
  const [currentPage, setCurrentPage] = useState(1); // Página actual para paginación

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentView, selectedEquipmentIndex, equipment]);

  // Resetear a página 1 cuando cambien los filtros o la cantidad de items
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, searchTerm, itemsPerPage]);

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
    const equipName = currentEquipment.name || currentEquipment.equipmentName || 'este equipo';

    if (window.confirm(`¿Marcar "${equipName}" como revisado?`)) {
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
   * Actualiza estados y va al dashboard de la planta
   */
  const handleSelectPlant = async (plant) => {
    console.log('🏭 Seleccionando planta:', plant.name);
    setSelectedPlant(plant);
    await loadEquipmentForPlant(plant);
    setItemsPerPage(null); // Resetear cantidad de items
    setCurrentView('plantDashboard');
  };

  /**
   * Navega del dashboard de planta a la lista de equipos
   */
  const handleViewEquipment = () => {
    console.log('📦 Navegando a lista de equipos');
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
    setItemsPerPage(null);
    setCurrentPage(1);
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
        // Compatibilidad: usar "name" o "equipmentName"
        return sorted.sort((a, b) =>
          (a.name || a.equipmentName || '').localeCompare(b.name || b.equipmentName || '')
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

  // Progreso de revisión (disponible para uso futuro)
  // eslint-disable-next-line no-unused-vars
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
        {/* Título Principal */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-4">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Panel de Auditoría
          </h1>
          <p className="text-sm text-gray-600">
            Selecciona una planta para revisar sus equipos
          </p>
        </div>

        {/* Lista de Plantas */}
        <AuditorPlantsList
          plants={plants}
          onSelectPlant={handleSelectPlant}
          loading={loading}
          equipmentCountByPlant={equipmentCountByPlant}
        />
      </div>
    );
  };

  // Vista de Dashboard de Planta (Resumen de Auditoría)
  const renderPlantDashboardView = () => {
    const counts = equipmentCountByPlant[selectedPlant?.id] || { total: 0, reviewed: 0, pending: 0 };

    return (
      <PlantDashboard
        plant={selectedPlant}
        equipmentCounts={counts}
        onBackToPlants={handleBackToPlants}
        onViewEquipment={handleViewEquipment}
      />
    );
  };

  // Vista de Lista de Equipos
  const renderEquipmentListView = () => {
    // Aplicar filtros y búsqueda
    const filteredEquipment = equipment.filter(eq => {
      // Filtro por búsqueda
      const equipName = eq.name || eq.equipmentName || '';
      const equipLocation = eq.location || eq.locationInPlant || '';
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch = !searchTerm ||
        equipName.toLowerCase().includes(searchLower) ||
        (eq.serialNumber || '').toLowerCase().includes(searchLower) ||
        (eq.model || '').toLowerCase().includes(searchLower) ||
        equipLocation.toLowerCase().includes(searchLower);

      // Filtro por estado
      const matchesStatus = filterStatus === 'all' ||
        (filterStatus === 'revisado' && eq.reviewStatus === 'revisado') ||
        (filterStatus === 'pendiente' && eq.reviewStatus !== 'revisado');

      return matchesSearch && matchesStatus;
    });

    // Calcular paginación
    const totalPages = itemsPerPage ? Math.ceil(filteredEquipment.length / itemsPerPage) : 0;
    const startIndex = itemsPerPage ? (currentPage - 1) * itemsPerPage : 0;
    const endIndex = itemsPerPage ? startIndex + itemsPerPage : 0;

    // Aplicar paginación
    const displayedEquipment = itemsPerPage
      ? filteredEquipment.slice(startIndex, endIndex)
      : [];

    const hasEquipment = filteredEquipment.length > 0;
    const shouldShowEquipment = itemsPerPage !== null;

    // Funciones de paginación
    const handleNextPage = () => {
      if (currentPage < totalPages) {
        setCurrentPage(currentPage + 1);
      }
    };

    const handlePreviousPage = () => {
      if (currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    };

    return (
      <div>
        {/* Header con nombre de planta */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            {selectedPlant?.name}
          </h2>
          <p className="text-sm text-gray-600">
            {selectedPlant?.location}
          </p>
        </div>

        {/* Buscador y Filtros */}
        <div className="bg-white rounded-lg shadow-md p-4 mb-4">
          {/* Botones de Filtro por Estado */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filtrar por Estado
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => setFilterStatus('all')}
                className={`
                  py-2 px-4 rounded-lg font-medium transition-all
                  ${filterStatus === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                Todos
              </button>
              <button
                onClick={() => setFilterStatus('pendiente')}
                className={`
                  py-2 px-4 rounded-lg font-medium transition-all
                  ${filterStatus === 'pendiente'
                    ? 'bg-orange-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                Pendientes
              </button>
              <button
                onClick={() => setFilterStatus('revisado')}
                className={`
                  py-2 px-4 rounded-lg font-medium transition-all
                  ${filterStatus === 'revisado'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }
                `}
              >
                Revisados
              </button>
            </div>
          </div>

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

          {/* Ordenamiento y Cantidad */}
          <div className="grid grid-cols-2 gap-3">
            {/* Ordenar por */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
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

            {/* Cantidad a mostrar */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Mostrar equipos
              </label>
              <select
                value={itemsPerPage || ''}
                onChange={(e) => setItemsPerPage(Number(e.target.value) || null)}
                className="w-full py-2 px-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Seleccionar...</option>
                <option value="5">5 equipos</option>
                <option value="10">10 equipos</option>
                <option value="15">15 equipos</option>
              </select>
            </div>
          </div>
        </div>

        {/* Lista de Equipos */}
        {loading ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <Loader className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-2" />
            <p className="text-gray-600">Cargando equipos...</p>
          </div>
        ) : !shouldShowEquipment ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <AlertCircle className="w-12 h-12 text-blue-400 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Selecciona la cantidad de equipos
            </h3>
            <p className="text-sm text-gray-600">
              Por favor, selecciona cuántos equipos deseas ver en el selector de arriba
            </p>
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
          <>
            {/* Información de resultados */}
            <div className="bg-blue-50 rounded-lg p-3 mb-4 border-l-4 border-blue-500">
              <p className="text-sm text-gray-700">
                Mostrando {startIndex + 1} - {Math.min(endIndex, filteredEquipment.length)} de {filteredEquipment.length} equipos
                {filterStatus !== 'all' && ` (filtrados por: ${filterStatus === 'pendiente' ? 'Pendientes' : 'Revisados'})`}
                {totalPages > 1 && ` - Página ${currentPage} de ${totalPages}`}
              </p>
            </div>

            {/* Lista */}
            <div className="space-y-3 mb-4">
              {displayedEquipment.map((eq) => {
                const isReviewed = eq.reviewStatus === 'revisado';
                const equipName = eq.name || eq.equipmentName || 'Sin nombre';
                const equipLocation = eq.location || eq.locationInPlant || 'Sin ubicación';
                return (
                  <button
                    key={eq.id}
                    onClick={() => handleSelectEquipment(equipment.indexOf(eq))}
                    className="w-full bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition-all text-left border-l-4 border-blue-500"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-bold text-gray-800 mb-1">
                          {equipName}
                        </h3>
                        <p className="text-sm text-gray-600">
                          {equipLocation}
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
          </>
        )}

        {/* Botones de Navegación */}
        <div className="bg-white rounded-lg shadow-md p-4">
          <div className="flex gap-3">
            {/* Botón Volver a Plantas */}
            <button
              onClick={handleBackToPlants}
              className="flex-1 bg-gray-500 hover:bg-gray-600 text-white py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Volver a Plantas</span>
            </button>

            {/* Botones de Paginación */}
            {shouldShowEquipment && totalPages > 1 && (
              <div className="flex gap-2">
                {/* Botón Anterior */}
                <button
                  onClick={handlePreviousPage}
                  disabled={currentPage === 1}
                  className={`
                    px-4 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2
                    ${currentPage === 1
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }
                  `}
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span>Anterior</span>
                </button>

                {/* Indicador de Página */}
                <div className="flex items-center px-4 py-3 bg-gray-100 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">
                    Página {currentPage} de {totalPages}
                  </span>
                </div>

                {/* Botón Siguiente */}
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className={`
                    px-4 py-3 rounded-lg font-semibold transition-colors flex items-center gap-2
                    ${currentPage === totalPages
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-blue-500 hover:bg-blue-600 text-white'
                    }
                  `}
                >
                  <span>Siguiente</span>
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Vista de Revisión de Equipo
  const renderReviewView = () => {
    const currentEquipment = equipment[selectedEquipmentIndex];

    return (
      <div>
        {/* Componente de revisión con navegación integrada */}
        <AuditorEquipmentReview
          equipment={currentEquipment}
          plant={selectedPlant}
          onSave={handleSaveEquipment}
          onMarkReviewed={handleMarkReviewed}
          saving={saving}
          currentIndex={selectedEquipmentIndex}
          totalEquipment={equipment.length}
          onPrevious={handlePreviousEquipment}
          onNext={handleNextEquipment}
          onFirst={handleFirstEquipment}
          onLast={handleLastEquipment}
          onBackToList={handleBackToEquipmentList}
        />
      </div>
    );
  };

  // ============================================
  // RENDER PRINCIPAL
  // ============================================

  return (
    <div className="w-full max-w-[1600px] 2xl:max-w-[1920px] mx-auto px-2 lg:px-3">
      {/* Mensaje de éxito */}
      {successMessage && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2 animate-fade-in">
          <CheckCircle className="w-5 h-5" />
          {successMessage}
        </div>
      )}

      {/* Renderizar vista según el estado */}
      {currentView === 'plants' && renderPlantsView()}
      {currentView === 'plantDashboard' && renderPlantDashboardView()}
      {currentView === 'equipment' && renderEquipmentListView()}
      {currentView === 'review' && renderReviewView()}
    </div>
  );
};

export default AuditorDashboard;