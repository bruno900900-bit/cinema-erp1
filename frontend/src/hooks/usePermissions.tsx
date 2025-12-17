import { useAuth } from './useAuth';
import { UserRole } from '../types/user';

// Definição das permissões por role
const ROLE_PERMISSIONS = {
  [UserRole.ADMIN]: {
    canViewDashboard: true,
    canManageUsers: true,
    canManageProjects: true,
    canManageLocations: true,
    canViewAgenda: true,
    canViewReports: true,
    canManageSettings: true,
    canCreateProjects: true,
    canEditProjects: true,
    canDeleteProjects: true,
    canViewFinancials: true,
    canExportData: true,
    canManageUserRoles: true,
    canActivateUsers: true,
    canDeactivateUsers: true,
    canDeleteUsers: true,
    canViewProjects: true,
    canManageContracts: true,
    canViewContracts: true,
    canManageTags: true,
    canManageFiles: true,
    canViewFiles: true,
  },
  [UserRole.MANAGER]: {
    canViewDashboard: true,
    canManageUsers: false,
    canManageProjects: true,
    canManageLocations: true,
    canViewAgenda: true,
    canViewReports: true,
    canManageSettings: false,
    canCreateProjects: true,
    canEditProjects: true,
    canDeleteProjects: false,
    canViewFinancials: true,
    canExportData: true,
    canManageUserRoles: false,
    canActivateUsers: false,
    canDeactivateUsers: false,
    canDeleteUsers: false,
    canViewProjects: true,
    canManageContracts: true,
    canViewContracts: true,
    canManageTags: true,
    canManageFiles: true,
    canViewFiles: true,
  },
  [UserRole.COORDINATOR]: {
    canViewDashboard: true,
    canManageUsers: false,
    canManageProjects: true,
    canManageLocations: true,
    canViewAgenda: true,
    canViewReports: false,
    canManageSettings: false,
    canCreateProjects: true,
    canEditProjects: true,
    canDeleteProjects: false,
    canViewFinancials: false,
    canExportData: false,
    canManageUserRoles: false,
    canActivateUsers: false,
    canDeactivateUsers: false,
    canDeleteUsers: false,
    canViewProjects: true,
    canManageContracts: false,
    canViewContracts: true,
    canManageTags: true,
    canManageFiles: false,
    canViewFiles: true,
  },
  [UserRole.OPERATOR]: {
    canViewDashboard: true,
    canManageUsers: false,
    canManageProjects: false,
    canManageLocations: false,
    canViewAgenda: true,
    canViewReports: false,
    canManageSettings: false,
    canCreateProjects: false,
    canEditProjects: false,
    canDeleteProjects: false,
    canViewFinancials: false,
    canExportData: false,
    canManageUserRoles: false,
    canActivateUsers: false,
    canDeactivateUsers: false,
    canDeleteUsers: false,
    canViewProjects: true,
    canManageContracts: false,
    canViewContracts: false,
    canManageTags: false,
    canManageFiles: false,
    canViewFiles: true,
  },
  [UserRole.VIEWER]: {
    canViewDashboard: true,
    canManageUsers: false,
    canManageProjects: false,
    canManageLocations: false,
    canViewAgenda: true,
    canViewReports: false,
    canManageSettings: false,
    canCreateProjects: false,
    canEditProjects: false,
    canDeleteProjects: false,
    canViewFinancials: false,
    canExportData: false,
    canManageUserRoles: false,
    canActivateUsers: false,
    canDeactivateUsers: false,
    canDeleteUsers: false,
    canViewProjects: false,
    canManageContracts: false,
    canViewContracts: false,
    canManageTags: false,
    canManageFiles: false,
    canViewFiles: false,
  },
  [UserRole.CLIENT]: {
    canViewDashboard: false,
    canManageUsers: false,
    canManageProjects: false,
    canManageLocations: false,
    canViewAgenda: false,
    canViewReports: false,
    canManageSettings: false,
    canCreateProjects: false,
    canEditProjects: false,
    canDeleteProjects: false,
    canViewFinancials: false,
    canExportData: false,
    canManageUserRoles: false,
    canActivateUsers: false,
    canDeactivateUsers: false,
    canDeleteUsers: false,
    canViewProjects: false,
    canManageContracts: false,
    canViewContracts: false,
    canManageTags: false,
    canManageFiles: false,
    canViewFiles: false,
  },
  [UserRole.CONTRIBUTOR]: {
    canViewDashboard: false,
    canManageUsers: false,
    canManageProjects: false,
    canManageLocations: false,
    canViewAgenda: false,
    canViewReports: false,
    canManageSettings: false,
    canCreateProjects: false,
    canEditProjects: false,
    canDeleteProjects: false,
    canViewFinancials: false,
    canExportData: false,
    canManageUserRoles: false,
    canActivateUsers: false,
    canDeactivateUsers: false,
    canDeleteUsers: false,
    canViewProjects: false,
    canManageContracts: false,
    canViewContracts: false,
    canManageTags: false,
    canManageFiles: false,
    canViewFiles: false,
  },
};

export interface Permissions {
  canViewDashboard: boolean;
  canManageUsers: boolean;
  canManageProjects: boolean;
  canManageLocations: boolean;
  canViewAgenda: boolean;
  canViewReports: boolean;
  canManageSettings: boolean;
  canCreateProjects: boolean;
  canEditProjects: boolean;
  canDeleteProjects: boolean;
  canViewFinancials: boolean;
  canExportData: boolean;
  canManageUserRoles: boolean;
  canActivateUsers: boolean;
  canDeactivateUsers: boolean;
  canDeleteUsers: boolean;
  // New granular permissions
  canViewProjects: boolean;
  canManageContracts: boolean;
  canViewContracts: boolean;
  canManageTags: boolean;
  canManageFiles: boolean;
  canViewFiles: boolean;
}

export function usePermissions(): Permissions {
  const { user } = useAuth();

  if (!user || !user.role) {
    // Retornar permissões mínimas se não houver usuário
    return ROLE_PERMISSIONS[UserRole.CONTRIBUTOR];
  }

  // 1. Obter permissões base da role
  const basePermissions =
    ROLE_PERMISSIONS[user.role] || ROLE_PERMISSIONS[UserRole.CONTRIBUTOR];

  // 2. Aplicar overrides do permissions_json se existir
  if (user.permissions_json) {
    return {
      ...basePermissions,
      ...user.permissions_json,
    } as Permissions;
  }

  return basePermissions;
}

// Hook para verificar permissão específica
export function useHasPermission(permission: keyof Permissions): boolean {
  const permissions = usePermissions();
  return permissions[permission];
}

// Hook para verificar se o usuário pode acessar uma rota
export function useCanAccessRoute(route: string): boolean {
  const permissions = usePermissions();

  const routePermissions: Record<string, keyof Permissions> = {
    '/dashboard': 'canViewDashboard',
    '/users': 'canManageUsers',
    '/projects': 'canManageProjects',
    '/locations': 'canManageLocations',
    '/agenda': 'canViewAgenda',
    '/reports': 'canViewReports',
    '/settings': 'canManageSettings',
  };

  const requiredPermission = routePermissions[route];
  if (!requiredPermission) {
    return true; // Se não há permissão específica, permitir acesso
  }

  return permissions[requiredPermission];
}
