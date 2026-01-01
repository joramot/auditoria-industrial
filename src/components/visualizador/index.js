/**
 * Componentes del Visualizador
 *
 * Exportaciones del módulo de visualización de expedientes
 */

export { VisualizadorDashboard } from './VisualizadorDashboard';
export { VisualizadorSidebar } from './VisualizadorSidebar';
export { ExpedienteViewer } from './ExpedienteViewer';

// Páginas del expediente
export { CaratulaPage } from './pages/CaratulaPage';
export { ImagePage } from './pages/ImagePage';
export { PDFPage } from './pages/PDFPage';

// Hooks
export { useExpediente, PAGE_TYPES } from './hooks/useExpediente';
