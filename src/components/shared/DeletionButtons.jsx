/**
 * 🗑️ DELETION BUTTONS COMPONENTS
 * 
 * Componentes de botones para eliminar equipos y plantas completas
 * Para usar en AuditoriaApp.jsx
 * 
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { Trash2, Loader, AlertCircle } from 'lucide-react';
import { 
  deleteEquipmentComplete, 
  deletePlantComplete, 
  getDeleteInfo 
} from '../../services/deletion/deletionService';

// ============================================================================
// 🔧 BOTÓN PARA ELIMINAR EQUIPO COMPLETO
// ============================================================================

export const DeleteEquipmentButton = ({
  equipmentId,
  plantId,
  equipmentName,
  isOnline,
  onSuccess,
  onError,
  className = ""
}) => {
  const [showModal, setShowModal] = useState(false);
  const [deleteInfo, setDeleteInfo] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleOpenModal = async () => {
    setLoading(true);
    const info = await getDeleteInfo("equipment", equipmentId);
    setLoading(false);
    
    if (info.success) {
      setDeleteInfo(info.info);
      setShowModal(true);
    } else {
      alert("Error al obtener información del equipo");
    }
  };

  const handleConfirmDelete = async () => {
    setLoading(true);
    
    try {
      const result = await deleteEquipmentComplete(equipmentId, plantId, isOnline);
      
      if (result.success) {
        alert(result.message);
        setShowModal(false);
        if (onSuccess) onSuccess(result);
      } else {
        alert(`Error: ${result.error}`);
        if (onError) onError(result.error);
      }
    } catch (error) {
      alert("Error al eliminar el equipo");
      if (onError) onError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleOpenModal}
        disabled={loading}
        className={`flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {loading ? (
          <Loader className="w-4 h-4 animate-spin" />
        ) : (
          <Trash2 className="w-4 h-4" />
        )}
        <span>Eliminar Equipo</span>
      </button>

      {/* Modal de confirmación */}
      {showModal && deleteInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              ⚠️ Eliminar Equipo Completo
            </h3>

            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-gray-700 mb-2">
                <strong>Equipo:</strong> {deleteInfo.name}
              </p>
              <p className="text-sm text-gray-700 mb-2">
                <strong>N° Serie:</strong> {deleteInfo.serialNumber}
              </p>
              <hr className="my-2" />
              <p className="text-sm text-gray-700">
                📸 <strong>Imágenes:</strong> {deleteInfo.images}
              </p>
              <p className="text-sm text-gray-700">
                📄 <strong>PDFs:</strong> {deleteInfo.pdfs}
              </p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-800 font-medium mb-2">
                Esta acción eliminará:
              </p>
              <ul className="text-sm text-red-700 space-y-1">
                <li>✓ Todas las imágenes del equipo</li>
                <li>✓ Todas las imágenes de placas</li>
                <li>✓ Todas las facturas</li>
                <li>✓ Todos los pedimentos</li>
                <li>✓ El registro del equipo</li>
              </ul>
              <p className="text-sm text-red-900 font-bold mt-3">
                ⚠️ ESTA ACCIÓN NO SE PUEDE DESHACER
              </p>
            </div>

            {!isOnline && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4 text-xs text-orange-700">
                📡 Modo Offline: Se eliminará al sincronizar
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleConfirmDelete}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 font-medium"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Sí, eliminar todo
                  </>
                )}
              </button>
              <button
                onClick={() => setShowModal(false)}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 font-medium"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ============================================================================
// 🏭 BOTÓN PARA ELIMINAR PLANTA COMPLETA
// ============================================================================

export const DeletePlantButton = ({
  plantId,
  plantName,
  isOnline,
  onSuccess,
  onError,
  className = ""
}) => {
  const [showModal, setShowModal] = useState(false);
  const [deleteInfo, setDeleteInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(null);

  const handleOpenModal = async () => {
    setLoading(true);
    const info = await getDeleteInfo("plant", plantId);
    setLoading(false);
    
    if (info.success) {
      setDeleteInfo(info.info);
      setShowModal(true);
    } else {
      alert("Error al obtener información de la planta");
    }
  };

  const handleConfirmDelete = async () => {
    setLoading(true);
    
    try {
      const result = await deletePlantComplete(
        plantId, 
        isOnline,
        (progressInfo) => {
          setProgress(progressInfo);
        }
      );
      
      if (result.success) {
        alert(result.message);
        setShowModal(false);
        setProgress(null);
        if (onSuccess) onSuccess(result);
      } else {
        alert(`Error: ${result.error}`);
        if (onError) onError(result.error);
      }
    } catch (error) {
      alert("Error al eliminar la planta");
      if (onError) onError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleOpenModal}
        disabled={loading}
        className={`flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {loading ? (
          <Loader className="w-4 h-4 animate-spin" />
        ) : (
          <Trash2 className="w-4 h-4" />
        )}
        <span>Eliminar Planta</span>
      </button>

      {/* Modal de confirmación */}
      {showModal && deleteInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              🚨 Eliminar Planta Completa
            </h3>

            <div className="bg-gray-50 p-4 rounded-lg mb-4">
              <p className="text-sm text-gray-700 mb-2">
                <strong>Planta:</strong> {deleteInfo.name}
              </p>
              <hr className="my-2" />
              <p className="text-sm text-gray-700">
                🔧 <strong>Equipos:</strong> {deleteInfo.equipment}
              </p>
              <p className="text-sm text-gray-700">
                📸 <strong>Imágenes totales:</strong> {deleteInfo.totalImages}
              </p>
              <p className="text-sm text-gray-700">
                📄 <strong>PDFs totales:</strong> {deleteInfo.totalPDFs}
              </p>
            </div>

            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 mb-4">
              <p className="text-sm text-red-900 font-bold mb-2">
                🚨 PELIGRO: ELIMINACIÓN MASIVA
              </p>
              <p className="text-sm text-red-800 mb-2">
                Esta acción eliminará:
              </p>
              <ul className="text-sm text-red-700 space-y-1">
                <li>✓ <strong>{deleteInfo.equipment}</strong> equipos completos</li>
                <li>✓ <strong>{deleteInfo.totalImages}</strong> imágenes</li>
                <li>✓ <strong>{deleteInfo.totalPDFs}</strong> documentos PDF</li>
                <li>✓ La planta y todos sus datos</li>
              </ul>
              <p className="text-sm text-red-900 font-bold mt-3 text-center">
                ⚠️ ESTA ACCIÓN NO SE PUEDE DESHACER ⚠️
              </p>
            </div>

            {!isOnline && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mb-4 text-xs text-orange-700">
                📡 Modo Offline: Se eliminará al sincronizar
              </div>
            )}

            {/* Barra de progreso */}
            {progress && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                <p className="text-sm text-blue-800 font-medium mb-2">
                  📊 Progreso: {progress.stage}
                </p>
                {progress.current && progress.total && (
                  <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                    <div 
                      className="bg-blue-600 h-2.5 rounded-full transition-all"
                      style={{ width: `${(progress.current / progress.total) * 100}%` }}
                    />
                  </div>
                )}
                {progress.message && (
                  <p className="text-xs text-blue-700">{progress.message}</p>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleConfirmDelete}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 font-medium"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Sí, eliminar TODO
                  </>
                )}
              </button>
              <button
                onClick={() => setShowModal(false)}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 font-medium"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// ============================================================================
// 💣 BOTÓN PARA BORRAR BASE DE DATOS (Para usar en Settings)
// ============================================================================

export const NukeDatabaseButton = ({ 
  onSuccess,
  className = ""
}) => {
  const [showModal, setShowModal] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    if (confirmText !== "DELETE_EVERYTHING") {
      alert('Debes escribir exactamente "DELETE_EVERYTHING"');
      return;
    }

    if (!window.confirm("ÚLTIMA ADVERTENCIA: ¿Eliminar TODA la base de datos?")) {
      return;
    }

    setLoading(true);
    
    try {
      const { nukeLocalDatabase } = await import('../../services/deletion/deletionService');
      const result = await nukeLocalDatabase(true);
      
      if (result.success) {
        alert("✅ Base de datos eliminada. La aplicación se recargará.");
        if (onSuccess) onSuccess();
        window.location.reload();
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      alert("Error al eliminar la base de datos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className={`flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900 transition-colors ${className}`}
      >
        <Trash2 className="w-4 h-4" />
        <span>Borrar BD Local</span>
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              💣 Borrar Base de Datos Local
            </h3>

            <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 mb-4">
              <p className="text-sm text-yellow-800 mb-2">
                ⚠️ <strong>ADVERTENCIA:</strong>
              </p>
              <p className="text-sm text-yellow-700">
                Esto eliminará toda la base de datos local (IndexedDB).
                Los datos en Firebase NO se verán afectados.
              </p>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Escribe <strong className="text-red-600">DELETE_EVERYTHING</strong> para confirmar:
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE_EVERYTHING"
                disabled={loading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleConfirm}
                disabled={loading || confirmText !== "DELETE_EVERYTHING"}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 font-medium"
              >
                {loading ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Eliminando...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-4 h-4" />
                    Eliminar BD Local
                  </>
                )}
              </button>
              <button
                onClick={() => {
                  setShowModal(false);
                  setConfirmText("");
                }}
                disabled={loading}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50 font-medium"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default {
  DeleteEquipmentButton,
  DeletePlantButton,
  NukeDatabaseButton
};
