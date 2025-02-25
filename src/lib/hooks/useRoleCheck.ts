import { useSession } from 'next-auth/react';
import { Role } from '@prisma/client';

/**
 * Hook to check if the current user has one of the specified roles
 * @param allowedRoles Array of roles to check against
 * @returns Object containing role check results and session status
 */
export function useRoleCheck(allowedRoles?: Role[]) {
  const { data: session, status } = useSession();
  const isLoading = status === 'loading';
  const isAuthenticated = !!session?.user;
  const userRole = session?.user?.role as Role | undefined;
  
  // If no roles are specified, just check if the user is authenticated
  if (!allowedRoles || allowedRoles.length === 0) {
    return {
      hasRole: isAuthenticated,
      isAdmin: userRole === 'ADMIN' as Role,
      isAccountManager: userRole === 'ACCOUNT_MANAGER' as Role,
      isDeveloper: userRole === 'DEVELOPER' as Role,
      isClient: userRole === 'CLIENT' as Role,
      role: userRole,
      isLoading,
      isAuthenticated,
      session
    };
  }
  
  // Check if the user has one of the allowed roles
  const hasRole = 
    isAuthenticated && 
    userRole && 
    allowedRoles.includes(userRole);
  
  return {
    hasRole,
    isAdmin: userRole === 'ADMIN' as Role,
    isAccountManager: userRole === 'ACCOUNT_MANAGER' as Role,
    isDeveloper: userRole === 'DEVELOPER' as Role,
    isClient: userRole === 'CLIENT' as Role,
    role: userRole,
    isLoading,
    isAuthenticated,
    session
  };
} 