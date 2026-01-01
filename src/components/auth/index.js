/**
 * index.js - Exportaciones de Componentes de Autenticación y Control de Acceso
 * FASE 3: Control de Acceso
 * 
 * Este archivo exporta todos los componentes y hooks relacionados
 * con el control de acceso basado en roles.
 */

// ============================================
// COMPONENTES DE PROTECCIÓN DE RUTAS
// ============================================

export {
  ProtectedRoute,
  withRoleProtection,
  AdminRoute,
  SupervisorRoute,
  AuditorRoute,
  AuthenticatedRoute
} from './ProtectedRoute';

// ============================================
// COMPONENTES DE RENDERIZADO CONDICIONAL
// ============================================

export {
  RoleGate,
  AdminOnly,
  SupervisorOnly,
  AuditorOnly,
  HideFromRole,
  PermissionGate,
  CanEditGate,
  CanViewPlantGate,
  RoleSwitch
} from './RoleGate';

// ============================================
// COMPONENTES DE CAMPOS
// ============================================

// Campos de Solo Lectura
export {
  ReadOnlyField,
  ReadOnlyFieldGroup,
  ReadOnlyStatus,
  ReadOnlyDate,
  ReadOnlyUser,
  ReadOnlyTags,
  ReadOnlyLocation,
  ReadOnlyTextArea
} from './ReadOnlyField';

// Campos Editables
export {
  EditableField,
  EditableTextArea,
  EditableNumber,
  EditableEmail,
  EditableFieldWithButton
} from './EditableField';

// Campos con Permisos
export {
  FieldPermission,
  FieldPermissionGroup,
  SmartField,
  EquipmentAuditFields,
  EquipmentInfoFields,
  useEditableFields
} from './FieldPermission';

// ============================================
// RE-EXPORTAR CONSTANTES ÚTILES
// ============================================

export { ROLES, PERMISSIONS } from '../../services/migration/roleService';