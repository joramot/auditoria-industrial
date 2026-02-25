// ─── Module mocks ─────────────────────────────────────────────────────────────

// Mock Firestore functions
const mockGetDoc  = jest.fn();
const mockSetDoc  = jest.fn();
const mockUpdateDoc = jest.fn();
const mockGetDocs  = jest.fn();
const mockDoc     = jest.fn((_db, _col, id) => ({ id }));
const mockCollection = jest.fn();
const mockQuery   = jest.fn();
const mockWhere   = jest.fn();

jest.mock('firebase/firestore', () => ({
  doc:        (...args) => mockDoc(...args),
  getDoc:     (...args) => mockGetDoc(...args),
  setDoc:     (...args) => mockSetDoc(...args),
  updateDoc:  (...args) => mockUpdateDoc(...args),
  collection: (...args) => mockCollection(...args),
  query:      (...args) => mockQuery(...args),
  where:      (...args) => mockWhere(...args),
  getDocs:    (...args) => mockGetDocs(...args),
}));

jest.mock('../firebase/firebaseConfig', () => ({
  db: {},
}));

// ─── Imports ─────────────────────────────────────────────────────────────────

import {
  ROLES,
  PERMISSIONS,
  ROLE_PERMISSIONS,
  EDITABLE_FIELDS_BY_ROLE,
  getRoleName,
  getUserRole,
  hasPermission,
  canEditField,
  canViewPlant,
} from './roleService';

// ─── Helpers ──────────────────────────────────────────────────────────────────

const makeFirestoreDoc = (exists, data = {}) => ({
  exists: () => exists,
  data: () => data,
});

beforeEach(() => {
  jest.clearAllMocks();
});

// ─── Constants ────────────────────────────────────────────────────────────────

describe('ROLES constants', () => {
  it('defines admin role', () => {
    expect(ROLES.ADMIN).toBe('admin');
  });

  it('defines supervisor role', () => {
    expect(ROLES.SUPERVISOR).toBe('supervisor');
  });

  it('defines auditor role', () => {
    expect(ROLES.AUDITOR).toBe('auditor');
  });

  it('defines visualizador role', () => {
    expect(ROLES.VISUALIZADOR).toBe('visualizador');
  });
});

describe('PERMISSIONS constants', () => {
  it('defines user management permissions', () => {
    expect(PERMISSIONS.users.view).toBe('users.view');
    expect(PERMISSIONS.users.create).toBe('users.create');
    expect(PERMISSIONS.users.assignRole).toBe('users.assignRole');
  });

  it('defines plant management permissions', () => {
    expect(PERMISSIONS.plants.viewAll).toBe('plants.viewAll');
    expect(PERMISSIONS.plants.create).toBe('plants.create');
  });

  it('defines equipment permissions', () => {
    expect(PERMISSIONS.equipment.editAll).toBe('equipment.editAll');
    expect(PERMISSIONS.equipment.editReview).toBe('equipment.editReview');
  });
});

describe('ROLE_PERMISSIONS matrix', () => {
  it('admin has all user management permissions', () => {
    const adminPerms = ROLE_PERMISSIONS[ROLES.ADMIN];
    expect(adminPerms).toContain(PERMISSIONS.users.view);
    expect(adminPerms).toContain(PERMISSIONS.users.create);
    expect(adminPerms).toContain(PERMISSIONS.users.delete);
    expect(adminPerms).toContain(PERMISSIONS.users.assignRole);
  });

  it('admin has system-level permissions', () => {
    const adminPerms = ROLE_PERMISSIONS[ROLES.ADMIN];
    expect(adminPerms).toContain(PERMISSIONS.system.cleanDatabase);
    expect(adminPerms).toContain(PERMISSIONS.system.backup);
  });

  it('supervisor does NOT have user management permissions', () => {
    const supervisorPerms = ROLE_PERMISSIONS[ROLES.SUPERVISOR];
    expect(supervisorPerms).not.toContain(PERMISSIONS.users.create);
    expect(supervisorPerms).not.toContain(PERMISSIONS.users.delete);
  });

  it('auditor can view all plants and equipment', () => {
    const auditorPerms = ROLE_PERMISSIONS[ROLES.AUDITOR];
    expect(auditorPerms).toContain(PERMISSIONS.plants.viewAll);
    expect(auditorPerms).toContain(PERMISSIONS.equipment.viewAll);
  });

  it('auditor can only edit review fields (not all)', () => {
    const auditorPerms = ROLE_PERMISSIONS[ROLES.AUDITOR];
    expect(auditorPerms).toContain(PERMISSIONS.equipment.editReview);
    expect(auditorPerms).not.toContain(PERMISSIONS.equipment.editAll);
  });

  it('auditor cannot create or delete equipment', () => {
    const auditorPerms = ROLE_PERMISSIONS[ROLES.AUDITOR];
    expect(auditorPerms).not.toContain(PERMISSIONS.equipment.create);
    expect(auditorPerms).not.toContain(PERMISSIONS.equipment.delete);
  });

  it('visualizador has read-only permissions', () => {
    const visPerms = ROLE_PERMISSIONS[ROLES.VISUALIZADOR];
    expect(visPerms).toContain(PERMISSIONS.plants.viewAll);
    expect(visPerms).toContain(PERMISSIONS.equipment.viewAll);
    expect(visPerms).not.toContain(PERMISSIONS.equipment.editAll);
    expect(visPerms).not.toContain(PERMISSIONS.equipment.create);
  });
});

describe('EDITABLE_FIELDS_BY_ROLE', () => {
  it('admin can edit all equipment fields', () => {
    const fields = EDITABLE_FIELDS_BY_ROLE[ROLES.ADMIN];
    expect(fields).toContain('equipmentName');
    expect(fields).toContain('serialNumber');
    expect(fields).toContain('actionsDescription');
    expect(fields).toContain('observations');
  });

  it('supervisor has the same editable fields as admin', () => {
    expect(EDITABLE_FIELDS_BY_ROLE[ROLES.SUPERVISOR]).toEqual(
      EDITABLE_FIELDS_BY_ROLE[ROLES.ADMIN]
    );
  });

  it('auditor can only edit actionsDescription and observations', () => {
    const fields = EDITABLE_FIELDS_BY_ROLE[ROLES.AUDITOR];
    expect(fields).toHaveLength(2);
    expect(fields).toContain('actionsDescription');
    expect(fields).toContain('observations');
  });

  it('visualizador cannot edit any fields', () => {
    expect(EDITABLE_FIELDS_BY_ROLE[ROLES.VISUALIZADOR]).toHaveLength(0);
  });
});

// ─── getRoleName ──────────────────────────────────────────────────────────────

describe('getRoleName', () => {
  it('returns "Administrador" for admin role', () => {
    expect(getRoleName(ROLES.ADMIN)).toBe('Administrador');
  });

  it('returns "Supervisor" for supervisor role', () => {
    expect(getRoleName(ROLES.SUPERVISOR)).toBe('Supervisor');
  });

  it('returns "Auditor" for auditor role', () => {
    expect(getRoleName(ROLES.AUDITOR)).toBe('Auditor');
  });

  it('returns "Visualizador" for visualizador role', () => {
    expect(getRoleName(ROLES.VISUALIZADOR)).toBe('Visualizador');
  });

  it('returns "Desconocido" for unknown roles', () => {
    expect(getRoleName('superuser')).toBe('Desconocido');
    expect(getRoleName(undefined)).toBe('Desconocido');
  });
});

// ─── getUserRole ──────────────────────────────────────────────────────────────

describe('getUserRole', () => {
  it('returns null when userId is missing', async () => {
    const result = await getUserRole(null);
    expect(result).toBeNull();
    expect(mockGetDoc).not.toHaveBeenCalled();
  });

  it('returns default visualizador role when user doc does not exist', async () => {
    mockGetDoc.mockResolvedValueOnce(makeFirestoreDoc(false));

    const result = await getUserRole('non-existent-uid');

    expect(result.role).toBe(ROLES.VISUALIZADOR);
    expect(result.assignedPlants).toEqual([]);
  });

  it('returns user data with role from Firestore', async () => {
    mockGetDoc.mockResolvedValueOnce(
      makeFirestoreDoc(true, {
        email: 'admin@company.com',
        displayName: 'Admin User',
        role: ROLES.ADMIN,
        assignedPlants: ['plant-1'],
      })
    );

    const result = await getUserRole('admin-uid');

    expect(result.role).toBe(ROLES.ADMIN);
    expect(result.email).toBe('admin@company.com');
    expect(result.assignedPlants).toEqual(['plant-1']);
  });

  it('attaches permissions array matching the stored role', async () => {
    mockGetDoc.mockResolvedValueOnce(
      makeFirestoreDoc(true, { role: ROLES.AUDITOR })
    );

    const result = await getUserRole('auditor-uid');

    expect(result.permissions).toEqual(ROLE_PERMISSIONS[ROLES.AUDITOR]);
  });

  it('falls back to visualizador when role is missing in Firestore doc', async () => {
    mockGetDoc.mockResolvedValueOnce(
      makeFirestoreDoc(true, { email: 'user@gmail.com' }) // no role field
    );

    const result = await getUserRole('uid-no-role');

    expect(result.role).toBe(ROLES.VISUALIZADOR);
  });

  it('returns null on Firestore error', async () => {
    mockGetDoc.mockRejectedValueOnce(new Error('firestore unavailable'));

    const result = await getUserRole('uid-error');

    expect(result).toBeNull();
  });
});

// ─── hasPermission ────────────────────────────────────────────────────────────

describe('hasPermission', () => {
  it('returns true when the user has the permission', async () => {
    mockGetDoc.mockResolvedValueOnce(
      makeFirestoreDoc(true, { role: ROLES.ADMIN })
    );

    const result = await hasPermission('admin-uid', PERMISSIONS.system.cleanDatabase);

    expect(result).toBe(true);
  });

  it('returns false when the user lacks the permission', async () => {
    mockGetDoc.mockResolvedValueOnce(
      makeFirestoreDoc(true, { role: ROLES.AUDITOR })
    );

    const result = await hasPermission('auditor-uid', PERMISSIONS.users.delete);

    expect(result).toBe(false);
  });

  it('returns false when getUserRole returns null', async () => {
    mockGetDoc.mockRejectedValueOnce(new Error('fail'));

    const result = await hasPermission('uid', PERMISSIONS.plants.create);

    expect(result).toBe(false);
  });
});

// ─── canEditField ─────────────────────────────────────────────────────────────

describe('canEditField', () => {
  it('allows auditor to edit actionsDescription', async () => {
    mockGetDoc.mockResolvedValueOnce(
      makeFirestoreDoc(true, { role: ROLES.AUDITOR })
    );

    const result = await canEditField('auditor-uid', 'actionsDescription');

    expect(result).toBe(true);
  });

  it('denies auditor from editing equipmentName', async () => {
    mockGetDoc.mockResolvedValueOnce(
      makeFirestoreDoc(true, { role: ROLES.AUDITOR })
    );

    const result = await canEditField('auditor-uid', 'equipmentName');

    expect(result).toBe(false);
  });

  it('allows admin to edit any field', async () => {
    mockGetDoc.mockResolvedValueOnce(
      makeFirestoreDoc(true, { role: ROLES.ADMIN })
    );

    const result = await canEditField('admin-uid', 'serialNumber');

    expect(result).toBe(true);
  });

  it('denies visualizador from editing any field', async () => {
    mockGetDoc.mockResolvedValueOnce(
      makeFirestoreDoc(true, { role: ROLES.VISUALIZADOR })
    );

    const result = await canEditField('vis-uid', 'observations');

    expect(result).toBe(false);
  });
});

// ─── canViewPlant ─────────────────────────────────────────────────────────────

describe('canViewPlant', () => {
  it('allows admin to view any plant', async () => {
    mockGetDoc.mockResolvedValueOnce(
      makeFirestoreDoc(true, { role: ROLES.ADMIN, assignedPlants: [] })
    );

    expect(await canViewPlant('admin-uid', 'plant-99')).toBe(true);
  });

  it('allows auditor to view any plant', async () => {
    mockGetDoc.mockResolvedValueOnce(
      makeFirestoreDoc(true, { role: ROLES.AUDITOR, assignedPlants: [] })
    );

    expect(await canViewPlant('auditor-uid', 'plant-99')).toBe(true);
  });

  it('allows visualizador to view any plant', async () => {
    mockGetDoc.mockResolvedValueOnce(
      makeFirestoreDoc(true, { role: ROLES.VISUALIZADOR, assignedPlants: [] })
    );

    expect(await canViewPlant('vis-uid', 'plant-99')).toBe(true);
  });

  it('allows supervisor to view an assigned plant', async () => {
    mockGetDoc.mockResolvedValueOnce(
      makeFirestoreDoc(true, {
        role: ROLES.SUPERVISOR,
        assignedPlants: ['plant-1', 'plant-2'],
      })
    );

    expect(await canViewPlant('sup-uid', 'plant-1')).toBe(true);
  });

  it('denies supervisor access to a non-assigned plant', async () => {
    mockGetDoc.mockResolvedValueOnce(
      makeFirestoreDoc(true, {
        role: ROLES.SUPERVISOR,
        assignedPlants: ['plant-1'],
      })
    );

    expect(await canViewPlant('sup-uid', 'plant-99')).toBe(false);
  });

  it('returns false when getUserRole fails', async () => {
    mockGetDoc.mockRejectedValueOnce(new Error('fail'));

    expect(await canViewPlant('uid', 'plant-1')).toBe(false);
  });
});
