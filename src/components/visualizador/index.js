/**
 * Componentes del Visualizador
 *
 * Exportaciones del módulo de visualización de expedientes
 * @version 2.0.0 - Homologado con estructura de Auditor
 */

export { VisualizadorDashboard } from './VisualizadorDashboard';
export { VisualizadorSidebar } from './VisualizadorSidebar';
export { ExpedienteViewer } from './ExpedienteViewer';
export { default as VisualizadorPlantsList } from './VisualizadorPlantsList';
export { default as VisualizadorEquipmentTable } from './VisualizadorEquipmentTable';

// Páginas del expediente
export { CaratulaPage } from './pages/CaratulaPage';
export { ImagePage } from './pages/ImagePage';
export { PDFPage } from './pages/PDFPage';

// Hooks
export { useExpediente, PAGE_TYPES } from './hooks/useExpediente';
