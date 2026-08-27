'use client';

import { createContext, useContext } from 'react';

export interface AuthSessionContextValue {
  beginSessionEnding: () => Promise<void>;
  clearDeletedSession: () => Promise<void>;
  logoutSession: () => Promise<void>;
  restoreSessionAfterEnding: () => Promise<void>;
}

const AuthSessionContext = createContext<AuthSessionContextValue | null>(null);

export function AuthSessionContextProvider({
  children,
  value,
}: {
  children: React.ReactNode;
  value: AuthSessionContextValue;
}) {
  return <AuthSessionContext.Provider value={value}>{children}</AuthSessionContext.Provider>;
}

export function useAuthSession(): AuthSessionContextValue {
  const context = useContext(AuthSessionContext);
  if (!context) throw new Error('useAuthSession must be used within AuthProvider');
  return context;
}
