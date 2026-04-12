'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

import { PageLoader } from '@/components/layout/page-loader';
import { useAuth } from '@/components/providers/auth-provider';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { status } = useAuth();

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/chat');
    }
  }, [router, status]);

  if (status === 'loading') {
    return <PageLoader label="Restoring session..." />;
  }

  return children;
}
