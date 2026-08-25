'use client';

import { useAtomValue } from 'jotai';

import { isAuthenticatedAtom } from '@/lib/auth-atoms';

interface HomeAudienceProps {
  signed: React.ReactNode;
  guest: React.ReactNode;
}

export function HomeAudience({ signed, guest }: HomeAudienceProps) {
  const isAuthenticated = useAtomValue(isAuthenticatedAtom);
  return isAuthenticated ? signed : guest;
}
