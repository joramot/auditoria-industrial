/**
 * AuditorEquipmentReview.jsx - Vista de Auditoria de Equipo (NO modal)
 *
 * Diseño basado en el EquipmentDetailModal del Supervisor pero como vista
 * en el area principal, con campos editables para el auditor.
 *
 * LAYOUT:
 * - Header con navegacion y estado
 * - Layout de dos columnas similar al modal de consulta
 * - Columna izquierda: Datos del equipo e imagenes
 * - Columna derecha: Documentos y campos editables
 * - Footer con botones de accion
 *
 * @version 2.0.0
 */

import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Save,
  CheckCircle,
  Clock,
  Package,
  Hash,
  Globe,
  AlertCircle,
  Loader2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Factory,
  MapPinned,
  Cpu,
  FileText,
  ClipboardList,
  MessageSquare,
  AlertTriangle,
  MapPin,
  Eye,
  Camera,
  Image,
} from "lucide-react";
import { getEquipmentImages, getEquipmentPDFs } from "../../services/firebase/firebaseServices";
import PDFViewer from "../shared/PDFViewer";
import ImageViewer from "../shared/ImageViewer";

/**
 * Componente para mostrar un campo de informacion (solo lectura)
 */
const InfoField = ({ icon: Icon, label, value, mono = false }) => (
  <div className="space-y-1">
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
      {Icon && <Icon className="w-3.5 h-3.5 text-gray-400" />}
      {label}
    </label>
    <p className={`text-sm text-gray-900 ${mono ? "font-mono" : "font-medium"}`}>
      {value || <span className="text-gray-400 italic">No especificado</span>}
    </p>
  </div>
);

/**
 * Componente para campo con boton de accion (ver documento)
 */
const FieldWithAction = ({ icon: Icon, label, value, onAction, actionLabel, hasDocument, mono = false }) => (
  <div className="space-y-1">
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
      {Icon && <Icon className="w-3.5 h-3.5 text-gray-400" />}
      {label}
    </label>
    <div className="flex items-center gap-2">
      <p className={`text-sm text-gray-900 flex-1 ${mono ? "font-mono" : "font-medium"}`}>
        {value || <span className="text-gray-400 italic">No especificado</span>}
      </p>
      {hasDocument && (
        <button
          onClick={onAction}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors border border-red-200"
        >
          <Eye className="w-3.5 h-3.5" />
          {actionLabel}
        </button>
      )}
    </div>
  </div>
);

/**
 * Componente para campo de texto editable
 */
const EditableTextArea = ({ icon: Icon, label, value, onChange, placeholder, rows = 4 }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
      {Icon && <Icon className="w-3.5 h-3.5 text-gray-400" />}
      {label}
    </label>
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-sm"
    />
  </div>
);

/**
 * Componente de Vista de Auditoria de Equipo
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
  onBackToList,
}) => {
  // Estados para campos editables
  const [actionsDescription, setActionsDescription] = useState("");
  const [observations, setObservations] = useState("");
  const [hasChanges, setHasChanges] = useState(false);

  // Estados para archivos
  const [isLoadingFiles, setIsLoadingFiles] = useState(true);
  const [images, setImages] = useState({ equipment: [], plate: [] });
  const [pdfs, setPdfs] = useState({ factura: [], pedimento: [] });

  // Estados para visores
  const [showFacturaViewer, setShowFacturaViewer] = useState(false);
  const [showPedimentoViewer, setShowPedimentoViewer] = useState(false);
  const [showEquipmentImagesViewer, setShowEquipmentImagesViewer] = useState(false);
  const [showPlateImagesViewer, setShowPlateImagesViewer] = useState(false);

  // Cargar datos del equipo
  useEffect(() => {
    if (equipment) {
      setActionsDescription(equipment.actionsDescription || "");
      setObservations(equipment.observations || "");
      setHasChanges(false);
      loadEquipmentFiles();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [equipment?.id]);

  // Detectar cambios
  useEffect(() => {
    if (!equipment) return;

    const changed =
      actionsDescription !== (equipment.actionsDescription || "") ||
      observations !== (equipment.observations || "");

    setHasChanges(changed);
  }, [actionsDescription, observations, equipment]);

  // Cargar imagenes y PDFs del equipo
  const loadEquipmentFiles = async () => {
    if (!equipment?.id || !plant?.id) return;

    setIsLoadingFiles(true);
    try {
      const [imagesResult, pdfsResult] = await Promise.all([
        getEquipmentImages(plant.id, equipment.id),
        getEquipmentPDFs(plant.id, equipment.id),
      ]);

      if (imagesResult.success) {
        setImages(imagesResult.images || { equipment: [], plate: [] });
      }

      if (pdfsResult.success) {
        setPdfs(pdfsResult.pdfs || { factura: [], pedimento: [] });
      }
    } catch (error) {
      console.error("Error cargando archivos:", error);
    } finally {
      setIsLoadingFiles(false);
    }
  };

  // Verificar estado vacio
  if (!equipment || !plant) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
        <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-800 mb-2">
          No hay equipo seleccionado
        </h3>
        <p className="text-sm text-gray-600">
          Selecciona un equipo de la lista para comenzar la auditoria.
        </p>
      </div>
    );
  }

  const isReviewed = equipment.reviewStatus === "revisado";
  const equipName = equipment.name || equipment.equipmentName || "Sin nombre";

  // Navegacion
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === totalEquipment - 1;

  // Verificar disponibilidad de documentos e imagenes
  const hasFactura = pdfs.factura && pdfs.factura.length > 0;
  const hasPedimento = pdfs.pedimento && pdfs.pedimento.length > 0;
  const hasEquipmentImages = images.equipment && images.equipment.length > 0;
  const hasPlateImages = images.plate && images.plate.length > 0;

  // Obtener URLs de imagenes para el visor
  const equipmentImageUrls = hasEquipmentImages
    ? images.equipment.map((img) => img.url || img)
    : [];
  const plateImageUrls = hasPlateImages
    ? images.plate.map((img) => img.url || img)
    : [];

  // Helper para obtener estado de placa
  const getPlateStatusDisplay = () => {
    const status = equipment.plateStatus || "OK";
    if (status === "OK") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-green-50 text-green-700 rounded-md text-sm font-medium border border-green-200">
          <CheckCircle className="w-4 h-4" />
          OK
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 text-amber-700 rounded-md text-sm font-medium border border-amber-200">
        <AlertTriangle className="w-4 h-4" />
        Con Observaciones
      </span>
    );
  };

  // Helper para obtener origen
  const getOriginDisplay = () => {
    const origin = equipment.origin || "NACIONAL";
    if (origin === "NACIONAL") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 text-blue-700 rounded-md text-sm font-medium border border-blue-200">
          Nacional
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-purple-50 text-purple-700 rounded-md text-sm font-medium border border-purple-200">
        Extranjero
      </span>
    );
  };

  // Manejadores de guardado
  const handleSave = async () => {
    if (!hasChanges) return;

    const updatedData = {
      actionsDescription,
      observations,
      updatedAt: new Date().toISOString(),
    };

    await onSave(updatedData);
    setHasChanges(false);
  };

  const handleMarkReviewed = async () => {
    if (hasChanges) {
      await handleSave();
    }

    const reviewData = {
      reviewStatus: "revisado",
      reviewDate: new Date().toISOString(),
      actionsDescription,
      observations,
    };

    await onMarkReviewed(reviewData);
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {/* ========== HEADER ========== */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
          <div className="flex items-center gap-3">
            {/* Boton Volver */}
            <button
              onClick={onBackToList}
              className="flex items-center gap-1 px-3 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-medium transition-colors"
              title="Volver a la lista de equipos"
            >
              <ArrowLeft className="w-4 h-4" />
              Volver
            </button>

            {/* Separador */}
            <div className="h-8 w-px bg-white/30" />

            {/* Info del equipo */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                <Package className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">{equipName}</h2>
                <p className="text-sm text-blue-100">{plant.name}</p>
              </div>
            </div>
          </div>

          {/* Navegacion y Estado */}
          <div className="flex items-center gap-3">
            {/* Badge de estado */}
            <span
              className={`
                px-3 py-1.5 rounded-full text-xs font-semibold
                ${isReviewed
                  ? "bg-green-100 text-green-800"
                  : "bg-orange-100 text-orange-800"
                }
              `}
            >
              {isReviewed ? (
                <span className="flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" />
                  Revisado
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  Pendiente
                </span>
              )}
            </span>

            {/* Separador */}
            <div className="h-8 w-px bg-white/30" />

            {/* Contador */}
            <span className="text-sm text-blue-100">
              {currentIndex + 1} / {totalEquipment}
            </span>

            {/* Botones de navegacion */}
            <div className="flex items-center gap-1">
              <button
                onClick={onFirst}
                disabled={isFirst}
                className={`p-2 rounded-lg transition-colors ${
                  isFirst
                    ? "text-white/30 cursor-not-allowed"
                    : "text-white hover:bg-white/20"
                }`}
                title="Primero"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                onClick={onPrevious}
                disabled={isFirst}
                className={`p-2 rounded-lg transition-colors ${
                  isFirst
                    ? "text-white/30 cursor-not-allowed"
                    : "text-white hover:bg-white/20"
                }`}
                title="Anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={onNext}
                disabled={isLast}
                className={`p-2 rounded-lg transition-colors ${
                  isLast
                    ? "text-white/30 cursor-not-allowed"
                    : "text-white hover:bg-white/20"
                }`}
                title="Siguiente"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={onLast}
                disabled={isLast}
                className={`p-2 rounded-lg transition-colors ${
                  isLast
                    ? "text-white/30 cursor-not-allowed"
                    : "text-white hover:bg-white/20"
                }`}
                title="Ultimo"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* ========== CONTENIDO PRINCIPAL ========== */}
        <div className="p-6">
          {isLoadingFiles ? (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-3" />
              <p className="text-gray-500 font-medium">Cargando informacion...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-6">
              {/* ========== COLUMNA IZQUIERDA ========== */}
              <div className="space-y-5">
                {/* Descripcion del Equipo */}
                <InfoField
                  icon={Package}
                  label="Descripcion del Equipo"
                  value={equipment.name}
                />

                {/* Marca/Fabricante */}
                <InfoField
                  icon={Factory}
                  label="Marca / Fabricante"
                  value={equipment.manufacturer}
                />

                {/* Modelo */}
                <InfoField
                  icon={Cpu}
                  label="Modelo"
                  value={equipment.model}
                />

                {/* Numero de Serie */}
                <InfoField
                  icon={Hash}
                  label="Numero de Serie"
                  value={equipment.serialNumber}
                  mono={true}
                />

                {/* Localizacion en Planta */}
                <InfoField
                  icon={MapPinned}
                  label="Localizacion en Planta"
                  value={equipment.location}
                />

                {/* Seccion de Imagenes */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-gray-400" />
                    Imagenes del Equipo
                  </label>
                  <div className="flex items-center gap-3">
                    {/* Boton Ver Equipo */}
                    <button
                      onClick={() => setShowEquipmentImagesViewer(true)}
                      disabled={!hasEquipmentImages}
                      className={`
                        inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all
                        ${hasEquipmentImages
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                          : "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
                        }
                      `}
                    >
                      <Image className="w-4 h-4" />
                      Ver Equipo
                      {hasEquipmentImages && (
                        <span className="bg-emerald-200 text-emerald-800 text-xs px-1.5 py-0.5 rounded-full">
                          {images.equipment.length}
                        </span>
                      )}
                    </button>

                    {/* Boton Ver Placa */}
                    <button
                      onClick={() => setShowPlateImagesViewer(true)}
                      disabled={!hasPlateImages}
                      className={`
                        inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all
                        ${hasPlateImages
                          ? "bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100"
                          : "bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed"
                        }
                      `}
                    >
                      <Camera className="w-4 h-4" />
                      Ver Placa
                      {hasPlateImages && (
                        <span className="bg-amber-200 text-amber-800 text-xs px-1.5 py-0.5 rounded-full">
                          {images.plate.length}
                        </span>
                      )}
                    </button>
                  </div>
                </div>

                {/* Observaciones (campo editable) */}
                <EditableTextArea
                  icon={MessageSquare}
                  label="Observaciones"
                  value={observations}
                  onChange={setObservations}
                  placeholder="Agrega observaciones sobre el equipo..."
                  rows={4}
                />
              </div>

              {/* ========== COLUMNA DERECHA ========== */}
              <div className="space-y-5">
                {/* Numero de Factura + Boton VER */}
                <FieldWithAction
                  icon={FileText}
                  label="Numero de Factura"
                  value={equipment.invoiceNumber}
                  onAction={() => setShowFacturaViewer(true)}
                  actionLabel="VER"
                  hasDocument={hasFactura}
                  mono={true}
                />

                {/* Numero de Pedimento + Boton VER */}
                <FieldWithAction
                  icon={FileText}
                  label="Numero de Pedimento"
                  value={equipment.customsNumber}
                  onAction={() => setShowPedimentoViewer(true)}
                  actionLabel="VER"
                  hasDocument={hasPedimento}
                  mono={true}
                />

                {/* Pais de Origen */}
                <InfoField
                  icon={Globe}
                  label="Pais de Origen"
                  value={equipment.countryOfOrigin}
                />

                {/* Origen del Equipo */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    Origen del Equipo
                  </label>
                  <div>{getOriginDisplay()}</div>
                </div>

                {/* Estatus de la Placa */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Estatus de la Placa
                  </label>
                  <div className="flex items-center gap-2">
                    {getPlateStatusDisplay()}
                    {equipment.plateNotes && (
                      <span className="text-xs text-gray-500">
                        ({equipment.plateNotes})
                      </span>
                    )}
                  </div>
                </div>

                {/* Acciones Requeridas (campo editable) */}
                <EditableTextArea
                  icon={ClipboardList}
                  label="Acciones Requeridas"
                  value={actionsDescription}
                  onChange={setActionsDescription}
                  placeholder="Describe las acciones que deben realizarse..."
                  rows={4}
                />

                {/* Fecha de revision si aplica */}
                {isReviewed && equipment.reviewDate && (
                  <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-xs text-green-700 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Revisado el {new Date(equipment.reviewDate).toLocaleString("es-MX")}
                      {equipment.reviewerName && ` por ${equipment.reviewerName}`}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ========== FOOTER CON ACCIONES ========== */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Mensaje de cambios sin guardar */}
            {hasChanges && (
              <div className="flex-1 flex items-center gap-2 text-orange-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                Tienes cambios sin guardar
              </div>
            )}

            <div className="flex gap-3 ml-auto">
              {/* Guardar Cambios */}
              <button
                onClick={handleSave}
                disabled={!hasChanges || saving}
                className={`
                  flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-colors
                  ${hasChanges && !saving
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-200 text-gray-400 cursor-not-allowed"
                  }
                `}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Guardar Cambios
                  </>
                )}
              </button>

              {/* Marcar como Revisado */}
              <button
                onClick={handleMarkReviewed}
                disabled={saving}
                className={`
                  flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold transition-colors
                  ${saving
                    ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                    : isReviewed
                      ? "bg-green-600 text-white hover:bg-green-700"
                      : "bg-orange-600 text-white hover:bg-orange-700"
                  }
                `}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Actualizando...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    {isReviewed ? "Actualizar Revision" : "Marcar como Revisado"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ========== VISORES EXTERNOS ========== */}

      {/* Visor de PDF - Factura */}
      {showFacturaViewer && hasFactura && (
        <PDFViewer
          isOpen={showFacturaViewer}
          onClose={() => setShowFacturaViewer(false)}
          pdfUrl={pdfs.factura[0]?.url}
          title="Factura"
          fileName={pdfs.factura[0]?.name || `factura_${equipment.invoiceNumber || "equipo"}.pdf`}
        />
      )}

      {/* Visor de PDF - Pedimento */}
      {showPedimentoViewer && hasPedimento && (
        <PDFViewer
          isOpen={showPedimentoViewer}
          onClose={() => setShowPedimentoViewer(false)}
          pdfUrl={pdfs.pedimento[0]?.url}
          title="Pedimento"
          fileName={pdfs.pedimento[0]?.name || `pedimento_${equipment.customsNumber || "equipo"}.pdf`}
        />
      )}

      {/* Visor de Imagenes - Equipo */}
      {showEquipmentImagesViewer && hasEquipmentImages && (
        <ImageViewer
          isOpen={showEquipmentImagesViewer}
          onClose={() => setShowEquipmentImagesViewer(false)}
          images={equipmentImageUrls}
          title={`Imagenes del Equipo - ${equipment.name || "Equipo"}`}
        />
      )}

      {/* Visor de Imagenes - Placa */}
      {showPlateImagesViewer && hasPlateImages && (
        <ImageViewer
          isOpen={showPlateImagesViewer}
          onClose={() => setShowPlateImagesViewer(false)}
          images={plateImageUrls}
          title={`Imagenes de Placa - ${equipment.name || "Equipo"}`}
        />
      )}
    </>
  );
};

export default AuditorEquipmentReview;
