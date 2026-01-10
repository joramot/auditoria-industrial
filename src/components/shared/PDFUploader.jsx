import React, { useState } from "react";
import { Upload, Trash2, Download, File, AlertCircle } from "lucide-react";
import { deleteFactura, deletePedimento } from "../../services/deletion/deletionService";

/**
 * PDF UPLOADER COMPONENT CON FUNCIONALIDAD DE ELIMINACION
 * 
 * Componente para seleccionar, validar, subir y ELIMINAR archivos PDF
 * Soporta facturas y pedimentos
 * 
 * @version 2.0 - Con eliminacion integrada
 */

const PDFUploader = ({
  category,                    // "factura" o "pedimento"
  label = "Documentos PDF",
  pdfs = [],                   // Array de PDFs ya cargados
  onPDFsChange,                // Callback cuando cambian los PDFs
  equipmentId,                 // ID del equipo (para eliminacion)
  isOnline = true,             // Estado de conexion
  maxPDFs = 5,                 // Maximo de PDFs por categori­a
  maxSizeMB = 20,              // Tamaño maximo en MB
  disabled = false,
}) => {
  const [error, setError] = useState(null);
  const [hoveredPdfId, setHoveredPdfId] = useState(null);
  const [deletingPdfId, setDeletingPdfId] = useState(null);

  /**
   * Validar archivo PDF
   */
  const validatePDF = (file) => {
    if (file.type !== "application/pdf") {
      setError("âŒ Solo se aceptan archivos PDF");
      return false;
    }

    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > maxSizeMB) {
      setError(`âŒ El archivo supera ${maxSizeMB}MB (${fileSizeMB.toFixed(2)}MB)`);
      return false;
    }

    if (pdfs.length >= maxPDFs) {
      setError(`âŒ MÃ¡ximo ${maxPDFs} archivos por categorÃ­a`);
      return false;
    }

    setError(null);
    return true;
  };

  /**
   * Manejar seleccion de archivo
   */
  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    
    if (file) {
      console.log(`ðŸ“„ Archivo seleccionado: ${file.name} (${(file.size / 1024).toFixed(2)}KB)`);
      
      if (!validatePDF(file)) {
        event.target.value = "";
        return;
      }

      const newPDF = {
        file: file,
        name: file.name,
        size: file.size,
        preview: URL.createObjectURL(file),
        uploadDate: new Date().toISOString(),
        isNew: true,
      };

      console.log(`✅ PDF validado: ${file.name}`);
      console.log('📦 Objeto PDF creado:', { name: newPDF.name, size: newPDF.size, isNew: newPDF.isNew, hasFile: !!newPDF.file });
      
      const updatedPDFs = [...pdfs, newPDF];
      console.log('📤 Llamando onPDFsChange con', updatedPDFs.length, 'PDF(s)');
      onPDFsChange(updatedPDFs);

      event.target.value = "";
      setError(null);
    }
  };

  /**
   * ELIMINAR PDF - NUEVA FUNCION
   */
  const handleDeletePDF = async (index) => {
    const pdfToDelete = pdfs[index];
    
    // Confirmacion
    if (!window.confirm(`Â¿Eliminar ${pdfToDelete.name}?`)) {
      return;
    }

    setDeletingPdfId(index);
    console.log(`ðŸ—‘ï¸ Eliminando PDF: ${pdfToDelete.name}`);

    try {
      // Si es un PDF nuevo (no sincronizado), solo remover de la lista
      if (pdfToDelete.isNew) {
        console.log("ðŸ“¦ PDF no sincronizado, removiendo de la lista...");
        if (pdfToDelete.preview) {
          URL.revokeObjectURL(pdfToDelete.preview);
        }
        const updatedPDFs = pdfs.filter((_, i) => i !== index);
        onPDFsChange(updatedPDFs);
        setDeletingPdfId(null);
        return;
      }

      // Si ya estÃ¡ sincronizado, usar funcion de eliminacion
      const deleteFunction = category === "factura" ? deleteFactura : deletePedimento;
      
      const result = await deleteFunction(
        equipmentId,
        pdfToDelete,
        isOnline
      );

      if (result.success) {
        console.log("âœ… PDF eliminado correctamente");
        
        // Remover de la lista local
        const updatedPDFs = pdfs.filter((_, i) => i !== index);
        onPDFsChange(updatedPDFs);
        
        // Mostrar mensaje
        alert(result.message);
      } else {
        console.error("âŒ Error al eliminar PDF:", result.error);
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("âŒ Error crÃ­tico al eliminar PDF:", error);
      alert("Error al eliminar el PDF. Intenta de nuevo.");
    } finally {
      setDeletingPdfId(null);
    }
  };

  /**
   * Eliminar PDF (funcion alternativa para PDFs nuevos)
   */
  // eslint-disable-next-line no-unused-vars
  const handleRemovePDF = (index) => {
    console.log(`ðŸ—‘ï¸ Removiendo PDF en Ã­ndice: ${index}`);
    
    const pdfToRemove = pdfs[index];
    
    if (pdfToRemove.preview && pdfToRemove.isNew) {
      URL.revokeObjectURL(pdfToRemove.preview);
    }

    const updatedPDFs = pdfs.filter((_, i) => i !== index);
    onPDFsChange(updatedPDFs);
    
    console.log(`âœ… PDF removido. Quedan: ${updatedPDFs.length}`);
  };

  /**
   * Abrir PDF en nueva pestaña
   */
  const handleDownloadPDF = (pdf) => {
    console.log(`📄 Abriendo PDF: ${pdf.name}`);

    const url = pdf.url || pdf.preview;

    if (url) {
      // Abrir en nueva pestaña para no perder la sesión de la app
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  /**
   * Formatear tamaÃ±o de archivo
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

      {/* BotÃ³n para seleccionar archivo */}
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
            ? `MÃ¡ximo ${maxPDFs} archivos`
            : `Seleccionar PDF (${pdfs.length}/${maxPDFs})`
          }
        </span>
      </label>

      {/* InformaciÃ³n de lÃ­mites */}
      <p className="text-xs text-gray-500 mt-2">
        ðŸ“„ MÃ¡ximo: {maxPDFs} archivo{maxPDFs > 1 ? "s" : ""} | TamaÃ±o: hasta {maxSizeMB}MB
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

                {/* InformaciÃ³n del PDF */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">
                    {pdf.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatFileSize(pdf.size)}
                  </p>
                </div>

                {/* Status de sincronizaciÃ³n */}
                {pdf.isNew ? (
                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded whitespace-nowrap">
                    Pendiente
                  </span>
                ) : (
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded whitespace-nowrap">
                    Sincronizado
                  </span>
                )}

                {/* Botones de acciÃ³n */}
                {hoveredPdfId === index && (
                  <div className="flex gap-1">
                    {/* BotÃ³n descargar */}
                    <button
                      onClick={() => handleDownloadPDF(pdf)}
                      className="p-1 text-gray-600 hover:text-blue-600 rounded transition-colors"
                      title="Descargar PDF"
                      disabled={deletingPdfId === index}
                    >
                      <Download className="w-4 h-4" />
                    </button>

                    {/* BotÃ³n eliminar - NUEVO: Funciona para PDFs nuevos y sincronizados */}
                    <button
                      onClick={() => handleDeletePDF(index)}
                      className={`p-1 rounded transition-colors ${
                        deletingPdfId === index
                          ? "text-gray-400 cursor-wait"
                          : "text-gray-600 hover:text-red-600"
                      }`}
                      title={pdf.isNew ? "Remover PDF" : "Eliminar PDF"}
                      disabled={deletingPdfId === index}
                    >
                      {deletingPdfId === index ? (
                        <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
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
          ðŸ’¡ Selecciona un PDF de {category} para cargarlo
        </div>
      )}

      {/* Indicador de modo offline */}
      {!isOnline && (
        <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded-lg text-xs text-orange-700">
          ðŸ“¡ Modo Offline: Los cambios se sincronizarÃ¡n al conectar
        </div>
      )}
    </div>
  );
};

export default PDFUploader;
