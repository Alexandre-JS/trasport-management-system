export const ROLE_PERMISSIONS: Record<string, string[]> = {
  ADMIN: [
    'auth:me',
    'auth:change-password',
    'users:manage',
    'clients:manage',
    'drivers:manage',
    'trucks:manage',
    'cargo:manage',
    'trips:manage',
    'tracking:manage',
    'delivery:manage',
    'incidents:manage',
    'notifications:read',
    'dashboard:read',
  ],
  DISPATCHER: [
    'auth:me',
    'auth:change-password',
    'operations:manage',
    'clients:manage',
    'drivers:manage',
    'trucks:manage',
    'cargo:manage',
    'trips:manage',
    'tracking:manage',
    'delivery:manage',
    'incidents:manage',
    'notifications:read',
    'dashboard:read',
  ],
  DRIVER: [
    'auth:me',
    'auth:change-password',
    'driver:operate',
    'tracking:manage',
    'delivery:manage',
    'incidents:manage',
    'notifications:read',
  ],
  CLIENT: [
    'auth:me',
    'auth:change-password',
    'cargo:read-own',
    'notifications:read',
  ],
};

export function getPermissionsForRole(role: string): string[] {
  return ROLE_PERMISSIONS[role] ?? [];
}
