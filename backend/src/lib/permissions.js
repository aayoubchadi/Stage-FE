export const PERMISSION_KEYS = Object.freeze([
  'employees.view',
  'employees.manage',
  'inventory.view',
  'inventory.manage',
  'stock.move',
  'receipts.create',
  'data.import',
  'data.export',
  'reports.view',
]);

export const PERMISSION_PRESETS = Object.freeze({
  warehouse_operator: {
    key: 'warehouse_operator',
    label: 'Warehouse Operator',
    permissions: ['inventory.view', 'stock.move'],
  },
  inventory_manager: {
    key: 'inventory_manager',
    label: 'Inventory Manager',
    permissions: [
      'inventory.view',
      'inventory.manage',
      'stock.move',
      'data.import',
      'reports.view',
    ],
  },
  reporting_viewer: {
    key: 'reporting_viewer',
    label: 'Reporting Viewer',
    permissions: ['reports.view', 'inventory.view'],
  },
  receipt_clerk: {
    key: 'receipt_clerk',
    label: 'Receipt Clerk',
    permissions: ['receipts.create'],
  },
});

export function buildPermissionMap(enabledKeys = []) {
  const safeKeys = Array.isArray(enabledKeys) ? enabledKeys : [];
  const map = {};

  for (const key of PERMISSION_KEYS) {
    map[key] = safeKeys.includes(key);
  }

  return map;
}

export function normalizePermissions(input) {
  if (!input || typeof input !== 'object') {
    return buildPermissionMap([]);
  }

  const map = {};

  for (const key of PERMISSION_KEYS) {
    map[key] = Boolean(input[key]);
  }

  return map;
}

export function extractEnabledPermissions(permissionMap) {
  const normalized = normalizePermissions(permissionMap);
  return PERMISSION_KEYS.filter((key) => normalized[key]);
}

export function getAdminPermissionMap() {
  return buildPermissionMap(PERMISSION_KEYS);
}

export function resolveEffectivePermissions(role, userPermissions) {
  const normalizedRole = String(role || '').trim().toLowerCase();

  if (normalizedRole === 'company_admin' || normalizedRole === 'admin') {
    return getAdminPermissionMap();
  }

  if (normalizedRole === 'special_employee') {
    const normalized = normalizePermissions(userPermissions);
    return {
      ...normalized,
      'receipts.create': true,
    };
  }

  return normalizePermissions(userPermissions);
}

export function applyPermissionPreset(presetKey, customPermissions = {}) {
  const preset = PERMISSION_PRESETS[presetKey];
  const presetMap = buildPermissionMap(preset?.permissions || []);
  const customMap = normalizePermissions(customPermissions);
  const merged = {};

  for (const key of PERMISSION_KEYS) {
    merged[key] = Boolean(presetMap[key] || customMap[key]);
  }

  return merged;
}
