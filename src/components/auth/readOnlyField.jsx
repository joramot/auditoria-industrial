/**
 * ReadOnlyField.jsx - Campo Visual de Solo Lectura
 * Versión: 1.0
 * 
 * Componente para mostrar campos que no son editables.
 * Presenta la información de forma clara y estilizada.
 * 
 * FASE 3: Control de Acceso - Tarea 3.3
 */

import React from 'react';
import { Lock, Eye, Info, AlertCircle, CheckCircle, XCircle, Calendar, User, MapPin, Tag } from 'lucide-react';

const EMPTY_OBJ = {};
const EMPTY_ARRAY = [];

/**
 * 📖 COMPONENTE READ ONLY FIELD
 * 
 * Muestra un campo en modo solo lectura con estilos visuales claros.
 * 
 * Uso básico:
 * ```jsx
 * <ReadOnlyField
 *   label="Nombre del Equipo"
 *   value={equipment.name}
 * />
 * ```
 * 
 * Con icono:
 * ```jsx
 * <ReadOnlyField
 *   label="Ubicación"
 *   value={equipment.location}
 *   icon={<MapPin />}
 * />
 * ```
 * 
 * @param {Object} props
 * @param {string} props.label - Etiqueta del campo
 * @param {string|number} props.value - Valor a mostrar
 * @param {React.ReactNode} props.icon - Icono opcional
 * @param {string} props.placeholder - Texto si no hay valor
 * @param {boolean} props.showLockIcon - Mostrar icono de candado
 * @param {string} props.variant - Variante visual: 'default', 'compact', 'card'
 * @param {string} props.className - Clases CSS adicionales
 * @param {boolean} props.multiline - Si el campo es multilínea
 * @param {string} props.helperText - Texto de ayuda
 */
export const ReadOnlyField = ({
  label,
  value,
  icon = null,
  placeholder = 'Sin información',
  showLockIcon = true,
  variant = 'default',
  className = '',
  multiline = false,
  helperText = null
}) => {
  const hasValue = value !== null && value !== undefined && value !== '';

  // Estilos según variante
  const variants = {
    default: {
      container: 'bg-gray-50 border border-gray-200 rounded-lg p-4',
      label: 'text-sm font-medium text-gray-600 mb-1',
      value: 'text-gray-900'
    },
    compact: {
      container: 'bg-gray-50 border border-gray-200 rounded-md px-3 py-2',
      label: 'text-xs font-medium text-gray-500 mb-0.5',
      value: 'text-sm text-gray-900'
    },
    card: {
      container: 'bg-white border border-gray-200 rounded-xl p-4 shadow-sm',
      label: 'text-sm font-medium text-gray-600 mb-2',
      value: 'text-gray-900 font-medium'
    }
  };

  const styles = variants[variant] || variants.default;

  return (
    <div className={`${styles.container} ${className}`}>
      {/* Etiqueta */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          {icon && (
            <span className="text-gray-400">
              {React.cloneElement(icon, { size: 16 })}
            </span>
          )}
          <label className={styles.label}>{label}</label>
        </div>
        
        {showLockIcon && (
          <Lock className="w-3.5 h-3.5 text-gray-400" />
        )}
      </div>
      
      {/* Valor */}
      <div className={`${styles.value} ${multiline ? 'whitespace-pre-wrap' : ''}`}>
        {hasValue ? (
          <span>{value}</span>
        ) : (
          <span className="text-gray-400 italic">{placeholder}</span>
        )}
      </div>
      
      {/* Texto de ayuda */}
      {helperText && (
        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
          <Info className="w-3 h-3" />
          {helperText}
        </p>
      )}
    </div>
  );
};

/**
 * 📋 COMPONENTE READ ONLY FIELD GROUP
 * 
 * Agrupa múltiples campos de solo lectura.
 * 
 * Uso:
 * ```jsx
 * <ReadOnlyFieldGroup title="Información Técnica">
 *   <ReadOnlyField label="Modelo" value={equipment.model} />
 *   <ReadOnlyField label="Serial" value={equipment.serialNumber} />
 * </ReadOnlyFieldGroup>
 * ```
 */
export const ReadOnlyFieldGroup = ({
  title,
  children,
  columns = 1,
  className = ''
}) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4'
  };

  return (
    <div className={`mb-6 ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Eye className="w-5 h-5 text-gray-500" />
          {title}
        </h3>
      )}
      <div className={`grid ${gridCols[columns] || gridCols[1]} gap-4`}>
        {children}
      </div>
    </div>
  );
};

/**
 * ✅ COMPONENTE READ ONLY STATUS
 * 
 * Muestra un campo de estado con indicador visual.
 * 
 * Uso:
 * ```jsx
 * <ReadOnlyStatus
 *   label="Estado de Revisión"
 *   status="completed"
 *   statusLabels={{
 *     completed: 'Completado',
 *     pending: 'Pendiente',
 *     error: 'Con errores'
 *   }}
 * />
 * ```
 */
export const ReadOnlyStatus = ({
  label,
  status,
  statusLabels = EMPTY_OBJ,
  statusColors = EMPTY_OBJ,
  showLockIcon = true,
  className = ''
}) => {
  const defaultColors = {
    completed: 'bg-green-100 text-green-800 border-green-200',
    success: 'bg-green-100 text-green-800 border-green-200',
    pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    error: 'bg-red-100 text-red-800 border-red-200',
    failed: 'bg-red-100 text-red-800 border-red-200',
    default: 'bg-gray-100 text-gray-800 border-gray-200'
  };

  const StatusIcon = {
    completed: CheckCircle,
    success: CheckCircle,
    pending: AlertCircle,
    warning: AlertCircle,
    error: XCircle,
    failed: XCircle
  };

  const colors = { ...defaultColors, ...statusColors };
  const colorClass = colors[status] || colors.default;
  const Icon = StatusIcon[status] || Info;
  const displayLabel = statusLabels[status] || status;

  return (
    <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
      {/* Etiqueta */}
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-gray-600">{label}</label>
        {showLockIcon && <Lock className="w-3.5 h-3.5 text-gray-400" />}
      </div>
      
      {/* Estado */}
      <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${colorClass}`}>
        <Icon className="w-4 h-4" />
        <span className="text-sm font-medium">{displayLabel}</span>
      </div>
    </div>
  );
};

/**
 * 📅 COMPONENTE READ ONLY DATE
 * 
 * Muestra un campo de fecha formateado.
 */
export const ReadOnlyDate = ({
  label,
  value,
  format = 'long',
  showLockIcon = true,
  className = ''
}) => {
  const formatDate = (dateValue) => {
    if (!dateValue) return null;
    
    try {
      const date = new Date(dateValue);
      
      if (format === 'short') {
        return date.toLocaleDateString('es-MX');
      } else if (format === 'long') {
        return date.toLocaleDateString('es-MX', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      } else if (format === 'datetime') {
        return date.toLocaleString('es-MX', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      }
      
      return date.toLocaleDateString('es-MX');
    } catch {
      return dateValue;
    }
  };

  return (
    <ReadOnlyField
      label={label}
      value={formatDate(value)}
      icon={<Calendar />}
      showLockIcon={showLockIcon}
      className={className}
      placeholder="Sin fecha"
    />
  );
};

/**
 * 👤 COMPONENTE READ ONLY USER
 * 
 * Muestra información de usuario.
 */
export const ReadOnlyUser = ({
  label,
  value,
  email = null,
  showLockIcon = true,
  className = ''
}) => {
  return (
    <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-gray-400" />
          <label className="text-sm font-medium text-gray-600">{label}</label>
        </div>
        {showLockIcon && <Lock className="w-3.5 h-3.5 text-gray-400" />}
      </div>
      
      <div className="text-gray-900">{value || 'No asignado'}</div>
      {email && (
        <div className="text-sm text-gray-500">{email}</div>
      )}
    </div>
  );
};

/**
 * 🏷️ COMPONENTE READ ONLY TAGS
 * 
 * Muestra un array de valores como tags.
 */
export const ReadOnlyTags = ({
  label,
  values = EMPTY_ARRAY,
  emptyMessage = 'Sin etiquetas',
  showLockIcon = true,
  className = ''
}) => {
  return (
    <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-gray-400" />
          <label className="text-sm font-medium text-gray-600">{label}</label>
        </div>
        {showLockIcon && <Lock className="w-3.5 h-3.5 text-gray-400" />}
      </div>
      
      {values.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {values.map((value, index) => (
            <span
              key={value || index}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm bg-blue-100 text-blue-800 border border-blue-200"
            >
              {value}
            </span>
          ))}
        </div>
      ) : (
        <span className="text-gray-400 italic">{emptyMessage}</span>
      )}
    </div>
  );
};

/**
 * 📍 COMPONENTE READ ONLY LOCATION
 * 
 * Muestra información de ubicación.
 */
export const ReadOnlyLocation = ({
  label = 'Ubicación',
  value,
  showLockIcon = true,
  className = ''
}) => {
  return (
    <ReadOnlyField
      label={label}
      value={value}
      icon={<MapPin />}
      showLockIcon={showLockIcon}
      className={className}
      placeholder="Sin ubicación"
    />
  );
};

/**
 * 📝 COMPONENTE READ ONLY TEXT AREA
 * 
 * Muestra texto largo en formato multilínea.
 */
export const ReadOnlyTextArea = ({
  label,
  value,
  rows = 4,
  showLockIcon = true,
  className = ''
}) => {
  return (
    <div className={`bg-gray-50 border border-gray-200 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-medium text-gray-600">{label}</label>
        {showLockIcon && <Lock className="w-3.5 h-3.5 text-gray-400" />}
      </div>
      
      <div 
        className="text-gray-900 whitespace-pre-wrap bg-white border border-gray-200 rounded-md p-3"
        style={{ minHeight: `${rows * 1.5}rem` }}
      >
        {value || <span className="text-gray-400 italic">Sin información</span>}
      </div>
    </div>
  );
};

export default ReadOnlyField;
