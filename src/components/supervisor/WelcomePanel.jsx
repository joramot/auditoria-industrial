/**
 * WelcomePanel.jsx - Panel de bienvenida sin planta seleccionada
 *
 * Se muestra cuando el usuario no ha seleccionado ninguna planta.
 * Incluye instrucciones y acceso rápido a crear planta.
 *
 * @version 1.0.0
 */

import React from "react";
import { Factory, ArrowLeft, Plus } from "lucide-react";

/**
 * Componente WelcomePanel
 */
export const WelcomePanel = ({ onNewPlant, plantsCount = 0 }) => {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-8">
      {/* Icono principal */}
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <Factory size={48} className="text-gray-400" />
      </div>

      {/* Título */}
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        Bienvenido al Sistema de Auditoría
      </h2>

      {/* Descripción */}
      <p className="text-gray-500 max-w-md mb-8">
        {plantsCount > 0 ? (
          <>
            Selecciona una planta del menú lateral para ver y gestionar sus equipos.
          </>
        ) : (
          <>
            No hay plantas registradas aún. Crea tu primera planta para comenzar
            a registrar equipos.
          </>
        )}
      </p>

      {/* Indicador visual */}
      <div className="flex items-center gap-4 text-gray-400 mb-8">
        <ArrowLeft size={24} className="animate-pulse" />
        <span className="text-sm">
          {plantsCount > 0
            ? "Usa el selector de plantas"
            : "Haz clic en '+ Nueva Planta'"}
        </span>
      </div>

      {/* Botón para crear planta si no hay ninguna */}
      {plantsCount === 0 && onNewPlant && (
        <button
          onClick={onNewPlant}
          className="
            flex items-center gap-2
            bg-amber-400 hover:bg-amber-500
            text-gray-900 font-semibold
            px-6 py-3 rounded-lg
            transition-colors duration-200
          "
        >
          <Plus size={20} />
          <span>Crear Primera Planta</span>
        </button>
      )}

      {/* Tarjetas de información */}
      {plantsCount > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 w-full max-w-2xl">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-3xl font-bold text-amber-500 mb-1">
              {plantsCount}
            </div>
            <div className="text-sm text-gray-500">
              Plantas registradas
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-3xl font-bold text-blue-500 mb-1">
              1
            </div>
            <div className="text-sm text-gray-500">
              Selecciona una planta
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-3xl font-bold text-green-500 mb-1">
              2
            </div>
            <div className="text-sm text-gray-500">
              Gestiona equipos
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WelcomePanel;
