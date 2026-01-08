/**
 * DeleteEquipmentModal.jsx - Modal de confirmación para eliminar equipo
 *
 * Muestra un resumen de la información que se eliminará y solicita
 * confirmación del usuario antes de proceder.
 *
 * @version 1.0.0
 */

import React, { useState, useEffect } from "react";
import {
  AlertTriangle,
  X,
  Trash2,
  Loader2,
  Image,
  FileText,
  Package,
} from "lucide-react";
import { getDeleteInfo, deleteEquipmentComplete } from "../../services/deletion/deletionService";

export const DeleteEquipmentModal = ({
  isOpen,
  equipment,
  plantId,
  isOnline,
  onClose,
  onDeleted,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteInfo, setDeleteInfo] = useState(null);
  const [error, setError] = useState(null);

  // Cargar información del equipo al abrir el modal
  useEffect(() => {
    if (isOpen && equipment?.id) {
      loadDeleteInfo();
    } else {
      setDeleteInfo(null);
      setError(null);
    }
  }, [isOpen, equipment?.id]);

  const loadDeleteInfo = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getDeleteInfo("equipment", equipment.id);

      if (result.success) {
        setDeleteInfo(result.info);
      } else {
        setError(result.error || "Error al obtener información");
      }
    } catch (err) {
      setError("Error al cargar información del equipo");
      console.error("Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);

    try {
      const result = await deleteEquipmentComplete(equipment.id, plantId, isOnline);

      if (result.success) {
        onDeleted(result);
        onClose();
      } else {
        setError(result.error || "Error al eliminar el equipo");
      }
    } catch (err) {
      setError("Error crítico al eliminar el equipo");
      console.error("Error:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={!isDeleting ? onClose : undefined}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-red-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">
                Eliminar Equipo
              </h2>
              <p className="text-sm text-gray-500">
                Esta acción no se puede deshacer
              </p>
            </div>
          </div>
          {!isDeleting && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-red-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Loading state */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-8">
              <Loader2 className="w-8 h-8 text-gray-400 animate-spin mb-2" />
              <p className="text-gray-500">Cargando información...</p>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Equipment info */}
          {!isLoading && equipment && (
            <>
              {/* Información del equipo */}
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Equipo a eliminar:
                </h3>
                <div className="space-y-1 text-sm">
                  <p>
                    <span className="text-gray-500">Nombre:</span>{" "}
                    <span className="font-medium">{equipment.name || "Sin nombre"}</span>
                  </p>
                  <p>
                    <span className="text-gray-500">No. Serie:</span>{" "}
                    <span className="font-mono">{equipment.serialNumber || "N/A"}</span>
                  </p>
                  {equipment.manufacturer && (
                    <p>
                      <span className="text-gray-500">Fabricante:</span>{" "}
                      <span>{equipment.manufacturer}</span>
                    </p>
                  )}
                  {equipment.model && (
                    <p>
                      <span className="text-gray-500">Modelo:</span>{" "}
                      <span>{equipment.model}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* Resumen de lo que se eliminará */}
              {deleteInfo && (
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900 mb-2">
                    Se eliminará permanentemente:
                  </h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                      <Image className="w-5 h-5 text-amber-600" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {deleteInfo.images} imagen(es)
                        </p>
                        <p className="text-xs text-gray-500">
                          Fotos de equipo y placa
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <div>
                        <p className="font-medium text-gray-900">
                          {deleteInfo.pdfs} documento(s) PDF
                        </p>
                        <p className="text-xs text-gray-500">
                          Facturas y pedimentos
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <Trash2 className="w-5 h-5 text-red-600" />
                      <div>
                        <p className="font-medium text-gray-900">
                          Registro del equipo
                        </p>
                        <p className="text-xs text-gray-500">
                          Toda la información del equipo
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Warning offline */}
              {!isOnline && (
                <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg text-orange-700 text-sm">
                  <strong>Modo Offline:</strong> La eliminación se realizará
                  cuando se restablezca la conexión.
                </div>
              )}

              {/* Confirmation text */}
              <p className="text-sm text-gray-600 mb-4">
                ¿Estás seguro de que deseas eliminar este equipo y toda su
                información asociada? Esta acción es{" "}
                <strong className="text-red-600">irreversible</strong>.
              </p>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="
              flex-1 px-4 py-2.5 rounded-lg
              border border-gray-300 bg-white
              text-gray-700 font-medium
              hover:bg-gray-50 transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            Cancelar
          </button>
          <button
            onClick={handleDelete}
            disabled={isLoading || isDeleting}
            className="
              flex-1 flex items-center justify-center gap-2
              px-4 py-2.5 rounded-lg
              bg-red-600 hover:bg-red-700
              text-white font-medium
              transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Eliminando...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                <span>Eliminar</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteEquipmentModal;
