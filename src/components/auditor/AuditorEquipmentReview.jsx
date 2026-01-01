/**
 * AuditorEquipmentReview.jsx - Pantalla de Revision de Equipo
 * Permite al auditor revisar equipos y editar campos especificos
 *
 * LAYOUT ACTUALIZADO:
 * - Fila 1: [Slider Imagenes] [Datos del Equipo] [Visor PDFs]
 * - Fila 2: [Acciones Requeridas] [Observaciones]
 * - Fila 3: [Guardar Cambios] [Marcar como Revisado]
 * - Fila 4: [Navegacion: Primero|Anterior|Siguiente|Ultimo]
 * - Fila 5: [Boton Volver a Lista de Equipos]
 */

import React, { useState, useEffect } from 'react';
import {
  Save,
  CheckCircle,
  Clock,
  Package,
  Hash,
  Globe,
  AlertCircle,
  Loader,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight
} from 'lucide-react';
import ImageSlider from '../shared/ImageSlider';
import PDFDocumentViewer from '../shared/PDFDocumentViewer';
import ImageViewer from '../shared/ImageViewer';

/**
 * Componente de Revision de Equipo para Auditor
 *
 * @param {Object} props
 * @param {Object} props.equipment - Datos del equipo
 * @param {Object} props.plant - Datos de la planta
 * @param {Function} props.onSave - Callback al guardar cambios
 * @param {Function} props.onMarkReviewed - Callback al marcar como revisado
 * @param {boolean} props.saving - Estado de guardado
 * @param {number} props.currentIndex - Indice actual del equipo
 * @param {number} props.totalEquipment - Total de equipos
 * @param {Function} props.onPrevious - Callback para equipo anterior
 * @param {Function} props.onNext - Callback para equipo siguiente
 * @param {Function} props.onFirst - Callback para primer equipo
 * @param {Function} props.onLast - Callback para ultimo equipo
 * @param {Function} props.onBackToList - Callback para volver a la lista
 */
const AuditorEquipmentReview = ({
  equipment = null,
  plant = null,
  onSave,
  onMarkReviewed,
  saving = false,
  currentIndex = 0,
  totalEquipment = 0,
  onPrevious,
  onNext,
  onFirst,
  onLast,
  onBackToList
}) => {
  // Estados para campos editables
  const [actionsDescription, setActionsDescription] = useState('');
  const [observations, setObservations] = useState('');
  const [hasChanges, setHasChanges] = useState(false);

  // Estados para visor fullscreen de imagenes
  const [imageViewerOpen, setImageViewerOpen] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  // Cargar datos del equipo
  useEffect(() => {
    if (equipment) {
      setActionsDescription(equipment.actionsDescription || '');
      setObservations(equipment.observations || '');
      setHasChanges(false);
    }
  }, [equipment]);

  // Detectar cambios
  useEffect(() => {
    if (!equipment) return;

    const changed =
      actionsDescription !== (equipment.actionsDescription || '') ||
      observations !== (equipment.observations || '');

    setHasChanges(changed);
  }, [actionsDescription, observations, equipment]);

  if (!equipment || !plant) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          No hay equipo seleccionado
        </h3>
        <p className="text-sm text-gray-600">
          Selecciona un equipo para comenzar la revision.
        </p>
      </div>
    );
  }

  const isReviewed = equipment.reviewStatus === 'revisado';
  const equipName = equipment.name || equipment.equipmentName || 'Sin nombre';

  // Navegacion
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === totalEquipment - 1;

  // Manejadores de guardado
  const handleSave = async () => {
    if (!hasChanges) return;

    const updatedData = {
      actionsDescription,
      observations,
      updatedAt: new Date().toISOString()
    };

    await onSave(updatedData);
  };

  const handleMarkReviewed = async () => {
    if (hasChanges) {
      await handleSave();
    }

    const reviewData = {
      reviewStatus: 'revisado',
      reviewDate: new Date().toISOString(),
      actionsDescription,
      observations
    };

    await onMarkReviewed(reviewData);
  };

  // Manejadores de imagenes
  const handleViewFullscreen = (images, startIndex = 0) => {
    setSelectedImages(images);
    setSelectedImageIndex(startIndex);
    setImageViewerOpen(true);
  };

  const handleDownloadImage = async (url, index) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `imagen-${index + 1}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error al descargar imagen:', error);
      alert('Error al descargar la imagen');
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* ============================================ */}
      {/* BARRA DE NAVEGACION COMPACTA */}
      {/* ============================================ */}
      <div className="flex items-center justify-center gap-2 py-1 -mt-1 -mb-1">
        {/* Boton Volver */}
        <button
          onClick={onBackToList}
          className="flex items-center gap-1 py-2 px-3 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 transition-colors"
          title="Volver a la lista de equipos"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver a Equipos
        </button>

        {/* Separador */}
        <div className="h-6 w-px bg-gray-300 mx-1" />

        {/* Botones de navegacion */}
        <button
          onClick={onFirst}
          disabled={isFirst}
          className={`p-2 rounded-lg border transition-all ${
            isFirst
              ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
              : 'bg-white border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400'
          }`}
          title="Primero"
        >
          <ChevronsLeft className="w-4 h-4" />
        </button>

        <button
          onClick={onPrevious}
          disabled={isFirst}
          className={`p-2 rounded-lg border transition-all ${
            isFirst
              ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
              : 'bg-white border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400'
          }`}
          title="Anterior"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <button
          onClick={onNext}
          disabled={isLast}
          className={`p-2 rounded-lg border transition-all ${
            isLast
              ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
              : 'bg-white border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400'
          }`}
          title="Siguiente"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <button
          onClick={onLast}
          disabled={isLast}
          className={`p-2 rounded-lg border transition-all ${
            isLast
              ? 'bg-gray-100 border-gray-300 text-gray-400 cursor-not-allowed'
              : 'bg-white border-blue-300 text-blue-600 hover:bg-blue-50 hover:border-blue-400'
          }`}
          title="Ultimo"
        >
          <ChevronsRight className="w-4 h-4" />
        </button>
      </div>

      {/* ============================================ */}
      {/* SECCION 1: Layout 3 columnas - Imagenes | Datos | PDFs */}
      {/* ============================================ */}
      <div className="flex flex-col xl:flex-row gap-3">
        {/* Columna Izquierda: Slider de Imagenes */}
        <div className="xl:flex-[0.85] min-w-0">
          <ImageSlider
            equipmentImages={equipment.images?.equipment || []}
            plateImages={equipment.images?.plate || []}
            onViewFullscreen={handleViewFullscreen}
            onDownload={handleDownloadImage}
          />
        </div>

        {/* Columna Central: Datos del Equipo - Mayor proporcion */}
        <div className="xl:flex-[1.3] min-w-0">
          <div className="bg-white rounded-lg border border-gray-200 p-4 h-full flex flex-col">
            {/* Header con nombre y estado */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                {isReviewed ? (
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
                ) : (
                  <Clock className="w-5 h-5 text-orange-600 flex-shrink-0" />
                )}
                <h2 className="text-lg font-bold text-gray-800 leading-tight">
                  {equipName}
                </h2>
              </div>
              <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${
                isReviewed
                  ? 'bg-green-100 text-green-800'
                  : 'bg-orange-100 text-orange-800'
              }`}>
                {isReviewed ? 'Revisado' : 'Pendiente'}
              </span>
            </div>

            {/* Lista de datos */}
            <div className="space-y-3">
              <DataField label="Fabricante" value={equipment.manufacturer} icon={Package} />
              <DataField label="Modelo" value={equipment.model} icon={Package} />
              <DataField label="Numero de Serie" value={equipment.serialNumber} icon={Hash} />
              <DataField label="Pais de Origen" value={equipment.countryOfOrigin} icon={Globe} />
              <DataField label="Estado de Placa" value={equipment.plateStatus} />
              <DataField label="Origen" value={equipment.origin} />
            </div>

            {/* Fecha de revision si aplica */}
            {isReviewed && equipment.reviewDate && (
              <div className="mt-4 pt-3 border-t border-gray-200">
                <p className="text-xs text-green-700">
                  Revisado el {new Date(equipment.reviewDate).toLocaleString('es-MX')}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Columna Derecha: Visor de PDFs */}
        <div className="xl:flex-[0.85] min-w-0">
          <PDFDocumentViewer
            facturas={equipment.pdfs?.factura || []}
            pedimentos={equipment.pdfs?.pedimento || []}
          />
        </div>
      </div>

      {/* ============================================ */}
      {/* SECCION 2: Acciones y Observaciones lado a lado */}
      {/* ============================================ */}
      <div className="flex flex-col md:flex-row gap-4">
        {/* Acciones Requeridas */}
        <div className="flex-1 bg-white rounded-lg border border-gray-200 p-4 flex flex-col">
          <label className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-orange-600" />
            Acciones Requeridas
          </label>
          <textarea
            value={actionsDescription}
            onChange={(e) => setActionsDescription(e.target.value)}
            placeholder="Describe las acciones que deben realizarse..."
            rows="5"
            className="flex-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
          />
        </div>

        {/* Observaciones */}
        <div className="flex-1 bg-white rounded-lg border border-gray-200 p-4 flex flex-col">
          <label className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600" />
            Observaciones
          </label>
          <textarea
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
            placeholder="Agrega observaciones sobre el equipo..."
            rows="5"
            className="flex-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
          />
        </div>
      </div>

      {/* ============================================ */}
      {/* SECCION 3: Botones Guardar y Marcar como Revisado */}
      {/* ============================================ */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Guardar Cambios */}
          <button
            onClick={handleSave}
            disabled={!hasChanges || saving}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
              hasChanges && !saving
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {saving ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Guardando...
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Guardar Cambios
              </>
            )}
          </button>

          {/* Marcar como Revisado */}
          <button
            onClick={handleMarkReviewed}
            disabled={saving}
            className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-lg font-medium transition-all ${
              isReviewed
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-orange-600 text-white hover:bg-orange-700'
            }`}
          >
            {saving ? (
              <>
                <Loader className="w-5 h-5 animate-spin" />
                Actualizando...
              </>
            ) : (
              <>
                <CheckCircle className="w-5 h-5" />
                {isReviewed ? 'Actualizar Revision' : 'Marcar como Revisado'}
              </>
            )}
          </button>
        </div>

        {hasChanges && (
          <p className="text-xs text-orange-600 text-center mt-2">
            Tienes cambios sin guardar
          </p>
        )}
      </div>

      {/* Visor fullscreen de imagenes */}
      <ImageViewer
        isOpen={imageViewerOpen}
        onClose={() => setImageViewerOpen(false)}
        images={selectedImages}
        initialIndex={selectedImageIndex}
        title="Imagenes del Equipo"
      />
    </div>
  );
};

/**
 * Componente auxiliar para mostrar campos de datos
 */
const DataField = ({ label, value, icon: Icon }) => (
  <div className="flex items-start gap-2">
    {Icon && <Icon className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />}
    <div className="flex-1 min-w-0">
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm font-medium text-gray-800 truncate">
        {value || <span className="text-gray-400 italic">No especificado</span>}
      </p>
    </div>
  </div>
);

export default AuditorEquipmentReview;
