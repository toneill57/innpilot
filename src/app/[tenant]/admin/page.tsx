'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * DEPRECATED: /admin route
 * Redirects to /dashboard
 */
export default function AdminRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-900 mx-auto mb-4"></div>
        <p className="text-gray-600">Redirecting to dashboard...</p>
      </div>
    </div>
  );
}
