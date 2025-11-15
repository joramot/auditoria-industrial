import React, { useState } from "react";
import { Upload, Trash2, Download, File, X, AlertCircle } from "lucide-react";

/**
 * 📄 PDF UPLOADER COMPONENT
 * 
 * Componente para seleccionar, validar y subir archivos PDF
 * Soporta facturas y pedimentos
 */

const PDFUploader = ({
  category,                    // "factura" o "pedimento"
  label = "Documentos PDF",
  pdfs = [],                   // Array de PDFs ya cargados
  onPDFsChange,                // Callback cuando cambian los PDFs
  maxPDFs = 5,                 // Máximo de PDFs por categoría
  maxSizeMB = 20,              // Tamaño máximo en MB
  disabled = false,
}) => {
  const [error, setError] = useState(null);
  const [hoveredPdfId, setHoveredPdfId] = useState(null);

  /**
   * Validar archivo PDF
   */
  const validatePDF = (file) => {
    // Validar tipo de archivo
    if (file.type !== "application/pdf") {
      setError("❌ Solo se aceptan archivos PDF");
      return false;
    }

    // Validar tamaño
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      setError(`❌ El archivo supera ${maxSizeMB}MB (${fileSizeMB.toFixed(2)}MB)`);
      return false;
    }

    // Validar cantidad
    if (pdfs.length >= maxPDFs) {
      setError(`❌ Máximo ${maxPDFs} archivos por categoría`);
      return false;
    }

    setError(null);
    return true;
  };

  /**
   * Manejar selección de archivo
   */
  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    
    if (file) {
      console.log(`📄 Archivo seleccionado: ${file.name} (${(file.size / 1024).toFixed(2)}KB)`);
      
      if (!validatePDF(file)) {
        event.target.value = ""; // Limpiar input
        return;
      }

      // Crear objeto con preview
      const newPDF = {
        file: file,
        name: file.name,
        size: file.size,
        preview: URL.createObjectURL(file),
        uploadDate: new Date().toISOString(),
        isNew: true, // Marcar como nuevo (no sincronizado aún)
      };

      console.log(`✅ PDF validado: ${file.name}`);
      
      // Agregar a la lista de PDFs
      const updatedPDFs = [...pdfs, newPDF];
      onPDFsChange(updatedPDFs);

      // Limpiar input para permitir seleccionar el mismo archivo de nuevo
      event.target.value = "";
      setError(null);
    }
  };

  /**
   * Eliminar PDF
   */
  const handleRemovePDF = (index) => {
    console.log(`🗑️ Eliminando PDF en índice: ${index}`);
    
    const pdfToRemove = pdfs[index];
    
    // Liberar URL de preview si existe
    if (pdfToRemove.preview && pdfToRemove.isNew) {
      URL.revokeObjectURL(pdfToRemove.preview);
    }

    const updatedPDFs = pdfs.filter((_, i) => i !== index);
    onPDFsChange(updatedPDFs);
    
    console.log(`✅ PDF eliminado. Quedan: ${updatedPDFs.length}`);
  };

  /**
   * Descargar PDF
   */
  const handleDownloadPDF = (pdf) => {
    console.log(`📥 Descargando PDF: ${pdf.name}`);
    
    if (pdf.url) {
      // PDF ya sincronizado - descargar desde URL
      const link = document.createElement("a");
      link.href = pdf.url;
      link.download = pdf.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (pdf.preview) {
      // PDF nuevo - descargar desde preview
      const link = document.createElement("a");
      link.href = pdf.preview;
      link.download = pdf.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  /**
   * Formatear tamaño de archivo
   */
  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
  };

  return (
    <div className="w-full">
      {/* Mostrar error si existe */}
      {error && (
        <div className="mb-3 bg-red-100 border border-red-300 text-red-700 px-3 py-2 rounded-lg flex items-center gap-2 text-sm">
          <AlertCircle className="w-4 h-4" />
          {error}
        </div>
      )}

      {/* Input de archivo (oculto) */}
      <input
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleFileSelect}
        disabled={disabled || pdfs.length >= maxPDFs}
        className="hidden"
        id={`pdf-input-${category}`}
      />

      {/* Botón para seleccionar archivo */}
      <label
        htmlFor={`pdf-input-${category}`}
        className={`
          flex items-center justify-center gap-2 px-4 py-2 
          rounded-lg border-2 border-dashed border-blue-300
          bg-blue-50 text-blue-700 font-medium
          cursor-pointer transition-all
          ${disabled || pdfs.length >= maxPDFs
            ? "opacity-50 cursor-not-allowed"
            : "hover:bg-blue-100 hover:border-blue-500"
          }
        `}
      >
        <Upload className="w-5 h-5" />
        <span>
          {pdfs.length >= maxPDFs
            ? `Máximo ${maxPDFs} archivos`
            : `Seleccionar PDF (${pdfs.length}/${maxPDFs})`
          }
        </span>
      </label>

      {/* Información de límites */}
      <p className="text-xs text-gray-500 mt-2">
        📄 Máximo: {maxPDFs} archivo{maxPDFs > 1 ? "s" : ""} | Tamaño: hasta {maxSizeMB}MB
      </p>

      {/* Lista de PDFs cargados */}
      {pdfs && pdfs.length > 0 && (
        <div className="mt-4 space-y-2">
          <h4 className="text-sm font-medium text-gray-700">
            {pdfs.length} archivo{pdfs.length > 1 ? "s" : ""} cargado{pdfs.length > 1 ? "s" : ""}:
          </h4>
          
          <div className="space-y-2">
            {pdfs.map((pdf, index) => (
              <div
                key={index}
                onMouseEnter={() => setHoveredPdfId(index)}
                onMouseLeave={() => setHoveredPdfId(null)}
                className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors"
              >
                {/* Icono de PDF */}
                <File className="w-5 h-5 text-red-600 flex-shrink-0" />

                {/* Información del PDF */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {pdf.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(pdf.size)}
                  </p>
                </div>

                {/* Status de sincronización */}
                {pdf.isNew ? (
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded whitespace-nowrap">
                    Pendiente
                  </span>
                ) : (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded whitespace-nowrap">
                    Sincronizado
                  </span>
                )}

                {/* Botones de acción */}
                {hoveredPdfId === index && (
                  <div className="flex gap-1">
                    {/* Botón descargar */}
                    <button
                      onClick={() => handleDownloadPDF(pdf)}
                      className="p-1 text-gray-600 hover:text-blue-600 rounded transition-colors"
                      title="Descargar PDF"
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    {/* Botón eliminar (solo para PDFs nuevos) */}
                    {pdf.isNew && (
                      <button
                        onClick={() => handleRemovePDF(index)}
                        className="p-1 text-gray-600 hover:text-red-600 rounded transition-colors"
                        title="Eliminar PDF"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mensaje si no hay PDFs */}
      {(!pdfs || pdfs.length === 0) && (
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg text-center text-sm text-blue-700">
          💡 Selecciona un PDF de {category} para cargarlo
        </div>
      )}
    </div>
  );
};

export default PDFUploader;
