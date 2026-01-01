import React from "react";
import {
  Save,
  X,
  CheckCircle,
  Loader,
} from "lucide-react";

/**
 * PlantForm - Formulario para crear/editar plantas
 * 
 * @param {Object} props
 * @param {Object} props.formData - Datos del formulario de planta
 * @param {Function} props.onChange - Callback al cambiar un campo (field, value)
 * @param {Function} props.onSave - Callback para guardar la planta
 * @param {Function} props.onCancel - Callback para cancelar
 * @param {boolean} props.isLoading - Estado de carga
 * @param {boolean} props.showSuccessMessage - Mostrar mensaje de éxito
 * @param {string} props.successMessage - Texto del mensaje de éxito
 */
export const PlantForm = ({
  formData = {
    name: "",
    location: "",
    address: "",
    responsiblePerson: "",
    phoneNumber: "",
  },
  onChange,
  onSave,
  onCancel,
  isLoading = false,
  showSuccessMessage = false,
  successMessage = "",
}) => {
  return (
    <div className="p-4 pb-24 bg-gray-50 min-h-screen">
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <h2 className="text-lg font-bold text-gray-800 mb-4">
          Nueva Planta Industrial
        </h2>

        <div className="space-y-4">
          {/* Nombre de la planta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre de la Planta <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => onChange("name", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ej: Planta Norte"
              disabled={isLoading}
            />
          </div>

          {/* Ciudad y Estado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ciudad y Estado <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.location}
              onChange={(e) => onChange("location", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Ej: Monterrey, NL"
              disabled={isLoading}
            />
          </div>

          {/* Dirección Completa */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Dirección Completa
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => onChange("address", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              rows="2"
              placeholder="Calle, número, colonia, código postal"
              disabled={isLoading}
            />
          </div>

          {/* Responsable de Planta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Responsable de Planta
            </label>
            <input
              type="text"
              value={formData.responsiblePerson}
              onChange={(e) => onChange("responsiblePerson", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Nombre del responsable"
              disabled={isLoading}
            />
          </div>

          {/* Teléfono de Contacto */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teléfono de Contacto
            </label>
            <input
              type="tel"
              value={formData.phoneNumber}
              onChange={(e) => onChange("phoneNumber", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="(999) 999-9999"
              disabled={isLoading}
            />
          </div>
        </div>
      </div>

      {/* Mensaje de éxito */}
      {showSuccessMessage && (
        <div className="mb-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {/* Botones de acción */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={onSave}
          disabled={isLoading}
          className="flex-1 bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
        >
          {isLoading ? (
            <Loader className="w-5 h-5 animate-spin" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          {isLoading ? "Guardando..." : "Guardar Planta"}
        </button>
        <button
          onClick={onCancel}
          disabled={isLoading}
          className="px-6 bg-gray-500 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors shadow-md disabled:opacity-50"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Nota informativa */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
        <span className="font-medium">ℹ️ Información:</span> Los campos marcados
        con <span className="text-red-500">*</span> son obligatorios
      </div>
    </div>
  );
};

export default PlantForm;