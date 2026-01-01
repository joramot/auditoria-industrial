/**
 * PDFPage.jsx - Página para mostrar PDFs del expediente
 *
 * Renderiza un PDF embebido usando iframe
 */

import React, { useState } from 'react';
import { FileText, ExternalLink, Download, AlertCircle } from 'lucide-react';

/**
 * @param {Object} props
 * @param {Object} props.data - Datos del PDF { url, name, category }
 * @param {string} props.title - Título de la página
 */
export const PDFPage = ({ data, title }) => {
  const [loadError, setLoadError] = useState(false);

  if (!data || !data.url) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center text-gray-500">
          <FileText className="w-16 h-16 mx-auto mb-4" />
          <p>No hay documento disponible</p>
        </div>
      </div>
    );
  }

  const handleOpenInNewTab = () => {
    window.open(data.url, '_blank');
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = data.url;
    link.download = data.name || 'documento.pdf';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="w-full h-full flex flex-col bg-gray-100">
      {/* Barra de herramientas */}
      <div className="bg-gray-800 p-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white">
          <FileText className="w-5 h-5" />
          <span className="font-medium">{title}</span>
          {data.name && (
            <span className="text-gray-400 text-sm">- {data.name}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDownload}
            className="flex items-center gap-1 px-3 py-1 text-white text-sm hover:bg-gray-700 rounded transition-colors"
            title="Descargar PDF"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Descargar</span>
          </button>
          <button
            onClick={handleOpenInNewTab}
            className="flex items-center gap-1 px-3 py-1 text-white text-sm hover:bg-gray-700 rounded transition-colors"
            title="Abrir en nueva pestaña"
          >
            <ExternalLink className="w-4 h-4" />
            <span className="hidden sm:inline">Abrir</span>
          </button>
        </div>
      </div>

      {/* Contenedor del PDF */}
      <div className="flex-1 relative">
        {loadError ? (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
            <div className="text-center p-8">
              <AlertCircle className="w-16 h-16 mx-auto mb-4 text-yellow-500" />
              <p className="text-gray-700 mb-4">No se pudo cargar el visor de PDF</p>
              <div className="flex gap-2 justify-center">
                <button
                  onClick={handleOpenInNewTab}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Abrir en nueva pestaña
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                >
                  <Download className="w-4 h-4" />
                  Descargar
                </button>
              </div>
            </div>
          </div>
        ) : (
          <iframe
            src={`${data.url}#toolbar=1&navpanes=0&scrollbar=1`}
            className="w-full h-full border-0"
            title={title}
            onError={() => setLoadError(true)}
          />
        )}
      </div>
    </div>
  );
};

export default PDFPage;
