# FASE 3: Control de Acceso - Guía de Instalación

## 📋 Resumen de Archivos Creados

### Tarea 3.1: Hook de Autenticación con Roles
- `hooks/useAuthWithRole.js` - Hook combinado de autenticación y roles

### Tarea 3.2: Protección de Rutas
- `components/auth/ProtectedRoute.jsx` - Componente para proteger rutas

### Tarea 3.3: Componentes Condicionales
- `components/auth/RoleGate.jsx` - Renderizado condicional por rol
- `components/auth/FieldPermission.jsx` - Campo editable/readonly por permiso
- `components/auth/ReadOnlyField.jsx` - Campos visuales de solo lectura
- `components/auth/EditableField.jsx` - Campos editables con validación
- `components/auth/index.js` - Archivo de exportaciones

---

## 🔧 Instrucciones de Instalación

### Paso 1: Copiar el Hook
```bash
# Copiar useAuthWithRole.js a tu carpeta de hooks
cp hooks/useAuthWithRole.js src/hooks/
```

### Paso 2: Copiar los Componentes
```bash
# Copiar todos los componentes de auth
cp -r components/auth/* src/components/auth/
```

### Paso 3: Verificar Importaciones
Asegúrate de que las rutas de importación en los archivos coincidan con tu estructura de proyecto.

---

## 📖 Guía de Uso

### 1. Hook useAuthWithRole

```jsx
import { useAuthWithRole } from './hooks/useAuthWithRole';

function MiComponente() {
  const { 
    user,                  // Usuario de Firebase
    isAuthenticated,       // Boolean
    role,                  // 'admin' | 'supervisor' | 'auditor'
    roleName,              // 'Administrador' | 'Supervisor' | 'Auditor'
    isAdmin,               // Boolean
    isSupervisor,          // Boolean
    isAuditor,             // Boolean
    canEditFieldSync,      // (fieldName) => boolean
    hasPermissionSync,     // (permission) => boolean
    editableFields,        // Array de campos editables
    isFullyLoaded,         // Boolean - true cuando auth y rol están cargados
  } = useAuthWithRole();

  if (!isFullyLoaded) return <Loading />;
  
  return (
    <div>
      <p>Bienvenido, {roleName}</p>
      {isAdmin && <AdminPanel />}
    </div>
  );
}
```

### 2. ProtectedRoute

```jsx
import { ProtectedRoute, AdminRoute, AuditorRoute } from './components/auth';

// Proteger ruta con roles específicos
<ProtectedRoute allowedRoles={['admin', 'supervisor']}>
  <Dashboard />
</ProtectedRoute>

// Atajos para roles comunes
<AdminRoute>
  <PanelAdministracion />
</AdminRoute>

<AuditorRoute>
  <PanelAuditoria />
</AuditorRoute>
```

### 3. RoleGate (Renderizado Condicional)

```jsx
import { RoleGate, AdminOnly, PermissionGate } from './components/auth';

// Mostrar solo para admin
<AdminOnly>
  <BotonEliminar />
</AdminOnly>

// Mostrar para roles específicos
<RoleGate allowedRoles={['admin', 'supervisor']}>
  <FormularioEdicion />
</RoleGate>

// Mostrar según permiso
<PermissionGate permission="equipment.delete">
  <BotonEliminar />
</PermissionGate>

// Con fallback
<RoleGate 
  allowedRoles={['admin']} 
  fallback={<MensajeSinPermiso />}
>
  <ContenidoAdmin />
</RoleGate>
```

### 4. FieldPermission (Campos con Permisos)

```jsx
import { FieldPermission, EquipmentAuditFields } from './components/auth';

// Campo individual que se adapta a permisos
<FieldPermission
  field="observations"
  label="Observaciones"
  value={equipment.observations}
  onSave={(value) => handleSave('observations', value)}
  type="textarea"
/>

// Campos de auditoría pre-configurados
<EquipmentAuditFields
  equipment={equipment}
  onSave={(field, value) => handleSaveField(field, value)}
/>
```

### 5. ReadOnlyField

```jsx
import { ReadOnlyField, ReadOnlyFieldGroup, ReadOnlyStatus } from './components/auth';

// Campo simple
<ReadOnlyField
  label="Número de Serie"
  value={equipment.serialNumber}
/>

// Grupo de campos
<ReadOnlyFieldGroup title="Información Técnica" columns={2}>
  <ReadOnlyField label="Modelo" value={equipment.model} />
  <ReadOnlyField label="Fabricante" value={equipment.manufacturer} />
</ReadOnlyFieldGroup>

// Campo de estado
<ReadOnlyStatus
  label="Estado de Revisión"
  status="completed"
  statusLabels={{ completed: 'Completado', pending: 'Pendiente' }}
/>
```

### 6. EditableField

```jsx
import { EditableField, EditableTextArea } from './components/auth';

// Campo editable básico
<EditableField
  label="Nombre"
  value={equipment.name}
  onSave={async (value) => await updateEquipment('name', value)}
  required
/>

// Con validación
<EditableField
  label="Email"
  value={user.email}
  onSave={handleSaveEmail}
  validate={(value) => value.includes('@') ? null : 'Email inválido'}
/>

// Modo edición inline
<EditableField
  label="Descripción"
  value={data.description}
  onSave={handleSave}
  inlineEdit={true}  // Click para editar
/>
```

---

## 🏗️ Estructura Final

```
src/
├── hooks/
│   ├── useAuth.js           (existente)
│   ├── useRole.js           (existente)
│   └── useAuthWithRole.js   ← NUEVO
│
├── components/
│   └── auth/
│       ├── index.js         ← NUEVO
│       ├── ProtectedRoute.jsx   ← NUEVO
│       ├── RoleGate.jsx     ← NUEVO
│       ├── FieldPermission.jsx  ← NUEVO
│       ├── ReadOnlyField.jsx    ← NUEVO
│       └── EditableField.jsx    ← NUEVO
│
└── services/
    └── migration/
        └── roleService.js   (existente)
```

---

## ✅ Checklist de Implementación

- [ ] Copiar `useAuthWithRole.js` a `src/hooks/`
- [ ] Crear carpeta `src/components/auth/` si no existe
- [ ] Copiar todos los componentes a `src/components/auth/`
- [ ] Actualizar rutas de importación si es necesario
- [ ] Probar con `npm start`
- [ ] Verificar que no hay errores de compilación

---

## 🔍 Ejemplo de Integración en AuditorEquipmentReview

```jsx
import { useAuthWithRole } from '../hooks/useAuthWithRole';
import { 
  FieldPermission, 
  ReadOnlyField, 
  EquipmentAuditFields,
  RoleGate 
} from '../components/auth';

function AuditorEquipmentReview({ equipment }) {
  const { isAuditor, canEditFieldSync } = useAuthWithRole();

  const handleSaveField = async (field, value) => {
    // Guardar en Firebase
    await updateEquipment(equipment.id, { [field]: value });
  };

  return (
    <div>
      {/* Información del equipo (readonly para auditores) */}
      <ReadOnlyField label="Nombre" value={equipment.equipmentName} />
      <ReadOnlyField label="Serial" value={equipment.serialNumber} />
      
      {/* Campos de auditoría (editables según rol) */}
      <EquipmentAuditFields
        equipment={equipment}
        onSave={handleSaveField}
      />
      
      {/* Botón solo visible para supervisores/admin */}
      <RoleGate allowedRoles={['admin', 'supervisor']}>
        <button onClick={handleDelete}>Eliminar Equipo</button>
      </RoleGate>
    </div>
  );
}
```

---

## 📝 Notas Importantes

1. **El hook `useAuthWithRole` combina** la funcionalidad de `useAuth` y `useRole` en uno solo para simplificar el código.

2. **Los campos editables/readonly se determinan automáticamente** basados en la configuración de `EDITABLE_FIELDS_BY_ROLE` en `roleService.js`.

3. **Los componentes son completamente responsivos** y funcionan bien en dispositivos móviles.

4. **Las funciones de verificación tienen versiones síncronas** (`canEditFieldSync`, `hasPermissionSync`) para evitar renders innecesarios.
