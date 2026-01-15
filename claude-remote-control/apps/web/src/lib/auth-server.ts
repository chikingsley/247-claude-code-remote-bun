import { createAuthServer, neonAuth, authApiHandler } from '@neondatabase/auth/next/server';

export const authServer = createAuthServer();

export { neonAuth, authApiHandler };
