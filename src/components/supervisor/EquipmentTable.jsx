/**
 * EquipmentTable.jsx - Tabla paginada de equipos estilo hoja de cálculo
 *
 * Muestra los equipos de una planta en formato de tabla con:
 * - Header con nombre de planta, contador y búsqueda
 * - Tabla con columnas definidas
 * - Filtros por columna
 * - Paginación
 * - Acciones por fila (editar/eliminar)
 *
 * @version 1.1.0
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
  Filter,
  X,
} from "lucide-react";

// Número de items por página
const ITEMS_PER_PAGE = 10;

// Configuración de columnas filtrables
const FILTERABLE_COLUMNS = [
  { key: "name", label: "Descripción", field: "name" },
  { key: "manufacturer", label: "Fabricante", field: "manufacturer" },
  { key: "model", label: "Modelo", field: "model" },
  { key: "serialNumber", label: "No. Serie", field: "serialNumber" },
  { key: "invoiceNumber", label: "# Factura", field: "invoiceNumber" },
  { key: "customsNumber", label: "# Pedimento", field: "customsNumber" },
];

/**
 * Menú de acciones para cada fila
 */
const ActionMenu = ({ onEdit, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = React.useRef(null);
  const [menuStyle, setMenuStyle] = useState({});

  // Calcular posición del menú al abrir
  const handleToggle = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const menuHeight = 100; // altura aproximada del menú

      // Calcular posición fixed
      const style = {
        position: 'fixed',
        right: window.innerWidth - rect.right,
        zIndex: 9999,
      };

      // Si hay espacio abajo, abrir hacia abajo, si no hacia arriba
      if (spaceBelow >= menuHeight) {
        style.top = rect.bottom + 4;
      } else {
        style.bottom = window.innerHeight - rect.top + 4;
      }

      setMenuStyle(style);
    }
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={handleToggle}
        className="p-2 hover:bg-gray-200 rounded-lg transition-colors"
      >
        <MoreVertical size={16} className="text-gray-600" />
      </button>

      {isOpen && (
        <>
          {/* Overlay para cerrar el menú */}
          <div
            className="fixed inset-0"
            style={{ zIndex: 9998 }}
            onClick={() => setIsOpen(false)}
          />

          {/* Menú desplegable con position fixed */}
          <div
            style={menuStyle}
            className="bg-white border border-gray-200 rounded-lg shadow-xl min-w-[140px]"
          >
            <button
              onClick={() => {
                setIsOpen(false);
                onEdit();
              }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-t-lg"
            >
              <Edit size={14} />
              <span>Editar</span>
            </button>
            <button
              onClick={() => {
                setIsOpen(false);
                onDelete();
              }}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-b-lg"
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
 * Input de filtro para columna
 */
const ColumnFilterInput = ({ value, onChange, placeholder }) => (
  <div className="relative">
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="
        w-full px-2 py-1.5 text-xs
        border border-gray-300 rounded
        focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400
        placeholder:text-gray-400
      "
    />
    {value && (
      <button
        onClick={() => onChange("")}
        className="absolute right-1 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-200 rounded"
      >
        <X size={12} className="text-gray-400" />
      </button>
    )}
  </div>
);

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
  const [showFilters, setShowFilters] = useState(false);

  // Estado para filtros por columna
  const [columnFilters, setColumnFilters] = useState({
    name: "",
    manufacturer: "",
    model: "",
    serialNumber: "",
    invoiceNumber: "",
    customsNumber: "",
  });

  // Verificar si hay filtros activos
  const hasActiveFilters = useMemo(() => {
    return Object.values(columnFilters).some((filter) => filter.trim() !== "");
  }, [columnFilters]);

  // Contar filtros activos
  const activeFiltersCount = useMemo(() => {
    return Object.values(columnFilters).filter((filter) => filter.trim() !== "").length;
  }, [columnFilters]);

  // Actualizar filtro de columna
  const updateColumnFilter = (column, value) => {
    setColumnFilters((prev) => ({
      ...prev,
      [column]: value,
    }));
  };

  // Limpiar todos los filtros
  const clearAllFilters = () => {
    setColumnFilters({
      name: "",
      manufacturer: "",
      model: "",
      serialNumber: "",
      invoiceNumber: "",
      customsNumber: "",
    });
    if (onSearchChange) {
      onSearchChange("");
    }
  };

  // Filtrar equipos por término de búsqueda global y filtros por columna
  const filteredEquipment = useMemo(() => {
    let result = equipment;

    // Aplicar búsqueda global
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (eq) =>
          eq.name?.toLowerCase().includes(term) ||
          eq.manufacturer?.toLowerCase().includes(term) ||
          eq.model?.toLowerCase().includes(term) ||
          eq.serialNumber?.toLowerCase().includes(term) ||
          eq.invoiceNumber?.toLowerCase().includes(term) ||
          eq.customsNumber?.toLowerCase().includes(term)
      );
    }

    // Aplicar filtros por columna
    FILTERABLE_COLUMNS.forEach(({ field }) => {
      const filterValue = columnFilters[field]?.trim().toLowerCase();
      if (filterValue) {
        result = result.filter((eq) =>
          eq[field]?.toLowerCase().includes(filterValue)
        );
      }
    });

    return result;
  }, [equipment, searchTerm, columnFilters]);

  // Calcular paginación
  const totalPages = Math.ceil(filteredEquipment.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedEquipment = filteredEquipment.slice(startIndex, endIndex);

  // Resetear a página 1 cuando cambie el filtro
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, columnFilters]);

  // Navegación de páginas
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
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
                <span className="ml-2 text-amber-600">
                  (mostrando {filteredEquipment.length})
                </span>
              )}
            </p>
          </div>

          {/* Controles */}
          <div className="flex items-center gap-2">
            {/* Botón de filtros */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`
                flex items-center gap-2 px-3 py-2 rounded-lg border
                transition-colors duration-200 text-sm
                ${showFilters || hasActiveFilters
                  ? "bg-amber-50 border-amber-400 text-amber-700"
                  : "border-gray-300 text-gray-600 hover:bg-gray-50"
                }
              `}
            >
              <Filter size={16} />
              <span className="hidden sm:inline">Filtros</span>
              {activeFiltersCount > 0 && (
                <span className="bg-amber-400 text-gray-900 text-xs font-bold px-1.5 py-0.5 rounded-full">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            {/* Limpiar filtros */}
            {(hasActiveFilters || searchTerm) && (
              <button
                onClick={clearAllFilters}
                className="flex items-center gap-1 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <X size={16} />
                <span className="hidden sm:inline">Limpiar</span>
              </button>
            )}

            {/* Búsqueda global */}
            <div className="relative">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="
                  pl-10 pr-4 py-2 w-36 sm:w-48
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
      <div className="overflow-x-auto overflow-y-visible">
        <table className="w-full">
          <thead>
            {/* Fila de encabezados */}
            <tr className="bg-amber-400">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider w-12">
                #
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider min-w-[150px]">
                Descripción
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider hidden md:table-cell min-w-[120px]">
                Fabricante
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider hidden lg:table-cell min-w-[100px]">
                Modelo
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider min-w-[120px]">
                No. Serie
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider hidden xl:table-cell min-w-[100px]">
                # Factura
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-900 uppercase tracking-wider hidden xl:table-cell min-w-[100px]">
                # Pedimento
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-900 uppercase tracking-wider w-20">
                Acciones
              </th>
            </tr>

            {/* Fila de filtros por columna */}
            {showFilters && (
              <tr className="bg-amber-50 border-b border-amber-200">
                <th className="px-4 py-2">
                  {/* Columna # sin filtro */}
                </th>
                <th className="px-2 py-2">
                  <ColumnFilterInput
                    value={columnFilters.name}
                    onChange={(value) => updateColumnFilter("name", value)}
                    placeholder="Filtrar..."
                  />
                </th>
                <th className="px-2 py-2 hidden md:table-cell">
                  <ColumnFilterInput
                    value={columnFilters.manufacturer}
                    onChange={(value) => updateColumnFilter("manufacturer", value)}
                    placeholder="Filtrar..."
                  />
                </th>
                <th className="px-2 py-2 hidden lg:table-cell">
                  <ColumnFilterInput
                    value={columnFilters.model}
                    onChange={(value) => updateColumnFilter("model", value)}
                    placeholder="Filtrar..."
                  />
                </th>
                <th className="px-2 py-2">
                  <ColumnFilterInput
                    value={columnFilters.serialNumber}
                    onChange={(value) => updateColumnFilter("serialNumber", value)}
                    placeholder="Filtrar..."
                  />
                </th>
                <th className="px-2 py-2 hidden xl:table-cell">
                  <ColumnFilterInput
                    value={columnFilters.invoiceNumber}
                    onChange={(value) => updateColumnFilter("invoiceNumber", value)}
                    placeholder="Filtrar..."
                  />
                </th>
                <th className="px-2 py-2 hidden xl:table-cell">
                  <ColumnFilterInput
                    value={columnFilters.customsNumber}
                    onChange={(value) => updateColumnFilter("customsNumber", value)}
                    placeholder="Filtrar..."
                  />
                </th>
                <th className="px-4 py-2">
                  {/* Columna acciones sin filtro */}
                </th>
              </tr>
            )}
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
                    {searchTerm || hasActiveFilters ? (
                      <>
                        <AlertCircle size={32} className="mb-2 text-gray-400" />
                        <span>No se encontraron equipos</span>
                        <span className="text-sm">
                          Prueba con otros filtros o términos de búsqueda
                        </span>
                        <button
                          onClick={clearAllFilters}
                          className="mt-3 text-amber-600 hover:text-amber-700 font-medium text-sm"
                        >
                          Limpiar todos los filtros
                        </button>
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
            {filteredEquipment.length !== equipment.length && (
              <span className="text-amber-600 ml-1">
                (filtrado de {equipment.length})
              </span>
            )}
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
              disabled={currentPage === totalPages || totalPages === 0}
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
