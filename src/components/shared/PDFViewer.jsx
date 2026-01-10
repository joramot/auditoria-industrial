/**
 * PDFViewer.jsx - Visor de PDFs con Navegación de Páginas
 * Modal para visualizar PDFs usando iframe
 */

import React, { useState } from 'react';
import {
  X,
  Download,
  Maximize2,
  Minimize2,
  ExternalLink
} from 'lucide-react';

/**
 * Componente Visor de PDFs
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Si el modal está abierto
 * @param {Function} props.onClose - Callback al cerrar
 * @param {string} props.pdfUrl - URL del PDF
 * @param {string} props.title - Título del PDF
 * @param {string} props.fileName - Nombre del archivo
 */
const PDFViewer = ({ 
  isOpen = false, 
  onClose, 
  pdfUrl = '',
  title = 'Visor de PDF',
  fileName = 'documento.pdf'
}) => {
  const [isFullscreen, setIsFullscreen] = useState(false);

  if (!isOpen || !pdfUrl) return null;

  const handleDownload = async () => {
    try {
      const response = await fetch(pdfUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error al descargar PDF:', error);
      alert('Error al descargar el PDF');
    }
  };

  const handleOpenInNewTab = () => {
    window.open(pdfUrl, '_blank');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex flex-col">
      {/* Header */}
      <div className="bg-black bg-opacity-50 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold text-lg">{title}</h3>
            <p className="text-gray-300 text-sm">{fileName}</p>
          </div>
          
          {/* Controles */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-lg transition-all flex items-center gap-2"
              title="Descargar PDF"
            >
              <Download className="w-5 h-5" />
              <span className="hidden sm:inline text-sm">Descargar</span>
            </button>

            <button
              onClick={handleOpenInNewTab}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-lg transition-all flex items-center gap-2"
              title="Abrir en nueva pestaña"
            >
              <ExternalLink className="w-5 h-5" />
              <span className="hidden sm:inline text-sm">Abrir</span>
            </button>

            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-lg transition-all"
              title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
            >
              {isFullscreen ? (
                <Minimize2 className="w-5 h-5" />
              ) : (
                <Maximize2 className="w-5 h-5" />
              )}
            </button>

            <button
              onClick={onClose}
              className="bg-red-500 bg-opacity-80 hover:bg-opacity-100 text-white p-2 rounded-lg transition-all"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* PDF Viewer */}
      <div className={`flex-1 ${isFullscreen ? 'p-0' : 'p-4'}`}>
        <div className="w-full h-full bg-gray-800 rounded-lg overflow-hidden shadow-2xl">
          <iframe
            src={`${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1`}
            className="w-full h-full"
            title={title}
            style={{ border: 'none' }}
          />
        </div>
      </div>

      {/* Instrucciones */}
      <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white text-xs p-2 rounded hidden sm:block">
        <p>El PDF incluye controles de navegación integrados</p>
      </div>

      {/* Fallback para navegadores sin soporte de iframe */}
      <noscript>
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-90">
          <div className="bg-white rounded-lg p-8 max-w-md text-center">
            <p className="text-gray-800 mb-4">
              Tu navegador no puede mostrar PDFs en línea.
            </p>
            <button
              onClick={handleDownload}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Descargar PDF
            </button>
          </div>
        </div>
      </noscript>
    </div>
  );
};

/**
 * Componente Simple de Vista de PDF (sin modal)
 * Para usar en pantallas dedicadas
 */
export const SimplePDFViewer = ({ pdfUrl, title, className = '' }) => {
  if (!pdfUrl) {
    return (
      <div className={`bg-gray-100 rounded-lg p-8 text-center ${className}`}>
        <p className="text-gray-600">No hay PDF para mostrar</p>
      </div>
    );
  }

  return (
    <div className={`w-full h-full bg-gray-800 rounded-lg overflow-hidden ${className}`}>
      <iframe
        src={`${pdfUrl}#toolbar=1&navpanes=1&scrollbar=1`}
        className="w-full h-full"
        title={title}
        style={{ border: 'none', minHeight: '600px' }}
      />
    </div>
  );
};

export default PDFViewer;
