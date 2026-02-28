/**
 * PDFDocumentViewer.jsx - Visor de Documentos PDF Embebido
 * Muestra facturas y pedimentos con navegacion entre documentos
 *
 * NOTA: Los PDFs vienen como objetos {url, path, name, fileName, uploadDate, size, category}
 */

import React, { useState, useEffect } from 'react';
import {
  FileText,
  Download,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  AlertCircle
} from 'lucide-react';

/**
 * Obtiene la URL de un PDF (puede ser string u objeto con propiedad url)
 */
const getPdfUrl = (pdf) => {
  if (!pdf) return null;
  if (typeof pdf === 'string') return pdf;
  return pdf.url || null;
};

/**
 * Obtiene el nombre de un PDF
 */
const getPdfName = (pdf, index) => {
  if (!pdf) return `Documento ${index + 1}`;
  if (typeof pdf === 'string') return `Documento ${index + 1}`;
  return pdf.name || pdf.fileName || `Documento ${index + 1}`;
};

const EMPTY_ARRAY = [];

/**
 * Componente Visor de PDFs Embebido
 *
 * @param {Object} props
 * @param {Array} props.facturas - Array de facturas (objetos o strings)
 * @param {Array} props.pedimentos - Array de pedimentos (objetos o strings)
 */
const PDFDocumentViewer = ({
  facturas = EMPTY_ARRAY,
  pedimentos = EMPTY_ARRAY
}) => {
  const [currentCategory, setCurrentCategory] = useState('factura');
  const [currentIndex, setCurrentIndex] = useState(0);

  const hasFacturas = facturas && facturas.length > 0;
  const hasPedimentos = pedimentos && pedimentos.length > 0;

  // Inicializar categoria con la que tenga PDFs
  useEffect(() => {
    if (!hasFacturas && hasPedimentos) {
      setCurrentCategory('pedimento');
    } else if (hasFacturas) {
      setCurrentCategory('factura');
    }
    setCurrentIndex(0);
  }, [hasFacturas, hasPedimentos]);

  // Obtener PDFs de la categoria actual
  const currentPdfs = currentCategory === 'factura' ? facturas : pedimentos;
  const totalPdfs = currentPdfs ? currentPdfs.length : 0;

  // Obtener URL del PDF actual
  const currentPdfUrl = totalPdfs > 0 ? getPdfUrl(currentPdfs[currentIndex]) : null;
  const currentPdfName = totalPdfs > 0 ? getPdfName(currentPdfs[currentIndex], currentIndex) : '';

  // Navegacion
  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : totalPdfs - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < totalPdfs - 1 ? prev + 1 : 0));
  };

  // Cambiar categoria
  const handleCategoryChange = (category) => {
    setCurrentCategory(category);
    setCurrentIndex(0);
  };

  // Descargar PDF
  const handleDownload = () => {
    if (currentPdfUrl) {
      const link = document.createElement('a');
      link.href = currentPdfUrl;
      link.download = currentPdfName;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  // Abrir en nueva pestana
  const handleOpenNewTab = () => {
    if (currentPdfUrl) {
      window.open(currentPdfUrl, '_blank');
    }
  };

  // Si no hay PDFs
  if (!hasFacturas && !hasPedimentos) {
    return (
      <div className="bg-gray-100 rounded-lg p-6 flex flex-col items-center justify-center h-64 border border-gray-200">
        <FileText className="w-12 h-12 text-gray-400 mb-2" />
        <p className="text-sm text-gray-500">Sin documentos disponibles</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden h-full flex flex-col">
      {/* Header con tabs de categoria */}
      <div className="flex border-b border-gray-200">
        {hasFacturas && (
          <button
            onClick={() => handleCategoryChange('factura')}
            className={`flex-1 py-2 px-3 text-xs font-medium transition-colors ${
              currentCategory === 'factura'
                ? 'bg-red-50 text-red-600 border-b-2 border-red-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Facturas ({facturas.length})
          </button>
        )}
        {hasPedimentos && (
          <button
            onClick={() => handleCategoryChange('pedimento')}
            className={`flex-1 py-2 px-3 text-xs font-medium transition-colors ${
              currentCategory === 'pedimento'
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Pedimentos ({pedimentos.length})
          </button>
        )}
      </div>

      {/* Barra de herramientas */}
      {totalPdfs > 0 && currentPdfUrl && (
        <div className="flex items-center justify-between px-3 py-2 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center gap-2">
            {totalPdfs > 1 && (
              <>
                <button
                  onClick={handlePrevious}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                  title="Anterior"
                >
                  <ChevronLeft className="w-4 h-4 text-gray-600" />
                </button>
                <span className="text-xs text-gray-600">
                  {currentIndex + 1} / {totalPdfs}
                </span>
                <button
                  onClick={handleNext}
                  className="p-1 hover:bg-gray-200 rounded transition-colors"
                  title="Siguiente"
                >
                  <ChevronRight className="w-4 h-4 text-gray-600" />
                </button>
              </>
            )}
            <span className="text-xs text-gray-500 truncate max-w-[120px]" title={currentPdfName}>
              {currentPdfName}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleDownload}
              className="p-1.5 hover:bg-gray-200 rounded transition-colors"
              title="Descargar"
            >
              <Download className="w-4 h-4 text-gray-600" />
            </button>
            <button
              onClick={handleOpenNewTab}
              className="p-1.5 hover:bg-gray-200 rounded transition-colors"
              title="Abrir en nueva pestana"
            >
              <ExternalLink className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
      )}

      {/* Area del visor PDF */}
      <div className="flex-1 bg-gray-200 min-h-[300px]">
        {currentPdfUrl && currentPdfUrl.startsWith('http') ? (
          <iframe
            src={`${currentPdfUrl}#toolbar=0&navpanes=0`}
            className="w-full h-full border-0"
            title={currentPdfName}
            onError={() => console.error('Error cargando PDF:', currentPdfUrl)}
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center p-4">
            <AlertCircle className="w-8 h-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500 text-center">
              {totalPdfs === 0
                ? `No hay ${currentCategory === 'factura' ? 'facturas' : 'pedimentos'}`
                : 'Error: URL de documento no valida'
              }
            </p>
            {currentPdfUrl && !currentPdfUrl.startsWith('http') && (
              <p className="text-xs text-red-400 mt-1">URL: {String(currentPdfUrl).substring(0, 50)}...</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PDFDocumentViewer;
