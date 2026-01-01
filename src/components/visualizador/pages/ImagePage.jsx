/**
 * ImagePage.jsx - Página para mostrar imágenes del expediente
 *
 * Muestra una imagen del equipo o de la placa a pantalla completa
 */

import React, { useState } from 'react';
import { ImageOff, ZoomIn, ZoomOut, RotateCw } from 'lucide-react';

/**
 * @param {Object} props
 * @param {Object} props.data - Datos de la imagen { url, category }
 * @param {string} props.title - Título de la página
 */
export const ImagePage = ({ data, title }) => {
  const [imageError, setImageError] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);

  if (!data || !data.url) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-100">
        <div className="text-center text-gray-500">
          <ImageOff className="w-16 h-16 mx-auto mb-4" />
          <p>No hay imagen disponible</p>
        </div>
      </div>
    );
  }

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleRotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const resetView = () => {
    setZoom(1);
    setRotation(0);
  };

  return (
    <div className="w-full h-full flex flex-col bg-gray-900">
      {/* Barra de herramientas */}
      <div className="bg-gray-800 p-2 flex items-center justify-between">
        <h3 className="text-white font-medium px-2">{title}</h3>
        <div className="flex items-center gap-2">
          <button
            onClick={handleZoomOut}
            className="p-2 text-white hover:bg-gray-700 rounded transition-colors"
            title="Alejar"
          >
            <ZoomOut className="w-5 h-5" />
          </button>
          <span className="text-white text-sm min-w-[50px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-2 text-white hover:bg-gray-700 rounded transition-colors"
            title="Acercar"
          >
            <ZoomIn className="w-5 h-5" />
          </button>
          <button
            onClick={handleRotate}
            className="p-2 text-white hover:bg-gray-700 rounded transition-colors"
            title="Rotar"
          >
            <RotateCw className="w-5 h-5" />
          </button>
          <button
            onClick={resetView}
            className="px-3 py-1 text-white text-sm hover:bg-gray-700 rounded transition-colors"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Contenedor de imagen */}
      <div className="flex-1 overflow-auto flex items-center justify-center p-4">
        {imageError ? (
          <div className="text-center text-gray-400">
            <ImageOff className="w-16 h-16 mx-auto mb-4" />
            <p>Error al cargar la imagen</p>
          </div>
        ) : (
          <img
            src={data.url}
            alt={title}
            className="max-w-full max-h-full object-contain transition-transform duration-200"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              transformOrigin: 'center center'
            }}
            onError={() => setImageError(true)}
          />
        )}
      </div>
    </div>
  );
};

export default ImagePage;
