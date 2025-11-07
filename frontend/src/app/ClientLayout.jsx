'use client';

import { AuthProvider } from '@/contexts/AuthContext';

export function ClientLayout({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}
