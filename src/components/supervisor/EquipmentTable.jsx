/**
 * EquipmentTable.jsx - Tabla paginada de equipos estilo hoja de cálculo
 *
 * Muestra los equipos de una planta en formato de tabla con:
 * - Header con nombre de planta, contador y búsqueda
 * - Tabla con columnas definidas
 * - Paginación
 * - Acciones por fila (editar/eliminar)
 *
 * @version 1.0.0
 */

import React, { useState, useMemo } from "react";
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Edit,
  Trash2,
  Loader2,
  Package,
  AlertCircle,
} from "lucide-react";

// Número de items por página
const ITEMS_PER_PAGE = 10;

/**
 * Menú de acciones para cada fila
 */
const ActionMenu = ({ onEdit, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
      >
        <MoreVertical size={16} className="text-gray-600" />
      </button>

      {isOpen && (
        <>
          {/* Overlay para cerrar el menú */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Menú desplegable */}
          <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[140px]">
            <button
              onClick={() => {
                setIsOpen(false);
                onEdit();
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Edit size={14} />
              <span>Editar</span>
            </button>
            <button
              onClick={() => {
                setIsOpen(false);
                onDelete();
              }}
              className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
            >
              <Trash2 size={14} />
              <span>Eliminar</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};

/**
 * Componente EquipmentTable
 */
export const EquipmentTable = ({
  equipment = [],
  plantName,
  onSelectEquipment,
  onNewEquipment,
  onDeleteEquipment,
  searchTerm = "",
  onSearchChange,
  isLoading,
  showSuccessMessage,
  successMessage,
}) => {
  const [currentPage, setCurrentPage] = useState(1);

  // Filtrar equipos por término de búsqueda
  const filteredEquipment = useMemo(() => {
    if (!searchTerm.trim()) return equipment;

    const term = searchTerm.toLowerCase();
    return equipment.filter(
      (eq) =>
        eq.name?.toLowerCase().includes(term) ||
        eq.manufacturer?.toLowerCase().includes(term) ||
        eq.model?.toLowerCase().includes(term) ||
        eq.serialNumber?.toLowerCase().includes(term) ||
        eq.invoiceNumber?.toLowerCase().includes(term) ||
        eq.customsNumber?.toLowerCase().includes(term)
    );
  }, [equipment, searchTerm]);

  // Calcular paginación
  const totalPages = Math.ceil(filteredEquipment.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedEquipment = filteredEquipment.slice(startIndex, endIndex);

  // Resetear a página 1 cuando cambie el filtro
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Navegación de páginas
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Título y contador */}
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
              {plantName}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              Total: <span className="font-semibold">{equipment.length}</span> equipos
              {filteredEquipment.length !== equipment.length && (
                <span className="ml-2">
                  (mostrando {filteredEquipment.length})
                </span>
              )}
            </p>
          </div>

          {/* Búsqueda y agregar */}
          <div className="flex items-center gap-3">
            {/* Búsqueda */}
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Buscar equipo..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="
                  pl-10 pr-4 py-2 w-48 sm:w-64
                  border border-gray-300 rounded-lg
                  text-sm
                  focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent
                "
              />
            </div>

            {/* Botón agregar */}
            <button
              onClick={onNewEquipment}
              className="
                flex items-center gap-2
                bg-amber-400 hover:bg-amber-500
                text-gray-900 font-medium
                px-4 py-2 rounded-lg
                transition-colors duration-200
                text-sm
              "
            >
              <Plus size={18} />
              <span className="hidden sm:inline">Agregar</span>
            </button>
          </div>
        </div>

        {/* Mensaje de éxito */}
        {showSuccessMessage && successMessage && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
            {successMessage}
          </div>
        )}
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-amber-400">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider w-12">
                #
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                Descripción
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider hidden md:table-cell">
                Fabricante
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider hidden lg:table-cell">
                Modelo
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider">
                No. Serie
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider hidden xl:table-cell">
                # Factura
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider hidden xl:table-cell">
                # Pedimento
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-900 uppercase tracking-wider w-20">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan="8" className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center justify-center text-gray-500">
                    <Loader2 size={32} className="animate-spin mb-2" />
                    <span>Cargando equipos...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedEquipment.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center justify-center text-gray-500">
                    {searchTerm ? (
                      <>
                        <AlertCircle size={32} className="mb-2 text-gray-400" />
                        <span>No se encontraron equipos</span>
                        <span className="text-sm">
                          Prueba con otro término de búsqueda
                        </span>
                      </>
                    ) : (
                      <>
                        <Package size={32} className="mb-2 text-gray-400" />
                        <span>No hay equipos registrados</span>
                        <button
                          onClick={onNewEquipment}
                          className="mt-2 text-amber-600 hover:text-amber-700 font-medium"
                        >
                          Agregar primer equipo
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              paginatedEquipment.map((equip, index) => (
                <tr
                  key={equip.id}
                  className="hover:bg-amber-50 transition-colors odd:bg-white even:bg-gray-50"
                >
                  <td className="px-4 py-3 text-sm text-gray-500 font-medium">
                    {startIndex + index + 1}
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-sm font-medium text-gray-900">
                      {equip.name || "-"}
                    </div>
                    <div className="text-xs text-gray-500 md:hidden">
                      {equip.manufacturer || "-"}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 hidden md:table-cell">
                    {equip.manufacturer || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 hidden lg:table-cell">
                    {equip.model || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 font-mono">
                    {equip.serialNumber || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 hidden xl:table-cell">
                    {equip.invoiceNumber || "-"}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600 hidden xl:table-cell">
                    {equip.customsNumber || "-"}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <ActionMenu
                      onEdit={() => onSelectEquipment(equip)}
                      onDelete={() => onDeleteEquipment && onDeleteEquipment(equip)}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {!isLoading && filteredEquipment.length > 0 && (
        <div className="px-4 sm:px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-sm text-gray-500">
            Mostrando {startIndex + 1}-{Math.min(endIndex, filteredEquipment.length)} de{" "}
            {filteredEquipment.length}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="
                p-2 rounded-lg border border-gray-300
                hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors
              "
            >
              <ChevronLeft size={18} />
            </button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (currentPage <= 3) {
                  pageNum = i + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = currentPage - 2 + i;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => goToPage(pageNum)}
                    className={`
                      w-8 h-8 rounded-lg text-sm font-medium
                      transition-colors
                      ${currentPage === pageNum
                        ? "bg-amber-400 text-gray-900"
                        : "hover:bg-gray-100 text-gray-600"
                      }
                    `}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="
                p-2 rounded-lg border border-gray-300
                hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed
                transition-colors
              "
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EquipmentTable;
