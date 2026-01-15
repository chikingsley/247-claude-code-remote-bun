'use client';

import { AuthView } from '@neondatabase/auth/react/ui';
import { useParams } from 'next/navigation';

export default function AuthPage() {
  const params = useParams();
  const path = params.path as string;

  return (
    <div className="bg-background flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md p-8">
        <h1 className="mb-8 text-center text-2xl font-bold">247</h1>
        <AuthView pathname={path} />
      </div>
    </div>
  );
}
