/**
 * AuditorNavigation.jsx - Navegación entre Equipos para Auditor
 * Permite navegar entre equipos con indicador de progreso
 */

import React from 'react';
import { 
  ChevronLeft, 
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CheckCircle,
  Clock
} from 'lucide-react';

/**
 * Componente de Navegación entre Equipos
 * 
 * @param {Object} props
 * @param {number} props.currentIndex - Índice actual (0-based)
 * @param {number} props.total - Total de equipos
 * @param {Function} props.onPrevious - Callback al ir al anterior
 * @param {Function} props.onNext - Callback al ir al siguiente
 * @param {Function} props.onFirst - Callback al ir al primero
 * @param {Function} props.onLast - Callback al ir al último
 * @param {string} props.reviewStatus - Estado de revisión del equipo actual
 */
const AuditorNavigation = ({ 
  currentIndex = 0,
  total = 0,
  onPrevious,
  onNext,
  onFirst,
  onLast,
  reviewStatus = 'pendiente'
}) => {

  const isFirst = currentIndex === 0;
  const isLast = currentIndex === total - 1;
  const currentNumber = currentIndex + 1;
  const isReviewed = reviewStatus === 'revisado';

  if (total === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-4 mb-4">
      {/* Indicador de Posición */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {isReviewed ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <Clock className="w-5 h-5 text-orange-600" />
          )}
          <span className="text-sm font-medium text-gray-700">
            {isReviewed ? 'Revisado' : 'Pendiente'}
          </span>
        </div>
        <div className="text-lg font-bold text-gray-800">
          {currentNumber} de {total}
        </div>
      </div>

      {/* Barra de Progreso */}
      <div className="mb-4">
        <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${(currentNumber / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Botones de Navegación */}
      <div className="grid grid-cols-4 gap-2">
        {/* Ir al Primero */}
        <button
          onClick={onFirst}
          disabled={isFirst}
          className={`
            flex items-center justify-center gap-1 py-2 px-3 rounded-lg border
            transition-all duration-200
            ${isFirst 
              ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed' 
              : 'bg-white border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400'
            }
          `}
          title="Ir al primero"
        >
          <ChevronsLeft className="w-4 h-4" />
          <span className="text-xs font-medium hidden sm:inline">Primero</span>
        </button>

        {/* Anterior */}
        <button
          onClick={onPrevious}
          disabled={isFirst}
          className={`
            flex items-center justify-center gap-1 py-2 px-3 rounded-lg border
            transition-all duration-200
            ${isFirst 
              ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed' 
              : 'bg-white border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400'
            }
          `}
          title="Anterior"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="text-xs font-medium">Anterior</span>
        </button>

        {/* Siguiente */}
        <button
          onClick={onNext}
          disabled={isLast}
          className={`
            flex items-center justify-center gap-1 py-2 px-3 rounded-lg border
            transition-all duration-200
            ${isLast 
              ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed' 
              : 'bg-white border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400'
            }
          `}
          title="Siguiente"
        >
          <span className="text-xs font-medium">Siguiente</span>
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Ir al Último */}
        <button
          onClick={onLast}
          disabled={isLast}
          className={`
            flex items-center justify-center gap-1 py-2 px-3 rounded-lg border
            transition-all duration-200
            ${isLast 
              ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed' 
              : 'bg-white border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400'
            }
          `}
          title="Ir al último"
        >
          <span className="text-xs font-medium hidden sm:inline">Último</span>
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>

      {/* Atajos de Teclado (Info) */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <p className="text-xs text-gray-500 text-center">
          Usa las teclas ← → para navegar entre equipos
        </p>
      </div>
    </div>
  );
};

export default AuditorNavigation;
