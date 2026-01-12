'use client';

import { SessionPollingProvider } from '@/contexts/SessionPollingContext';
import { AuthProvider } from '@/contexts/AuthContext';
import type { ReactNode } from 'react';

// Cloud auth is enabled when NEXT_PUBLIC_PROVISIONING_URL is set
const isCloudAuthEnabled = !!process.env.NEXT_PUBLIC_PROVISIONING_URL;

export function Providers({ children }: { children: ReactNode }) {
  // If cloud auth is enabled, wrap with AuthProvider
  if (isCloudAuthEnabled) {
    return (
      <AuthProvider>
        <SessionPollingProvider>{children}</SessionPollingProvider>
      </AuthProvider>
    );
  }

  // Otherwise, just session polling (local agent only)
  return <SessionPollingProvider>{children}</SessionPollingProvider>;
}
