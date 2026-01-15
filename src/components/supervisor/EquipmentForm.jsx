import React from "react";
import {
  Save,
  X,
  CheckCircle,
  AlertCircle,
  Loader,
} from "lucide-react";
import ImageUploader from "../shared/ImageUploader";
import PDFUploader from "../shared/PDFUploader";
import { DeleteEquipmentButton } from "../shared/DeletionButtons";

/**
 * EquipmentForm - Formulario completo para crear/editar equipos
 * 
 * @param {Object} props
 * @param {Object} props.formData - Datos del formulario de equipo
 * @param {Function} props.onChange - Callback al cambiar un campo
 * @param {Function} props.onSave - Callback para guardar el equipo
 * @param {Function} props.onCancel - Callback para cancelar
 * @param {Object} props.capturedImages - Imágenes capturadas { equipment: [], plate: [] }
 * @param {Object} props.capturedPDFs - PDFs capturados { factura: [], pedimento: [] }
 * @param {Function} props.onImageChange - Callback al cambiar imágenes (category, images)
 * @param {Function} props.onPDFChange - Callback al cambiar PDFs (category, pdfs)
 * @param {Object|null} props.selectedEquipment - Equipo seleccionado (null si es nuevo)
 * @param {Object} props.selectedPlant - Planta seleccionada
 * @param {boolean} props.isLoading - Estado de carga
 * @param {boolean} props.isOffline - Estado de conexión
 * @param {boolean} props.showSuccessMessage - Mostrar mensaje de éxito
 * @param {string} props.successMessage - Texto del mensaje de éxito
 * @param {Function} props.onEquipmentDeleted - Callback después de eliminar equipo
 */
export const EquipmentForm = ({
  formData = {
    equipmentName: "",
    locationInPlant: "",
    serialNumber: "",
    model: "",
    manufacturer: "",
    countryOfOrigin: "",
    plateStatus: "OK",
    plateNotes: "",
    origin: "NACIONAL",
    actionsDescription: "",
    observations: "",
    invoiceNumber: "",
    customsNumber: "",
  },
  onChange,
  onSave,
  onCancel,
  capturedImages = { equipment: [], plate: [] },
  capturedPDFs = { factura: [], pedimento: [] },
  onImageChange,
  onPDFChange,
  selectedEquipment = null,
  selectedPlant = null,
  isLoading = false,
  isOffline = false,
  showSuccessMessage = false,
  successMessage = "",
  onEquipmentDeleted,
}) => {
  // Helper para actualizar formData
  const handleFieldChange = (field, value) => {
    onChange({ ...formData, [field]: value });
  };

  return (
    <div className="p-4 pb-24 bg-gray-50 min-h-screen">
      {/* Sección: Datos Básicos */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <h2 className="text-lg font-bold text-gray-800 mb-4">
          {selectedEquipment ? "✏️ Editar Equipo" : "➕ Nuevo Equipo"}
        </h2>

        <div className="space-y-4">
          {/* Nombre del Equipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Equipo <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.equipmentName}
              onChange={(e) => handleFieldChange("equipmentName", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Compresor Atlas Copco GA55"
              disabled={isLoading}
            />
          </div>

          {/* Localización en Planta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Localización en Planta <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.locationInPlant}
              onChange={(e) => handleFieldChange("locationInPlant", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Área de Producción A"
              disabled={isLoading}
            />
          </div>

          {/* Imágenes del Equipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Imágenes del Equipo
            </label>
            <ImageUploader
              category="equipment"
              images={capturedImages.equipment}
              onImagesChange={(imgs) => onImageChange("equipment", imgs)}
              equipmentId={selectedEquipment?.id}
              plantId={selectedPlant?.id}
              isOnline={!isOffline}
              disabled={isLoading}
            />
          </div>

          {/* Imágenes de la Placa */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Imágenes de la Placa
            </label>
            <ImageUploader
              category="plate"
              images={capturedImages.plate}
              onImagesChange={(imgs) => onImageChange("plate", imgs)}
              equipmentId={selectedEquipment?.id}
              plantId={selectedPlant?.id}
              isOnline={!isOffline}
              disabled={isLoading}
            />
          </div>
        </div>
      </div>

      {/* Sección: Datos Técnicos */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <h3 className="text-md font-bold text-gray-800 mb-4">Datos Técnicos</h3>

        <div className="space-y-4">
          {/* Número de Serie */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número de Serie <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.serialNumber}
              onChange={(e) => handleFieldChange("serialNumber", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: AC-2023-001"
              disabled={isLoading}
            />
          </div>

          {/* Modelo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Modelo
            </label>
            <input
              type="text"
              value={formData.model}
              onChange={(e) => handleFieldChange("model", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: GA55"
              disabled={isLoading}
            />
          </div>

          {/* Fabricante */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fabricante
            </label>
            <input
              type="text"
              value={formData.manufacturer}
              onChange={(e) => handleFieldChange("manufacturer", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Atlas Copco"
              disabled={isLoading}
            />
          </div>

          {/* País de Origen */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              País de Origen
            </label>
            <input
              type="text"
              value={formData.countryOfOrigin}
              onChange={(e) => handleFieldChange("countryOfOrigin", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: Alemania"
              disabled={isLoading}
            />
          </div>

          {/* Status de la Placa */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status de la Placa
            </label>
            <div className="flex gap-2 mb-2">
              <button
                onClick={() => handleFieldChange("plateStatus", "OK")}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  formData.plateStatus === "OK"
                    ? "bg-green-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
                disabled={isLoading}
              >
                OK
              </button>
              <button
                onClick={() => handleFieldChange("plateStatus", "OBSERVACIONES")}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  formData.plateStatus === "OBSERVACIONES"
                    ? "bg-orange-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
                disabled={isLoading}
              >
                Observaciones
              </button>
            </div>
            {formData.plateStatus === "OBSERVACIONES" && (
              <textarea
                value={formData.plateNotes}
                onChange={(e) => handleFieldChange("plateNotes", e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                rows="2"
                placeholder="Describe las observaciones de la placa..."
                disabled={isLoading}
              />
            )}
          </div>

          {/* Origen del Equipo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Origen del Equipo
            </label>
            <div className="flex gap-2">
              <button
                onClick={() => handleFieldChange("origin", "NACIONAL")}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  formData.origin === "NACIONAL"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
                disabled={isLoading}
              >
                Nacional
              </button>
              <button
                onClick={() => handleFieldChange("origin", "EXTRANJERO")}
                className={`flex-1 py-2 px-4 rounded-lg font-medium transition-colors ${
                  formData.origin === "EXTRANJERO"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
                disabled={isLoading}
              >
                Extranjero
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Sección: Documentación */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <h3 className="text-md font-bold text-gray-800 mb-4">Documentación</h3>

        <div className="space-y-4">
          {/* Número de Factura */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número de Factura
            </label>
            <input
              type="text"
              value={formData.invoiceNumber}
              onChange={(e) => handleFieldChange("invoiceNumber", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: FAC-2023-001"
              disabled={isLoading}
            />
          </div>

          {/* Número de Pedimento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número de Pedimento
            </label>
            <input
              type="text"
              value={formData.customsNumber}
              onChange={(e) => handleFieldChange("customsNumber", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Ej: PED-2023-001"
              disabled={isLoading}
            />
          </div>

          {/* Factura de Compra */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📄 Factura de Compra (PDF)
            </label>
            <PDFUploader
              category="factura"
              label="Facturas"
              pdfs={capturedPDFs.factura}
              onPDFsChange={(pdfs) => onPDFChange("factura", pdfs)}
              equipmentId={selectedEquipment?.id}
              isOnline={!isOffline}
              maxPDFs={5}
              maxSizeMB={20}
              disabled={isLoading}
            />
          </div>

          {/* Pedimento Aduanal */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📄 Pedimento Aduanal (PDF)
            </label>
            <PDFUploader
              category="pedimento"
              label="Pedimentos"
              pdfs={capturedPDFs.pedimento}
              onPDFsChange={(pdfs) => onPDFChange("pedimento", pdfs)}
              equipmentId={selectedEquipment?.id}
              isOnline={!isOffline}
              maxPDFs={5}
              maxSizeMB={20}
              disabled={isLoading}
            />
          </div>

          {/* Descripción de Acciones a Realizar */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descripción de Acciones a Realizar
            </label>
            <textarea
              value={formData.actionsDescription}
              onChange={(e) => handleFieldChange("actionsDescription", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows="3"
              placeholder="Describe las acciones necesarias (mantenimiento, reparación, etc.)"
              disabled={isLoading}
            />
          </div>

          {/* Observaciones Generales */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observaciones Generales
            </label>
            <textarea
              value={formData.observations}
              onChange={(e) => handleFieldChange("observations", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              rows="4"
              placeholder="Observaciones detalladas sobre el equipo..."
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

      {/* Botón Eliminar Equipo (solo si existe equipo seleccionado) */}
      {selectedEquipment && selectedPlant && (
        <div className="mb-4">
          <DeleteEquipmentButton
            equipmentId={selectedEquipment.id}
            plantId={selectedPlant.id}
            equipmentName={selectedEquipment.name}
            isOnline={!isOffline}
            onSuccess={(result) => {
              // console.log("✅ Equipo eliminado:", result);
              if (onEquipmentDeleted) onEquipmentDeleted();
            }}
            onError={(error) => console.error("❌ Error:", error)}
            className="w-full"
          />
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
          {isLoading
            ? "Guardando..."
            : selectedEquipment
            ? "Actualizar Equipo"
            : "Guardar Equipo"}
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
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800 flex items-center gap-2">
        <AlertCircle className="w-4 h-4" />
        <span>💾 Los datos se guardan automáticamente en Firebase</span>
      </div>
    </div>
  );
};

export default EquipmentForm;