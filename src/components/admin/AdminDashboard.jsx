/**
 * AdminDashboard.jsx - Panel de Administracion
 * Dashboard principal para usuarios con rol Admin
 *
 * Funcionalidades:
 * - Gestion de usuarios y roles
 * - Vista de todas las plantas y equipos
 * - Estadisticas generales del sistema
 * - Herramientas de mantenimiento
 *
 * @version 1.0.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Building2,
  Package,
  Shield,
  RefreshCw,
  Loader,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  UserCog,
  BarChart3,
  Edit,
  Trash2,
  Save,
  X,
  ArrowLeft,
  Wrench,
  Search
} from 'lucide-react';

import {
  getAllUsers,
  assignRole,
  ROLES,
  getRoleName
} from '../../services/migration/roleService';
import { getPlants, updatePlant } from '../../services/firebase/firebaseServices';
import { DeletePlantButton, NukeDatabaseButton } from '../shared/DeletionButtons';
import { cleanEverything, findDuplicates, removeDuplicates } from '../../utils/cleanDatabase';

/**
 * Dashboard de Administracion
 * @param {Object} props
 * @param {Object} props.user - Usuario actual (admin)
 */
const AdminDashboard = ({ user }) => {
  // Estados
  const [currentView, setCurrentView] = useState('overview'); // overview, users, plants, editPlant
  const [users, setUsers] = useState([]);
  const [plants, setPlants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Estados para edicion de planta
  const [selectedPlant, setSelectedPlant] = useState(null);
  const [editPlantData, setEditPlantData] = useState({
    name: '',
    location: '',
    description: ''
  });

  // Estadisticas
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalPlants: 0,
    totalEquipment: 0,
    usersByRole: {}
  });

  // Cargar datos iniciales
  const loadData = useCallback(async () => {
    if (!user?.uid) return;

    setLoading(true);
    try {
      // Cargar usuarios
      const usersData = await getAllUsers(user.uid);
      setUsers(usersData || []);

      // Cargar plantas
      const plantsResult = await getPlants();
      const plantsData = plantsResult?.data || plantsResult || [];
      setPlants(Array.isArray(plantsData) ? plantsData : []);

      // Calcular estadisticas
      const usersByRole = {};
      (usersData || []).forEach(u => {
        const role = u.role || 'supervisor';
        usersByRole[role] = (usersByRole[role] || 0) + 1;
      });

      setStats({
        totalUsers: usersData?.length || 0,
        totalPlants: plantsData?.length || 0,
        totalEquipment: 0, // Se puede calcular si se necesita
        usersByRole
      });

    } catch (error) {
      console.error('Error cargando datos:', error);
      setErrorMessage('Error al cargar datos del sistema');
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Cambiar rol de usuario
  const handleChangeRole = async (targetUserId, newRole) => {
    if (!user?.uid) return;

    setActionLoading(true);
    setErrorMessage('');

    try {
      const result = await assignRole(user.uid, targetUserId, newRole);

      if (result.success) {
        setSuccessMessage(`Rol actualizado a ${getRoleName(newRole)}`);
        await loadData(); // Recargar usuarios
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorMessage(result.error || 'Error al cambiar rol');
      }
    } catch (error) {
      setErrorMessage('Error: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Iniciar edicion de planta
  const handleEditPlant = (plant) => {
    setSelectedPlant(plant);
    setEditPlantData({
      name: plant.name || '',
      location: plant.location || '',
      description: plant.description || ''
    });
    setCurrentView('editPlant');
  };

  // Guardar cambios de planta
  const handleSavePlant = async () => {
    if (!selectedPlant?.id) return;

    setActionLoading(true);
    setErrorMessage('');

    try {
      const result = await updatePlant(selectedPlant.id, {
        name: editPlantData.name,
        location: editPlantData.location,
        description: editPlantData.description,
        updatedAt: new Date().toISOString()
      });

      if (result?.success !== false) {
        setSuccessMessage('Planta actualizada correctamente');
        await loadData();
        setCurrentView('plants');
        setSelectedPlant(null);
        setTimeout(() => setSuccessMessage(''), 3000);
      } else {
        setErrorMessage(result?.error || 'Error al actualizar planta');
      }
    } catch (error) {
      setErrorMessage('Error: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Cancelar edicion
  const handleCancelEdit = () => {
    setSelectedPlant(null);
    setEditPlantData({ name: '', location: '', description: '' });
    setCurrentView('plants');
  };

  // Callback despues de eliminar planta
  const handlePlantDeleted = async () => {
    setSuccessMessage('Planta eliminada correctamente');
    await loadData();
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // ============================================
  // FUNCIONES DE MANTENIMIENTO
  // ============================================

  // Buscar duplicados
  const handleFindDuplicates = async () => {
    setActionLoading(true);
    setErrorMessage('');
    try {
      const result = await findDuplicates();
      if (result.duplicates && result.duplicates.length > 0) {
        setSuccessMessage(`Se encontraron ${result.duplicates.length} equipos duplicados`);
      } else {
        setSuccessMessage('No se encontraron duplicados');
      }
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      setErrorMessage('Error al buscar duplicados: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Eliminar duplicados
  const handleRemoveDuplicates = async () => {
    if (!window.confirm('¿Estas seguro de eliminar los equipos duplicados?')) return;

    setActionLoading(true);
    setErrorMessage('');
    try {
      const result = await removeDuplicates();
      if (result.success) {
        setSuccessMessage(`Se eliminaron ${result.removedCount || 0} duplicados`);
        await loadData();
      } else {
        setErrorMessage(result.error || 'Error al eliminar duplicados');
      }
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (error) {
      setErrorMessage('Error al eliminar duplicados: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Limpiar todo (Firebase + Local)
  const handleCleanEverything = async () => {
    const confirm1 = window.confirm('⚠️ ADVERTENCIA: Esto eliminara TODOS los datos de Firebase y locales. ¿Continuar?');
    if (!confirm1) return;

    const confirm2 = window.confirm('⚠️ SEGUNDA CONFIRMACION: ¿Realmente deseas eliminar TODO?');
    if (!confirm2) return;

    const confirmText = window.prompt('Escribe "BORRAR TODO" para confirmar:');
    if (confirmText !== 'BORRAR TODO') {
      setErrorMessage('Operacion cancelada: texto de confirmacion incorrecto');
      return;
    }

    setActionLoading(true);
    setErrorMessage('');
    try {
      const result = await cleanEverything();
      if (result.success) {
        setSuccessMessage('Base de datos limpiada completamente');
        await loadData();
      } else {
        setErrorMessage(result.error || 'Error en la limpieza');
      }
    } catch (error) {
      setErrorMessage('Error al limpiar: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Callback despues de limpiar BD local
  const handleNukeSuccess = () => {
    setSuccessMessage('Base de datos local eliminada correctamente');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  // Componente de tarjeta de estadistica
  const StatCard = ({ icon: Icon, label, value, color = 'blue' }) => (
    <div className={`bg-white rounded-lg border border-gray-200 p-4 flex items-center gap-4`}>
      <div className={`p-3 rounded-lg bg-${color}-100`}>
        <Icon className={`w-6 h-6 text-${color}-600`} />
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );

  // Vista de resumen
  const renderOverview = () => (
    <div className="space-y-6">
      {/* Estadisticas generales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Usuarios" value={stats.totalUsers} color="blue" />
        <StatCard icon={Building2} label="Plantas" value={stats.totalPlants} color="green" />
        <StatCard icon={Shield} label="Admins" value={stats.usersByRole?.admin || 0} color="purple" />
        <StatCard icon={UserCog} label="Supervisores" value={stats.usersByRole?.supervisor || 0} color="orange" />
      </div>

      {/* Distribucion de roles */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-600" />
          Distribucion de Roles
        </h3>
        <div className="space-y-3">
          {Object.entries(stats.usersByRole).map(([role, count]) => (
            <div key={role} className="flex items-center justify-between">
              <span className="text-sm text-gray-600">{getRoleName(role)}</span>
              <div className="flex items-center gap-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full"
                    style={{ width: `${(count / stats.totalUsers) * 100}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-800 w-8">{count}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Acciones rapidas */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Acciones Rapidas</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <button
            onClick={() => setCurrentView('users')}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Users className="w-5 h-5 text-blue-600" />
              <span className="text-sm font-medium">Gestionar Usuarios</span>
            </span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
          <button
            onClick={() => setCurrentView('plants')}
            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <span className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-green-600" />
              <span className="text-sm font-medium">Ver Plantas</span>
            </span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
          </button>
        </div>
      </div>
    </div>
  );

  // Vista de gestion de usuarios
  const renderUsersView = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Gestion de Usuarios</h3>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Usuario</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Rol Actual</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Cambiar Rol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((u) => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{u.displayName || 'Sin nombre'}</p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      u.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                      u.role === 'auditor' ? 'bg-blue-100 text-blue-800' :
                      u.role === 'visualizador' ? 'bg-gray-100 text-gray-800' :
                      'bg-orange-100 text-orange-800'
                    }`}>
                      {getRoleName(u.role)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={u.role || 'supervisor'}
                      onChange={(e) => handleChangeRole(u.id, e.target.value)}
                      disabled={actionLoading || u.id === user?.uid}
                      className="text-sm border border-gray-300 rounded-lg px-2 py-1 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    >
                      <option value={ROLES.ADMIN}>Administrador</option>
                      <option value={ROLES.SUPERVISOR}>Supervisor</option>
                      <option value={ROLES.AUDITOR}>Auditor</option>
                      <option value={ROLES.VISUALIZADOR}>Visualizador</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  // Vista de plantas
  const renderPlantsView = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-800">Plantas Registradas</h3>
        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {plants.map((plant) => (
          <div key={plant.id} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-semibold text-gray-800">{plant.name}</h4>
                <p className="text-sm text-gray-500">{plant.location}</p>
              </div>
              <Building2 className="w-5 h-5 text-gray-400" />
            </div>

            {plant.description && (
              <p className="mt-2 text-sm text-gray-600">{plant.description}</p>
            )}

            {plant.equipmentCount !== undefined && (
              <div className="mt-3 flex items-center gap-2 text-sm text-gray-600">
                <Package className="w-4 h-4" />
                {plant.equipmentCount} equipos
              </div>
            )}

            {/* Botones de accion */}
            <div className="mt-4 pt-3 border-t border-gray-200 flex gap-2">
              <button
                onClick={() => handleEditPlant(plant)}
                className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <Edit className="w-4 h-4" />
                Editar
              </button>
              <DeletePlantButton
                plantId={plant.id}
                plantName={plant.name}
                isOnline={true}
                onSuccess={handlePlantDeleted}
                onError={(error) => setErrorMessage('Error al eliminar: ' + error)}
                className="flex-1"
              />
            </div>
          </div>
        ))}
      </div>

      {plants.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          No hay plantas registradas
        </div>
      )}
    </div>
  );

  // Vista de edicion de planta
  const renderEditPlant = () => (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={handleCancelEdit}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <h3 className="text-lg font-semibold text-gray-800">Editar Planta</h3>
      </div>

      {/* Formulario */}
      <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre de la Planta
          </label>
          <input
            type="text"
            value={editPlantData.name}
            onChange={(e) => setEditPlantData({ ...editPlantData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Nombre de la planta"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ubicacion
          </label>
          <input
            type="text"
            value={editPlantData.location}
            onChange={(e) => setEditPlantData({ ...editPlantData, location: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Ciudad, Estado, Pais"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Descripcion (opcional)
          </label>
          <textarea
            value={editPlantData.description}
            onChange={(e) => setEditPlantData({ ...editPlantData, description: e.target.value })}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Descripcion de la planta..."
          />
        </div>

        {/* Botones de accion */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={handleCancelEdit}
            disabled={actionLoading}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            <X className="w-5 h-5" />
            Cancelar
          </button>
          <button
            onClick={handleSavePlant}
            disabled={actionLoading || !editPlantData.name.trim()}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {actionLoading ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {actionLoading ? 'Guardando...' : 'Guardar Cambios'}
          </button>
        </div>
      </div>
    </div>
  );

  // Vista de Mantenimiento
  const renderMaintenanceView = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">Mantenimiento del Sistema</h3>

      {/* Panel Zona de Peligro - Eliminar BD Local */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          Zona de Peligro - BD Local
        </h4>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-3">
          <p className="text-sm text-red-800 mb-2">
            <strong>Precaucion:</strong> Eliminara toda la BD local (IndexedDB).
          </p>
          <p className="text-xs text-red-700">
            Firebase no se vera afectado.
          </p>
        </div>

        <NukeDatabaseButton
          onSuccess={handleNukeSuccess}
          className="w-full"
        />
      </div>

      {/* Panel de Limpieza de Duplicados */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          Limpieza de Duplicados
        </h4>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-3">
          <p className="text-sm text-yellow-800 mb-2">
            <strong>Detectado:</strong> Posibles duplicados en la base de datos
          </p>
          <p className="text-xs text-yellow-700">
            Esta operacion buscara y eliminara registros duplicados manteniendo el mas antiguo.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-2">
          <button
            onClick={handleFindDuplicates}
            disabled={actionLoading}
            className="flex-1 bg-yellow-600 text-white py-2 px-4 rounded-lg hover:bg-yellow-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {actionLoading ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <Search className="w-5 h-5" />
            )}
            Buscar Duplicados
          </button>

          <button
            onClick={handleRemoveDuplicates}
            disabled={actionLoading}
            className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {actionLoading ? (
              <Loader className="w-5 h-5 animate-spin" />
            ) : (
              <Trash2 className="w-5 h-5" />
            )}
            Eliminar Duplicados
          </button>
        </div>
      </div>

      {/* Panel de Limpieza Total */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-red-600" />
          Limpieza Total
        </h4>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-3">
          <p className="text-sm text-red-800 mb-2">
            <strong>PELIGRO EXTREMO:</strong> Esto eliminara TODO
          </p>
          <ul className="text-xs text-red-700 list-disc list-inside space-y-1">
            <li>Todas las plantas de Firebase</li>
            <li>Todos los equipos de Firebase</li>
            <li>Toda la cache local (IndexedDB)</li>
            <li>Operaciones pendientes de sincronizacion</li>
          </ul>
          <p className="text-xs text-red-700 mt-2">
            Las imagenes y PDFs en Storage deben eliminarse manualmente desde Firebase Console
          </p>
        </div>

        <button
          onClick={handleCleanEverything}
          disabled={actionLoading}
          className="w-full bg-red-600 text-white py-3 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 font-bold"
        >
          {actionLoading ? (
            <>
              <Loader className="w-5 h-5 animate-spin" />
              Eliminando Todo...
            </>
          ) : (
            <>
              <AlertCircle className="w-5 h-5" />
              ELIMINAR TODO
            </>
          )}
        </button>

        <p className="text-xs text-red-600 mt-2 text-center font-medium">
          Requiere 3 confirmaciones y escribir "BORRAR TODO"
        </p>
      </div>
    </div>
  );

  // Menu de navegacion
  const NavButton = ({ view, icon: Icon, label }) => (
    <button
      onClick={() => setCurrentView(view)}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
        currentView === view
          ? 'bg-blue-600 text-white'
          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );

  // Loading
  if (loading && users.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4">
      {/* Mensajes */}
      {successMessage && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800">
          <CheckCircle className="w-5 h-5" />
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800">
          <AlertCircle className="w-5 h-5" />
          {errorMessage}
        </div>
      )}

      {/* Navegacion */}
      <div className="flex flex-wrap gap-2">
        <NavButton view="overview" icon={BarChart3} label="Resumen" />
        <NavButton view="users" icon={Users} label="Usuarios" />
        <NavButton view="plants" icon={Building2} label="Plantas" />
        <NavButton view="maintenance" icon={Wrench} label="Mantenimiento" />
      </div>

      {/* Contenido */}
      {currentView === 'overview' && renderOverview()}
      {currentView === 'users' && renderUsersView()}
      {currentView === 'plants' && renderPlantsView()}
      {currentView === 'editPlant' && renderEditPlant()}
      {currentView === 'maintenance' && renderMaintenanceView()}
    </div>
  );
};

export default AdminDashboard;
