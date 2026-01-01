import React from "react";
import { Loader } from "lucide-react";

/**
 * SyncProgress Component
 * Modal que muestra el progreso de sincronización de datos.
 * Se muestra como overlay sobre la aplicación durante la sincronización.
 * 
 * @param {Object} props
 * @param {boolean} props.show - Controla si el modal es visible
 * @param {Object} props.progress - Objeto con el estado del progreso
 * @param {number} props.progress.current - Número de items procesados
 * @param {number} props.progress.total - Total de items a procesar
 * @param {number} props.progress.percentage - Porcentaje de progreso (0-100)
 * @param {string} props.progress.type - Tipo de dato siendo procesado (ej: "plantas", "equipos")
 * @param {Function} [props.onClose] - Callback opcional para cerrar el modal manualmente
 */
export const SyncProgress = ({ show, progress, onClose }) => {
  // No renderizar si no está visible
  if (!show) return null;

  // Valores por defecto para el progreso
  const {
    current = 0,
    total = 0,
    percentage = 0,
    type = "",
  } = progress || {};

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4 shadow-xl">
        {/* Título */}
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
          <Loader className="w-5 h-5 animate-spin text-blue-600" />
          Sincronizando datos...
        </h3>

        {/* Barra de progreso */}
        <div className="mb-4">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-gray-600">Progreso</span>
            <span className="text-sm font-medium text-blue-600">
              {current}/{total}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>

        {/* Información de procesamiento */}
        <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
          {type ? (
            <>
              <span className="font-medium">Procesando:</span> {type}
            </>
          ) : (
            "Iniciando sincronización..."
          )}
        </p>

        {/* Botón de cierre opcional */}
        {onClose && (
          <button
            onClick={onClose}
            className="mt-4 w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded transition-colors text-sm"
          >
            Cerrar
          </button>
        )}
      </div>
    </div>
  );
};

export default SyncProgress;