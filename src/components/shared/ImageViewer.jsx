/**
 * ImageViewer.jsx - Visor de Imágenes con Zoom y Navegación
 * Modal para visualizar imágenes con controles de zoom y navegación
 */

import React, { useState, useEffect } from 'react';
import { 
  X, 
  ZoomIn, 
  ZoomOut,
  Download,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2
} from 'lucide-react';

/**
 * Componente Visor de Imágenes
 * 
 * @param {Object} props
 * @param {boolean} props.isOpen - Si el modal está abierto
 * @param {Function} props.onClose - Callback al cerrar
 * @param {Array} props.images - Array de URLs de imágenes
 * @param {number} props.initialIndex - Índice inicial (default: 0)
 * @param {string} props.title - Título del visor
 */
const ImageViewer = ({ 
  isOpen = false, 
  onClose, 
  images = [], 
  initialIndex = 0,
  title = 'Visor de Imágenes'
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Reset index cuando se abre el modal o cambia initialIndex
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setZoom(1);
    }
  }, [isOpen, initialIndex]);

  // Reset zoom cuando cambia la imagen
  useEffect(() => {
    setZoom(1);
  }, [currentIndex]);

  // Navegación con teclado
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      switch(e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          handlePrevious();
          break;
        case 'ArrowRight':
          handleNext();
          break;
        case '+':
        case '=':
          handleZoomIn();
          break;
        case '-':
          handleZoomOut();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentIndex, zoom]);

  if (!isOpen || images.length === 0) return null;

  const currentImage = images[currentIndex];
  const hasMultipleImages = images.length > 1;

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(currentImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `imagen-${currentIndex + 1}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error al descargar imagen:', error);
      alert('Error al descargar la imagen');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 bg-black bg-opacity-50 p-4 z-10">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold text-lg">{title}</h3>
            {hasMultipleImages && (
              <p className="text-gray-300 text-sm">
                Imagen {currentIndex + 1} de {images.length}
              </p>
            )}
          </div>
          
          {/* Controles de Zoom */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleZoomOut}
              disabled={zoom <= 0.5}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title="Alejar (tecla -)"
            >
              <ZoomOut className="w-5 h-5" />
            </button>
            
            <span className="text-white font-medium min-w-[60px] text-center">
              {Math.round(zoom * 100)}%
            </span>
            
            <button
              onClick={handleZoomIn}
              disabled={zoom >= 3}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title="Acercar (tecla +)"
            >
              <ZoomIn className="w-5 h-5" />
            </button>

            <div className="w-px h-6 bg-white bg-opacity-30 mx-2"></div>

            <button
              onClick={handleDownload}
              className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-2 rounded-lg transition-all"
              title="Descargar imagen"
            >
              <Download className="w-5 h-5" />
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
              title="Cerrar (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Imagen */}
      <div className={`relative flex items-center justify-center ${isFullscreen ? 'w-full h-full' : 'w-full h-full p-20'}`}>
        <img
          src={currentImage}
          alt={`Imagen ${currentIndex + 1}`}
          className="max-w-full max-h-full object-contain transition-transform duration-300"
          style={{ 
            transform: `scale(${zoom})`,
            cursor: zoom > 1 ? 'move' : 'default'
          }}
        />
      </div>

      {/* Navegación (solo si hay múltiples imágenes) */}
      {hasMultipleImages && (
        <>
          {/* Botón Anterior */}
          {currentIndex > 0 && (
            <button
              onClick={handlePrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-3 rounded-full transition-all"
              title="Imagen anterior (←)"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>
          )}

          {/* Botón Siguiente */}
          {currentIndex < images.length - 1 && (
            <button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-30 text-white p-3 rounded-full transition-all"
              title="Siguiente imagen (→)"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          )}

          {/* Miniaturas */}
          <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 p-4">
            <div className="max-w-6xl mx-auto flex gap-2 overflow-x-auto pb-2">
              {images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={`
                    flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all
                    ${currentIndex === index 
                      ? 'border-blue-500 ring-2 ring-blue-400' 
                      : 'border-white border-opacity-30 hover:border-opacity-60'
                    }
                  `}
                >
                  <img
                    src={img}
                    alt={`Miniatura ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Instrucciones */}
      <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white text-xs p-2 rounded">
        <p>← → : Navegar | + - : Zoom | Esc : Cerrar</p>
      </div>
    </div>
  );
};

export default ImageViewer;
