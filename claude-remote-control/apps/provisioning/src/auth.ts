import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { db } from './db/index.js';
import { config } from './lib/config.js';

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
  }),
  secret: config.betterAuth.secret,
  baseURL: config.dashboardUrl,
  trustedOrigins: [config.dashboardUrl],
  socialProviders: {
    github: {
      clientId: config.github.clientId,
      clientSecret: config.github.clientSecret,
      // Request repo scope for private repo access
      scope: ['read:user', 'user:email', 'repo'],
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 5 * 60, // 5 minutes
    },
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  advanced: {
    cookiePrefix: '247_',
  },
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
