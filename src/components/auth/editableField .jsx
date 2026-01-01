/**
 * EditableField.jsx - Campo Editable con Validación
 * Versión: 1.0
 * 
 * Componente para campos que pueden ser editados.
 * Incluye validación, estados de guardado y feedback visual.
 * 
 * FASE 3: Control de Acceso - Tarea 3.3
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Check, X, Edit2, Save, Loader2, AlertCircle, CheckCircle } from 'lucide-react';

/**
 * ✏️ COMPONENTE EDITABLE FIELD
 * 
 * Campo editable con modo inline o formulario.
 * 
 * Uso básico:
 * ```jsx
 * <EditableField
 *   label="Observaciones"
 *   value={equipment.observations}
 *   onSave={(newValue) => handleSave('observations', newValue)}
 * />
 * ```
 * 
 * Con validación:
 * ```jsx
 * <EditableField
 *   label="Email"
 *   value={user.email}
 *   onSave={handleSaveEmail}
 *   validate={(value) => value.includes('@') ? null : 'Email inválido'}
 *   required
 * />
 * ```
 * 
 * @param {Object} props
 * @param {string} props.label - Etiqueta del campo
 * @param {string} props.name - Nombre del campo (para formularios)
 * @param {string} props.value - Valor actual
 * @param {Function} props.onSave - Callback al guardar (async permitido)
 * @param {Function} props.onChange - Callback al cambiar (opcional)
 * @param {Function} props.validate - Función de validación
 * @param {boolean} props.required - Si el campo es requerido
 * @param {string} props.type - Tipo de input: 'text', 'textarea', 'number', 'email'
 * @param {string} props.placeholder - Placeholder del input
 * @param {number} props.maxLength - Longitud máxima
 * @param {number} props.rows - Filas para textarea
 * @param {boolean} props.disabled - Si el campo está deshabilitado
 * @param {string} props.helperText - Texto de ayuda
 * @param {boolean} props.inlineEdit - Modo edición inline
 * @param {boolean} props.autoSave - Guardar automáticamente al perder foco
 * @param {number} props.autoSaveDelay - Delay para auto-save (ms)
 * @param {string} props.className - Clases CSS adicionales
 */
export const EditableField = ({
  label,
  name,
  value: initialValue = '',
  onSave,
  onChange,
  validate,
  required = false,
  type = 'text',
  placeholder = '',
  maxLength,
  rows = 4,
  disabled = false,
  helperText,
  inlineEdit = false,
  autoSave = false,
  autoSaveDelay = 1000,
  className = ''
}) => {
  // ============================================
  // ESTADO
  // ============================================
  
  const [value, setValue] = useState(initialValue);
  const [isEditing, setIsEditing] = useState(!inlineEdit);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  // Sincronizar valor inicial
  useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  // Limpiar mensaje de éxito después de un tiempo
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // ============================================
  // FUNCIONES
  // ============================================
  
  const validateValue = useCallback((val) => {
    // Validación requerido
    if (required && (!val || val.trim() === '')) {
      return 'Este campo es requerido';
    }

    // Validación personalizada
    if (validate) {
      return validate(val);
    }

    return null;
  }, [required, validate]);

  const handleChange = useCallback((e) => {
    const newValue = e.target.value;
    setValue(newValue);
    setIsDirty(newValue !== initialValue);
    setError(null);
    setSuccess(false);

    if (onChange) {
      onChange(newValue, name);
    }
  }, [initialValue, name, onChange]);

  const handleSave = useCallback(async () => {
    // Validar
    const validationError = validateValue(value);
    if (validationError) {
      setError(validationError);
      return false;
    }

    // Si no cambió, no guardar
    if (value === initialValue) {
      if (inlineEdit) setIsEditing(false);
      return true;
    }

    // Guardar
    setIsSaving(true);
    setError(null);

    try {
      if (onSave) {
        await onSave(value, name);
      }
      setSuccess(true);
      setIsDirty(false);
      if (inlineEdit) setIsEditing(false);
      return true;
    } catch (err) {
      setError(err.message || 'Error al guardar');
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [value, initialValue, name, onSave, validateValue, inlineEdit]);

  const handleCancel = useCallback(() => {
    setValue(initialValue);
    setError(null);
    setIsDirty(false);
    if (inlineEdit) setIsEditing(false);
  }, [initialValue, inlineEdit]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && type !== 'textarea') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  }, [handleSave, handleCancel, type]);

  const handleBlur = useCallback(() => {
    if (autoSave && isDirty) {
      handleSave();
    }
  }, [autoSave, isDirty, handleSave]);

  // ============================================
  // RENDER MODO INLINE (Solo lectura hasta click)
  // ============================================
  
  if (inlineEdit && !isEditing) {
    return (
      <div className={`group ${className}`}>
        <label className="text-sm font-medium text-gray-600 mb-1 block">{label}</label>
        <div 
          className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-100 hover:border-blue-300 transition-all"
          onClick={() => !disabled && setIsEditing(true)}
        >
          <span className={value ? 'text-gray-900' : 'text-gray-400 italic'}>
            {value || placeholder || 'Click para editar'}
          </span>
          {!disabled && (
            <Edit2 className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
          )}
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER MODO EDICIÓN
  // ============================================
  
  const inputClasses = `
    w-full px-3 py-2 
    border rounded-lg 
    focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
    transition-all
    ${error ? 'border-red-500 bg-red-50' : 'border-gray-300'}
    ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
  `;

  return (
    <div className={`${className}`}>
      {/* Label */}
      <div className="flex items-center justify-between mb-1">
        <label className="text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        
        {/* Indicador de estado */}
        <div className="flex items-center gap-2">
          {isSaving && (
            <span className="flex items-center text-blue-600 text-sm">
              <Loader2 className="w-4 h-4 animate-spin mr-1" />
              Guardando...
            </span>
          )}
          {success && (
            <span className="flex items-center text-green-600 text-sm">
              <CheckCircle className="w-4 h-4 mr-1" />
              Guardado
            </span>
          )}
          {isDirty && !isSaving && !success && (
            <span className="text-orange-500 text-sm">Sin guardar</span>
          )}
        </div>
      </div>

      {/* Input */}
      <div className="relative">
        {type === 'textarea' ? (
          <textarea
            name={name}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            placeholder={placeholder}
            maxLength={maxLength}
            rows={rows}
            disabled={disabled || isSaving}
            className={inputClasses}
          />
        ) : (
          <input
            type={type}
            name={name}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onBlur={handleBlur}
            placeholder={placeholder}
            maxLength={maxLength}
            disabled={disabled || isSaving}
            className={inputClasses}
          />
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
          <AlertCircle className="w-4 h-4" />
          {error}
        </p>
      )}

      {/* Helper text / Character count */}
      <div className="flex justify-between mt-1">
        {helperText && (
          <p className="text-gray-500 text-sm">{helperText}</p>
        )}
        {maxLength && (
          <p className={`text-sm ${value.length > maxLength * 0.9 ? 'text-orange-500' : 'text-gray-400'}`}>
            {value.length}/{maxLength}
          </p>
        )}
      </div>

      {/* Botones para modo inline */}
      {inlineEdit && (
        <div className="flex items-center gap-2 mt-2">
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving || !isDirty}
            className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Check className="w-4 h-4" />
            )}
            Guardar
          </button>
          <button
            type="button"
            onClick={handleCancel}
            disabled={isSaving}
            className="flex items-center gap-1 px-3 py-1.5 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 transition-colors text-sm"
          >
            <X className="w-4 h-4" />
            Cancelar
          </button>
        </div>
      )}
    </div>
  );
};

/**
 * 📝 COMPONENTE EDITABLE TEXT AREA
 * 
 * Versión especializada para textos largos.
 */
export const EditableTextArea = (props) => (
  <EditableField {...props} type="textarea" />
);

/**
 * 🔢 COMPONENTE EDITABLE NUMBER
 * 
 * Versión especializada para números.
 */
export const EditableNumber = ({
  min,
  max,
  step = 1,
  ...props
}) => {
  const validateNumber = (value) => {
    const num = Number(value);
    if (isNaN(num)) return 'Debe ser un número';
    if (min !== undefined && num < min) return `Mínimo: ${min}`;
    if (max !== undefined && num > max) return `Máximo: ${max}`;
    return null;
  };

  return (
    <EditableField 
      {...props} 
      type="number"
      validate={props.validate || validateNumber}
    />
  );
};

/**
 * 📧 COMPONENTE EDITABLE EMAIL
 * 
 * Versión especializada para emails.
 */
export const EditableEmail = (props) => {
  const validateEmail = (value) => {
    if (!value) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return 'Email inválido';
    return null;
  };

  return (
    <EditableField 
      {...props} 
      type="email"
      validate={props.validate || validateEmail}
    />
  );
};

/**
 * 💾 COMPONENTE EDITABLE FIELD WITH SAVE BUTTON
 * 
 * Campo editable con botón de guardar explícito.
 */
export const EditableFieldWithButton = ({
  onSave,
  saveLabel = 'Guardar',
  ...props
}) => {
  const [localValue, setLocalValue] = useState(props.value || '');
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setLocalValue(props.value || '');
  }, [props.value]);

  const handleChange = (newValue) => {
    setLocalValue(newValue);
    setIsDirty(newValue !== props.value);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onSave(localValue, props.name);
      setIsDirty(false);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-2">
      <EditableField
        {...props}
        value={localValue}
        onChange={handleChange}
        onSave={() => {}} // Deshabilitamos el save interno
      />
      <button
        type="button"
        onClick={handleSave}
        disabled={!isDirty || isSaving}
        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isSaving ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Guardando...
          </>
        ) : (
          <>
            <Save className="w-4 h-4" />
            {saveLabel}
          </>
        )}
      </button>
    </div>
  );
};

export default EditableField;