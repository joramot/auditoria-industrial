/**
 * RoleGate.jsx - Componente de Renderizado Condicional por Rol
 * Versión: 1.0
 * 
 * Muestra u oculta contenido basado en el rol del usuario.
 * No muestra ningún indicador visual cuando el acceso es denegado.
 * 
 * FASE 3: Control de Acceso - Tarea 3.3
 */

import React from 'react';
import { useAuthWithRole } from '../../hooks/useAuthWithRole';
import { ROLES, PERMISSIONS } from '../../services/migration/roleService';

/**
 * 🎭 COMPONENTE ROLE GATE
 * 
 * Muestra contenido solo si el usuario tiene el rol permitido.
 * 
 * Uso básico:
 * ```jsx
 * <RoleGate allowedRoles={['admin']}>
 *   <BotonEliminar />
 * </RoleGate>
 * ```
 * 
 * Con fallback:
 * ```jsx
 * <RoleGate 
 *   allowedRoles={['admin', 'supervisor']}
 *   fallback={<MensajeSoloLectura />}
 * >
 *   <FormularioEdicion />
 * </RoleGate>
 * ```
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - Contenido a mostrar si tiene rol
 * @param {Array<string>} props.allowedRoles - Roles permitidos
 * @param {React.ReactNode} props.fallback - Contenido alternativo si no tiene rol
 * @param {boolean} props.showLoading - Mostrar indicador de carga
 */
export const RoleGate = ({
  children,
  allowedRoles = [],
  fallback = null,
  showLoading = false
}) => {
  const { role, isFullyLoaded } = useAuthWithRole();

  // Mostrar carga si se solicita
  if (showLoading && !isFullyLoaded) {
    return (
      <div className="animate-pulse bg-gray-200 rounded h-8 w-24"></div>
    );
  }

  // Si no ha cargado, no mostrar nada
  if (!isFullyLoaded) {
    return null;
  }

  // Verificar si tiene rol permitido
  const hasAccess = allowedRoles.includes(role);

  // Si tiene acceso, mostrar contenido
  if (hasAccess) {
    return <>{children}</>;
  }

  // Si no tiene acceso, mostrar fallback o nada
  return fallback ? <>{fallback}</> : null;
};

/**
 * 👑 COMPONENTE ADMIN ONLY
 * 
 * Muestra contenido solo para administradores.
 * 
 * Uso:
 * ```jsx
 * <AdminOnly>
 *   <PanelAdministracion />
 * </AdminOnly>
 * ```
 */
export const AdminOnly = ({ children, fallback = null }) => (
  <RoleGate allowedRoles={[ROLES.ADMIN]} fallback={fallback}>
    {children}
  </RoleGate>
);

/**
 * 👷 COMPONENTE SUPERVISOR ONLY
 * 
 * Muestra contenido para supervisores (y admins).
 */
export const SupervisorOnly = ({ children, fallback = null, includeAdmin = true }) => (
  <RoleGate 
    allowedRoles={includeAdmin ? [ROLES.ADMIN, ROLES.SUPERVISOR] : [ROLES.SUPERVISOR]} 
    fallback={fallback}
  >
    {children}
  </RoleGate>
);

/**
 * 🔍 COMPONENTE AUDITOR ONLY
 * 
 * Muestra contenido para auditores (y admins).
 */
export const AuditorOnly = ({ children, fallback = null, includeAdmin = true }) => (
  <RoleGate 
    allowedRoles={includeAdmin ? [ROLES.ADMIN, ROLES.AUDITOR] : [ROLES.AUDITOR]} 
    fallback={fallback}
  >
    {children}
  </RoleGate>
);

/**
 * 🚫 COMPONENTE HIDE FROM ROLE
 * 
 * Oculta contenido de ciertos roles.
 * 
 * Uso:
 * ```jsx
 * <HideFromRole roles={['auditor']}>
 *   <BotonEditar />
 * </HideFromRole>
 * ```
 */
export const HideFromRole = ({ children, roles = [], fallback = null }) => {
  const { role, isFullyLoaded } = useAuthWithRole();

  if (!isFullyLoaded) {
    return null;
  }

  // Si el usuario tiene uno de los roles a ocultar, no mostrar
  if (roles.includes(role)) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
};

/**
 * 🔐 COMPONENTE PERMISSION GATE
 * 
 * Muestra contenido basado en permisos específicos.
 * 
 * Uso:
 * ```jsx
 * <PermissionGate permission="equipment.delete">
 *   <BotonEliminar />
 * </PermissionGate>
 * ```
 */
export const PermissionGate = ({
  children,
  permission,
  fallback = null,
  showLoading = false
}) => {
  const { hasPermissionSync, isFullyLoaded } = useAuthWithRole();

  if (showLoading && !isFullyLoaded) {
    return (
      <div className="animate-pulse bg-gray-200 rounded h-8 w-24"></div>
    );
  }

  if (!isFullyLoaded) {
    return null;
  }

  const hasAccess = hasPermissionSync(permission);

  if (hasAccess) {
    return <>{children}</>;
  }

  return fallback ? <>{fallback}</> : null;
};

/**
 * ✏️ COMPONENTE CAN EDIT GATE
 * 
 * Muestra contenido si el usuario puede editar un campo específico.
 * 
 * Uso:
 * ```jsx
 * <CanEditGate field="observations">
 *   <CampoObservaciones editable />
 * </CanEditGate>
 * ```
 */
export const CanEditGate = ({
  children,
  field,
  fallback = null,
  showLoading = false
}) => {
  const { canEditFieldSync, isFullyLoaded } = useAuthWithRole();

  if (showLoading && !isFullyLoaded) {
    return (
      <div className="animate-pulse bg-gray-200 rounded h-8 w-full"></div>
    );
  }

  if (!isFullyLoaded) {
    return null;
  }

  const canEdit = canEditFieldSync(field);

  if (canEdit) {
    return <>{children}</>;
  }

  return fallback ? <>{fallback}</> : null;
};

/**
 * 🌱 COMPONENTE CAN VIEW PLANT GATE
 * 
 * Muestra contenido si el usuario puede ver una planta específica.
 * 
 * Uso:
 * ```jsx
 * <CanViewPlantGate plantId="plant123">
 *   <PlantDetails />
 * </CanViewPlantGate>
 * ```
 */
export const CanViewPlantGate = ({
  children,
  plantId,
  fallback = null,
  showLoading = false
}) => {
  const { canViewPlantSync, isFullyLoaded } = useAuthWithRole();

  if (showLoading && !isFullyLoaded) {
    return (
      <div className="animate-pulse bg-gray-200 rounded h-32 w-full"></div>
    );
  }

  if (!isFullyLoaded) {
    return null;
  }

  const canView = canViewPlantSync(plantId);

  if (canView) {
    return <>{children}</>;
  }

  return fallback ? <>{fallback}</> : null;
};

/**
 * 🔄 COMPONENTE ROLE SWITCH
 * 
 * Renderiza diferentes componentes según el rol del usuario.
 * 
 * Uso:
 * ```jsx
 * <RoleSwitch
 *   admin={<AdminPanel />}
 *   supervisor={<SupervisorPanel />}
 *   auditor={<AuditorPanel />}
 *   default={<VistaGeneral />}
 * />
 * ```
 */
export const RoleSwitch = ({
  admin = null,
  supervisor = null,
  auditor = null,
  default: defaultContent = null,
  showLoading = false
}) => {
  const { role, isFullyLoaded } = useAuthWithRole();

  if (showLoading && !isFullyLoaded) {
    return (
      <div className="animate-pulse bg-gray-200 rounded h-48 w-full"></div>
    );
  }

  if (!isFullyLoaded) {
    return null;
  }

  switch (role) {
    case ROLES.ADMIN:
      return admin || defaultContent;
    case ROLES.SUPERVISOR:
      return supervisor || defaultContent;
    case ROLES.AUDITOR:
      return auditor || defaultContent;
    default:
      return defaultContent;
  }
};

// Exportar constantes útiles
export { ROLES, PERMISSIONS };

export default RoleGate;