import { createAuthClient } from 'better-auth/react';

// Provisioning service URL - where Better Auth is hosted
const PROVISIONING_URL = process.env.NEXT_PUBLIC_PROVISIONING_URL || 'http://localhost:4680';

/**
 * Better Auth client for the dashboard
 * Connects to the provisioning service for authentication
 */
export const authClient = createAuthClient({
  baseURL: PROVISIONING_URL,
});

// Re-export hooks for convenience
export const { signIn, signOut, signUp, useSession, getSession } = authClient;

/**
 * Sign in with GitHub
 * Redirects to GitHub OAuth flow via provisioning service
 */
export async function signInWithGitHub() {
  return authClient.signIn.social({
    provider: 'github',
    callbackURL: window.location.origin,
  });
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return !!session?.data?.user;
}

// Type exports
export type { Session, User } from 'better-auth/types';
