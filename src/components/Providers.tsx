'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';
import RouteGuard from './auth/RouteGuard';

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <SessionProvider>
      <RouteGuard>
        {children}
      </RouteGuard>
    </SessionProvider>
  );
} 