/**
 * FieldPermission.jsx - Campo con Control de Permisos
 * Versión: 1.0
 * 
 * Componente que renderiza un campo como editable o readonly
 * basado en los permisos del usuario actual.
 * 
 * FASE 3: Control de Acceso - Tarea 3.3
 */

import React, { useMemo } from 'react';
import { useAuthWithRole } from '../../hooks/useAuthWithRole';
import { ReadOnlyField, ReadOnlyTextArea, ReadOnlyStatus, ReadOnlyDate } from './readOnlyField';
import { EditableField, EditableTextArea, EditableNumber, EditableEmail } from './editableField';
import { Edit2, Lock } from 'lucide-react';

/**
 * 🔐 COMPONENTE FIELD PERMISSION
 * 
 * Renderiza automáticamente un campo como editable o readonly
 * basado en si el usuario puede editar ese campo específico.
 * 
 * Uso:
 * ```jsx
 * <FieldPermission
 *   field="observations"
 *   label="Observaciones"
 *   value={equipment.observations}
 *   onSave={(value) => handleSave('observations', value)}
 * />
 * ```
 * 
 * @param {Object} props
 * @param {string} props.field - Nombre del campo para verificar permisos
 * @param {string} props.label - Etiqueta del campo
 * @param {string} props.value - Valor actual
 * @param {Function} props.onSave - Callback al guardar (solo si es editable)
 * @param {string} props.type - Tipo de campo: 'text', 'textarea', 'number', 'email', 'date', 'status'
 * @param {Object} props.editableProps - Props adicionales para el campo editable
 * @param {Object} props.readonlyProps - Props adicionales para el campo readonly
 * @param {React.ReactNode} props.icon - Icono para el campo
 * @param {boolean} props.showPermissionIndicator - Mostrar indicador de permiso
 * @param {string} props.className - Clases CSS adicionales
 */
export const FieldPermission = ({
  field,
  label,
  value,
  onSave,
  onChange,
  type = 'text',
  editableProps = {},
  readonlyProps = {},
  icon = null,
  showPermissionIndicator = true,
  className = ''
}) => {
  const { canEditFieldSync, isFullyLoaded } = useAuthWithRole();

  // Verificar permiso
  const canEdit = useMemo(() => {
    if (!isFullyLoaded) return false;
    return canEditFieldSync(field);
  }, [field, canEditFieldSync, isFullyLoaded]);

  // ============================================
  // ESTADO DE CARGA
  // ============================================
  
  if (!isFullyLoaded) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
        <div className="h-10 bg-gray-200 rounded w-full"></div>
      </div>
    );
  }

  // ============================================
  // RENDER CAMPO EDITABLE
  // ============================================
  
  if (canEdit) {
    const EditComponent = getEditComponent(type);
    
    return (
      <div className={className}>
        {showPermissionIndicator && (
          <div className="flex items-center gap-1 text-xs text-green-600 mb-1">
            <Edit2 className="w-3 h-3" />
            <span>Editable</span>
          </div>
        )}
        <EditComponent
          label={label}
          name={field}
          value={value}
          onSave={onSave}
          onChange={onChange}
          {...editableProps}
        />
      </div>
    );
  }

  // ============================================
  // RENDER CAMPO READONLY
  // ============================================
  
  const ReadComponent = getReadComponent(type);
  
  return (
    <div className={className}>
      {showPermissionIndicator && (
        <div className="flex items-center gap-1 text-xs text-gray-500 mb-1">
          <Lock className="w-3 h-3" />
          <span>Solo lectura</span>
        </div>
      )}
      <ReadComponent
        label={label}
        value={value}
        icon={icon}
        {...readonlyProps}
      />
    </div>
  );
};

/**
 * Obtener componente de edición según tipo
 */
const getEditComponent = (type) => {
  switch (type) {
    case 'textarea':
      return EditableTextArea;
    case 'number':
      return EditableNumber;
    case 'email':
      return EditableEmail;
    default:
      return EditableField;
  }
};

/**
 * Obtener componente de lectura según tipo
 */
const getReadComponent = (type) => {
  switch (type) {
    case 'textarea':
      return ReadOnlyTextArea;
    case 'date':
      return ReadOnlyDate;
    case 'status':
      return ReadOnlyStatus;
    default:
      return ReadOnlyField;
  }
};

/**
 * 📝 COMPONENTE FIELD PERMISSION GROUP
 * 
 * Agrupa múltiples campos con permisos.
 * 
 * Uso:
 * ```jsx
 * <FieldPermissionGroup
 *   title="Campos de Auditoría"
 *   fields={[
 *     { field: 'actionsDescription', label: 'Acciones', value: data.actionsDescription },
 *     { field: 'observations', label: 'Observaciones', value: data.observations }
 *   ]}
 *   onSave={handleSaveField}
 * />
 * ```
 */
export const FieldPermissionGroup = ({
  title,
  fields = [],
  onSave,
  columns = 1,
  showPermissionIndicator = false,
  className = ''
}) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
          {title}
        </h3>
      )}
      <div className={`grid ${gridCols[columns] || gridCols[1]} gap-4`}>
        {fields.map((fieldConfig) => (
          <FieldPermission
            key={fieldConfig.field}
            {...fieldConfig}
            onSave={(value) => onSave(fieldConfig.field, value)}
            showPermissionIndicator={showPermissionIndicator}
          />
        ))}
      </div>
    </div>
  );
};

/**
 * 🔄 COMPONENTE SMART FIELD
 * 
 * Campo inteligente que detecta automáticamente el tipo
 * y aplica permisos basados en el nombre del campo.
 * 
 * Uso:
 * ```jsx
 * <SmartField
 *   field="observations"
 *   value={data.observations}
 *   onSave={handleSave}
 * />
 * ```
 */
export const SmartField = ({
  field,
  value,
  onSave,
  label: customLabel,
  ...props
}) => {
  // Auto-detectar tipo basado en nombre del campo
  const fieldType = useMemo(() => {
    const lowerField = field.toLowerCase();
    
    if (lowerField.includes('email')) return 'email';
    if (lowerField.includes('description') || lowerField.includes('observations') || lowerField.includes('notes')) return 'textarea';
    if (lowerField.includes('date') || lowerField.includes('created') || lowerField.includes('updated')) return 'date';
    if (lowerField.includes('count') || lowerField.includes('number') || lowerField.includes('quantity')) return 'number';
    if (lowerField.includes('status')) return 'status';
    
    return 'text';
  }, [field]);

  // Auto-generar label basado en nombre del campo
  const label = useMemo(() => {
    if (customLabel) return customLabel;
    
    // Convertir camelCase a texto legible
    return field
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim();
  }, [field, customLabel]);

  return (
    <FieldPermission
      field={field}
      label={label}
      value={value}
      onSave={onSave}
      type={fieldType}
      {...props}
    />
  );
};

/**
 * 📋 COMPONENTE EQUIPMENT AUDIT FIELDS
 * 
 * Campos específicos para auditoría de equipos.
 * Renderiza los campos que el auditor puede editar.
 */
export const EquipmentAuditFields = ({
  equipment,
  onSave,
  className = ''
}) => {
  const auditFields = [
    {
      field: 'actionsDescription',
      label: 'Descripción de Acciones a Realizar',
      value: equipment?.actionsDescription || '',
      type: 'textarea',
      editableProps: {
        placeholder: 'Describe las acciones necesarias para este equipo...',
        rows: 4,
        maxLength: 1000
      }
    },
    {
      field: 'observations',
      label: 'Observaciones Generales',
      value: equipment?.observations || '',
      type: 'textarea',
      editableProps: {
        placeholder: 'Ingresa observaciones adicionales...',
        rows: 4,
        maxLength: 1000
      }
    }
  ];

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="flex items-center gap-2 text-lg font-semibold text-gray-800">
        <Edit2 className="w-5 h-5 text-blue-600" />
        <span>Campos de Auditoría</span>
      </div>
      
      {auditFields.map((fieldConfig) => (
        <FieldPermission
          key={fieldConfig.field}
          {...fieldConfig}
          onSave={(value) => onSave(fieldConfig.field, value)}
          showPermissionIndicator={true}
        />
      ))}
    </div>
  );
};

/**
 * 📊 COMPONENTE EQUIPMENT INFO FIELDS
 * 
 * Campos de información del equipo (generalmente readonly para auditores).
 */
export const EquipmentInfoFields = ({
  equipment,
  onSave,
  columns = 2,
  className = ''
}) => {
  const infoFields = [
    { field: 'equipmentName', label: 'Nombre del Equipo', value: equipment?.equipmentName },
    { field: 'locationInPlant', label: 'Ubicación en Planta', value: equipment?.locationInPlant },
    { field: 'serialNumber', label: 'Número de Serie', value: equipment?.serialNumber },
    { field: 'model', label: 'Modelo', value: equipment?.model },
    { field: 'manufacturer', label: 'Fabricante', value: equipment?.manufacturer },
    { field: 'countryOfOrigin', label: 'País de Origen', value: equipment?.countryOfOrigin },
    { field: 'plateStatus', label: 'Estado de Placa', value: equipment?.plateStatus },
    { field: 'origin', label: 'Origen', value: equipment?.origin }
  ];

  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-800 border-b pb-2">
        Información del Equipo
      </h3>
      <div className={`grid ${gridCols[columns]} gap-4`}>
        {infoFields.map((fieldConfig) => (
          <FieldPermission
            key={fieldConfig.field}
            {...fieldConfig}
            onSave={(value) => onSave(fieldConfig.field, value)}
            showPermissionIndicator={false}
          />
        ))}
      </div>
    </div>
  );
};

/**
 * 🎯 HOOK PARA DETECTAR CAMPOS EDITABLES
 * 
 * Uso:
 * ```jsx
 * const { editableFields, isEditable } = useEditableFields();
 * 
 * if (isEditable('observations')) {
 *   // mostrar campo editable
 * }
 * ```
 */
export const useEditableFields = () => {
  const { editableFields, canEditFieldSync, isFullyLoaded } = useAuthWithRole();

  return {
    editableFields,
    isEditable: canEditFieldSync,
    isLoading: !isFullyLoaded
  };
};

export default FieldPermission;