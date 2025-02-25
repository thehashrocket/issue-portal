import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { ReactNode, useEffect } from 'react';
import { Role } from '@prisma/client';

interface WithRoleAccessProps {
  children: ReactNode;
  allowedRoles: Role[];
  redirectTo?: string;
  fallback?: ReactNode;
}

/**
 * A component that restricts access based on user roles
 * @param children The content to render if the user has access
 * @param allowedRoles Array of roles that are allowed to access the content
 * @param redirectTo Optional path to redirect to if the user doesn't have access
 * @param fallback Optional content to render if the user doesn't have access (instead of redirecting)
 */
export function WithRoleAccess({
  children,
  allowedRoles,
  redirectTo = '/',
  fallback,
}: WithRoleAccessProps) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const isLoading = status === 'loading';
  
  const hasAccess = 
    session?.user?.role && 
    allowedRoles.includes(session.user.role as Role);

  useEffect(() => {
    // Only redirect if:
    // 1. Not loading
    // 2. User is authenticated (has session)
    // 3. User doesn't have access
    // 4. No fallback content is provided
    if (!isLoading && session && !hasAccess && !fallback) {
      router.push(redirectTo);
    }
  }, [isLoading, session, hasAccess, redirectTo, router, fallback]);

  // Show nothing while loading
  if (isLoading) {
    return <div className="p-4 text-center">Loading...</div>;
  }

  // If not authenticated, redirect to sign in
  if (!session) {
    router.push('/auth/signin');
    return null;
  }

  // If user doesn't have access and fallback is provided, show fallback
  if (!hasAccess) {
    return fallback ? (
      <>{fallback}</>
    ) : (
      // This will be shown briefly before the redirect happens
      <div className="p-4 text-center">
        You don't have permission to access this page.
      </div>
    );
  }

  // User has access, render children
  return <>{children}</>;
}

/**
 * Higher-order component that restricts access to a component based on user roles
 * @param Component The component to wrap
 * @param allowedRoles Array of roles that are allowed to access the component
 * @param redirectTo Optional path to redirect to if the user doesn't have access
 * @param fallback Optional component to render if the user doesn't have access
 */
export default function withRoleAccess<P extends object>(
  Component: React.ComponentType<P>,
  allowedRoles: Role[],
  redirectTo?: string,
  fallback?: ReactNode
) {
  return function WithRoleAccessWrapper(props: P) {
    return (
      <WithRoleAccess 
        allowedRoles={allowedRoles} 
        redirectTo={redirectTo}
        fallback={fallback}
      >
        <Component {...props} />
      </WithRoleAccess>
    );
  };
} 