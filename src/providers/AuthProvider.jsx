// src/providers/AuthProvider.jsx
'use client';

import { SessionProvider } from 'next-auth/react';

export function AuthProvider({ children, session }) {
  return <SessionProvider session={session}>{children}</SessionProvider>;
}