/**
 * useExpediente.js - Hook para gestionar datos del expediente
 *
 * Carga los datos de un equipo y genera la estructura de páginas
 * del expediente para el visor del rol Visualizador.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  getEquipmentById,
  getEquipmentImages,
  getEquipmentPDFs
} from '../../../services/firebase/firebaseServices';

/**
 * Tipos de página del expediente
 */
export const PAGE_TYPES = {
  CARATULA: 'caratula',
  IMAGE: 'image',
  PDF: 'pdf'
};

/**
 * Hook para cargar y gestionar el expediente de un equipo
 * @param {string} equipmentId - ID del equipo
 * @param {string} plantId - ID de la planta
 * @returns {Object} Estado del expediente y funciones de navegación
 */
export const useExpediente = (equipmentId, plantId) => {
  const [equipment, setEquipment] = useState(null);
  const [images, setImages] = useState({ equipment: [], plate: [] });
  const [pdfs, setPdfs] = useState({ factura: [], pedimento: [] });
  const [pages, setPages] = useState([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  /**
   * Genera la estructura de páginas del expediente
   */
  const generatePages = useCallback((equipmentData, imagesData, pdfsData) => {
    const pagesList = [];

    // Página 1: Carátula
    pagesList.push({
      type: PAGE_TYPES.CARATULA,
      title: 'Carátula del Expediente',
      data: {
        equipmentName: equipmentData.name || equipmentData.equipmentName || 'Sin nombre',
        serialNumber: equipmentData.serialNumber || 'N/A',
        invoiceNumber: equipmentData.invoiceNumber || 'N/A',
        customsNumber: equipmentData.customsNumber || 'N/A',
        manufacturer: equipmentData.manufacturer || '',
        model: equipmentData.model || '',
        countryOfOrigin: equipmentData.countryOfOrigin || '',
        origin: equipmentData.origin || ''
      }
    });

    // Página 2: Imagen del equipo (primera imagen disponible)
    if (imagesData.equipment && imagesData.equipment.length > 0) {
      pagesList.push({
        type: PAGE_TYPES.IMAGE,
        title: 'Imagen del Equipo',
        data: {
          url: imagesData.equipment[0].url,
          category: 'equipment'
        }
      });
    }

    // Página 3: Imagen de la placa (primera imagen disponible)
    if (imagesData.plate && imagesData.plate.length > 0) {
      pagesList.push({
        type: PAGE_TYPES.IMAGE,
        title: 'Imagen de la Placa',
        data: {
          url: imagesData.plate[0].url,
          category: 'plate'
        }
      });
    }

    // Páginas de facturas
    if (pdfsData.factura && pdfsData.factura.length > 0) {
      pdfsData.factura.forEach((pdf, index) => {
        pagesList.push({
          type: PAGE_TYPES.PDF,
          title: `Factura ${index + 1}`,
          data: {
            url: pdf.url,
            name: pdf.name || pdf.fileName,
            category: 'factura'
          }
        });
      });
    }

    // Páginas de pedimentos
    if (pdfsData.pedimento && pdfsData.pedimento.length > 0) {
      pdfsData.pedimento.forEach((pdf, index) => {
        pagesList.push({
          type: PAGE_TYPES.PDF,
          title: `Pedimento ${index + 1}`,
          data: {
            url: pdf.url,
            name: pdf.name || pdf.fileName,
            category: 'pedimento'
          }
        });
      });
    }

    return pagesList;
  }, []);

  /**
   * Carga todos los datos del expediente
   */
  const loadExpediente = useCallback(async () => {
    if (!equipmentId || !plantId) {
      setPages([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Cargar datos del equipo
      const equipResult = await getEquipmentById(equipmentId);
      if (!equipResult.success) {
        throw new Error(equipResult.error || 'Error al cargar equipo');
      }

      // Cargar imágenes
      const imagesResult = await getEquipmentImages(plantId, equipmentId);
      const imagesData = imagesResult.success ? imagesResult.images : { equipment: [], plate: [] };

      // Cargar PDFs
      const pdfsResult = await getEquipmentPDFs(plantId, equipmentId);
      const pdfsData = pdfsResult.success ? pdfsResult.pdfs : { factura: [], pedimento: [] };

      // Actualizar estado
      setEquipment(equipResult.data);
      setImages(imagesData);
      setPdfs(pdfsData);

      // Generar páginas
      const generatedPages = generatePages(equipResult.data, imagesData, pdfsData);
      setPages(generatedPages);
      setCurrentPage(0);

    } catch (err) {
      console.error('Error al cargar expediente:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [equipmentId, plantId, generatePages]);

  // Cargar expediente cuando cambia el equipo
  useEffect(() => {
    loadExpediente();
  }, [loadExpediente]);

  // Navegación de páginas
  const goToPage = useCallback((pageNumber) => {
    if (pageNumber >= 0 && pageNumber < pages.length) {
      setCurrentPage(pageNumber);
    }
  }, [pages.length]);

  const nextPage = useCallback(() => {
    goToPage(currentPage + 1);
  }, [currentPage, goToPage]);

  const prevPage = useCallback(() => {
    goToPage(currentPage - 1);
  }, [currentPage, goToPage]);

  const firstPage = useCallback(() => {
    goToPage(0);
  }, [goToPage]);

  const lastPage = useCallback(() => {
    goToPage(pages.length - 1);
  }, [pages.length, goToPage]);

  return {
    // Datos
    equipment,
    images,
    pdfs,
    pages,

    // Página actual
    currentPage,
    currentPageData: pages[currentPage] || null,
    totalPages: pages.length,

    // Navegación
    goToPage,
    nextPage,
    prevPage,
    firstPage,
    lastPage,

    // Estado
    loading,
    error,
    reload: loadExpediente,

    // Helpers
    hasNextPage: currentPage < pages.length - 1,
    hasPrevPage: currentPage > 0
  };
};

export default useExpediente;
