import { authApiHandler } from '@/lib/auth-server';

export const { GET, POST, PUT, DELETE, PATCH } = authApiHandler();
