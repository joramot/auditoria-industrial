/**
 * EquipmentDetailModal.jsx - Modal de consulta/visualizacion de equipo
 *
 * Muestra informacion completa del equipo en modo solo lectura.
 * Diseño de dos columnas con acceso a documentos e imágenes en ventanas independientes.
 *
 * @version 2.1.0
 */

import React, { useState, useEffect } from "react";
import {
  X,
  Package,
  Loader2,
  MapPin,
  Factory,
  Globe,
  FileText,
  ClipboardList,
  MessageSquare,
  Printer,
  AlertCircle,
  CheckCircle,
  AlertTriangle,
  Eye,
  Hash,
  Cpu,
  MapPinned,
  Camera,
  Image,
} from "lucide-react";
import { getEquipmentImages, getEquipmentPDFs } from "../../services/firebase/firebaseServices";
import PDFViewer from "./PDFViewer";
import ImageViewer from "./ImageViewer";

/**
 * Componente para mostrar un campo de información
 */
const InfoField = ({ icon: Icon, label, value, className = "", mono = false }) => (
  <div className={`space-y-1 ${className}`}>
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
 * Componente para campos de texto largo
 */
const TextAreaField = ({ icon: Icon, label, value }) => (
  <div className="space-y-1.5">
    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
      {Icon && <Icon className="w-3.5 h-3.5 text-gray-400" />}
      {label}
    </label>
    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 min-h-[80px]">
      <p className="text-sm text-gray-900 whitespace-pre-wrap leading-relaxed">
        {value || <span className="text-gray-400 italic">Sin información</span>}
      </p>
    </div>
  </div>
);

/**
 * Componente para campo con botón de acción
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
 * Componente Modal de Detalle de Equipo
 */
const EquipmentDetailModal = ({
  isOpen,
  onClose,
  equipment,
  plantId,
  plantName,
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [images, setImages] = useState({ equipment: [], plate: [] });
  const [pdfs, setPdfs] = useState({ factura: [], pedimento: [] });
  const [error, setError] = useState(null);

  // Estados para visores independientes
  const [showFacturaViewer, setShowFacturaViewer] = useState(false);
  const [showPedimentoViewer, setShowPedimentoViewer] = useState(false);
  const [showEquipmentImagesViewer, setShowEquipmentImagesViewer] = useState(false);
  const [showPlateImagesViewer, setShowPlateImagesViewer] = useState(false);

  // Cargar imágenes y PDFs al abrir
  useEffect(() => {
    if (isOpen && equipment?.id && plantId) {
      loadEquipmentFiles();
    } else {
      setImages({ equipment: [], plate: [] });
      setPdfs({ factura: [], pedimento: [] });
      setError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, equipment?.id, plantId]);

  const loadEquipmentFiles = async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Cargar imágenes y PDFs en paralelo
      const [imagesResult, pdfsResult] = await Promise.all([
        getEquipmentImages(plantId, equipment.id),
        getEquipmentPDFs(plantId, equipment.id),
      ]);

      if (imagesResult.success) {
        setImages(imagesResult.images || { equipment: [], plate: [] });
      }

      if (pdfsResult.success) {
        setPdfs(pdfsResult.pdfs || { factura: [], pedimento: [] });
      }
    } catch (err) {
      console.error("Error cargando archivos:", err);
      setError("Error al cargar documentos del equipo");
    } finally {
      setIsLoading(false);
    }
  };

  // Cerrar con Escape (solo si no hay visores abiertos)
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen &&
          !showFacturaViewer && !showPedimentoViewer &&
          !showEquipmentImagesViewer && !showPlateImagesViewer) {
        onClose();
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose, showFacturaViewer, showPedimentoViewer, showEquipmentImagesViewer, showPlateImagesViewer]);

  // Imprimir
  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

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

  // Verificar si hay documentos e imágenes
  const hasFactura = pdfs.factura && pdfs.factura.length > 0;
  const hasPedimento = pdfs.pedimento && pdfs.pedimento.length > 0;
  const hasEquipmentImages = images.equipment && images.equipment.length > 0;
  const hasPlateImages = images.plate && images.plate.length > 0;

  // Obtener URLs de imágenes para el visor
  const equipmentImageUrls = hasEquipmentImages
    ? images.equipment.map(img => img.url || img)
    : [];
  const plateImageUrls = hasPlateImages
    ? images.plate.map(img => img.url || img)
    : [];

  return (
    <>
      {/* Modal Principal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Overlay */}
        <div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal Container */}
        <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-600 to-blue-700">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 bg-white/20 rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  {equipment.name || "Equipo sin nombre"}
                </h2>
                <p className="text-sm text-blue-100">
                  {plantName || "Planta"}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handlePrint}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                title="Imprimir"
              >
                <Printer className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Loading */}
            {isLoading && (
              <div className="flex flex-col items-center justify-center py-16">
                <Loader2 className="w-10 h-10 text-blue-500 animate-spin mb-3" />
                <p className="text-gray-500 font-medium">Cargando información...</p>
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm flex items-center gap-3">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Two Column Layout */}
            {!isLoading && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-8 gap-y-5">
                {/* ========== COLUMNA IZQUIERDA ========== */}
                <div className="space-y-5">
                  {/* Descripción del Equipo */}
                  <InfoField
                    icon={Package}
                    label="Descripción del Equipo"
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

                  {/* Número de Serie */}
                  <InfoField
                    icon={Hash}
                    label="Número de Serie"
                    value={equipment.serialNumber}
                    mono={true}
                  />

                  {/* Localización en Planta */}
                  <InfoField
                    icon={MapPinned}
                    label="Localización en Planta"
                    value={equipment.location}
                  />

                  {/* ===== SECCIÓN DE IMÁGENES ===== */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-gray-400" />
                      Imágenes del Equipo
                    </label>
                    <div className="flex items-center gap-3">
                      {/* Botón Ver Equipo */}
                      <button
                        onClick={() => setShowEquipmentImagesViewer(true)}
                        disabled={!hasEquipmentImages}
                        className={`
                          inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all
                          ${hasEquipmentImages
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                            : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
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

                      {/* Botón Ver Placa */}
                      <button
                        onClick={() => setShowPlateImagesViewer(true)}
                        disabled={!hasPlateImages}
                        className={`
                          inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all
                          ${hasPlateImages
                            ? 'bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100'
                            : 'bg-gray-100 text-gray-400 border border-gray-200 cursor-not-allowed'
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

                  {/* Análisis y Observaciones */}
                  <TextAreaField
                    icon={MessageSquare}
                    label="Análisis y Observaciones"
                    value={equipment.observations}
                  />
                </div>

                {/* ========== COLUMNA DERECHA ========== */}
                <div className="space-y-5">
                  {/* Número de Factura + Botón VER */}
                  <FieldWithAction
                    icon={FileText}
                    label="Número de Factura"
                    value={equipment.invoiceNumber}
                    onAction={() => setShowFacturaViewer(true)}
                    actionLabel="VER"
                    hasDocument={hasFactura}
                    mono={true}
                  />

                  {/* Número de Pedimento + Botón VER */}
                  <FieldWithAction
                    icon={FileText}
                    label="Número de Pedimento"
                    value={equipment.customsNumber}
                    onAction={() => setShowPedimentoViewer(true)}
                    actionLabel="VER"
                    hasDocument={hasPedimento}
                    mono={true}
                  />

                  {/* País de Origen */}
                  <InfoField
                    icon={Globe}
                    label="País de Origen"
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

                  {/* Acciones Recomendadas */}
                  <TextAreaField
                    icon={ClipboardList}
                    label="Acciones Recomendadas"
                    value={equipment.actionsDescription}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-colors"
            >
              Cerrar
            </button>
          </div>
        </div>
      </div>

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

      {/* Visor de Imágenes - Equipo */}
      {showEquipmentImagesViewer && hasEquipmentImages && (
        <ImageViewer
          isOpen={showEquipmentImagesViewer}
          onClose={() => setShowEquipmentImagesViewer(false)}
          images={equipmentImageUrls}
          title={`Imágenes del Equipo - ${equipment.name || "Equipo"}`}
        />
      )}

      {/* Visor de Imágenes - Placa */}
      {showPlateImagesViewer && hasPlateImages && (
        <ImageViewer
          isOpen={showPlateImagesViewer}
          onClose={() => setShowPlateImagesViewer(false)}
          images={plateImageUrls}
          title={`Imágenes de Placa - ${equipment.name || "Equipo"}`}
        />
      )}
    </>
  );
};

export default EquipmentDetailModal;
