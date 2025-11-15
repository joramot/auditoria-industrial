// ImageUploader.jsx - Versión 3.0 CON ELIMINACIÓN
// Componente para captura, vista previa, gestión y ELIMINACIÓN de imágenes

import React, { useState } from 'react';
import { Camera, Upload, X, Loader, Image as ImageIcon, Trash2, Eye } from 'lucide-react';
import { deleteEquipmentImage, deletePlacaImage } from './deletionService_INTEGRATED';

const ImageUploader = ({ 
  category,                    // "equipment" o "plate"
  label,
  images = [],
  onImagesChange,
  equipmentId,                 // ID del equipo (para eliminación)
  plantId,                     // ID de la planta (para eliminación)
  isOnline = true,             // Estado de conexión
  maxImages = 10,
  disabled = false
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [deletingImageId, setDeletingImageId] = useState(null);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    // Verificar límite
    if (images.length + files.length > maxImages) {
      alert(`⚠️ Límite de ${maxImages} imágenes por categoría`);
      return;
    }

    setIsUploading(true);

    try {
      // Convertir archivos a preview URLs
      const newImages = await Promise.all(
        files.map(async (file) => ({
          file: file,
          preview: URL.createObjectURL(file),
          name: file.name,
          size: file.size,
          isNew: true
        }))
      );

      onImagesChange([...images, ...newImages]);
    } catch (error) {
      alert('❌ Error al procesar imágenes: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  /**
   * 🗑️ ELIMINAR IMAGEN - NUEVA FUNCIÓN CON INTEGRACIÓN
   */
  const handleDelete = async (index) => {
    const imageToDelete = images[index];
    
    // Confirmación
    if (!window.confirm(`¿Eliminar ${imageToDelete.name || 'esta imagen'}?`)) {
      return;
    }

    setDeletingImageId(index);
    console.log(`🗑️ Eliminando imagen: ${imageToDelete.name}`);

    try {
      // Si es una imagen nueva (no sincronizada), solo remover de la lista
      if (imageToDelete.isNew) {
        console.log("📦 Imagen no sincronizada, removiendo de la lista...");
        if (imageToDelete.preview) {
          URL.revokeObjectURL(imageToDelete.preview);
        }
        const newImages = images.filter((_, i) => i !== index);
        onImagesChange(newImages);
        setDeletingImageId(null);
        return;
      }

      // Si ya está sincronizada, usar función de eliminación
      const deleteFunction = category === "equipment" 
        ? deleteEquipmentImage 
        : deletePlacaImage;
      
      const result = await deleteFunction(
        equipmentId,
        plantId,
        imageToDelete,
        isOnline
      );

      if (result.success) {
        console.log("✅ Imagen eliminada correctamente");
        
        // Remover de la lista local
        const newImages = images.filter((_, i) => i !== index);
        onImagesChange(newImages);
        
        // Mostrar mensaje
        alert(result.message);
      } else {
        console.error("❌ Error al eliminar imagen:", result.error);
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("❌ Error crítico al eliminar imagen:", error);
      alert("Error al eliminar la imagen. Intenta de nuevo.");
    } finally {
      setDeletingImageId(null);
    }
  };

  /**
   * Remover imagen (función original, ahora llama a handleDelete)
   */
  const handleRemove = (index) => {
    handleDelete(index);
  };

  const handleCameraCapture = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.capture = 'environment';
    input.multiple = true;
    input.onchange = handleFileSelect;
    input.click();
  };

  const handleGallerySelect = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.multiple = true;
    input.onchange = handleFileSelect;
    input.click();
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        {label} {images.length > 0 && `(${images.length}/${maxImages})`}
      </label>

      {/* Botones de captura */}
      <div className="flex gap-2">
        <button 
          type="button"
          onClick={handleCameraCapture}
          disabled={disabled || isUploading || images.length >= maxImages}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? (
            <Loader className="w-5 h-5 text-gray-600 animate-spin" />
          ) : (
            <Camera className="w-5 h-5 text-gray-600" />
          )}
          <span className="text-sm text-gray-600">Cámara</span>
        </button>
        
        <button 
          type="button"
          onClick={handleGallerySelect}
          disabled={disabled || isUploading || images.length >= maxImages}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isUploading ? (
            <Loader className="w-5 h-5 text-gray-600 animate-spin" />
          ) : (
            <Upload className="w-5 h-5 text-gray-600" />
          )}
          <span className="text-sm text-gray-600">Galería</span>
        </button>
      </div>

      {/* Vista previa de imágenes */}
      {images.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {images.map((image, index) => (
            <div key={index} className="relative group">
              <img
                src={image.preview || image.url}
                alt={`${label} ${index + 1}`}
                className="w-full h-24 object-cover rounded-lg border-2 border-gray-200"
              />
              
              {/* Overlay con botones */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all rounded-lg flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => setPreviewImage(image.preview || image.url)}
                  className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                  title="Ver imagen"
                  disabled={deletingImageId === index}
                >
                  <Eye className="w-4 h-4 text-gray-700" />
                </button>
                
                <button
                  type="button"
                  onClick={() => handleRemove(index)}
                  disabled={disabled || deletingImageId === index}
                  className={`p-2 bg-white rounded-full transition-colors ${
                    deletingImageId === index
                      ? "cursor-wait"
                      : "hover:bg-red-100"
                  }`}
                  title={image.isNew ? "Remover imagen" : "Eliminar imagen"}
                >
                  {deletingImageId === index ? (
                    <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Trash2 className="w-4 h-4 text-red-600" />
                  )}
                </button>
              </div>

              {/* Indicador de nueva imagen */}
              {image.isNew && (
                <div className="absolute top-1 right-1 bg-green-500 text-white text-xs px-2 py-0.5 rounded-full">
                  Nueva
                </div>
              )}

              {/* Indicador de eliminando */}
              {deletingImageId === index && (
                <div className="absolute inset-0 bg-black bg-opacity-50 rounded-lg flex items-center justify-center">
                  <div className="text-white text-xs font-medium">
                    Eliminando...
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Información */}
      {images.length === 0 && (
        <div className="text-center py-6 border-2 border-dashed border-gray-200 rounded-lg">
          <ImageIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">No hay imágenes capturadas</p>
        </div>
      )}

      {/* Indicador de modo offline */}
      {!isOnline && (
        <div className="p-2 bg-orange-50 border border-orange-200 rounded-lg text-xs text-orange-700">
          📡 Modo Offline: Los cambios se sincronizarán al conectar
        </div>
      )}

      {/* Modal de vista previa */}
      {previewImage && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-full">
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="w-6 h-6 text-gray-700" />
            </button>
            <img
              src={previewImage}
              alt="Vista previa"
              className="max-w-full max-h-[90vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;
