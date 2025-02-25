'use client';

import { ReactNode } from 'react';
import { Role } from '@prisma/client';
import { useRoleCheck } from '@/lib/hooks/useRoleCheck';

interface RoleBasedContentProps {
  children: ReactNode;
  allowedRoles: Role[];
  fallback?: ReactNode;
}

/**
 * A component that conditionally renders content based on user roles
 * @param children The content to render if the user has access
 * @param allowedRoles Array of roles that are allowed to see the content
 * @param fallback Optional content to render if the user doesn't have access
 */
export default function RoleBasedContent({
  children,
  allowedRoles,
  fallback = null,
}: RoleBasedContentProps) {
  const { hasRole, isLoading } = useRoleCheck(allowedRoles);
  
  // While loading, render nothing
  if (isLoading) {
    return null;
  }
  
  // If user has the required role, render children
  if (hasRole) {
    return <>{children}</>;
  }
  
  // Otherwise, render fallback content (if provided)
  return fallback ? <>{fallback}</> : null;
} 