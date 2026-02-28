/**
 * ImageViewer.jsx - Visor de Imágenes con Zoom, Rotación y Navegación
 * Modal para visualizar imágenes con controles completos
 *
 * @version 2.0.0
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  ZoomIn,
  ZoomOut,
  Download,
  ChevronLeft,
  ChevronRight,
  RotateCw,
  RotateCcw,
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
const EMPTY_IMAGES = [];

const ImageViewer = ({
  isOpen = false,
  onClose,
  images = EMPTY_IMAGES,
  initialIndex = 0,
  title = 'Visor de Imágenes'
}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  // Reset cuando se abre el modal o cambia initialIndex
  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
      setZoom(1);
      setRotation(0);
    }
  }, [isOpen, initialIndex]);

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
        case 'r':
        case 'R':
          handleRotateRight();
          break;
        case 'l':
        case 'L':
          handleRotateLeft();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, currentIndex, zoom, rotation]);

  if (!isOpen || images.length === 0) return null;

  const currentImage = images[currentIndex];
  const hasMultipleImages = images.length > 1;

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
      setZoom(1);
      setRotation(0);
    }
  };

  const handleNext = () => {
    if (currentIndex < images.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setZoom(1);
      setRotation(0);
    }
  };

  const handleZoomIn = () => {
    setZoom(prev => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoom(prev => Math.max(prev - 0.25, 0.5));
  };

  const handleRotateRight = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const handleRotateLeft = () => {
    setRotation(prev => (prev - 90 + 360) % 360);
  };

  const handleResetView = () => {
    setZoom(1);
    setRotation(0);
  };

  // Descargar imagen actual
  const handleDownloadCurrent = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch(currentImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `imagen-${currentIndex + 1}.webp`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error al descargar imagen:', error);
      alert('Error al descargar la imagen');
    } finally {
      setIsDownloading(false);
    }
  };

  // Descargar todas las imágenes
  const handleDownloadAll = async () => {
    if (images.length === 1) {
      handleDownloadCurrent();
      return;
    }

    setIsDownloading(true);
    try {
      for (let i = 0; i < images.length; i++) {
        const response = await fetch(images[i]);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `imagen-${i + 1}.webp`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        // Pequeña pausa entre descargas
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    } catch (error) {
      console.error('Error al descargar imágenes:', error);
      alert('Error al descargar las imágenes');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/95 z-[60] flex flex-col">
      {/* Header */}
      <div className="bg-gradient-to-b from-black/80 to-transparent p-4 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold text-lg">{title}</h3>
            {hasMultipleImages && (
              <p className="text-gray-300 text-sm">
                Imagen {currentIndex + 1} de {images.length}
              </p>
            )}
          </div>

          {/* Controles */}
          <div className="flex items-center gap-1.5">
            {/* Rotación */}
            <button
              onClick={handleRotateLeft}
              className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition-all"
              title="Girar izquierda (L)"
            >
              <RotateCcw className="w-5 h-5" />
            </button>

            <button
              onClick={handleRotateRight}
              className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition-all"
              title="Girar derecha (R)"
            >
              <RotateCw className="w-5 h-5" />
            </button>

            <div className="w-px h-6 bg-white/30 mx-1.5"></div>

            {/* Zoom */}
            <button
              onClick={handleZoomOut}
              disabled={zoom <= 0.5}
              className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title="Alejar (-)"
            >
              <ZoomOut className="w-5 h-5" />
            </button>

            <button
              onClick={handleResetView}
              className="text-white font-medium min-w-[60px] text-center text-sm hover:bg-white/20 rounded-lg py-1 transition-all"
              title="Restablecer vista"
            >
              {Math.round(zoom * 100)}%
            </button>

            <button
              onClick={handleZoomIn}
              disabled={zoom >= 3}
              className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title="Acercar (+)"
            >
              <ZoomIn className="w-5 h-5" />
            </button>

            <div className="w-px h-6 bg-white/30 mx-1.5"></div>

            {/* Descargar */}
            <button
              onClick={handleDownloadCurrent}
              disabled={isDownloading}
              className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition-all disabled:opacity-50 flex items-center gap-1.5"
              title="Descargar imagen actual"
            >
              <Download className="w-5 h-5" />
            </button>

            {hasMultipleImages && (
              <button
                onClick={handleDownloadAll}
                disabled={isDownloading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg transition-all disabled:opacity-50 text-sm font-medium"
                title="Descargar todas las imágenes"
              >
                {isDownloading ? 'Descargando...' : `Descargar todas (${images.length})`}
              </button>
            )}

            <div className="w-px h-6 bg-white/30 mx-1.5"></div>

            {/* Fullscreen */}
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="bg-white/20 hover:bg-white/30 text-white p-2 rounded-lg transition-all"
              title={isFullscreen ? "Salir de pantalla completa" : "Pantalla completa"}
            >
              {isFullscreen ? (
                <Minimize2 className="w-5 h-5" />
              ) : (
                <Maximize2 className="w-5 h-5" />
              )}
            </button>

            {/* Cerrar */}
            <button
              onClick={onClose}
              className="bg-red-500/80 hover:bg-red-500 text-white p-2 rounded-lg transition-all ml-2"
              title="Cerrar (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Contenedor de imagen */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        <div
          className={`flex items-center justify-center ${isFullscreen ? 'w-full h-full' : 'w-full h-full p-4 md:p-16'}`}
        >
          <img
            src={currentImage}
            alt={`Imagen ${currentIndex + 1}`}
            className="max-w-full max-h-full object-contain transition-transform duration-300 ease-out"
            style={{
              transform: `scale(${zoom}) rotate(${rotation}deg)`,
              cursor: zoom > 1 ? 'grab' : 'default'
            }}
            draggable={false}
          />
        </div>

        {/* Navegación (solo si hay múltiples imágenes) */}
        {hasMultipleImages && (
          <>
            {/* Botón Anterior */}
            <button
              onClick={handlePrevious}
              disabled={currentIndex === 0}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 disabled:opacity-30 disabled:cursor-not-allowed text-white p-3 rounded-full transition-all"
              title="Imagen anterior (←)"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>

            {/* Botón Siguiente */}
            <button
              onClick={handleNext}
              disabled={currentIndex === images.length - 1}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 disabled:opacity-30 disabled:cursor-not-allowed text-white p-3 rounded-full transition-all"
              title="Siguiente imagen (→)"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          </>
        )}
      </div>

      {/* Footer con miniaturas */}
      {hasMultipleImages && (
        <div className="bg-gradient-to-t from-black/80 to-transparent p-4">
          <div className="max-w-4xl mx-auto flex gap-2 overflow-x-auto pb-2 justify-center">
            {images.map((img, index) => (
              <button
                key={img}
                onClick={() => {
                  setCurrentIndex(index);
                  setZoom(1);
                  setRotation(0);
                }}
                className={`
                  flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 transition-all
                  ${currentIndex === index
                    ? 'border-blue-500 ring-2 ring-blue-400/50 scale-105'
                    : 'border-white/30 hover:border-white/60 opacity-70 hover:opacity-100'
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
      )}

      {/* Indicador de rotación */}
      {rotation !== 0 && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 bg-black/70 text-white text-sm px-3 py-1.5 rounded-full">
          Rotación: {rotation}°
        </div>
      )}

      {/* Instrucciones */}
      <div className="absolute bottom-4 left-4 bg-black/60 text-white/80 text-xs p-2 rounded-lg hidden md:block">
        <p>← → Navegar | + - Zoom | R L Rotar | Esc Cerrar</p>
      </div>
    </div>
  );
};

export default ImageViewer;
