/**
 * AuditorEquipmentTable.jsx - Tabla paginada de equipos para Auditor
 *
 * Muestra los equipos de una planta en formato de tabla con:
 * - Header con nombre de planta, contador y busqueda
 * - Tabla con columnas de datos y estado de revision
 * - Filtros por columna
 * - Paginacion
 * - Click en fila abre vista de auditoria (NO modal)
 * - SIN columna de Acciones (editar/eliminar)
 *
 * @version 1.0.0
 */

import React, { useState, useMemo } from "react";
import {
  Search,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Package,
  AlertCircle,
  Filter,
  X,
  CheckCircle,
  Clock,
} from "lucide-react";

// Numero de items por pagina
const ITEMS_PER_PAGE = 10;

// Configuracion de columnas filtrables
const FILTERABLE_COLUMNS = [
  { key: "name", label: "Descripcion", field: "name" },
  { key: "manufacturer", label: "Fabricante", field: "manufacturer" },
  { key: "model", label: "Modelo", field: "model" },
  { key: "serialNumber", label: "No. Serie", field: "serialNumber" },
  { key: "location", label: "Ubicacion", field: "location" },
];

// Configuración de filtros de datos faltantes
const MISSING_DATA_FILTERS = [
  { key: "missingModel", label: "Sin Modelo" },
  { key: "missingSerialNumber", label: "Sin No. Serie" },
  { key: "missingInvoiceNumber", label: "Sin # Factura" },
  { key: "missingCustomsNumber", label: "Sin # Pedimento" },
  { key: "missingR1Number", label: "Sin Folio R1" },
  { key: "missingDocuments", label: "Sin documentos PDF adjuntos" },
  { key: "missingImages", label: "Sin imágenes adjuntas" },
];

// Verificar condición de dato faltante para un equipo
const checkMissingCondition = (eq, key) => {
  switch (key) {
    case "missingModel": return !eq.model?.trim();
    case "missingSerialNumber": return !eq.serialNumber?.trim();
    case "missingInvoiceNumber": return !eq.invoiceNumber?.trim();
    case "missingCustomsNumber": return !eq.customsNumber?.trim();
    case "missingR1Number": return !eq.r1Number?.trim();
    case "missingDocuments":
      return !eq.pdfs?.factura?.length && !eq.pdfs?.pedimento?.length && !eq.pdfs?.r1?.length;
    case "missingImages":
      return !eq.images?.equipment?.length && !eq.images?.plate?.length;
    default: return false;
  }
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
        focus:outline-none focus:ring-1 focus:ring-blue-400 focus:border-blue-400
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
 * Badge de estado de revision
 */
const StatusBadge = ({ isReviewed }) => (
  <span
    className={`
      inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
      ${isReviewed
        ? "bg-green-100 text-green-800"
        : "bg-orange-100 text-orange-800"
      }
    `}
  >
    {isReviewed ? (
      <>
        <CheckCircle size={12} />
        Revisado
      </>
    ) : (
      <>
        <Clock size={12} />
        Pendiente
      </>
    )}
  </span>
);

/**
 * Componente AuditorEquipmentTable
 */
export const AuditorEquipmentTable = ({
  equipment = [],
  plantName,
  plantLocation,
  onSelectEquipment,
  searchTerm = "",
  onSearchChange,
  isLoading,
  filterStatus = "all", // 'all', 'revisado', 'pendiente'
  onFilterStatusChange,
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Estado para filtros por columna
  const [columnFilters, setColumnFilters] = useState({
    name: "",
    manufacturer: "",
    model: "",
    serialNumber: "",
    location: "",
  });

  // Estado para filtros de datos faltantes
  const [missingDataFilters, setMissingDataFilters] = useState(
    Object.fromEntries(MISSING_DATA_FILTERS.map((f) => [f.key, false]))
  );

  // Alternar filtro de dato faltante
  const toggleMissingFilter = (key) => {
    setMissingDataFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Estado para filtros de origen
  const [originFilters, setOriginFilters] = useState({ nacional: false, extranjero: false });

  // Alternar filtro de origen
  const toggleOriginFilter = (key) => {
    setOriginFilters((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Contar filtros de datos faltantes activos
  const activeMissingCount = useMemo(() => {
    return Object.values(missingDataFilters).filter(Boolean).length;
  }, [missingDataFilters]);

  // Contar filtros de origen activos
  const activeOriginCount = useMemo(() => {
    return Object.values(originFilters).filter(Boolean).length;
  }, [originFilters]);

  // Verificar si hay filtros activos
  const hasActiveFilters = useMemo(() => {
    return Object.values(columnFilters).some((filter) => filter.trim() !== "") || activeMissingCount > 0 || activeOriginCount > 0;
  }, [columnFilters, activeMissingCount, activeOriginCount]);

  // Contar filtros activos
  const activeFiltersCount = useMemo(() => {
    return Object.values(columnFilters).filter((filter) => filter.trim() !== "").length + activeMissingCount + activeOriginCount;
  }, [columnFilters, activeMissingCount, activeOriginCount]);

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
      location: "",
    });
    setMissingDataFilters(
      Object.fromEntries(MISSING_DATA_FILTERS.map((f) => [f.key, false]))
    );
    setOriginFilters({ nacional: false, extranjero: false });
    if (onSearchChange) {
      onSearchChange("");
    }
    if (onFilterStatusChange) {
      onFilterStatusChange("all");
    }
  };

  // Filtrar equipos por termino de busqueda global, filtros por columna y estado
  const filteredEquipment = useMemo(() => {
    let result = equipment;

    // Aplicar filtro por estado de revision
    if (filterStatus === "revisado") {
      result = result.filter((eq) => eq.reviewStatus === "revisado");
    } else if (filterStatus === "pendiente") {
      result = result.filter((eq) => eq.reviewStatus !== "revisado");
    }

    // Aplicar busqueda global
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (eq) =>
          eq.name?.toLowerCase().includes(term) ||
          eq.manufacturer?.toLowerCase().includes(term) ||
          eq.model?.toLowerCase().includes(term) ||
          eq.serialNumber?.toLowerCase().includes(term) ||
          eq.location?.toLowerCase().includes(term)
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

    // Aplicar filtros de datos faltantes (lógica OR: muestra equipos que cumplen al menos uno)
    const activeMissingKeys = Object.entries(missingDataFilters)
      .filter(([, active]) => active)
      .map(([key]) => key);

    if (activeMissingKeys.length > 0) {
      result = result.filter((eq) =>
        activeMissingKeys.some((key) => checkMissingCondition(eq, key))
      );
    }

    // Aplicar filtros de origen (lógica OR entre los seleccionados)
    const activeOrigins = [
      originFilters.nacional && "NACIONAL",
      originFilters.extranjero && "EXTRANJERO",
    ].filter(Boolean);

    if (activeOrigins.length > 0) {
      result = result.filter((eq) => activeOrigins.includes(eq.origin));
    }

    return result;
  }, [equipment, searchTerm, columnFilters, filterStatus, missingDataFilters, originFilters]);

  // Calcular estadisticas
  const stats = useMemo(() => {
    const total = equipment.length;
    const reviewed = equipment.filter((eq) => eq.reviewStatus === "revisado").length;
    const pending = total - reviewed;
    return { total, reviewed, pending };
  }, [equipment]);

  // Calcular paginacion
  const totalPages = Math.ceil(filteredEquipment.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedEquipment = filteredEquipment.slice(startIndex, endIndex);

  // Resetear a pagina 1 cuando cambie el filtro
  React.useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, columnFilters, filterStatus, missingDataFilters, originFilters]);

  // Navegacion de paginas
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200">
      {/* Header */}
      <div className="p-4 sm:p-6 border-b border-gray-200">
        <div className="flex flex-col gap-4">
          {/* Titulo y contador */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                {plantName}
              </h2>
              {plantLocation && (
                <p className="text-sm text-gray-500 mt-0.5">
                  {plantLocation}
                </p>
              )}
              <p className="text-sm text-gray-500 mt-1">
                Total: <span className="font-semibold">{stats.total}</span> equipos
                {" | "}
                <span className="text-green-600 font-semibold">{stats.reviewed}</span> revisados
                {" | "}
                <span className="text-orange-600 font-semibold">{stats.pending}</span> pendientes
                {filteredEquipment.length !== equipment.length && (
                  <span className="ml-2 text-blue-600">
                    (mostrando {filteredEquipment.length})
                  </span>
                )}
              </p>
            </div>

            {/* Controles */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Boton de filtros */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-lg border
                  transition-colors duration-200 text-sm
                  ${showFilters || hasActiveFilters
                    ? "bg-blue-50 border-blue-400 text-blue-700"
                    : "border-gray-300 text-gray-600 hover:bg-gray-50"
                  }
                `}
              >
                <Filter size={16} />
                <span className="hidden sm:inline">Filtros</span>
                {activeFiltersCount > 0 && (
                  <span className="bg-blue-400 text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
                    {activeFiltersCount}
                  </span>
                )}
              </button>

              {/* Limpiar filtros */}
              {(hasActiveFilters || searchTerm || filterStatus !== "all") && (
                <button
                  onClick={clearAllFilters}
                  className="flex items-center gap-1 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <X size={16} />
                  <span className="hidden sm:inline">Limpiar</span>
                </button>
              )}

              {/* Busqueda global */}
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
                    focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-transparent
                  "
                />
              </div>
            </div>
          </div>

          {/* Botones de filtro por estado */}
          <div className="flex gap-2">
            <button
              onClick={() => onFilterStatusChange("all")}
              className={`
                px-4 py-2 rounded-lg font-medium text-sm transition-colors
                ${filterStatus === "all"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }
              `}
            >
              Todos ({stats.total})
            </button>
            <button
              onClick={() => onFilterStatusChange("pendiente")}
              className={`
                px-4 py-2 rounded-lg font-medium text-sm transition-colors
                ${filterStatus === "pendiente"
                  ? "bg-orange-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }
              `}
            >
              Pendientes ({stats.pending})
            </button>
            <button
              onClick={() => onFilterStatusChange("revisado")}
              className={`
                px-4 py-2 rounded-lg font-medium text-sm transition-colors
                ${filterStatus === "revisado"
                  ? "bg-green-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }
              `}
            >
              Revisados ({stats.reviewed})
            </button>
          </div>
        </div>
      </div>

      {/* Panel de filtros de datos faltantes y origen */}
      {showFilters && (
        <div className="px-4 sm:px-6 py-3 bg-blue-50 border-b border-blue-200 flex flex-col gap-3">
          {/* Datos faltantes */}
          <div>
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
              Datos faltantes
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {MISSING_DATA_FILTERS.map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={missingDataFilters[key]}
                    onChange={() => toggleMissingFilter(key)}
                    className="w-4 h-4 rounded border-gray-300 cursor-pointer accent-blue-500"
                  />
                  <span className={`text-sm ${missingDataFilters[key] ? "text-blue-700 font-medium" : "text-gray-700"} group-hover:text-gray-900`}>
                    {label}
                  </span>
                </label>
              ))}
            </div>
          </div>
          {/* Origen */}
          <div className="border-t border-blue-200 pt-3">
            <p className="text-xs font-semibold text-gray-600 uppercase tracking-wider mb-2">
              Origen
            </p>
            <div className="flex flex-wrap gap-x-6 gap-y-2">
              {[
                { key: "nacional", label: "Nacional" },
                { key: "extranjero", label: "Extranjero" },
              ].map(({ key, label }) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={originFilters[key]}
                    onChange={() => toggleOriginFilter(key)}
                    className="w-4 h-4 rounded border-gray-300 cursor-pointer accent-blue-500"
                  />
                  <span className={`text-sm ${originFilters[key] ? "text-blue-700 font-medium" : "text-gray-700"} group-hover:text-gray-900`}>
                    {label}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="overflow-x-auto overflow-y-visible">
        <table className="w-full">
          <thead>
            {/* Fila de encabezados */}
            <tr className="bg-blue-600">
              <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider w-12">
                #
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider min-w-[150px]">
                Descripcion
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider hidden md:table-cell min-w-[120px]">
                Fabricante
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider hidden lg:table-cell min-w-[100px]">
                Modelo
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider min-w-[120px]">
                No. Serie
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-white uppercase tracking-wider hidden xl:table-cell min-w-[120px]">
                Ubicacion
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-white uppercase tracking-wider w-28">
                Estado
              </th>
            </tr>

            {/* Fila de filtros por columna */}
            {showFilters && (
              <tr className="bg-blue-50 border-b border-blue-200">
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
                    value={columnFilters.location}
                    onChange={(value) => updateColumnFilter("location", value)}
                    placeholder="Filtrar..."
                  />
                </th>
                <th className="px-4 py-2">
                  {/* Columna estado sin filtro */}
                </th>
              </tr>
            )}
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan="7" className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center justify-center text-gray-500">
                    <Loader2 size={32} className="animate-spin mb-2" />
                    <span>Cargando equipos...</span>
                  </div>
                </td>
              </tr>
            ) : paginatedEquipment.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-4 py-12 text-center">
                  <div className="flex flex-col items-center justify-center text-gray-500">
                    {searchTerm || hasActiveFilters || filterStatus !== "all" ? (
                      <>
                        <AlertCircle size={32} className="mb-2 text-gray-400" />
                        <span>No se encontraron equipos</span>
                        <span className="text-sm">
                          Prueba con otros filtros o terminos de busqueda
                        </span>
                        <button
                          onClick={clearAllFilters}
                          className="mt-3 text-blue-600 hover:text-blue-700 font-medium text-sm"
                        >
                          Limpiar todos los filtros
                        </button>
                      </>
                    ) : (
                      <>
                        <Package size={32} className="mb-2 text-gray-400" />
                        <span>No hay equipos registrados en esta planta</span>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ) : (
              paginatedEquipment.map((equip, index) => {
                const isReviewed = equip.reviewStatus === "revisado";
                return (
                  <tr
                    key={equip.id}
                    className="hover:bg-blue-50 transition-colors odd:bg-white even:bg-gray-50 cursor-pointer focus:outline-none focus:bg-blue-100 focus:ring-2 focus:ring-inset focus:ring-blue-400"
                    onClick={() => onSelectEquipment(equip, equipment.indexOf(equip))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        onSelectEquipment(equip, equipment.indexOf(equip));
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`Auditar ${equip.name || "equipo"}`}
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
                      {equip.location || "-"}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge isReviewed={isReviewed} />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Paginacion */}
      {!isLoading && filteredEquipment.length > 0 && (
        <div className="px-4 sm:px-6 py-4 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-sm text-gray-500">
            Mostrando {startIndex + 1}-{Math.min(endIndex, filteredEquipment.length)} de{" "}
            {filteredEquipment.length}
            {filteredEquipment.length !== equipment.length && (
              <span className="text-blue-600 ml-1">
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
                        ? "bg-blue-600 text-white"
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

export default AuditorEquipmentTable;
