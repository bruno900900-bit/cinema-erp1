import { usePermissions, Permissions } from './usePermissions';

/**
 * Hook para verificar se o usuário tem uma permissão específica
 */
export function useHasPermission(permission: keyof Permissions): boolean {
  const permissions = usePermissions();
  return permissions[permission];
}

/**
 * Hook que lança erro se o usuário não tiver a permissão
 * Útil para garantir permissão em componentes críticos
 */
export function useRequirePermission(permission: keyof Permissions): void {
  const hasPermission = useHasPermission(permission);

  if (!hasPermission) {
    throw new Error(`Permissão necessária: ${permission}`);
  }
}

/**
 * Hook para verificar múltiplas permissões
 */
export function useHasAllPermissions(
  permissions: Array<keyof Permissions>
): boolean {
  const userPermissions = usePermissions();
  return permissions.every(permission => userPermissions[permission]);
}

/**
 * Hook para verificar se tem pelo menos uma das permissões
 */
export function useHasAnyPermission(
  permissions: Array<keyof Permissions>
): boolean {
  const userPermissions = usePermissions();
  return permissions.some(permission => userPermissions[permission]);
}
