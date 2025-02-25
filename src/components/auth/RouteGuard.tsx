'use client';

import { useSession } from 'next-auth/react';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, ReactNode } from 'react';
import { Role } from '@prisma/client';

// Define route access configuration
export const routeAccessConfig: Record<string, Role[]> = {
  '/users': ['ADMIN' as Role],
  '/clients': ['ADMIN' as Role, 'ACCOUNT_MANAGER' as Role, 'DEVELOPER' as Role],
  '/reports': ['ADMIN' as Role, 'ACCOUNT_MANAGER' as Role],
  // All authenticated users can access issues
  '/issues': ['ADMIN' as Role, 'ACCOUNT_MANAGER' as Role, 'DEVELOPER' as Role, 'CLIENT' as Role],
};

interface RouteGuardProps {
  children: ReactNode;
}

export default function RouteGuard({ children }: RouteGuardProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const isLoading = status === 'loading';

  useEffect(() => {
    // Skip if still loading or no session data yet
    if (isLoading) return;

    // If user is not authenticated, redirect to sign in
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    // Check if the current route requires specific roles
    const patternMatch = Object.keys(routeAccessConfig).find(pattern => 
      pathname === pattern || pathname.startsWith(`${pattern}/`)
    );

    if (patternMatch) {
      const allowedRoles = routeAccessConfig[patternMatch];
      const userRole = session.user?.role as Role;
      
      // If user doesn't have the required role, redirect to home
      if (!allowedRoles.includes(userRole)) {
        router.push('/');
      }
    }
  }, [isLoading, session, pathname, router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return <div className="p-4 text-center">Loading...</div>;
  }

  // Render children once authentication is checked
  return <>{children}</>;
} 