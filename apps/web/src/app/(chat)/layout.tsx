'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { PageLoader } from '@/components/layout/page-loader';
import { useAuth } from '@/components/providers/auth-provider';

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { status } = useAuth();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace('/login');
    }
  }, [router, status]);

  if (status !== 'authenticated') {
    return <PageLoader label="Loading workspace..." />;
  }

  return children;
}
