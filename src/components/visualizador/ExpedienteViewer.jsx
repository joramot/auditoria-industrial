/**
 * ExpedienteViewer.jsx - Visor de expediente con paginación
 *
 * Renderiza las páginas del expediente y proporciona controles de navegación
 */

import React from 'react';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileText,
  Loader
} from 'lucide-react';
import { CaratulaPage } from './pages/CaratulaPage';
import { ImagePage } from './pages/ImagePage';
import { PDFPage } from './pages/PDFPage';
import { PAGE_TYPES } from './hooks/useExpediente';

/**
 * Renderiza la página actual según su tipo
 */
const PageRenderer = ({ pageData }) => {
  if (!pageData) return null;

  switch (pageData.type) {
    case PAGE_TYPES.CARATULA:
      return <CaratulaPage data={pageData.data} />;
    case PAGE_TYPES.IMAGE:
      return <ImagePage data={pageData.data} title={pageData.title} />;
    case PAGE_TYPES.PDF:
      return <PDFPage data={pageData.data} title={pageData.title} />;
    default:
      return (
        <div className="w-full h-full flex items-center justify-center">
          <p className="text-gray-500">Tipo de página no soportado</p>
        </div>
      );
  }
};

/**
 * @param {Object} props
 * @param {Object} props.currentPageData - Datos de la página actual
 * @param {number} props.currentPage - Índice de la página actual (0-based)
 * @param {number} props.totalPages - Total de páginas
 * @param {Function} props.goToPage - Función para ir a una página específica
 * @param {Function} props.nextPage - Función para ir a la siguiente página
 * @param {Function} props.prevPage - Función para ir a la página anterior
 * @param {Function} props.firstPage - Función para ir a la primera página
 * @param {Function} props.lastPage - Función para ir a la última página
 * @param {boolean} props.hasNextPage - Si hay página siguiente
 * @param {boolean} props.hasPrevPage - Si hay página anterior
 * @param {boolean} props.loading - Estado de carga
 * @param {string} props.error - Mensaje de error
 */
export const ExpedienteViewer = ({
  currentPageData,
  currentPage,
  totalPages,
  goToPage,
  nextPage,
  prevPage,
  firstPage,
  lastPage,
  hasNextPage,
  hasPrevPage,
  loading,
  error
}) => {
  // Estado de carga
  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <Loader className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Cargando expediente...</p>
        </div>
      </div>
    );
  }

  // Error
  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center text-red-600">
          <p className="text-lg font-medium mb-2">Error al cargar expediente</p>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // Sin páginas
  if (totalPages === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center text-gray-500">
          <FileText className="w-16 h-16 mx-auto mb-4" />
          <p className="text-lg">Selecciona un equipo para ver su expediente</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-gray-200">
      {/* Área de contenido de la página */}
      <div className="flex-1 overflow-hidden">
        <PageRenderer pageData={currentPageData} />
      </div>

      {/* Barra de navegación inferior */}
      <div className="bg-white border-t border-gray-300 p-3 flex items-center justify-between shadow-lg">
        {/* Botones de navegación izquierda */}
        <div className="flex items-center gap-1">
          <button
            onClick={firstPage}
            disabled={!hasPrevPage}
            className="p-2 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Primera página"
          >
            <ChevronsLeft className="w-5 h-5" />
          </button>
          <button
            onClick={prevPage}
            disabled={!hasPrevPage}
            className="p-2 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Página anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Indicador de página */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Página</span>
          <select
            value={currentPage}
            onChange={(e) => goToPage(parseInt(e.target.value))}
            className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-2 focus:ring-blue-500"
          >
            {Array.from({ length: totalPages }, (_, i) => (
              <option key={i} value={i}>
                {i + 1}
              </option>
            ))}
          </select>
          <span className="text-sm text-gray-600">de {totalPages}</span>
        </div>

        {/* Botones de navegación derecha */}
        <div className="flex items-center gap-1">
          <button
            onClick={nextPage}
            disabled={!hasNextPage}
            className="p-2 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Página siguiente"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <button
            onClick={lastPage}
            disabled={!hasNextPage}
            className="p-2 rounded hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            title="Última página"
          >
            <ChevronsRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExpedienteViewer;
