/**
 * ImageSlider.jsx - Componente Slider/Carrusel de Imagenes
 * Permite navegar entre imagenes del equipo y placa con controles
 *
 * NOTA: Las imagenes vienen como objetos {url, path, uploadDate}
 */

import React, { useState, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Camera,
  Download,
  ZoomIn
} from 'lucide-react';

/**
 * Obtiene la URL de una imagen (puede ser string u objeto con propiedad url)
 */
const getImageUrl = (image) => {
  if (!image) return null;
  if (typeof image === 'string') return image;
  return image.url || image.preview || null;
};

const EMPTY_ARRAY = [];

/**
 * Componente Slider de Imagenes
 *
 * @param {Object} props
 * @param {Array} props.equipmentImages - Array de imagenes del equipo (objetos o strings)
 * @param {Array} props.plateImages - Array de imagenes de la placa (objetos o strings)
 * @param {Function} props.onViewFullscreen - Callback para ver imagen en fullscreen
 * @param {Function} props.onDownload - Callback para descargar imagen
 */
const ImageSlider = ({
  equipmentImages = EMPTY_ARRAY,
  plateImages = EMPTY_ARRAY,
  onViewFullscreen,
  onDownload
}) => {
  const [currentCategory, setCurrentCategory] = useState('equipment');
  const [currentIndex, setCurrentIndex] = useState(0);

  const hasEquipmentImages = equipmentImages && equipmentImages.length > 0;
  const hasPlateImages = plateImages && plateImages.length > 0;

  // Inicializar categoria con la que tenga imagenes
  useEffect(() => {
    if (!hasEquipmentImages && hasPlateImages) {
      setCurrentCategory('plate');
    } else if (hasEquipmentImages) {
      setCurrentCategory('equipment');
    }
    setCurrentIndex(0);
  }, [hasEquipmentImages, hasPlateImages]);

  // Obtener imagenes de la categoria actual
  const currentImages = currentCategory === 'equipment' ? equipmentImages : plateImages;
  const totalImages = currentImages ? currentImages.length : 0;

  // Obtener URL de imagen actual
  const currentImageUrl = totalImages > 0 ? getImageUrl(currentImages[currentIndex]) : null;

  // Navegacion
  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : totalImages - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev < totalImages - 1 ? prev + 1 : 0));
  };

  // Cambiar categoria
  const handleCategoryChange = (category) => {
    setCurrentCategory(category);
    setCurrentIndex(0);
  };

  // Manejar ver en fullscreen - extraer URLs
  const handleViewFullscreen = () => {
    if (onViewFullscreen && currentImages.length > 0) {
      // Extraer URLs de todos los objetos de imagen
      const urls = currentImages.map(img => getImageUrl(img)).filter(Boolean);
      onViewFullscreen(urls, currentIndex);
    }
  };

  // Manejar descarga
  const handleDownload = () => {
    if (onDownload && currentImageUrl) {
      onDownload(currentImageUrl, currentIndex);
    }
  };

  // Si no hay imagenes
  if (!hasEquipmentImages && !hasPlateImages) {
    return (
      <div className="bg-gray-100 rounded-lg p-6 flex flex-col items-center justify-center h-64 border border-gray-200">
        <Camera className="w-12 h-12 text-gray-400 mb-2" />
        <p className="text-sm text-gray-500">Sin imagenes disponibles</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* Header con tabs de categoria */}
      <div className="flex border-b border-gray-200">
        {hasEquipmentImages && (
          <button
            onClick={() => handleCategoryChange('equipment')}
            className={`flex-1 py-2 px-3 text-xs font-medium transition-colors ${
              currentCategory === 'equipment'
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Equipo ({equipmentImages.length})
          </button>
        )}
        {hasPlateImages && (
          <button
            onClick={() => handleCategoryChange('plate')}
            className={`flex-1 py-2 px-3 text-xs font-medium transition-colors ${
              currentCategory === 'plate'
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Placa ({plateImages.length})
          </button>
        )}
      </div>

      {/* Area de imagen principal */}
      <div className="relative bg-gray-900 aspect-[4/3]">
        {currentImageUrl ? (
          <>
            {/* Imagen */}
            <img
              src={currentImageUrl}
              alt={`${currentCategory === 'equipment' ? 'Equipo' : 'Placa'} ${currentIndex + 1}`}
              className="w-full h-full object-contain"
              onError={(e) => {
                console.error('Error cargando imagen:', currentImageUrl);
                e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect fill="%23ddd" width="100" height="100"/><text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="%23999">Error</text></svg>';
              }}
            />

            {/* Overlay con botones */}
            <div className="absolute top-2 right-2 flex gap-1">
              <button
                onClick={handleViewFullscreen}
                className="p-1.5 bg-black/50 hover:bg-black/70 rounded text-white transition-colors"
                title="Ver en pantalla completa"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              <button
                onClick={handleDownload}
                className="p-1.5 bg-black/50 hover:bg-black/70 rounded text-white transition-colors"
                title="Descargar"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>

            {/* Botones de navegacion */}
            {totalImages > 1 && (
              <>
                <button
                  onClick={handlePrevious}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={handleNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-black/50 hover:bg-black/70 rounded-full text-white transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Indicador de posicion */}
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/50 rounded text-white text-xs">
              {currentIndex + 1} / {totalImages}
            </div>
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <p className="text-gray-400 text-sm">No hay imagenes en esta categoria</p>
          </div>
        )}
      </div>

      {/* Miniaturas */}
      {totalImages > 1 && (
        <div className="p-2 bg-gray-50 border-t border-gray-200">
          <div className="flex gap-1 overflow-x-auto">
            {currentImages.map((img, index) => {
              const imgUrl = getImageUrl(img);
              return (
                <button
                  key={imgUrl || index}
                  onClick={() => setCurrentIndex(index)}
                  className={`flex-shrink-0 w-12 h-12 rounded overflow-hidden border-2 transition-colors ${
                    index === currentIndex
                      ? 'border-blue-500'
                      : 'border-transparent hover:border-gray-300'
                  }`}
                >
                  <img
                    src={imgUrl}
                    alt={`Miniatura ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48"><rect fill="%23ddd" width="48" height="48"/></svg>';
                    }}
                  />
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageSlider;
