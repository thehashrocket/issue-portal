'use client';

import Link from 'next/link';
import { signIn, signOut, useSession } from 'next-auth/react';
import NotificationBell from './NotificationBell';
import { useRoleCheck } from '@/lib/hooks/useRoleCheck';

export default function Navbar() {
  const { data: session } = useSession();
  const { isAdmin, isAccountManager, isDeveloper, isAuthenticated, isLoading } = useRoleCheck();
  
  return (
    <nav className="bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center space-x-6">
            <Link href="/" className="text-xl font-bold text-gray-800">
              Issue Portal
            </Link>
            
            {/* Navigation links - only show when authenticated */}
            {isAuthenticated && (
              <div className="flex space-x-4">
                <Link href="/dashboard" className="text-gray-600 hover:text-gray-900">
                  Dashboard
                </Link>
                <Link href="/issues" className="text-gray-600 hover:text-gray-900">
                  Issues
                </Link>
                
                {/* Only show clients link to admin, account managers, and developers */}
                {(isAdmin || isAccountManager || isDeveloper) && (
                  <Link href="/clients" className="text-gray-600 hover:text-gray-900">
                    Clients
                  </Link>
                )}
                
                {/* Only show users link to admins */}
                {isAdmin && (
                  <Link href="/users" className="text-gray-600 hover:text-gray-900">
                    Users
                  </Link>
                )}
                
                {/* Only show reports link to admins and account managers */}
                {(isAdmin || isAccountManager) && (
                  <Link href="/reports" className="text-gray-600 hover:text-gray-900">
                    Reports
                  </Link>
                )}
              </div>
            )}
          </div>
          
          <div className="flex items-center space-x-4">
            {isLoading ? (
              <span className="text-sm text-gray-500">Loading...</span>
            ) : isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <NotificationBell />
                <span className="text-sm text-gray-700">
                  {session?.user?.name || session?.user?.email}
                  {session?.user?.role && (
                    <span className="ml-1 text-xs text-gray-500">
                      ({session.user.role})
                    </span>
                  )}
                </span>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => signIn('google')}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
} 